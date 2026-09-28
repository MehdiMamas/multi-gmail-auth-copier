import { htmlToText } from './gmail';

const MAGIC_KEYWORDS = [
  'magic link',
  'login link',
  'sign-in link',
  'sign in link',
  'verify your email',
  'verify email',
  'confirm your email',
  'email verification',
  'confirm your account',
  'verify your account',
  'passwordless',
  'click the link below to sign in',
  'click here to sign in',
  'click here to log in',
  'click this link to log in',
  'click this link to sign in',
  'click the link to sign in',
  'login request',
  'authentication link',
  'your sign-in link',
  'your login link',
  'sign-in token',
  'one-click login',
];

const URL_HINTS = ['login', 'signin', 'sign-in', 'magic', 'token', 'session', 'verify', 'continue', 'reactivate'];

const DANGEROUS = [
  'password reset',
  'reset your password',
  'reset password',
  'unsubscribe',
  'preferences',
  'help center',
  'support',
  'delete account',
  'delete your account',
  'account deletion',
  'close your account',
  'close account',
  'cancel your account',
  'cancel subscription',
  'deactivate account',
];

const HARD_DANGER = [
  'password reset',
  'reset your password',
  'reset password',
  'forgot your password',
  'forgot password',
  'delete your account',
  'delete account',
  'account deletion',
  'confirm account deletion',
  'close your account',
  'cancel your account',
  'cancel subscription',
  'deactivate your account',
];

const RESET_PATHS = [
  /\/(?:reset|forgot|recover)(?:[/?#]|$)/i,
  /\/(?:reset|forgot|recover)[-_](?:password|account|access)(?:[/?#]|$)/i,
  /\/(?:password|account)[-_](?:reset|recovery)(?:[/?#]|$)/i,
];

const DESTRUCTIVE_PATHS = [
  /\/(?:verify|confirm)[-_](?:delete|close|cancel|terminate|remove|deactivate)(?:[-_]account)?(?:[/?#]|$)/i,
  /\/(?:verify|confirm)[-_]account[-_](?:delet|clos|cancel|terminat|remov|deactivat)/i,
  /\/(?:delete|close|cancel|terminate|remove|deactivate)[-_]account(?:[/?#]|$)/i,
  /\/account\/(?:delete|deletion|close|closure|cancel)(?:[/?#]|$)/i,
];

const TRACKER_HOSTS = [
  /(?:^|\.)list-manage\.com$/i,
  /(?:^|\.)mandrillapp\.com$/i,
  /(?:^|\.)sendgrid\.net$/i,
  /(?:^|\.)mailgun\.org$/i,
  /(?:^|\.)hubspotlinks\.com$/i,
  /(?:^|\.)sendinblue\.com$/i,
  /(?:^|\.)brevo\.com$/i,
  /(?:^|\.)sparkpostmail\.com$/i,
  /^click\d*\./i,
  /^clicks\./i,
  /^track\d*\./i,
  /^tracking\./i,
];

const TRACKER_PATHS = [/^\/(?:Ctc|CL0|e3t)\//i, /^\/ls\/click\b/i, /^\/wf\/(?:click|open)\b/i, /^\/track\//i];

const STRONG_TEXT = ['sign in', 'sign-in', 'signin', 'log in', 'log-in', 'login', 'magic link', 'passwordless'];
const STRONG_PATHS = ['/login', '/signin', '/sign-in', '/magic', '/session'];

const MIN_SCORE = 0.5;

export interface VerificationLink {
  url: string;
  host: string;
}

interface Anchor {
  href: string;
  text: string;
  context: string;
}

/**
 * Best verification or magic sign-in link in a message.
 * Returns null for newsletters, password resets, and account-deletion mail.
 */
export function extractVerificationLink(subject: string, text: string, html: string): VerificationLink | null {
  if (containsAny(subject.toLowerCase(), HARD_DANGER)) return null;

  const plain = text || '';
  const visible = `${plain} ${html ? htmlToText(html) : ''}`.replace(/\s+/g, ' ').trim();
  const anchors = harvestAnchors(html);
  const rawUrls = harvestRawUrls(plain);
  const hasUrlHint =
    anchors.some((anchor) => containsAny(anchor.href.toLowerCase(), URL_HINTS)) ||
    rawUrls.some((href) => containsAny(href.toLowerCase(), URL_HINTS));
  const hasIntent =
    containsAny(visible.toLowerCase(), MAGIC_KEYWORDS) ||
    containsAny(subject.toLowerCase(), MAGIC_KEYWORDS) ||
    hasUrlHint;
  if (!hasIntent) return null;

  const candidates: { url: string; host: string; score: number }[] = [];
  for (const anchor of anchors) {
    const hrefs = linkHrefs(anchor.href, anchor.text);
    for (const href of hrefs) {
      const scored = scoreLink(href, anchor.text, subject, anchor.context);
      if (scored) candidates.push(scored);
    }
  }
  for (const href of rawUrls) {
    if (anchors.some((anchor) => sameUrl(anchor.href, href))) continue;
    const scored = scoreLink(href, '', subject, contextAround(visible, href));
    if (scored) candidates.push(scored);
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates.find((candidate) => candidate.score >= MIN_SCORE);
  return best ? { url: best.url, host: best.host } : null;
}

export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function harvestAnchors(html: string): Anchor[] {
  if (!html) return [];
  const anchors: Anchor[] = [];
  const re = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(re)) {
    const href = decodeHref((match[1] || match[2] || '').trim());
    if (!href || /^(mailto:|tel:|#)/i.test(href)) continue;
    const text = htmlToText(match[3] || '');
    const before = htmlToText(html.slice(0, match.index ?? 0)).slice(-240);
    const after = htmlToText(html.slice((match.index ?? 0) + match[0].length)).slice(0, 80);
    anchors.push({ href, text, context: `${before} ${after}`.trim() });
  }
  return anchors;
}

function harvestRawUrls(text: string): string[] {
  const urls = [...text.matchAll(/\bhttps?:\/\/[^\s<>"']+/gi)].map((match) =>
    decodeHref(match[0].replace(/[),.;]+$/, '')),
  );
  return [...new Set(urls)];
}

function scoreLink(
  rawHref: string,
  anchorText: string,
  subject: string,
  localContext: string,
): { url: string; host: string; score: number } | null {
  const href = unwrap(rawHref);
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  if (!host || isTracker(url)) return null;

  const hrefLower = url.href.toLowerCase();
  const anchorLower = anchorText.toLowerCase();
  if (containsAny(hrefLower, DANGEROUS) || (anchorLower && containsAny(anchorLower, DANGEROUS))) return null;
  if (RESET_PATHS.some((pattern) => pattern.test(url.pathname))) return null;
  if (DESTRUCTIVE_PATHS.some((pattern) => pattern.test(url.pathname))) return null;
  if (containsAny(localContext.toLowerCase(), HARD_DANGER) && !hasStrongLogin(url, anchorText)) return null;

  let score = 0.3;
  const bodyIntent = containsAny(localContext.toLowerCase(), MAGIC_KEYWORDS) || anchorHasIntent(anchorText);
  if (bodyIntent) score += 0.18;
  if (containsAny(hrefLower, URL_HINTS)) score += 0.24;
  if (loginPhraseBefore(localContext, url.href)) score += 0.24;
  if (containsAny(subject.toLowerCase(), MAGIC_KEYWORDS)) score += 0.1;
  if (anchorHasIntent(anchorText)) score += 0.1;
  return { url: url.href, host: host.replace(/^www\./, ''), score };
}

function unwrap(href: string): string {
  let current = href.trim();
  for (let hop = 0; hop < 3; hop++) {
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      return current;
    }
    const host = url.hostname.toLowerCase();
    let next = '';
    if ((host === 'www.google.com' || host === 'google.com') && url.pathname === '/url') {
      next = url.searchParams.get('q') || url.searchParams.get('url') || '';
    } else if (host.endsWith('.safelinks.protection.outlook.com') || host === 'safelinks.protection.outlook.com') {
      next = url.searchParams.get('url') || '';
    }
    if (!next.startsWith('https://')) return current;
    current = next;
  }
  return current;
}

function isTracker(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  if (TRACKER_HOSTS.some((pattern) => pattern.test(host))) return true;
  if (TRACKER_PATHS.some((pattern) => pattern.test(url.pathname))) return true;
  if (isMailgunClick(url)) return true;
  return false;
}

/** Mailgun rewrites the button to email.mg.example.com/c/..., hiding the real host. */
function isMailgunClick(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  const mailgun = host.endsWith('.mailgun.org') || host.endsWith('.mailgun.net') || /(^|\.)mg\.[^.]+\.[^.]+$/.test(host);
  if (!mailgun) return false;
  return url.pathname === '/c' || url.pathname.startsWith('/c/') || url.pathname.startsWith('/o/');
}

/**
 * Use the real URL when the href is only a click tracker.
 * ExtensionPay prints that URL as the link text next to the button.
 */
function linkHrefs(href: string, anchorText: string): string[] {
  let url: URL | null = null;
  try {
    url = new URL(unwrap(href));
  } catch {
    url = null;
  }
  if (url && isTracker(url)) {
    const visible = harvestRawUrls(anchorText);
    return visible.length ? visible : [];
  }
  return [href];
}

function loginPhraseBefore(localContext: string, href: string): boolean {
  const hay = localContext.toLowerCase();
  const at = hay.indexOf(href.toLowerCase());
  const before = at >= 0 ? hay.slice(Math.max(0, at - 96), at) : hay.slice(-96);
  return /click (?:this|the) link to (?:log|sign) in|login request/.test(before);
}

function hasStrongLogin(url: URL, anchorText: string): boolean {
  const text = anchorText.toLowerCase();
  if (text && STRONG_TEXT.some((marker) => text.includes(marker))) return true;
  const path = url.pathname.toLowerCase();
  return STRONG_PATHS.some((marker) => path.includes(marker));
}

function anchorHasIntent(text: string): boolean {
  const value = text.toLowerCase().trim();
  if (!value) return false;
  return containsAny(value, MAGIC_KEYWORDS) || /^(open|continue|sign\s?in|log\s?in|verify|confirm)\b/i.test(value);
}

function contextAround(text: string, href: string): string {
  const index = text.indexOf(href);
  if (index < 0) return text.slice(0, 320);
  return text.slice(Math.max(0, index - 240), index + href.length + 80);
}

function sameUrl(a: string, b: string): boolean {
  try {
    return new URL(unwrap(a)).href === new URL(unwrap(b)).href;
  } catch {
    return a === b;
  }
}

function containsAny(hay: string, needles: readonly string[]): boolean {
  return needles.some((needle) => hay.includes(needle));
}

function decodeHref(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

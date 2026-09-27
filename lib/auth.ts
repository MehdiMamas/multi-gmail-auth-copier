import { browser } from 'wxt/browser';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export interface SignedInAccount {
  email: string;
  token: string;
  expiresAt: number;
}

export function googleClientId(): string {
  return import.meta.env.WXT_GOOGLE_CLIENT_ID ?? '';
}

/** Interactive sign-in. Call this from the options page so the click gesture is intact. */
export async function signInInteractive(loginHint?: string): Promise<SignedInAccount> {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error('Missing Google client id. Add WXT_GOOGLE_CLIENT_ID to .env and rebuild.');
  }
  const responseUrl = await launch(clientId, true, 'select_account', loginHint);
  return accountFromResponse(responseUrl);
}

/** Silent refresh used by the background worker. Returns null if the user must click Reconnect. */
export async function refreshAccessToken(email: string): Promise<{ token: string; expiresAt: number } | null> {
  const clientId = googleClientId();
  if (!clientId) return null;
  try {
    const responseUrl = await launch(clientId, false, 'none', email);
    const account = await accountFromResponse(responseUrl);
    return { token: account.token, expiresAt: account.expiresAt };
  } catch {
    return null;
  }
}

async function launch(
  clientId: string,
  interactive: boolean,
  prompt: 'select_account' | 'none',
  loginHint?: string,
): Promise<string> {
  const redirectUri = browser.identity.getRedirectURL();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'token');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('prompt', prompt);
  if (loginHint) url.searchParams.set('login_hint', loginHint);

  const responseUrl = await browser.identity.launchWebAuthFlow({
    url: url.href,
    interactive,
  });
  if (!responseUrl) throw new Error('Google sign-in was cancelled');
  return responseUrl;
}

async function accountFromResponse(responseUrl: string): Promise<SignedInAccount> {
  const params = new URLSearchParams(new URL(responseUrl).hash.replace(/^#/, ''));
  const error = params.get('error');
  if (error) throw new Error(params.get('error_description') || error);
  const token = params.get('access_token');
  if (!token) throw new Error('Google did not return an access token');
  const expiresIn = Number(params.get('expires_in') || 3600);
  const email = await fetchEmail(token);
  return { email, token, expiresAt: Date.now() + expiresIn * 1000 };
}

async function fetchEmail(token: string): Promise<string> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Could not read the Google account email');
  const data = (await response.json()) as { email?: string };
  if (!data.email) throw new Error('Google account has no email address');
  return data.email;
}

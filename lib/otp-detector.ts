/**
 * Finds a verification-code field on the page.
 * Email and authenticator fields score high enough to auto-fill.
 * SMS and phone fields stay in a weak band so a Fill chip can still appear.
 * Promo codes, API keys, and access tokens are ignored.
 */
export interface OtpFieldDetection {
  element: HTMLInputElement;
  confidence: number;
  type: 'single' | 'split';
  splitInputs?: HTMLInputElement[];
}

const CODE_PHRASES = ['emailed', 'email code', 'verification code', 'authenticator'];

const BLOCKED = [
  'promo',
  'coupon',
  'personal access token',
  'access token',
  'access-token',
  'api key',
  'api-key',
  'api token',
];

const FILLABLE_TYPES = new Set(['', 'text', 'tel', 'number']);

export const detectOtpFields = (): OtpFieldDetection[] => {
  const inputs = Array.from(document.querySelectorAll('input')).filter(isFillable);
  const used = new Set<HTMLInputElement>();
  const found: OtpFieldDetection[] = [];

  for (const group of digitGroups(inputs)) {
    group.forEach((input) => used.add(input));
    const detection = scoreGroup(group);
    if (detection) found.push(detection);
  }

  for (const input of inputs) {
    if (used.has(input)) continue;
    const detection = scoreSingle(input);
    if (detection) found.push(detection);
  }

  return found.sort((a, b) => b.confidence - a.confidence);
};

export const getBestOtpField = (minimum = 0.5): OtpFieldDetection | null => {
  const best = detectOtpFields()[0];
  if (!best || best.confidence < minimum) return null;
  return best;
};

const isFillable = (input: HTMLInputElement): boolean => {
  if (input.readOnly || input.disabled) return false;
  return FILLABLE_TYPES.has((input.type || '').toLowerCase());
};

const digitGroups = (inputs: HTMLInputElement[]): HTMLInputElement[][] => {
  const boxes = inputs.filter(isDigitBox);
  const groups: HTMLInputElement[][] = [];
  let current: HTMLInputElement[] = [];
  let currentKey: HTMLElement | null = null;

  const flush = (): void => {
    if (current.length >= 4 && current.length <= 8) groups.push(current);
    current = [];
    currentKey = null;
  };

  for (const box of boxes) {
    const key = groupContainer(box);
    if (currentKey && key === currentKey) {
      current.push(box);
      continue;
    }
    flush();
    current = [box];
    currentKey = key;
  }
  flush();
  return groups;
};

const isDigitBox = (input: HTMLInputElement): boolean => input.maxLength === 1;

const groupContainer = (input: HTMLInputElement): HTMLElement | null => {
  const parent = input.parentElement;
  if (!parent) return null;
  const alone = parent.querySelectorAll('input').length === 1;
  if (alone && parent.parentElement && parent.parentElement !== document.body) return parent.parentElement;
  return parent;
};

const scoreGroup = (inputs: HTMLInputElement[]): OtpFieldDetection | null => {
  const text = groupText(inputs);
  const confidence = confidenceFor(text, true, false);
  if (confidence === null || confidence < 0.3) return null;
  return { element: inputs[0]!, confidence, type: 'split', splitInputs: inputs };
};

const scoreSingle = (input: HTMLInputElement): OtpFieldDetection | null => {
  const text = fieldText(input);
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase().includes('one-time-code');
  const shortCode = input.maxLength >= 4 && input.maxLength <= 8;
  const confidence = confidenceFor(text, shortCode, autocomplete);
  if (confidence === null || confidence < 0.3) return null;
  return { element: input, confidence, type: 'single' };
};

const confidenceFor = (text: string, shapedLikeCode: boolean, autocomplete: boolean): number | null => {
  if (BLOCKED.some((word) => text.includes(word))) return null;
  if (autocomplete) return 0.9;
  const sms = /\bsms\b|text message|texted|to your phone/.test(text);
  const phrase = CODE_PHRASES.some((phrase) => text.includes(phrase));
  if (sms) return shapedLikeCode && (phrase || text.includes('code')) ? 0.4 : null;
  if (phrase) return 0.8;
  if (shapedLikeCode && text.includes('code')) return 0.72;
  return null;
};

const groupText = (inputs: HTMLInputElement[]): string => {
  const container = groupContainer(inputs[0]!);
  const before = container?.previousElementSibling;
  const lead = before?.tagName === 'LABEL' ? (before.textContent ?? '') : '';
  return `${lead} ${inputs.map(fieldText).join(' ')}`.toLowerCase();
};

const fieldText = (input: HTMLInputElement): string => {
  const parts = [
    labelledBy(input),
    input.getAttribute('aria-label') ?? '',
    input.placeholder ?? '',
    input.name ?? '',
    input.id ?? '',
  ];
  return parts.join(' ').toLowerCase();
};

const labelledBy = (input: HTMLInputElement): string => {
  if (input.id) {
    const match = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
    if (match?.textContent) return match.textContent;
  }
  const wrapping = input.closest('label');
  if (wrapping?.textContent) return wrapping.textContent;
  const previous = input.previousElementSibling;
  if (previous?.tagName === 'LABEL') return previous.textContent ?? '';
  return '';
};

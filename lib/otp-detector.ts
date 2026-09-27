/**
 * Adapted from ente-auth-extension (https://github.com/ente-io/ente), AGPL-3.0.
 * Email delivery is a positive signal here. SMS and phone delivery lower the
 * score so an email code is not auto-filled into an SMS box.
 */
export interface OtpFieldDetection {
  element: HTMLInputElement;
  confidence: number;
  type: 'single' | 'split';
  splitInputs?: HTMLInputElement[];
}

const MFA_ATTRIBUTE_PATTERNS = [
  'otp',
  'totp',
  'hotp',
  'mfa',
  '2fa',
  'twofa',
  'two-factor',
  'twofactor',
  'verification-code',
  'verificationcode',
  'verify-code',
  'verifycode',
  'auth-code',
  'authcode',
  'auth-token',
  'authtoken',
  '2fa-token',
  'mfa-token',
  'otp-token',
  'totp-token',
  'twofa-token',
  'twofactor-token',
  'two-factor-token',
  'authenticator',
  'security-code',
  'securitycode',
  'pin-code',
  'pincode',
  'passcode',
  'one-time',
  'onetime',
  'otc',
];

const EMAIL_ATTRIBUTE_PATTERNS = [
  'email-code',
  'emailcode',
  'email-otp',
  'emailotp',
  'email-verification',
  'email-verify',
  'by-email',
  'via-email',
];

const SMS_ATTRIBUTE_PATTERNS = [
  'sms',
  'sms-code',
  'smscode',
  'text-code',
  'textcode',
  'text-message',
  'textmessage',
  'phone-code',
  'phonecode',
  'phone-otp',
  'phoneotp',
  'phone-verification',
  'phone-verify',
  'by-sms',
  'by-text',
  'via-sms',
  'via-text',
  'sms-marketing',
];

const EXCLUSION_PATTERNS = [
  'promo',
  'promotion',
  'promotional',
  'coupon',
  'discount',
  'voucher',
  'gift',
  'giftcard',
  'gift-card',
  'referral',
  'refer',
  'invite',
  'invitation',
  'redeem',
  'reward',
  'loyalty',
  'offer',
  'deal',
  'signup',
  'sign-up',
  'newsletter',
  'subscribe',
  'captcha',
  'recaptcha',
  'postal',
  'zip',
  'zipcode',
  'zip-code',
  'magic-link',
  'magiclink',
  'personal-access-token',
  'personalaccesstoken',
  'personal access token',
  'access-token',
  'accesstoken',
  'access token',
  'api-token',
  'apitoken',
  'api token',
  'api-key',
  'apikey',
  'api key',
  'bearer-token',
  'bearertoken',
  'bearer token',
  'refresh-token',
  'refreshtoken',
  'refresh token',
  'oauth-token',
  'oauthtoken',
  'oauth token',
  'secret-key',
  'secretkey',
  'secret key',
  'private-key',
  'privatekey',
  'private key',
  'deploy-key',
  'deploy key',
  'client-secret',
  'client secret',
  'client-id',
  'client id',
  'webhook-secret',
  'webhook secret',
];

const SMS_LABEL_PATTERNS = [
  'text message',
  'sms',
  'via text',
  'via sms',
  'by text',
  'by sms',
  'by phone',
  'via phone',
  'text you',
  'texted you',
  'texted to',
  'text to',
  'sent to your phone',
  'sent to your mobile',
  'sent you a text',
  'sent you an sms',
  'check your phone',
  'check your text',
  'code we texted',
  "we'll text",
  'we will text',
  'phone number ending',
  'mensaje de texto',
  'te enviamos un sms',
  'enviado a tu teléfono',
  'message texte',
  'par sms',
  'per sms',
  'an ihre telefonnummer',
  'messaggio di testo',
  'via sms',
];

const EMAIL_LABEL_PATTERNS = [
  'check your email',
  'check your inbox',
  'sent to your email',
  'sent you an email',
  'code we emailed',
  'we emailed',
  'emailed you',
  "we'll email",
  'we will email',
  'by email',
  'via email',
  'email code',
  'email verification',
  'enviado a tu correo',
  'par e-mail',
  'per e-mail',
  'via e-mail',
  'an ihre e-mail',
];

const MFA_LABEL_PATTERNS = [
  'verification code',
  'authentication code',
  'security code',
  '2-factor',
  'two-factor',
  '6-digit code',
  '6 digit code',
  'one-time code',
  'one time code',
  'one-time password',
  'one time password',
  'otp',
  'mfa',
  'authenticator',
  'enter your code',
  'enter the code from',
  'passcode',
  'login code',
  'signin code',
  'sign-in code',
  'codice di verifica',
  'codice di autenticazione',
  'codice di sicurezza',
  'codice otp',
  'inserisci il codice',
  'inserisci codice',
  'codice a 6 cifre',
  'codice monouso',
  'código de verificación',
  'código de autenticación',
  'código de seguridad',
  'introduce el código',
  'ingrese el código',
  'ingresa el código',
  'código de 6 dígitos',
  'código único',
  'code de vérification',
  "code d'authentification",
  'code de sécurité',
  'entrez le code',
  'saisissez le code',
  'code à 6 chiffres',
  'code à usage unique',
  'bestätigungscode',
  'verifizierungscode',
  'authentifizierungscode',
  'sicherheitscode',
  'code eingeben',
  '6-stelliger code',
  'einmalcode',
  'código de verificação',
  'código de autenticação',
  'código de segurança',
  'digite o código',
  'insira o código',
  'código de 6 dígitos',
  'verificatiecode',
  'beveiligingscode',
  'voer code in',
  'kod weryfikacyjny',
  'kod bezpieczeństwa',
  'wprowadź kod',
  'код подтверждения',
  'код верификации',
  'введите код',
  '認証コード',
  '確認コード',
  'ワンタイム',
  '验证码',
  '認證碼',
  '安全码',
  '动态口令',
  '动态码',
  '动态验证码',
  '两步验证',
  '身份验证码',
  'mfa码',
  '인증 코드',
  '인증코드',
  '보안 코드',
  '일회용 비밀번호',
];

const matchesPattern = (value: string | null | undefined, patterns: string[]): boolean => {
  if (!value) return false;
  const lower = value.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern));
};

const findLabelForInput = (input: HTMLInputElement): HTMLLabelElement | null => {
  if (input.id) {
    const label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
    if (label) return label as HTMLLabelElement;
  }
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel as HTMLLabelElement;
  return null;
};

const inputTextBlob = (input: HTMLInputElement): string => {
  const dataAttrsText = Array.from(input.attributes)
    .filter((attr) => attr.name.startsWith('data-'))
    .map((attr) => `${attr.name} ${attr.value}`)
    .join(' ');
  return [input.name, input.id, input.className, input.placeholder, input.getAttribute('aria-label'), dataAttrsText]
    .filter(Boolean)
    .join(' ');
};

const isExcludedField = (input: HTMLInputElement): boolean => {
  if (matchesPattern(inputTextBlob(input), EXCLUSION_PATTERNS)) return true;
  const inputLabel = findLabelForInput(input);
  if (inputLabel && matchesPattern(inputLabel.textContent, EXCLUSION_PATTERNS)) return true;
  const inputContainer = input.closest("form, fieldset, [role='group']") || input.parentElement?.parentElement;
  if (inputContainer) {
    const containerText = `${(inputContainer as HTMLElement).id || ''} ${(inputContainer as HTMLElement).className || ''}`;
    if (matchesPattern(containerText, EXCLUSION_PATTERNS)) return true;
  }
  return false;
};

const hasSmsSignal = (input: HTMLInputElement): boolean => {
  if (matchesPattern(inputTextBlob(input), SMS_ATTRIBUTE_PATTERNS)) return true;
  const placeholder = input.placeholder || '';
  const ariaLabel = input.getAttribute('aria-label') || '';
  const labelText = findLabelForInput(input)?.textContent || '';
  if (
    matchesPattern(placeholder, SMS_LABEL_PATTERNS) ||
    matchesPattern(ariaLabel, SMS_LABEL_PATTERNS) ||
    matchesPattern(labelText, SMS_LABEL_PATTERNS)
  ) {
    return true;
  }
  const describedById = input.getAttribute('aria-describedby');
  if (describedById) {
    const describedBy = document.getElementById(describedById);
    if (describedBy && matchesPattern(describedBy.textContent, SMS_LABEL_PATTERNS)) return true;
  }
  if (input.autocomplete === 'one-time-code') return false;
  let ancestor: HTMLElement | null = input.parentElement;
  for (let depth = 0; depth < 4 && ancestor && ancestor !== document.body; depth++) {
    if (matchesPattern((ancestor.textContent || '').slice(0, 500), SMS_LABEL_PATTERNS)) return true;
    ancestor = ancestor.parentElement;
  }
  return false;
};

const emailLabelBonus = (input: HTMLInputElement): number => {
  if (matchesPattern(inputTextBlob(input), EMAIL_ATTRIBUTE_PATTERNS)) return 0.3;
  const placeholder = input.placeholder || '';
  const ariaLabel = input.getAttribute('aria-label') || '';
  const labelText = findLabelForInput(input)?.textContent || '';
  if (
    matchesPattern(placeholder, EMAIL_LABEL_PATTERNS) ||
    matchesPattern(ariaLabel, EMAIL_LABEL_PATTERNS) ||
    matchesPattern(labelText, EMAIL_LABEL_PATTERNS)
  ) {
    return 0.55;
  }
  let ancestor: HTMLElement | null = input.parentElement;
  for (let depth = 0; depth < 4 && ancestor && ancestor !== document.body; depth++) {
    if (matchesPattern((ancestor.textContent || '').slice(0, 500), EMAIL_LABEL_PATTERNS)) return 0.55;
    ancestor = ancestor.parentElement;
  }
  return 0;
};

const calculateConfidence = (input: HTMLInputElement): number => {
  if (isExcludedField(input)) return 0;
  let confidence = 0;

  if (input.autocomplete === 'one-time-code') confidence += 0.7;
  if (input.inputMode === 'numeric' && input.maxLength === 6) confidence += 0.5;

  const pattern = input.pattern;
  if (pattern && (/\[0-9\]\{6\}/.test(pattern) || /\\d\{6\}/.test(pattern) || /^\d{6}$/.test(pattern))) {
    confidence += 0.4;
  } else if (pattern && (/\[0-9\]\{[4-8]\}/.test(pattern) || /\\d\{[4-8]\}/.test(pattern))) {
    confidence += 0.3;
  }

  if (input.maxLength === 6) confidence += 0.2;
  if (input.maxLength === 4 || input.maxLength === 8) confidence += 0.1;
  if (input.inputMode === 'numeric' && input.maxLength !== 6) confidence += 0.15;
  if (input.type === 'tel' || input.type === 'number') confidence += 0.15;

  const nameIdClass = `${input.name || ''} ${input.id || ''} ${input.className || ''}`;
  if (matchesPattern(nameIdClass, MFA_ATTRIBUTE_PATTERNS)) confidence += 0.3;

  const dataAttrs = Array.from(input.attributes)
    .filter((attr) => attr.name.startsWith('data-'))
    .map((attr) => `${attr.name} ${attr.value}`)
    .join(' ');
  if (matchesPattern(dataAttrs, MFA_ATTRIBUTE_PATTERNS)) confidence += 0.2;

  if (matchesPattern(input.placeholder, MFA_LABEL_PATTERNS)) confidence += 0.25;
  const label = findLabelForInput(input);
  if (label && matchesPattern(label.textContent, MFA_LABEL_PATTERNS)) confidence += 0.25;
  if (matchesPattern(input.getAttribute('aria-label'), MFA_LABEL_PATTERNS)) confidence += 0.2;

  const describedById = input.getAttribute('aria-describedby');
  if (describedById) {
    const describedBy = document.getElementById(describedById);
    if (describedBy && matchesPattern(describedBy.textContent, MFA_LABEL_PATTERNS)) confidence += 0.15;
  }

  const container = input.closest("form, fieldset, [role='group']") || input.parentElement?.parentElement;
  if (container) {
    const containerIdClass = `${container.id || ''} ${container.className || ''}`;
    if (matchesPattern(containerIdClass, MFA_ATTRIBUTE_PATTERNS)) confidence += 0.2;
  }

  let ancestor: HTMLElement | null = input.parentElement;
  while (ancestor && ancestor !== document.body) {
    if (ancestor === container) {
      ancestor = ancestor.parentElement;
      continue;
    }
    const tagName = ancestor.tagName.toLowerCase();
    const ancestorIdClass = `${ancestor.id || ''} ${ancestor.className || ''}`;
    if (matchesPattern(tagName, MFA_ATTRIBUTE_PATTERNS) || matchesPattern(ancestorIdClass, MFA_ATTRIBUTE_PATTERNS)) {
      confidence += 0.2;
      break;
    }
    ancestor = ancestor.parentElement;
  }

  confidence += emailLabelBonus(input);
  confidence = Math.min(confidence, 1);
  if (hasSmsSignal(input)) confidence = Math.max(0, Math.min(confidence - 0.4, 0.49));
  return confidence;
};

const isVisible = (input: HTMLInputElement): boolean => {
  if (input.readOnly || input.disabled) return false;
  if (!input.offsetParent && input.style.position !== 'fixed') return false;
  return true;
};

const detectSplitInputs = (): OtpFieldDetection | null => {
  const allInputs = document.querySelectorAll<HTMLInputElement>(
    'input[maxlength="1"][type="text"], input[maxlength="1"][type="tel"], input[maxlength="1"][type="number"], input[maxlength="1"]:not([type])',
  );
  const groups: HTMLInputElement[][] = [];
  let currentGroup: HTMLInputElement[] = [];

  allInputs.forEach((input) => {
    if (!isVisible(input)) return;
    if (currentGroup.length === 0) {
      currentGroup.push(input);
      return;
    }
    const lastInput = currentGroup[currentGroup.length - 1]!;
    const isSibling = lastInput.nextElementSibling === input || lastInput.parentElement === input.parentElement;
    const isClose = lastInput.parentElement?.parentElement === input.parentElement?.parentElement;
    if (isSibling || isClose) currentGroup.push(input);
    else {
      if (currentGroup.length >= 4 && currentGroup.length <= 8) groups.push(currentGroup);
      currentGroup = [input];
    }
  });
  if (currentGroup.length >= 4 && currentGroup.length <= 8) groups.push(currentGroup);

  for (const group of groups) {
    if (group.length < 4 || group.length > 8) continue;
    if (isExcludedField(group[0]!)) continue;
    let confidence = 0.85;
    if (hasSmsSignal(group[0]!)) confidence = Math.max(0, Math.min(confidence - 0.4, 0.49));
    else confidence = Math.min(1, confidence + emailLabelBonus(group[0]!));
    return { element: group[0]!, confidence, type: 'split', splitInputs: group };
  }
  return null;
};

export const detectOtpFields = (): OtpFieldDetection[] => {
  const detections: OtpFieldDetection[] = [];
  const splitDetection = detectSplitInputs();
  if (splitDetection) detections.push(splitDetection);

  const inputs = document.querySelectorAll<HTMLInputElement>(
    'input[type="text"], input[type="tel"], input[type="number"], input:not([type])',
  );
  inputs.forEach((input) => {
    if (!isVisible(input)) return;
    if (splitDetection?.splitInputs?.includes(input)) return;
    if (input.type === 'password') return;
    if (input.maxLength === 1) return;
    const confidence = calculateConfidence(input);
    if (confidence >= 0.3) detections.push({ element: input, confidence, type: 'single' });
  });

  detections.sort((a, b) => b.confidence - a.confidence);
  return detections;
};

export const getBestOtpField = (minimum = 0.5): OtpFieldDetection | null => {
  return detectOtpFields().find((detection) => detection.confidence >= minimum) ?? null;
};

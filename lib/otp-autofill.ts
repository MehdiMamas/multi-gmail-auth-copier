/**
 * Adapted from ente-auth-extension (https://github.com/ente-io/ente), AGPL-3.0.
 * The value is written with the native setter before input events so React
 * controlled inputs keep the code. Auto-submit stays optional.
 */
import type { OtpFieldDetection } from './otp-detector';

const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

export const fillCode = (detection: OtpFieldDetection, code: string, autoSubmit = false): void => {
  if (detection.type === 'split' && detection.splitInputs) fillSplitInputs(detection.splitInputs, code);
  else fillSingleInput(detection.element, code);

  if (autoSubmit) {
    setTimeout(() => {
      clickSubmitButton(detection.element);
    }, 100);
  }
};

const setNativeValue = (input: HTMLInputElement, value: string): void => {
  if (nativeValueSetter) nativeValueSetter.call(input, value);
  else input.value = value;
};

const fillSingleInput = (input: HTMLInputElement, code: string): void => {
  input.focus();
  setNativeValue(input, code);
  triggerInputEvents(input, code);
};

const fillSplitInputs = (inputs: HTMLInputElement[], code: string): void => {
  if (code.length !== inputs.length && inputs[0]) {
    const transfer = new DataTransfer();
    transfer.setData('text/plain', code);
    inputs[0].focus();
    const paste = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: transfer });
    const handled = !inputs[0].dispatchEvent(paste);
    if (handled) return;
  }

  const digits = code.split('');
  inputs.forEach((input, index) => {
    const digit = digits[index];
    if (!digit) return;
    input.focus();
    setNativeValue(input, digit);
    triggerInputEvents(input, digit);
  });
  const lastIndex = Math.min(digits.length, inputs.length) - 1;
  if (lastIndex >= 0) inputs[lastIndex]?.focus();
};

const triggerInputEvents = (input: HTMLInputElement, data: string): void => {
  input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true }));
  input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true }));
};

const isLikelySubmitButton = (element: HTMLElement): boolean => {
  const text = element.textContent?.toLowerCase().trim() || '';
  const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
  const title = element.getAttribute('title')?.toLowerCase() || '';
  const className = element.className?.toLowerCase?.() || '';
  const id = element.id?.toLowerCase() || '';
  const submitKeywords = [
    'submit',
    'verify',
    'confirm',
    'continue',
    'next',
    'sign in',
    'signin',
    'login',
    'log in',
    'authenticate',
    'send',
    'done',
    'ok',
    'go',
    'enter',
    '验证',
    '确认',
    '提交',
    '继续',
    '登录',
    '登入',
    '下一步',
    '確認',
    '送信',
    'ログイン',
    '次へ',
    '확인',
    '제출',
    '로그인',
    '다음',
  ];
  for (const keyword of submitKeywords) {
    if (text.includes(keyword) || ariaLabel.includes(keyword) || title.includes(keyword)) return true;
  }
  const primaryClassPatterns = ['submit', 'primary', 'btn-primary', 'cta', 'action', 'continue', 'next', 'confirm'];
  return primaryClassPatterns.some((pattern) => className.includes(pattern) || id.includes(pattern));
};

const clickSubmitButton = (input: HTMLInputElement): void => {
  const form = input.closest('form');
  if (form) {
    const submitButton = form.querySelector<HTMLButtonElement | HTMLInputElement>(
      'button[type="submit"], input[type="submit"]',
    );
    if (submitButton && !submitButton.disabled) {
      submitButton.click();
      return;
    }
    const defaultButton = form.querySelector<HTMLButtonElement>('button:not([type])');
    if (defaultButton && !defaultButton.disabled) {
      defaultButton.click();
      return;
    }
    for (const button of form.querySelectorAll<HTMLButtonElement>('button')) {
      if (!button.disabled && isLikelySubmitButton(button)) {
        button.click();
        return;
      }
    }
  }

  let container: HTMLElement | null = input.parentElement;
  const checked = new Set<HTMLElement>();
  for (let i = 0; i < 10 && container; i++) {
    if (checked.has(container)) {
      container = container.parentElement;
      continue;
    }
    checked.add(container);
    const clickables = container.querySelectorAll<HTMLElement>(
      'button, input[type="submit"], input[type="button"], a[role="button"], [role="button"]',
    );
    for (const element of clickables) {
      if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') continue;
      if (isLikelySubmitButton(element)) {
        element.click();
        return;
      }
    }
    container = container.parentElement;
  }

  const allButtons = document.querySelectorAll<HTMLElement>('button, input[type="submit"], a[role="button"], [role="button"]');
  for (const button of allButtons) {
    if (
      button.hasAttribute('disabled') ||
      button.getAttribute('aria-disabled') === 'true' ||
      button.offsetParent === null
    ) {
      continue;
    }
    if (!isLikelySubmitButton(button)) continue;
    const rect = button.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      button.click();
      return;
    }
  }

  form?.requestSubmit();
};

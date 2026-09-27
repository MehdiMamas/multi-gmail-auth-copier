/**
 * Writes a code into the detected field.
 * The native value setter runs before input events so React-controlled inputs keep the code.
 */
import type { OtpFieldDetection } from './otp-detector';

const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

export const fillCode = (detection: OtpFieldDetection, code: string, autoSubmit = false): void => {
  if (detection.type === 'split' && detection.splitInputs?.length) fillSplit(detection.splitInputs, code);
  else fillSingle(detection.element, code);

  if (!autoSubmit) return;
  const form = detection.element.closest('form');
  const submit = form?.querySelector<HTMLButtonElement | HTMLInputElement>(
    'button[type="submit"], input[type="submit"]',
  );
  if (submit && !submit.disabled) submit.click();
};

const fillSingle = (input: HTMLInputElement, code: string): void => {
  input.focus();
  writeValue(input, code);
};

const fillSplit = (inputs: HTMLInputElement[], code: string): void => {
  const first = inputs[0];
  if (!first) return;
  if (code.length !== inputs.length) {
    pasteInto(first, code);
    return;
  }
  inputs.forEach((input, index) => {
    const digit = code[index];
    if (!digit) return;
    input.focus();
    writeValue(input, digit);
  });
  inputs[inputs.length - 1]?.focus();
};

const pasteInto = (input: HTMLInputElement, code: string): void => {
  input.focus();
  const transfer = new DataTransfer();
  transfer.setData('text/plain', code);
  const paste = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: transfer });
  if (!input.dispatchEvent(paste)) return;
  writeValue(input, code);
};

const writeValue = (input: HTMLInputElement, value: string): void => {
  if (nativeValueSetter) nativeValueSetter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: value }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

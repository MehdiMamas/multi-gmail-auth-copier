import { describe, expect, it } from 'vitest';
import { fillCode } from '~/lib/otp-autofill';
import type { OtpFieldDetection } from '~/lib/otp-detector';

describe('fillCode', () => {
  it('writes through the native setter before the input event', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (!desc?.set || !desc.get) throw new Error('missing value descriptor');

    let tracker = '';
    Object.defineProperty(input, 'value', {
      configurable: true,
      get() {
        return desc.get!.call(this);
      },
      set(next: string) {
        tracker = next;
        desc.set!.call(this, next);
      },
    });

    let seen = '';
    input.addEventListener('input', () => {
      seen = input.value;
    });

    const detection: OtpFieldDetection = { element: input, confidence: 1, type: 'single' };
    fillCode(detection, '847291', false);

    expect(seen).toBe('847291');
    expect(input.value).toBe('847291');
    expect(tracker).not.toBe('847291');
  });

  it('fills one character per split box when the length matches', () => {
    const inputs = Array.from({ length: 6 }, () => {
      const input = document.createElement('input');
      input.maxLength = 1;
      document.body.appendChild(input);
      return input;
    });
    fillCode(
      { element: inputs[0]!, confidence: 1, type: 'split', splitInputs: inputs },
      '123456',
      false,
    );
    expect(inputs.map((input) => input.value).join('')).toBe('123456');
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectOtpFields, getBestOtpField } from '~/lib/otp-detector';

const show = [
  '01-single-totp.html',
  '02-split-siblings.html',
  '03-split-wrapped.html',
  '06-email.html',
  '11-totp-near-sms-text.html',
  '12-email-label.html',
  '13-split-four.html',
  '14-split-eight.html',
  '15-react-input.html',
];

const noAutofill = ['04-sms-label.html', '05-sms-attr.html', '07-split-sms.html'];
const hide = ['08-promo.html', '09-plain.html', '10-github-pat.html'];

describe('otp detector fixtures', () => {
  for (const file of show) {
    it(`${file} is an auto-fill target`, () => {
      mount(file);
      const best = getBestOtpField(0.5);
      expect(best, file).not.toBeNull();
    });
  }

  for (const file of noAutofill) {
    it(`${file} stays below auto-fill`, () => {
      mount(file);
      expect(getBestOtpField(0.5)).toBeNull();
      const candidate = detectOtpFields()[0];
      expect(candidate?.confidence ?? 0).toBeGreaterThanOrEqual(0.3);
      expect(candidate?.confidence ?? 1).toBeLessThan(0.5);
    });
  }

  for (const file of hide) {
    it(`${file} is ignored`, () => {
      mount(file);
      expect(detectOtpFields().some((field) => field.confidence >= 0.3)).toBe(false);
    });
  }

  it('uses CSS.escape for label ids', () => {
    document.body.innerHTML = `
      <label for="a.b">Verification code</label>
      <input id="a.b" autocomplete="one-time-code" maxlength="6" />
    `;
    expect(getBestOtpField(0.5)).not.toBeNull();
  });
});

function mount(file: string): void {
  const html = readFileSync(path.join(process.cwd(), 'test-pages', 'cases', file), 'utf8');
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  document.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/gi, '');
}

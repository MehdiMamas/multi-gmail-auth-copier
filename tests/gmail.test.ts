import { describe, expect, it } from 'vitest';
import { decodeBody, htmlToText, parseGmailMessage } from '~/lib/gmail';

describe('gmail parsing', () => {
  it('decodes a base64url plain-text part', () => {
    const raw = parseGmailMessage({
      id: 'm1',
      internalDate: '1700000000000',
      payload: {
        headers: [
          { name: 'Subject', value: 'Verification code' },
          { name: 'From', value: 'Google <noreply@google.com>' },
        ],
        mimeType: 'text/plain',
        body: { data: encode('Your verification code is 847291') },
      },
    });
    expect(raw.subject).toBe('Verification code');
    expect(raw.from).toContain('noreply@google.com');
    expect(raw.body).toContain('847291');
    expect(raw.receivedAt).toBe(1700000000000);
  });

  it('strips html when there is no plain part', () => {
    const text = htmlToText('<p>Your <b>code</b> is&nbsp;123456</p>');
    expect(text).toBe('Your code is 123456');
    expect(decodeBody(encode('abc'))).toBe('abc');
  });
});

function encode(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

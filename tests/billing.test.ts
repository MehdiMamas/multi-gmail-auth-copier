import { describe, expect, it } from 'vitest';
import { isNewAccountAllowed } from '~/lib/account-limit';

describe('isNewAccountAllowed', () => {
  it('allows the first account without a purchase', () => {
    expect(isNewAccountAllowed(0, false, false)).toBe(true);
  });

  it('allows reconnecting an account that is already saved', () => {
    expect(isNewAccountAllowed(1, true, false)).toBe(true);
    expect(isNewAccountAllowed(3, true, false)).toBe(true);
  });

  it('blocks a new address once one account is saved', () => {
    expect(isNewAccountAllowed(1, false, false)).toBe(false);
    expect(isNewAccountAllowed(2, false, false)).toBe(false);
  });

  it('allows another address after the one-time unlock', () => {
    expect(isNewAccountAllowed(1, false, true)).toBe(true);
  });
});

export const FREE_ACCOUNT_LIMIT = 1;

export const UPGRADE_REQUIRED_ERROR = 'One Gmail account is free. Upgrade to add another.';

/** A new address is allowed for the first account, for a reconnect, or after the one-time unlock. */
export function isNewAccountAllowed(accountCount: number, isExisting: boolean, paid: boolean): boolean {
  if (isExisting) return true;
  if (accountCount < FREE_ACCOUNT_LIMIT) return true;
  return paid;
}

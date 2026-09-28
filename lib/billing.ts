import ExtPay from 'extpay';
import { browser } from 'wxt/browser';

/** Extension registered on extensionpay.com as KeyTray. */
export const EXTENSION_PAY_ID = 'kfkmcgkbicdmgdodjjindmnpofbcmoji';

const PAID_KEY = 'billingPaid';

export function createExtPay() {
  return ExtPay(EXTENSION_PAY_ID);
}

export async function readPaid(): Promise<boolean> {
  const stored = await browser.storage.local.get(PAID_KEY);
  return stored[PAID_KEY] === true;
}

export async function cachePaid(paid: boolean): Promise<void> {
  await browser.storage.local.set({ [PAID_KEY]: paid });
}

/** Ask ExtensionPay, then keep the previous answer if the request fails. */
export async function refreshPaid(): Promise<boolean> {
  try {
    const user = await createExtPay().getUser();
    const paid = user.paid === true;
    await cachePaid(paid);
    return paid;
  } catch {
    return readPaid();
  }
}

export function openPaymentPage(): Promise<void> {
  return createExtPay().openPaymentPage();
}

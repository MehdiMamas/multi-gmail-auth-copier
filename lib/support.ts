export const PAYPAL_DONATE_URL =
  'https://www.paypal.com/donate/?business=4XDDD3F38QEGJ&no_recurring=1&item_name=Enjoy+using+the+extension%2C+you+can+skip+and+it+will+unlock+the+app+anyways.+it%27s+just+to+show+your+appreciation.&currency_code=USD';

export const DONATION_NOTE =
  'Multiple accounts are supported by a donation of $1 or more. There is a loophole you can use to skip the payment and unlock it. If you do it, congrats hacker. If not, you’ll have to pay ;)';

export const HACKER_LINE = 'Congrats, hacker.';

export function isPaypalUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'paypal.com' || host.endsWith('.paypal.com');
  } catch {
    return false;
  }
}

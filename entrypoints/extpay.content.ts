/**
 * Forwards the ExtensionPay success-page message to the background worker.
 * The listener is registered by importing the library.
 */
import 'extpay';

export default defineContentScript({
  matches: ['https://extensionpay.com/*'],
  runAt: 'document_start',
  main() {},
});

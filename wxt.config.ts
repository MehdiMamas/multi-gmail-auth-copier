import { defineConfig } from 'wxt';

/**
 * Stable unpacked-install id: kkaljelcngliippihmklimildhmmhoml
 * OAuth redirect: https://kkaljelcngliippihmklimildhmmhoml.chromiumapp.org/
 */
const EXTENSION_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAslm8PtehGFZWypx5zBGsCielypNE75s734s1+Jfnyq4ngCCs5vCnXTGhndlLXDx1rc5jcjr55hkJa7WlUdmP08x5Qn0NudgTp56we0gKbOEwXhedhK6QwsGIbgFkgQ8JooOzmExdr0eiFqM83uqF9EwbkLtX1qNPlqRnQJoLACHtMjOSysGXkrRgsgcYw73NUXnHe5IR3uhlKBAuLRkJw+YIfHA185GDb1kWBlpI5+8Fd3OoHmnMJtgstL2Hdn8XDK9YoMz6wA90yr7dRaGTYhIpiqwPKJy+M5wtnO/fHUIChGK9xVHQ0MWXxPzf/mVu8sXOl0d2HDeA5rKk+4obXwIDAQAB';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // `npm run zip` uses --mode store. The Chrome Web Store rejects `key`.
  // Unpacked builds keep it so the OAuth redirect id stays stable.
  manifest: ({ mode }) => ({
    name: 'Keytray',
    description:
      'Reads verification codes from your Gmail accounts and can auto-fill or copy them.',
    ...(mode === 'store' ? {} : { key: EXTENSION_KEY }),
    permissions: ['identity', 'storage', 'alarms', 'offscreen', 'notifications', 'scripting'],
    host_permissions: [
      'https://gmail.googleapis.com/*',
      'https://www.googleapis.com/*',
      'https://extensionpay.com/*',
      '<all_urls>',
    ],
    icons: {
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
    action: {
      default_title: 'Keytray',
      default_icon: {
        16: 'icons/icon16.png',
        32: 'icons/icon32.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png',
      },
    },
  }),
});

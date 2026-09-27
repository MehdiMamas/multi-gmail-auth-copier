# Setup

The extension id is fixed, so every unpacked install uses the same Google sign-in redirect:

`https://kkaljelcngliippihmklimildhmmhoml.chromiumapp.org/`

You need a free Google Cloud project. No billing account. The OAuth app stays in Testing mode. Add yourself and friends as test users (up to 100). Friends will see an "unverified app" screen once and click Continue.

## 1. Google Cloud

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Enable the **Gmail API** (APIs & Services → Library → Gmail API → Enable).
3. APIs & Services → OAuth consent screen:
   - User type: **External**
   - App name: Keytray
   - Your email as support and developer contact
   - Scopes: add `https://www.googleapis.com/auth/gmail.readonly` and `https://www.googleapis.com/auth/userinfo.email`
   - Test users: add every Gmail address that will connect, including yours
   - Publishing status: **Testing**
4. APIs & Services → Credentials → Create credentials → **OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `https://kkaljelcngliippihmklimildhmmhoml.chromiumapp.org/`
5. Copy the client id (it ends in `.apps.googleusercontent.com`).

## 2. Build

```bash
cp .env.example .env
```

Put the client id in `.env`:

```
WXT_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
```

```bash
npm install
npm test
npm run build
```

Load `.output/chrome-mv3` unpacked, or zip it for friends:

```bash
npm run zip
```

The zip is written under `.output`.

## 3. Install (you and friends)

1. Unzip the build if you received a zip.
2. Open `chrome://extensions` (Edge: `edge://extensions`).
3. Turn on **Developer mode**.
4. **Load unpacked** and choose the folder that contains `manifest.json` (`.output/chrome-mv3` after a local build).
5. Open the extension's options (the Settings button in the popup, or "Extension options" on the extensions page).
6. **Add account**, pick the Gmail account, and on the unverified-app screen click **Continue**.
7. Repeat Add account for each mailbox.

Tokens last about an hour and renew silently while that Google account stays signed in in the browser. If renewal fails, the popup shows **Reconnect**.

## How it behaves

- The popup lists the last 5 codes for the account you pick, or for all accounts. Each row has a Copy button. **Sync** fetches immediately.
- Background checks run about every 30 seconds. While a code field is on screen, or while the popup is open, it checks about every 3 seconds for two minutes (popup: the whole time it stays open). Turn that off in Settings if you only want the Sync button and the 30 second check.
- Per account, or as the default: **Auto-fill**, **Auto-copy**, or **Do nothing**.
- Auto-fill types into the code box on the active tab, including one-digit boxes. If it cannot find a field, it copies the code and notifies you.
- "Submit the form after auto-fill" is off. A wrong code submitted on its own can lock an account. Turn it on only if you want that.
- A **Fill** chip appears on the code field when a code from the last 10 minutes is stored. It works even when the account mode is Do nothing.

Email bodies are not stored. The extension keeps the code, sender, subject, and time (up to 50 codes).

## Tests

`npm test` covers code extraction and the page fixtures in `test-pages/`. Open `test-pages/index.html` in a browser with the extension loaded to try detection by hand.

## License

You may use, copy, modify, and share this project, including removing the donation note. You may not sell it or charge for a copy. See `LICENSE`.

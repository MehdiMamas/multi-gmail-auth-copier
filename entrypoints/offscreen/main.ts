import { browser } from 'wxt/browser';

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const request = message as { type?: string; text?: string };
  if (request.type !== 'OFFSCREEN_COPY' || !request.text) return;
  const text = request.text;
  void navigator.clipboard.writeText(text).then(
    () => sendResponse({ ok: true, copied: true }),
    () => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      sendResponse({ ok: true, copied: true });
    },
  );
  return true;
});

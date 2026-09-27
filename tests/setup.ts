const proto = HTMLElement.prototype;
const existing = Object.getOwnPropertyDescriptor(proto, 'offsetParent');
if (!existing || existing.configurable) {
  Object.defineProperty(proto, 'offsetParent', {
    configurable: true,
    get() {
      const el = this as HTMLElement;
      if (el.hidden) return null;
      const style = el.getAttribute('style') || '';
      if (/display\s*:\s*none/.test(style)) return null;
      return document.body;
    },
  });
}

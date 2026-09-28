import { browser } from 'wxt/browser';
import { CODE_MAX_AGE_MS, type CodeEntry, type PersistedState } from '~/lib/types';

let host: HTMLElement | null = null;
let place: (() => void) | null = null;
let listening = false;

export function hideChip(): void {
  host?.remove();
  host = null;
  place = null;
}

export function showChip(
  anchor: HTMLElement,
  placement: 'inside' | 'outside',
  onFill: (code: string) => void,
): void {
  void render(anchor, placement, onFill);
}

async function render(
  anchor: HTMLElement,
  placement: 'inside' | 'outside',
  onFill: (code: string) => void,
): Promise<void> {
  const stored = await browser.storage.local.get('otpState');
  const state = stored.otpState as PersistedState | undefined;
  if (!state?.settings.showFillChip) {
    hideChip();
    return;
  }
  const code = newestCode(state.codes ?? []);
  if (!code) {
    hideChip();
    return;
  }

  if (!host) {
    host = document.createElement('div');
    host.style.all = 'initial';
    host.style.position = 'fixed';
    host.style.zIndex = '2147483646';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      button {
        font: 600 12px/1 "Segoe UI", sans-serif;
        color: #f3efe6;
        background: #0f6e56;
        border: 0;
        border-radius: 999px;
        padding: 6px 10px;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(28, 25, 21, 0.18);
      }
      button:hover { background: #0b5344; }
      strong { font-family: Consolas, ui-monospace, monospace; letter-spacing: 0.04em; }
    `;
    const button = document.createElement('button');
    button.type = 'button';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const value = button.dataset.code;
      if (value) onFill(value);
    });
    shadow.append(style, button);
    document.documentElement.appendChild(host);
  }

  const button = host.shadowRoot?.querySelector('button');
  if (!button) return;
  button.dataset.code = code.code;
  button.innerHTML = `Fill <strong>${escapeHtml(code.code)}</strong>`;

  place = () => {
    if (!host || !anchor.isConnected) return;
    const rect = anchor.getBoundingClientRect();
    host.style.top = `${rect.top + rect.height / 2}px`;
    if (placement === 'inside') {
      host.style.left = `${rect.right - 8}px`;
      host.style.transform = 'translate(-100%, -50%)';
    } else {
      host.style.left = `${rect.right + 8}px`;
      host.style.transform = 'translate(0, -50%)';
    }
  };
  place();
  if (!listening) {
    listening = true;
    window.addEventListener('scroll', () => place?.(), true);
    window.addEventListener('resize', () => place?.());
  }
}

function newestCode(codes: CodeEntry[]): CodeEntry | null {
  const fresh = codes
    .filter((entry) => entry.kind !== 'link' && Date.now() - entry.receivedAt < CODE_MAX_AGE_MS)
    .sort((a, b) => b.receivedAt - a.receivedAt);
  return fresh[0] ?? null;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char] ?? char;
  });
}

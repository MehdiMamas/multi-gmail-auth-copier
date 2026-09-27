import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { signInInteractive } from '~/lib/auth';
import type { ExtensionResponse } from '~/lib/messages';
import type { Mode, PublicState, Settings } from '~/lib/types';

const MODES: { value: Mode | ''; label: string }[] = [
  { value: '', label: 'Use default' },
  { value: 'autofill', label: 'Auto-fill' },
  { value: 'autocopy', label: 'Auto-copy' },
  { value: 'nothing', label: 'Do nothing' },
];

export function App() {
  const [state, setState] = useState<PublicState | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    const response = (await browser.runtime.sendMessage({ type: 'GET_STATE' })) as ExtensionResponse;
    if (response?.ok && response.state) setState(response.state);
  };

  useEffect(() => {
    void refresh();
    const onChange = () => {
      void refresh();
    };
    browser.storage.onChanged.addListener(onChange);
    return () => browser.storage.onChanged.removeListener(onChange);
  }, []);

  const addAccount = async (email?: string) => {
    setError('');
    setBusy(email ?? 'add');
    try {
      const account = await signInInteractive(email);
      const response = (await browser.runtime.sendMessage({
        type: 'SAVE_ACCOUNT',
        account,
      })) as ExtensionResponse;
      if (!response?.ok) throw new Error(response?.error || 'Could not save the account');
      if (response.state) setState(response.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy('');
    }
  };

  const updateSettings = async (patch: Partial<Settings>) => {
    const response = (await browser.runtime.sendMessage({ type: 'SET_SETTINGS', settings: patch })) as ExtensionResponse;
    if (response?.ok && response.state) setState(response.state);
  };

  const clearHistory = async () => {
    const stored = await browser.storage.local.get('otpState');
    const current = stored.otpState as Record<string, unknown> | undefined;
    if (!current) return;
    await browser.storage.local.set({
      otpState: { ...current, codes: [], processedIds: [], unseen: 0, lastSyncedAt: null },
    });
    await browser.action.setBadgeText({ text: '' });
    await refresh();
  };

  if (!state) return <main className="mx-auto max-w-xl p-8 font-sans">Loading…</main>;

  return (
    <main className="mx-auto max-w-xl px-6 py-8 font-sans text-ink">
      <h1 className="text-2xl font-semibold">Gmail OTP Copier</h1>
      <p className="mt-1 text-sm text-ink/70">Codes stay in this browser. Gmail is read with the readonly scope only.</p>
      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Accounts</h2>
          <button
            className="rounded-md bg-moss px-3 py-1.5 text-sm font-semibold text-paper disabled:opacity-60"
            disabled={busy !== ''}
            onClick={() => void addAccount()}
          >
            {busy === 'add' ? 'Waiting for Google…' : 'Add account'}
          </button>
        </div>
        {state.accounts.length === 0 ? (
          <p className="mt-3 text-sm text-ink/70">No accounts connected.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-white">
            {state.accounts.map((account) => (
              <li key={account.email} className="flex flex-wrap items-center gap-2 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{account.email}</div>
                  {account.needsReauth && <div className="text-xs text-clay">Sign-in expired</div>}
                </div>
                <select
                  aria-label={`Mode for ${account.email}`}
                  className="rounded-md border border-line bg-paper px-2 py-1 text-sm"
                  value={account.mode ?? ''}
                  onChange={(event) => {
                    const mode = event.target.value;
                    void browser.runtime
                      .sendMessage({
                        type: 'SET_ACCOUNT_MODE',
                        email: account.email,
                        mode: mode ? (mode as Mode) : null,
                      })
                      .then(refresh);
                  }}
                >
                  {MODES.map((mode) => (
                    <option key={mode.label} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
                <button className="text-sm text-moss" onClick={() => void addAccount(account.email)} disabled={busy !== ''}>
                  {busy === account.email ? 'Waiting…' : 'Reconnect'}
                </button>
                <button
                  className="text-sm text-clay"
                  onClick={() => {
                    void browser.runtime.sendMessage({ type: 'REMOVE_ACCOUNT', email: account.email }).then(refresh);
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">When a new code arrives</h2>
        <label className="block text-sm">
          Default action
          <select
            className="mt-1 block w-full rounded-md border border-line bg-white px-2 py-2"
            value={state.settings.defaultMode}
            onChange={(event) => void updateSettings({ defaultMode: event.target.value as Mode })}
          >
            <option value="autofill">Auto-fill the page</option>
            <option value="autocopy">Auto-copy</option>
            <option value="nothing">Do nothing</option>
          </select>
        </label>
        <Toggle
          label="Notifications"
          checked={state.settings.notifications}
          onChange={(notifications) => void updateSettings({ notifications })}
        />
        <Toggle
          label="Check every few seconds while a code page or this popup is open"
          checked={state.settings.fastPoll}
          onChange={(fastPoll) => void updateSettings({ fastPoll })}
        />
        <Toggle
          label="Submit the form after auto-fill"
          checked={state.settings.autoSubmit}
          onChange={(autoSubmit) => void updateSettings({ autoSubmit })}
        />
        <Toggle
          label="Show the Fill button on code fields"
          checked={state.settings.showFillChip}
          onChange={(showFillChip) => void updateSettings({ showFillChip })}
        />
        <button className="rounded-md border border-line px-3 py-1.5 text-sm" onClick={() => void clearHistory()}>
          Clear history
        </button>
      </section>
    </main>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

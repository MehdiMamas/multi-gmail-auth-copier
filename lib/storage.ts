import { browser } from 'wxt/browser';
import { EMPTY_STATE, type Account, type PersistedState, type PublicState, type Settings } from './types';

const KEY = 'otpState';

export async function loadState(): Promise<PersistedState> {
  const stored = await browser.storage.local.get(KEY);
  const raw = stored[KEY] as Partial<PersistedState> | undefined;
  if (!raw) return structuredClone(EMPTY_STATE);
  return {
    ...structuredClone(EMPTY_STATE),
    ...raw,
    settings: { ...EMPTY_STATE.settings, ...raw.settings },
    accounts: raw.accounts ?? [],
    codes: raw.codes ?? [],
    processedIds: raw.processedIds ?? [],
  };
}

export async function saveState(state: PersistedState): Promise<void> {
  await browser.storage.local.set({ [KEY]: state });
}

export function toPublicState(state: PersistedState): PublicState {
  return {
    accounts: state.accounts.map(toPublicAccount),
    codes: state.codes,
    settings: state.settings,
    unseen: state.unseen,
    lastSyncedAt: state.lastSyncedAt,
  };
}

export function toPublicAccount(account: Account) {
  return {
    email: account.email,
    mode: account.mode,
    needsReauth: account.needsReauth,
  };
}

export function resolveMode(account: Account, settings: Settings) {
  return account.mode ?? settings.defaultMode;
}

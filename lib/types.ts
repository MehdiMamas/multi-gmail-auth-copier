export type Mode = 'autofill' | 'autocopy' | 'nothing';

export interface Account {
  email: string;
  token?: string;
  expiresAt?: number;
  historyId?: string;
  mode?: Mode;
  needsReauth?: boolean;
}

export interface CodeEntry {
  id: string;
  messageId: string;
  account: string;
  code: string;
  from: string;
  subject: string;
  receivedAt: number;
}

export interface Settings {
  defaultMode: Mode;
  notifications: boolean;
  fastPoll: boolean;
  /** Press the page's submit button after a fill. Off by default. */
  autoSubmit: boolean;
  /** Inline "Fill 123456" chip on detected fields. */
  showFillChip: boolean;
}

export interface PersistedState {
  accounts: Account[];
  codes: CodeEntry[];
  processedIds: string[];
  settings: Settings;
  unseen: number;
  lastSyncedAt: number | null;
  /** Extra accounts were unlocked by leaving the donation page. Not a payment record. */
  multiUnlocked: boolean;
}

export interface PublicAccount {
  email: string;
  mode?: Mode;
  needsReauth?: boolean;
}

export interface PublicState {
  accounts: PublicAccount[];
  codes: CodeEntry[];
  settings: Settings;
  unseen: number;
  lastSyncedAt: number | null;
  multiUnlocked: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultMode: 'nothing',
  notifications: true,
  fastPoll: true,
  autoSubmit: false,
  showFillChip: true,
};

export const EMPTY_STATE: PersistedState = {
  accounts: [],
  codes: [],
  processedIds: [],
  settings: DEFAULT_SETTINGS,
  unseen: 0,
  lastSyncedAt: null,
  multiUnlocked: false,
};

export const CODE_MAX_AGE_MS = 10 * 60 * 1000;
export const MAX_CODES = 50;
export const MAX_PROCESSED_IDS = 400;

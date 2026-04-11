export type DebugHttpEntry = {
  id: string;
  ts: number;
  kind: 'http';
  phase: 'start' | 'end' | 'error';
  method: string;
  url: string;
  status?: number;
  ok?: boolean;
  error?: string;
  initDataLength?: number;
};

export type DebugLogEntry = {
  id: string;
  ts: number;
  kind: 'log';
  message: string;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

export type DebugEntry = DebugHttpEntry | DebugLogEntry;

type Listener = (entries: DebugEntry[]) => void;

const MAX_ENTRIES = 80;

let entries: DebugEntry[] = [];
const listeners = new Set<Listener>();

const notify = () => {
  const snapshot = entries;
  for (const cb of listeners) cb(snapshot);
};

export const debugStore = {
  subscribe(cb: Listener) {
    listeners.add(cb);
    cb(entries);
    return () => listeners.delete(cb);
  },
  get() {
    return entries;
  },
  clear() {
    entries = [];
    notify();
  },
  push(entry: DebugEntry) {
    entries = [entry, ...entries].slice(0, MAX_ENTRIES);
    notify();
  },
};

export const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

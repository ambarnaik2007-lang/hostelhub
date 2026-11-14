import { useSyncExternalStore } from "react";
import * as logic from "./logic";
import { makeSeed } from "./seed";
import type { ApplicationInput } from "./logic";
import type { DB, Role, Session } from "./types";

/**
 * Demo data store: one shared JSON document in localStorage (persists across refreshes and
 * syncs between tabs). The signed-in demo account lives in sessionStorage so each browser tab
 * can be a different portal at the same time.
 */
const DB_KEY = "hostelhub:db:v1";
const SESSION_KEY = "hostelhub:session:v1";

let db: DB | null = null;
let session: Session | null | undefined;
const listeners = new Set<() => void>();
let storageBound = false;

function emit() {
  for (const l of listeners) l();
}

function loadDB(): DB {
  if (db) return db;
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed?.version === 1) {
        db = parsed;
        return db;
      }
    }
  } catch {
    /* fall through to seed */
  }
  db = makeSeed(Date.now());
  persist();
  return db;
}

function persist() {
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* storage full or unavailable */
  }
}

function loadSession(): Session | null {
  if (session !== undefined) return session;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    session = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    session = null;
  }
  return session;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!storageBound && typeof window !== "undefined") {
    storageBound = true;
    window.addEventListener("storage", (e) => {
      if (e.key === DB_KEY) {
        db = e.newValue ? (JSON.parse(e.newValue) as DB) : null;
        emit();
      }
    });
  }
  return () => listeners.delete(cb);
}

function update(fn: (d: DB) => DB) {
  db = fn(loadDB());
  persist();
  emit();
}

const serverNull = () => null;

/** Returns null during SSR / before hydration. */
export function useDB(): DB | null {
  return useSyncExternalStore(subscribe, loadDB, serverNull);
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, loadSession, serverNull);
}

const random = () => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0]! / 4294967296;
};

export const actions = {
  login(role: Role, email: string, password: string) {
    const res = logic.authenticate(loadDB(), role, email, password);
    if (res.ok) {
      session = res.session;
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(res.session));
      emit();
    }
    return res;
  },
  logout() {
    session = null;
    window.sessionStorage.removeItem(SESSION_KEY);
    emit();
  },
  submitApplication(studentId: string, input: ApplicationInput) {
    const res = logic.submitApplication(loadDB(), studentId, input, Date.now());
    update(() => res.db);
    return res.application;
  },
  approve(appId: string, reviewerId: string) {
    const res = logic.approveApplication(loadDB(), appId, reviewerId, Date.now(), random);
    update(() => res.db);
    return res.pass;
  },
  reject(appId: string, reviewerId: string, reason: string) {
    update((d) => logic.rejectApplication(d, appId, reviewerId, reason, Date.now()));
  },
  cancel(appId: string, studentId: string) {
    update((d) => logic.cancelApplication(d, appId, studentId, Date.now()));
  },
  recordExit(passId: string, guardId: string) {
    update((d) => logic.recordExit(d, passId, guardId, Date.now()));
  },
  recordReturn(passId: string, guardId: string) {
    update((d) => logic.recordReturn(d, passId, guardId, Date.now()));
  },
  markAllRead(recipient: string) {
    update((d) => ({
      ...d,
      notifications: d.notifications.map((n) => (n.recipient === recipient ? { ...n, read: true } : n)),
    }));
  },
  resetDemo() {
    db = makeSeed(Date.now());
    persist();
    emit();
  },
};

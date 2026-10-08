import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { afterFailure, hashPassword, lockRemainingMs, passwordProblem, verifyPassword, type LockState, type PasswordRecord } from '../auth/password';
import { deleteSecret, getSecret, setSecret } from '../auth/secureStore';
import { makeBackup, mergeById, readBackup } from '../data/backup';
import type { BodyEntry } from '../data/body';
import { setCustomPrograms, type Program } from '../data/exercises';
import type { Issue } from '../pose/analysis';
import { applyReminders, clearReminders, DEFAULT_REMINDERS, type Reminders } from './reminders';

export type Goal = 'strength' | 'fat' | 'mobility' | 'active';
export type Profile = {
  name: string;
  goal: Goal;
  level: 'beg' | 'int' | 'adv';
  days: number;
  gear: string[];
  where: 'home' | 'gym' | 'both';
  units: 'kg' | 'lb';
  /** Program the user follows; unset means the app suggests one. */
  programId?: string;
  /** For BMI. */
  heightCm?: number;
};

export type SessionResult = {
  id: string;
  exerciseId: string;
  finishedAt: number;
  durationMs: number;
  mode: 'reps' | 'hold';
  /** Reps per set, or seconds held per set. */
  sets: number[];
  /** Target reps (or seconds) per set when the session started. */
  target?: number;
  /** Weight per set, in the profile's units, for weighted exercises. */
  weights?: number[];
  /** Logged by hand (no camera): no form score. */
  manual?: boolean;
  score: number;
  repScores: number[];
  /** Issue cue → how many reps (or seconds) it happened on. */
  issueCounts: Record<string, number>;
  topIssue: Issue | null;
  workoutId?: string;
};

export type WorkoutResult = {
  id: string;
  programId: string;
  dayId: string;
  title: string;
  startedAt: number;
  finishedAt: number;
  sessionIds: string[];
  skipped: string[];
};

/** A workout in progress: which block is next and what has been done. */
export type Run = { id: string; programId: string; dayId: string; title: string; index: number; startedAt: number; sessionIds: string[]; skipped: string[] };

export type Account = { id: string; name: string; email: string; createdAt: number };

type Registry = { accounts: Account[]; currentId: string | null; locks: Record<string, LockState> };
type UserData = {
  profile: Profile | null;
  history: SessionResult[];
  workouts: WorkoutResult[];
  bodyLog: BodyEntry[];
  customPrograms: Program[];
  reminders: Reminders;
};

export type AuthResult = { ok: true } | { ok: false; error: string };

type Store = {
  accounts: Account[];
  user: Account | null;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  logIn: (email: string, password: string) => Promise<AuthResult>;
  logOut: () => void;
  deleteAccount: (password: string) => Promise<AuthResult>;

  profile: Profile;
  /** True once the signed-in user has finished setup. */
  onboarded: boolean;
  setProfile: (p: Profile) => void;
  history: SessionResult[];
  addResult: (r: SessionResult) => void;
  workouts: WorkoutResult[];

  run: Run | null;
  startRun: (programId: string, dayId: string, title: string) => void;
  /** Record the current block as done (with its session) or skipped, and move on. */
  advanceRun: (sessionId: string | null, exerciseId: string) => void;
  /** Save the workout and return its id, or null if nothing was done. */
  finishRun: () => string | null;
  cancelRun: () => void;

  /** Body weight entries in kg, newest first. */
  bodyLog: BodyEntry[];
  addBodyWeight: (kg: number) => void;
  removeBodyWeight: (id: string) => void;

  customPrograms: Program[];
  /** Add or replace one of the user's own workouts. */
  saveCustomProgram: (p: Program) => void;
  deleteCustomProgram: (id: string) => void;

  reminders: Reminders;
  /** Save and schedule reminders; fails when notifications are not allowed. */
  setReminders: (r: Reminders) => Promise<AuthResult>;

  /** This account's data as a backup file's text. */
  exportBackup: () => string;
  /** Add what a backup has that this account does not; nothing is overwritten. */
  importBackup: (text: string) => { ok: true; added: number } | { ok: false; error: string };
};

const Ctx = createContext<Store | null>(null);

const REGISTRY_KEY = 'formai/accounts/v1';
const LEGACY_KEY = 'formai/state/v1';
const userKey = (id: string) => `formai/user/${id}/v1`;
const credKey = (id: string) => `gymcoach.cred.${id}`;
const MAX_HISTORY = 1000;
const MAX_WORKOUTS = 300;

export const DEFAULT_PROFILE: Profile = { name: '', goal: 'strength', level: 'beg', days: 3, gear: ['none'], where: 'home', units: 'kg' };
const MAX_BODY = 1000;
const EMPTY_USER: UserData = { profile: null, history: [], workouts: [], bodyLog: [], customPrograms: [], reminders: DEFAULT_REMINDERS };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normEmail = (e: string) => e.trim().toLowerCase();
const loadJson = async <T,>(key: string): Promise<Partial<T>> => {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as Partial<T>) : {};
};
const asUser = (d: Partial<UserData>): UserData => ({
  profile: d.profile ? { ...DEFAULT_PROFILE, ...d.profile } : null,
  history: Array.isArray(d.history) ? d.history : [],
  workouts: Array.isArray(d.workouts) ? d.workouts : [],
  bodyLog: Array.isArray(d.bodyLog) ? d.bodyLog : [],
  customPrograms: Array.isArray(d.customPrograms) ? d.customPrograms : [],
  reminders: { ...DEFAULT_REMINDERS, ...d.reminders },
});
const byNewest = <T extends { at: number }>(xs: T[]) => [...xs].sort((a, b) => b.at - a.at);

// Accounts live on this device only. The registry (names, emails, lockouts) is in
// AsyncStorage; password hashes are in SecureStore; each account's profile and
// history is saved under its own key. Children render once state has loaded.
export function StoreProvider({ children }: { children: ReactNode }) {
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [data, setData] = useState<UserData | null>(null);
  const [run, setRun] = useState<Run | null>(null);

  useEffect(() => {
    (async () => {
      const r = await loadJson<Registry>(REGISTRY_KEY).catch(() => ({}) as Partial<Registry>);
      const reg: Registry = { accounts: r.accounts ?? [], currentId: r.currentId ?? null, locks: r.locks ?? {} };
      if (reg.currentId && !reg.accounts.some((a) => a.id === reg.currentId)) reg.currentId = null;
      setData(reg.currentId ? asUser(await loadJson<UserData>(userKey(reg.currentId)).catch((): Partial<UserData> => ({}))) : EMPTY_USER);
      setRegistry(reg);
    })();
  }, []);

  useEffect(() => {
    if (registry) AsyncStorage.setItem(REGISTRY_KEY, JSON.stringify(registry)).catch(() => {});
  }, [registry]);

  const currentId = registry?.currentId ?? null;
  useEffect(() => {
    if (currentId && data) AsyncStorage.setItem(userKey(currentId), JSON.stringify(data)).catch(() => {});
  }, [currentId, data]);

  const signIn = useCallback(async (id: string) => {
    const loaded = asUser(await loadJson<UserData>(userKey(id)).catch((): Partial<UserData> => ({})));
    setRun(null);
    setData(loaded);
    setRegistry((r) => r && { ...r, currentId: id, locks: { ...r.locks, [id]: { fails: 0, lockedUntil: 0 } } });
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      if (!registry) return { ok: false, error: 'Still loading. Try again in a moment.' };
      const cleanName = name.trim();
      const cleanEmail = normEmail(email);
      if (!cleanName) return { ok: false, error: 'Enter your name.' };
      if (!EMAIL.test(cleanEmail)) return { ok: false, error: 'Enter a valid email address.' };
      if (registry.accounts.some((a) => a.email === cleanEmail)) return { ok: false, error: 'An account with that email already exists on this phone. Log in instead.' };
      const weak = passwordProblem(password);
      if (weak) return { ok: false, error: weak };

      const id = Crypto.randomUUID();
      const record = await hashPassword(password, Crypto.getRandomBytes(16));
      await setSecret(credKey(id), JSON.stringify(record));

      // The very first account inherits data saved before accounts existed.
      let initial: UserData = EMPTY_USER;
      if (registry.accounts.length === 0) {
        const legacy = await loadJson<UserData>(LEGACY_KEY).catch((): Partial<UserData> => ({}));
        if (legacy.profile || legacy.history?.length) initial = asUser(legacy);
        await AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
      }
      await AsyncStorage.setItem(userKey(id), JSON.stringify(initial));

      const account: Account = { id, name: cleanName, email: cleanEmail, createdAt: Date.now() };
      setRegistry((r) => r && { ...r, accounts: [...r.accounts, account] });
      await signIn(id);
      return { ok: true };
    },
    [registry, signIn],
  );

  const logIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!registry) return { ok: false, error: 'Still loading. Try again in a moment.' };
      const account = registry.accounts.find((a) => a.email === normEmail(email));
      // Same message for unknown email and wrong password, so it does not reveal which accounts exist.
      const wrong: AuthResult = { ok: false, error: 'Email or password is incorrect.' };
      if (!account) return wrong;
      const wait = lockRemainingMs(registry.locks[account.id], Date.now());
      if (wait > 0) return { ok: false, error: `Too many attempts. Try again in ${Math.ceil(wait / 1000)} seconds.` };

      const raw = await getSecret(credKey(account.id));
      const ok = raw ? await verifyPassword(password, JSON.parse(raw) as PasswordRecord) : false;
      if (!ok) {
        const next = afterFailure(registry.locks[account.id] ?? { fails: 0, lockedUntil: 0 }, Date.now());
        setRegistry((r) => r && { ...r, locks: { ...r.locks, [account.id]: next } });
        const locked = lockRemainingMs(next, Date.now());
        return locked ? { ok: false, error: `Too many attempts. Try again in ${Math.ceil(locked / 1000)} seconds.` } : wrong;
      }
      await signIn(account.id);
      return { ok: true };
    },
    [registry, signIn],
  );

  const logOut = useCallback(() => {
    setRun(null);
    setData(EMPTY_USER);
    setRegistry((r) => r && { ...r, currentId: null });
  }, []);

  const deleteAccount = useCallback(
    async (password: string): Promise<AuthResult> => {
      const id = registry?.currentId;
      if (!id) return { ok: false, error: 'Not signed in.' };
      const raw = await getSecret(credKey(id));
      if (!raw || !(await verifyPassword(password, JSON.parse(raw) as PasswordRecord))) return { ok: false, error: 'Password is incorrect.' };
      await deleteSecret(credKey(id));
      await AsyncStorage.removeItem(userKey(id));
      await clearReminders(id).catch(() => {});
      setRun(null);
      setData(EMPTY_USER);
      setRegistry((r) => {
        if (!r) return r;
        const locks = { ...r.locks };
        delete locks[id];
        return { accounts: r.accounts.filter((a) => a.id !== id), currentId: null, locks };
      });
      return { ok: true };
    },
    [registry?.currentId],
  );

  const value = useMemo<Store | null>(() => {
    if (!registry || !data) return null;
    const user = registry.accounts.find((a) => a.id === registry.currentId) ?? null;
    // Before children render, so screens looking programs up by id see this user's own.
    setCustomPrograms(data.customPrograms);
    return {
      accounts: registry.accounts,
      user,
      signUp,
      logIn,
      logOut,
      deleteAccount,
      profile: data.profile ?? { ...DEFAULT_PROFILE, name: user?.name ?? '' },
      onboarded: data.profile !== null,
      setProfile: (profile) => setData((d) => d && { ...d, profile }),
      history: data.history,
      addResult: (r) => setData((d) => d && { ...d, history: [r, ...d.history].slice(0, MAX_HISTORY) }),
      workouts: data.workouts,
      run,
      startRun: (programId, dayId, title) =>
        setRun({ id: Crypto.randomUUID(), programId, dayId, title, index: 0, startedAt: Date.now(), sessionIds: [], skipped: [] }),
      advanceRun: (sessionId, exerciseId) =>
        setRun((r) =>
          r && {
            ...r,
            index: r.index + 1,
            sessionIds: sessionId ? [...r.sessionIds, sessionId] : r.sessionIds,
            skipped: sessionId ? r.skipped : [...r.skipped, exerciseId],
          },
        ),
      finishRun: () => {
        if (!run || run.sessionIds.length === 0) {
          setRun(null);
          return null;
        }
        const w: WorkoutResult = {
          id: run.id,
          programId: run.programId,
          dayId: run.dayId,
          title: run.title,
          startedAt: run.startedAt,
          finishedAt: Date.now(),
          sessionIds: run.sessionIds,
          skipped: run.skipped,
        };
        setData((d) => d && { ...d, workouts: [w, ...d.workouts].slice(0, MAX_WORKOUTS) });
        setRun(null);
        return w.id;
      },
      cancelRun: () => setRun(null),

      bodyLog: data.bodyLog,
      addBodyWeight: (kg) =>
        setData((d) => d && { ...d, bodyLog: byNewest([{ id: Crypto.randomUUID(), at: Date.now(), kg }, ...d.bodyLog]).slice(0, MAX_BODY) }),
      removeBodyWeight: (id) => setData((d) => d && { ...d, bodyLog: d.bodyLog.filter((e) => e.id !== id) }),

      customPrograms: data.customPrograms,
      saveCustomProgram: (p) =>
        setData((d) => d && { ...d, customPrograms: d.customPrograms.some((x) => x.id === p.id) ? d.customPrograms.map((x) => (x.id === p.id ? p : x)) : [...d.customPrograms, p] }),
      deleteCustomProgram: (id) =>
        setData(
          (d) =>
            d && {
              ...d,
              customPrograms: d.customPrograms.filter((x) => x.id !== id),
              // Following a deleted workout falls back to the suggested program.
              profile: d.profile?.programId === id ? { ...d.profile, programId: undefined } : d.profile,
            },
        ),

      reminders: data.reminders,
      setReminders: async (r) => {
        if (!user) return { ok: false, error: 'Not signed in.' };
        const res = await applyReminders(user.id, user.name, r).catch(() => ({ ok: false as const, error: 'Could not schedule reminders on this phone.' }));
        // Keep "on" only when they were actually scheduled.
        setData((d) => d && { ...d, reminders: res.ok ? r : { ...r, on: false } });
        return res;
      },

      exportBackup: () =>
        makeBackup(
          { profile: data.profile, history: data.history, workouts: data.workouts, bodyLog: data.bodyLog, customPrograms: data.customPrograms },
          Date.now(),
        ),
      importBackup: (text) => {
        const read = readBackup(text);
        if (!read.ok) return read;
        const b = read.data;
        const history = mergeById(data.history, b.history as SessionResult[]);
        const workouts = mergeById(data.workouts, b.workouts as WorkoutResult[]);
        const bodyLog = mergeById(data.bodyLog, b.bodyLog as BodyEntry[]);
        const programs = mergeById(data.customPrograms, b.customPrograms as Program[]);
        setData(
          (d) =>
            d && {
              ...d,
              // A fresh account takes the backup's profile; an existing one keeps its own.
              profile: d.profile ?? (b.profile ? { ...DEFAULT_PROFILE, ...(b.profile as Partial<Profile>) } : null),
              history: [...history.merged].sort((x, y) => y.finishedAt - x.finishedAt).slice(0, MAX_HISTORY),
              workouts: [...workouts.merged].sort((x, y) => y.finishedAt - x.finishedAt).slice(0, MAX_WORKOUTS),
              bodyLog: byNewest(bodyLog.merged).slice(0, MAX_BODY),
              customPrograms: programs.merged,
            },
        );
        return { ok: true, added: history.added + workouts.added + bodyLog.added + programs.added };
      },
    };
  }, [registry, data, run, signUp, logIn, logOut, deleteAccount]);

  if (!value) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

const DAY = 86_400_000;
export const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Days in a row, ending today or yesterday, with at least one session. */
export function streak(history: SessionResult[], now = Date.now()): number {
  const days = new Set(history.map((h) => startOfDay(h.finishedAt)));
  let d = startOfDay(now);
  if (!days.has(d)) d -= DAY;
  let n = 0;
  while (days.has(d)) {
    n++;
    d -= DAY;
  }
  return n;
}

/** Most recent session of an exercise, for "last time" and progression hints. */
export const lastSessionOf = (history: SessionResult[], exerciseId: string) => history.find((h) => h.exerciseId === exerciseId);

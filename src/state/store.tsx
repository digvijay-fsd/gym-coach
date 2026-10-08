import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Issue } from '../pose/analysis';

export type Goal = 'strength' | 'fat' | 'mobility' | 'active';
export type Profile = {
  name: string;
  goal: Goal;
  level: 'beg' | 'int' | 'adv';
  days: number;
  gear: string[];
};

export type SessionResult = {
  id: string;
  exerciseId: string;
  finishedAt: number;
  durationMs: number;
  mode: 'reps' | 'hold';
  /** Reps per set, or seconds held per set. */
  sets: number[];
  score: number;
  repScores: number[];
  /** Issue cue → how many reps (or seconds) it happened on. */
  issueCounts: Record<string, number>;
  topIssue: Issue | null;
};

type Store = {
  profile: Profile;
  /** True once the user has finished setup (saved across launches). */
  onboarded: boolean;
  setProfile: (p: Profile) => void;
  history: SessionResult[];
  addResult: (r: SessionResult) => void;
};

const Ctx = createContext<Store | null>(null);

const STORAGE_KEY = 'formai/state/v1';
const MAX_HISTORY = 500;
const DEFAULT_PROFILE: Profile = { name: '', goal: 'strength', level: 'beg', days: 3, gear: ['none'] };

type Saved = { profile: Profile | null; history: SessionResult[] };

// Profile and history are saved on the device with AsyncStorage. Children render
// only after the saved state has loaded, so screens never flash default data.
export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const parsed = raw ? (JSON.parse(raw) as Partial<Saved>) : {};
        setSaved({ profile: parsed.profile ?? null, history: Array.isArray(parsed.history) ? parsed.history : [] });
      })
      .catch(() => setSaved({ profile: null, history: [] }));
  }, []);

  useEffect(() => {
    if (saved) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch(() => {});
  }, [saved]);

  const value = useMemo<Store | null>(
    () =>
      saved && {
        profile: saved.profile ?? DEFAULT_PROFILE,
        onboarded: saved.profile !== null,
        setProfile: (profile) => setSaved((s) => s && { ...s, profile }),
        history: saved.history,
        addResult: (r) => setSaved((s) => s && { ...s, history: [r, ...s.history].slice(0, MAX_HISTORY) }),
      },
    [saved],
  );
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

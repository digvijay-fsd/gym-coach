// Personal records and strength estimates from session history.
// Pure TypeScript so it is unit tested with `node --test`.

type Session = { exerciseId: string; finishedAt: number; mode: 'reps' | 'hold'; sets: number[]; weights?: number[] };

/** Epley estimate of the most you could lift once, from a set of `reps` at `weight`. */
export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export type Point = { at: number; value: number };
export type Records = {
  sessions: number;
  /** True when any set had a weight, so the trend is estimated 1-rep max. */
  weighted: boolean;
  bestWeight: number;
  bestE1rm: number;
  /** Most reps (or seconds held) in one set. */
  bestSet: number;
  /** Most reps (or seconds) in one session. */
  bestTotal: number;
  /** One point per session, oldest first: estimated 1-rep max, or best set. */
  trend: Point[];
};

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const bestE1rmOf = (h: Session) => Math.max(0, ...h.sets.map((r, i) => e1rm(h.weights?.[i] ?? 0, r)));
const isWeighted = (h: Session) => (h.weights ?? []).some((w) => w > 0);

/** The number a session is judged on: estimated 1-rep max when weighted, else the best set. */
export const sessionMetric = (h: Session) => (isWeighted(h) ? bestE1rmOf(h) : Math.max(0, ...h.sets));

export function recordsFor(history: Session[], exerciseId: string): Records | null {
  const xs = history.filter((h) => h.exerciseId === exerciseId).sort((a, b) => a.finishedAt - b.finishedAt);
  if (xs.length === 0) return null;
  const weighted = xs.some(isWeighted);
  return {
    sessions: xs.length,
    weighted,
    bestWeight: Math.max(0, ...xs.flatMap((h) => h.weights ?? [])),
    bestE1rm: Math.max(0, ...xs.map(bestE1rmOf)),
    bestSet: Math.max(0, ...xs.flatMap((h) => h.sets)),
    bestTotal: Math.max(0, ...xs.map((h) => sum(h.sets))),
    trend: xs.filter((h) => !weighted || isWeighted(h)).map((h) => ({ at: h.finishedAt, value: sessionMetric(h) })),
  };
}

/** Every exercise the user has done, most recently trained first. */
export function exercisesDone(history: Session[]): string[] {
  const seen: string[] = [];
  [...history].sort((a, b) => b.finishedAt - a.finishedAt).forEach((h) => !seen.includes(h.exerciseId) && seen.push(h.exerciseId));
  return seen;
}

/** True when the session beat every earlier session of the same exercise. The first session is not a record. */
export function isNewRecord(history: Session[], session: Session): boolean {
  const before = history.filter((h) => h.exerciseId === session.exerciseId && h.finishedAt < session.finishedAt);
  if (before.length === 0) return false;
  const metric = sessionMetric(session);
  return metric > 0 && before.every((h) => sessionMetric(h) < metric);
}

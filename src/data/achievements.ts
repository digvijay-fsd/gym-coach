// Badges earned from training history. Pure TypeScript so it is unit tested with `node --test`.
import { isNewRecord } from './records.ts';

type Session = { exerciseId: string; finishedAt: number; mode: 'reps' | 'hold'; sets: number[]; weights?: number[]; score: number; manual?: boolean };
export type AchievementInput = { history: Session[]; workouts: number; bodyEntries: number; customWorkouts: number };
export type Badge = { id: string; title: string; detail: string; value: number; goal: number; earned: boolean };

const DAY = 86_400_000;
const dayOf = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Longest run of consecutive days with at least one session. */
export function longestStreak(history: { finishedAt: number }[]): number {
  const days = [...new Set(history.map((h) => dayOf(h.finishedAt)))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  days.forEach((d, i) => {
    // Rounded so a daylight-saving day (23 or 25 hours) still counts as one day.
    run = i > 0 && Math.round((d - days[i - 1]) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

export function achievements({ history, workouts, bodyEntries, customWorkouts }: AchievementInput): Badge[] {
  const reps = history.filter((h) => h.mode === 'reps').reduce((s, h) => s + h.sets.reduce((a, b) => a + b, 0), 0);
  const camera = history.filter((h) => !h.manual);
  const bestScore = Math.max(0, ...camera.map((h) => h.score));
  const streak = longestStreak(history);
  const kinds = new Set(history.map((h) => h.exerciseId)).size;
  const records = history.filter((h) => isNewRecord(history, h)).length;

  const badge = (id: string, title: string, detail: string, value: number, goal: number): Badge => ({ id, title, detail, value: Math.min(value, goal), goal, earned: value >= goal });
  return [
    badge('first', 'First rep', 'Finish your first exercise', history.length, 1),
    badge('workout', 'Full workout', 'Finish a whole workout from a program', workouts, 1),
    badge('workouts10', 'Regular', 'Finish 10 workouts', workouts, 10),
    badge('workouts50', 'Dedicated', 'Finish 50 workouts', workouts, 50),
    badge('streak3', 'On a roll', 'Train 3 days in a row', streak, 3),
    badge('streak7', 'Week warrior', 'Train 7 days in a row', streak, 7),
    badge('streak30', 'Unstoppable', 'Train 30 days in a row', streak, 30),
    badge('reps100', '100 reps', 'Do 100 reps in total', reps, 100),
    badge('reps1000', '1,000 reps', 'Do 1,000 reps in total', reps, 1000),
    badge('reps10000', '10,000 reps', 'Do 10,000 reps in total', reps, 10000),
    badge('form90', 'Clean form', 'Score 90 or more in a camera session', bestScore, 90),
    badge('form100', 'Textbook', 'Score a perfect 100 in a camera session', bestScore, 100),
    badge('record', 'Record breaker', 'Beat a personal record', records, 1),
    badge('records10', 'Getting stronger', 'Beat 10 personal records', records, 10),
    badge('explorer', 'Explorer', 'Try 10 different exercises', kinds, 10),
    badge('weighin', 'Weigh-in', 'Log your body weight 5 times', bodyEntries, 5),
    badge('builder', 'Architect', 'Build your own workout', customWorkouts, 1),
  ];
}

import type { Profile, WorkoutResult } from '../state/store';
import { getProgram, suggestProgram, type Program, type WorkoutDay } from './exercises';

export function activeProgram(profile: Profile): Program {
  return (profile.programId && getProgram(profile.programId)) || suggestProgram(profile);
}

/** The next day of the user's program: the one after the last day they finished. */
export function todaysWorkout(profile: Profile, workouts: WorkoutResult[]): { program: Program; day: WorkoutDay; index: number } {
  const program = activeProgram(profile);
  const last = workouts.find((w) => w.programId === program.id);
  const lastIndex = last ? program.days.findIndex((d) => d.id === last.dayId) : -1;
  const index = (lastIndex + 1) % program.days.length;
  return { program, day: program.days[index], index };
}

export type Category = 'Strength' | 'Cardio' | 'Core';
export type Level = 'Beginner' | 'Intermediate' | 'Advanced';

export type Exercise = {
  /** Matches a key in RULES (src/pose/analysis.ts). */
  id: string;
  name: string;
  muscles: string;
  category: Category;
  level: Level;
  mode: 'reps' | 'hold';
  /** What the AI checks, shown on the detail screen. */
  checks: string[];
  view: 'front' | 'side';
  sets: number;
  /** Reps per set, or seconds per set for holds. */
  target: number;
  rest: number;
  /** Icon glyph path for list thumbnails (24×24, drawn under a head circle). */
  glyph: string;
};

export const EXERCISES: Exercise[] = [
  {
    id: 'squat',
    name: 'Bodyweight squat',
    muscles: 'Quads · Glutes · Core',
    category: 'Strength',
    level: 'Beginner',
    mode: 'reps',
    checks: ['Squat depth', 'Knees over toes', 'Tempo', 'Full range'],
    view: 'front',
    sets: 3,
    target: 12,
    rest: 60,
    glyph: 'M12 6v6M8 9l4-1 4 1M12 12l-4 3 2 5M12 12l4 3-2 5',
  },
  {
    id: 'pushup',
    name: 'Push-up',
    muscles: 'Chest · Triceps · Core',
    category: 'Strength',
    level: 'Beginner',
    mode: 'reps',
    checks: ['Elbow depth', 'Hip sag', 'Hip pike', 'Tempo'],
    view: 'side',
    sets: 3,
    target: 10,
    rest: 60,
    glyph: 'M4 16l8-3 8-1M7 15v5M18 12v8',
  },
  {
    id: 'lunge',
    name: 'Reverse lunge',
    muscles: 'Quads · Glutes · Balance',
    category: 'Strength',
    level: 'Intermediate',
    mode: 'reps',
    checks: ['Front knee angle', 'Torso upright', 'Depth', 'Tempo'],
    view: 'side',
    sets: 3,
    target: 10,
    rest: 60,
    glyph: 'M12 6v7M8 9l4-1 4 1M12 13l-4 3v4M12 13l5 2 2 5',
  },
  {
    id: 'bridge',
    name: 'Glute bridge',
    muscles: 'Glutes · Hamstrings',
    category: 'Strength',
    level: 'Beginner',
    mode: 'reps',
    checks: ['Hip height', 'Full lockout', 'Tempo'],
    view: 'side',
    sets: 3,
    target: 15,
    rest: 45,
    glyph: 'M3 18l6-1 4-5 4 2 3 4',
  },
  {
    id: 'jacks',
    name: 'Jumping jacks',
    muscles: 'Full body · Cardio',
    category: 'Cardio',
    level: 'Beginner',
    mode: 'reps',
    checks: ['Arm range', 'Rep count', 'Rhythm'],
    view: 'front',
    sets: 3,
    target: 30,
    rest: 30,
    glyph: 'M12 6v7M5 4l7 4 7-4M12 13l-5 7M12 13l5 7',
  },
  {
    id: 'plank',
    name: 'Plank hold',
    muscles: 'Core · Shoulders',
    category: 'Core',
    level: 'Beginner',
    mode: 'hold',
    checks: ['Body line', 'Hip sag', 'Hip pike', 'Hold time'],
    view: 'side',
    sets: 3,
    target: 30,
    rest: 30,
    glyph: 'M4 14l16-2M6 14v5M19 12v7',
  },
  {
    id: 'wallsit',
    name: 'Wall sit',
    muscles: 'Quads · Glutes',
    category: 'Strength',
    level: 'Beginner',
    mode: 'hold',
    checks: ['Knee angle', 'Thighs parallel', 'Hold time'],
    view: 'side',
    sets: 3,
    target: 40,
    rest: 30,
    glyph: 'M6 4v16M8 10h6v6M14 16v4',
  },
];

export const getExercise = (id: string) => EXERCISES.find((e) => e.id === id);

export type Plan = { id: string; title: string; exerciseIds: string[]; minutes: number };

/** Today's plan per goal; a real version would rotate and progress these. */
export const PLANS: Record<string, Plan> = {
  strength: { id: 'lower', title: 'Lower body strength', exerciseIds: ['squat', 'lunge', 'bridge', 'wallsit'], minutes: 24 },
  fat: { id: 'burn', title: 'Full body burn', exerciseIds: ['jacks', 'squat', 'pushup', 'plank'], minutes: 20 },
  mobility: { id: 'control', title: 'Control and posture', exerciseIds: ['bridge', 'lunge', 'plank'], minutes: 18 },
  active: { id: 'quick', title: 'Quick daily move', exerciseIds: ['jacks', 'squat', 'plank'], minutes: 12 },
};

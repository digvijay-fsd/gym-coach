export type Category = 'Strength' | 'Cardio' | 'Core';
export type Level = 'Beginner' | 'Intermediate' | 'Advanced';
export type Place = 'home' | 'gym';
export type Equipment = 'none' | 'dumbbells' | 'barbell' | 'machine' | 'cable';

export type Exercise = {
  id: string;
  name: string;
  muscles: string;
  category: Category;
  level: Level;
  mode: 'reps' | 'hold';
  /** True when RULES in src/pose/analysis.ts has camera rules for this id. */
  tracked: boolean;
  where: Place[];
  equipment: Equipment;
  /** Log a weight per set. */
  weighted: boolean;
  /** Upper or lower body, for the progressive-overload step. */
  body: 'upper' | 'lower' | 'full';
  /** What the AI checks (tracked) or the key coaching points (manual). */
  checks: string[];
  view: 'front' | 'side';
  sets: number;
  /** Reps per set, or seconds per set for holds. */
  target: number;
  rest: number;
  /** Icon glyph path for list thumbnails (24×24, drawn under a head circle). */
  glyph: string;
};

const G = {
  squat: 'M12 6v6M8 9l4-1 4 1M12 12l-4 3 2 5M12 12l4 3-2 5',
  push: 'M4 16l8-3 8-1M7 15v5M18 12v8',
  lunge: 'M12 6v7M8 9l4-1 4 1M12 13l-4 3v4M12 13l5 2 2 5',
  bridge: 'M3 18l6-1 4-5 4 2 3 4',
  jacks: 'M12 6v7M5 4l7 4 7-4M12 13l-5 7M12 13l5 7',
  plank: 'M4 14l16-2M6 14v5M19 12v7',
  wall: 'M6 4v16M8 10h6v6M14 16v4',
  curl: 'M12 6v8M12 9l-3 3 2-4M12 9l3 3-2-4M12 14l-2 6M12 14l2 6',
  press: 'M12 7v7M6 3l2 5 4 0 4 0 2-5M12 14l-2 6M12 14l2 6',
  raise: 'M12 6v8M4 9h16M12 14l-2 6M12 14l2 6',
  hinge: 'M7 7l6 5v8M13 12l-3 2v4M7 7l1 5',
  row: 'M7 7l6 5v8M7 7l4 1 1-3',
  knees: 'M12 6v7M8 9l4-1 4 1M12 13l-4-1v6M12 13l2 7',
  situp: 'M4 18h7l3-8M11 18l5-3 3 3',
  climb: 'M4 12l8 1 7 2M12 13l-3 4M19 15v5',
  bench: 'M3 15h18M5 15v4M19 15v4M7 12h10M6 9v6M18 9v6',
  pulldown: 'M5 4h14M8 4l2 6M16 4l-2 6M12 10v6M10 20h4',
  cable: 'M4 4v16M4 10h8l4 4M12 14l-2 6',
  legpress: 'M4 18l8-8M12 10l6 2M18 12l1 6',
  legcurl: 'M3 12h12M15 12l4 4M7 12v6',
  run: 'M12 6l-1 6 3 3-2 5M11 12l-4 2M14 15l4-1M10 8l4 1',
};

export const EXERCISES: Exercise[] = [
  // ---------- camera-tracked, bodyweight ----------
  { id: 'squat', name: 'Bodyweight squat', muscles: 'Quads · Glutes · Core', category: 'Strength', level: 'Beginner', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'none', weighted: false, body: 'lower', checks: ['Squat depth', 'Knees over toes', 'Tempo', 'Full range'], view: 'front', sets: 3, target: 12, rest: 60, glyph: G.squat },
  { id: 'pushup', name: 'Push-up', muscles: 'Chest · Triceps · Core', category: 'Strength', level: 'Beginner', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'none', weighted: false, body: 'upper', checks: ['Elbow depth', 'Hip sag', 'Hip pike', 'Tempo'], view: 'side', sets: 3, target: 10, rest: 60, glyph: G.push },
  { id: 'lunge', name: 'Reverse lunge', muscles: 'Quads · Glutes · Balance', category: 'Strength', level: 'Intermediate', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'none', weighted: false, body: 'lower', checks: ['Front knee angle', 'Torso upright', 'Depth', 'Tempo'], view: 'side', sets: 3, target: 10, rest: 60, glyph: G.lunge },
  { id: 'bridge', name: 'Glute bridge', muscles: 'Glutes · Hamstrings', category: 'Strength', level: 'Beginner', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'none', weighted: false, body: 'lower', checks: ['Hip height', 'Full lockout', 'Tempo'], view: 'side', sets: 3, target: 15, rest: 45, glyph: G.bridge },
  { id: 'jacks', name: 'Jumping jacks', muscles: 'Full body · Cardio', category: 'Cardio', level: 'Beginner', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'none', weighted: false, body: 'full', checks: ['Arm range', 'Rep count', 'Rhythm'], view: 'front', sets: 3, target: 30, rest: 30, glyph: G.jacks },
  { id: 'highknees', name: 'High knees', muscles: 'Hip flexors · Cardio', category: 'Cardio', level: 'Beginner', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'none', weighted: false, body: 'full', checks: ['Knee height', 'Rep count', 'Rhythm'], view: 'front', sets: 3, target: 30, rest: 30, glyph: G.knees },
  { id: 'climbers', name: 'Mountain climbers', muscles: 'Core · Shoulders · Cardio', category: 'Cardio', level: 'Intermediate', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'none', weighted: false, body: 'full', checks: ['Knee drive', 'Rep count', 'Rhythm'], view: 'side', sets: 3, target: 20, rest: 30, glyph: G.climb },
  { id: 'situp', name: 'Sit-up', muscles: 'Abs · Hip flexors', category: 'Core', level: 'Beginner', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'none', weighted: false, body: 'full', checks: ['Full range', 'Rep count', 'Tempo'], view: 'side', sets: 3, target: 15, rest: 45, glyph: G.situp },
  { id: 'plank', name: 'Plank hold', muscles: 'Core · Shoulders', category: 'Core', level: 'Beginner', mode: 'hold', tracked: true, where: ['home', 'gym'], equipment: 'none', weighted: false, body: 'full', checks: ['Body line', 'Hip sag', 'Hip pike', 'Hold time'], view: 'side', sets: 3, target: 30, rest: 30, glyph: G.plank },
  { id: 'wallsit', name: 'Wall sit', muscles: 'Quads · Glutes', category: 'Strength', level: 'Beginner', mode: 'hold', tracked: true, where: ['home', 'gym'], equipment: 'none', weighted: false, body: 'lower', checks: ['Knee angle', 'Thighs parallel', 'Hold time'], view: 'side', sets: 3, target: 40, rest: 30, glyph: G.wall },

  // ---------- camera-tracked, dumbbells ----------
  { id: 'goblet', name: 'Goblet squat', muscles: 'Quads · Glutes · Core', category: 'Strength', level: 'Beginner', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'dumbbells', weighted: true, body: 'lower', checks: ['Squat depth', 'Knees over toes', 'Tempo'], view: 'front', sets: 3, target: 10, rest: 75, glyph: G.squat },
  { id: 'curl', name: 'Dumbbell curl', muscles: 'Biceps · Forearms', category: 'Strength', level: 'Beginner', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'dumbbells', weighted: true, body: 'upper', checks: ['Elbows by your sides', 'Full curl', 'Tempo'], view: 'front', sets: 3, target: 12, rest: 60, glyph: G.curl },
  { id: 'press', name: 'Dumbbell shoulder press', muscles: 'Shoulders · Triceps', category: 'Strength', level: 'Beginner', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'dumbbells', weighted: true, body: 'upper', checks: ['Full lockout', 'Elbow angle', 'Tempo'], view: 'front', sets: 3, target: 10, rest: 75, glyph: G.press },
  { id: 'raise', name: 'Lateral raise', muscles: 'Side delts', category: 'Strength', level: 'Beginner', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'dumbbells', weighted: true, body: 'upper', checks: ['Raise to shoulder height', 'Arm range', 'Tempo'], view: 'front', sets: 3, target: 12, rest: 60, glyph: G.raise },
  { id: 'rdl', name: 'Romanian deadlift', muscles: 'Hamstrings · Glutes · Back', category: 'Strength', level: 'Intermediate', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'dumbbells', weighted: true, body: 'lower', checks: ['Hip hinge depth', 'Soft knees', 'Tempo'], view: 'side', sets: 3, target: 10, rest: 90, glyph: G.hinge },
  { id: 'row', name: 'Bent-over row', muscles: 'Back · Biceps', category: 'Strength', level: 'Intermediate', mode: 'reps', tracked: true, where: ['home', 'gym'], equipment: 'dumbbells', weighted: true, body: 'upper', checks: ['Hinged torso', 'Elbow pull', 'Tempo'], view: 'side', sets: 3, target: 10, rest: 75, glyph: G.row },

  // ---------- gym, logged by hand ----------
  { id: 'bench', name: 'Barbell bench press', muscles: 'Chest · Triceps · Shoulders', category: 'Strength', level: 'Intermediate', mode: 'reps', tracked: false, where: ['gym'], equipment: 'barbell', weighted: true, body: 'upper', checks: ['Feet flat, shoulder blades pinned', 'Bar to mid-chest', 'Press up and slightly back'], view: 'side', sets: 3, target: 8, rest: 120, glyph: G.bench },
  { id: 'dbbench', name: 'Dumbbell bench press', muscles: 'Chest · Triceps', category: 'Strength', level: 'Beginner', mode: 'reps', tracked: false, where: ['gym', 'home'], equipment: 'dumbbells', weighted: true, body: 'upper', checks: ['Elbows about 45° from your body', 'Lower to chest level', 'Press together at the top'], view: 'side', sets: 3, target: 10, rest: 90, glyph: G.bench },
  { id: 'pulldown', name: 'Lat pulldown', muscles: 'Lats · Biceps', category: 'Strength', level: 'Beginner', mode: 'reps', tracked: false, where: ['gym'], equipment: 'cable', weighted: true, body: 'upper', checks: ['Chest up', 'Pull the bar to your upper chest', 'Control it back up'], view: 'front', sets: 3, target: 10, rest: 90, glyph: G.pulldown },
  { id: 'cablerow', name: 'Seated cable row', muscles: 'Mid back · Lats', category: 'Strength', level: 'Beginner', mode: 'reps', tracked: false, where: ['gym'], equipment: 'cable', weighted: true, body: 'upper', checks: ['Sit tall', 'Squeeze shoulder blades', 'No leaning back'], view: 'side', sets: 3, target: 10, rest: 90, glyph: G.cable },
  { id: 'legpress', name: 'Leg press', muscles: 'Quads · Glutes', category: 'Strength', level: 'Beginner', mode: 'reps', tracked: false, where: ['gym'], equipment: 'machine', weighted: true, body: 'lower', checks: ['Lower back on the pad', 'Knees track over toes', 'Do not lock knees'], view: 'side', sets: 3, target: 12, rest: 90, glyph: G.legpress },
  { id: 'legcurl', name: 'Leg curl', muscles: 'Hamstrings', category: 'Strength', level: 'Beginner', mode: 'reps', tracked: false, where: ['gym'], equipment: 'machine', weighted: true, body: 'lower', checks: ['Hips pressed down', 'Full squeeze', 'Slow on the way back'], view: 'side', sets: 3, target: 12, rest: 60, glyph: G.legcurl },
  { id: 'treadmill', name: 'Treadmill run', muscles: 'Heart · Legs', category: 'Cardio', level: 'Beginner', mode: 'hold', tracked: false, where: ['gym'], equipment: 'machine', weighted: false, body: 'full', checks: ['Easy pace you can talk at', 'Upright posture', 'Light, quick steps'], view: 'side', sets: 1, target: 600, rest: 0, glyph: G.run },
];

export const getExercise = (id: string) => EXERCISES.find((e) => e.id === id);

// ---------- programs ----------

export type Block = { exerciseId: string; sets: number; target: number; rest: number };
export type WorkoutDay = { id: string; title: string; focus: string; blocks: Block[] };
export type Program = {
  id: string;
  title: string;
  where: Place;
  equipment: 'none' | 'dumbbells' | 'gym';
  level: Level;
  goals: ('strength' | 'fat' | 'mobility' | 'active')[];
  summary: string;
  days: WorkoutDay[];
  /** Built by the user in the workout builder. */
  custom?: boolean;
};

const b = (exerciseId: string, sets: number, target: number, rest: number): Block => ({ exerciseId, sets, target, rest });

export const PROGRAMS: Program[] = [
  {
    id: 'home-basics',
    title: 'Home bodyweight basics',
    where: 'home',
    equipment: 'none',
    level: 'Beginner',
    goals: ['strength', 'mobility', 'active'],
    summary: 'Three full-body days with no equipment. Every exercise is camera-coached.',
    days: [
      { id: 'a', title: 'Day A · Legs and push', focus: 'Squat, push-up, bridge, plank', blocks: [b('squat', 3, 15, 60), b('pushup', 3, 10, 60), b('bridge', 3, 15, 45), b('plank', 3, 30, 30)] },
      { id: 'b', title: 'Day B · Lunge and core', focus: 'Lunge, sit-up, climbers, wall sit', blocks: [b('lunge', 3, 10, 60), b('situp', 3, 12, 45), b('climbers', 3, 20, 30), b('wallsit', 3, 40, 30)] },
      { id: 'c', title: 'Day C · Conditioning', focus: 'Jacks, squat, push-up, high knees', blocks: [b('jacks', 3, 30, 30), b('squat', 3, 15, 45), b('pushup', 3, 10, 60), b('highknees', 3, 30, 30)] },
    ],
  },
  {
    id: 'home-burn',
    title: 'Home fat-burn circuits',
    where: 'home',
    equipment: 'none',
    level: 'Beginner',
    goals: ['fat', 'active'],
    summary: 'Fast circuits with short rests to keep your heart rate up.',
    days: [
      { id: 'a', title: 'Circuit 1 · Cardio blast', focus: 'Jacks, high knees, squats, climbers', blocks: [b('jacks', 3, 40, 20), b('highknees', 3, 40, 20), b('squat', 3, 20, 30), b('climbers', 3, 30, 30)] },
      { id: 'b', title: 'Circuit 2 · Core burner', focus: 'Sit-ups, climbers, plank, bridge', blocks: [b('situp', 3, 15, 30), b('climbers', 3, 30, 30), b('plank', 3, 40, 30), b('bridge', 3, 20, 30)] },
    ],
  },
  {
    id: 'home-db',
    title: 'Dumbbell strength at home',
    where: 'home',
    equipment: 'dumbbells',
    level: 'Beginner',
    goals: ['strength'],
    summary: 'A pair of dumbbells, two alternating days. Add weight when you hit every rep.',
    days: [
      { id: 'a', title: 'Day A · Squat and press', focus: 'Goblet squat, row, press, curl', blocks: [b('goblet', 3, 12, 75), b('row', 3, 10, 75), b('press', 3, 10, 75), b('curl', 2, 12, 60)] },
      { id: 'b', title: 'Day B · Hinge and push', focus: 'RDL, lunge, push-up, raise, plank', blocks: [b('rdl', 3, 10, 90), b('lunge', 3, 10, 60), b('pushup', 3, 12, 60), b('raise', 3, 12, 60), b('plank', 3, 40, 30)] },
    ],
  },
  {
    id: 'gym-fullbody',
    title: 'Gym full body A/B',
    where: 'gym',
    equipment: 'gym',
    level: 'Beginner',
    goals: ['strength', 'fat'],
    summary: 'Classic beginner gym plan. Camera coaches the free-weight moves; machines are logged by hand.',
    days: [
      { id: 'a', title: 'Day A · Squat and bench', focus: 'Goblet squat, bench, cable row, press, plank', blocks: [b('goblet', 3, 10, 90), b('bench', 3, 8, 120), b('cablerow', 3, 10, 90), b('press', 3, 10, 75), b('plank', 3, 40, 30)] },
      { id: 'b', title: 'Day B · Hinge and pull', focus: 'RDL, leg press, pulldown, DB bench, curl', blocks: [b('rdl', 3, 8, 120), b('legpress', 3, 12, 90), b('pulldown', 3, 10, 90), b('dbbench', 3, 10, 90), b('curl', 2, 12, 60)] },
      { id: 'c', title: 'Day C · Legs and cardio', focus: 'Leg curl, lunge, raise, treadmill', blocks: [b('legcurl', 3, 12, 60), b('lunge', 3, 10, 60), b('raise', 3, 12, 60), b('treadmill', 1, 600, 0)] },
    ],
  },
];

// The signed-in user's own workouts. The store sets these whenever they change, so
// every screen that looks a program up by id (player, Home, program detail) finds them.
let customPrograms: Program[] = [];
export const setCustomPrograms = (ps: Program[]) => {
  customPrograms = ps;
};

export const getProgram = (id: string) => PROGRAMS.find((p) => p.id === id) ?? customPrograms.find((p) => p.id === id);

export function getDay(programId: string, dayId: string): { program: Program; day: WorkoutDay } | undefined {
  const program = getProgram(programId);
  const day = program?.days.find((d) => d.id === dayId);
  return program && day ? { program, day } : undefined;
}

/** Best starting program for a profile when the user has not picked one. */
export function suggestProgram(p: { goal: string; where?: 'home' | 'gym' | 'both'; gear: string[] }): Program {
  if (p.where === 'gym') return getProgram('gym-fullbody')!;
  if (p.goal === 'fat') return getProgram('home-burn')!;
  if (p.gear.includes('db') && p.goal === 'strength') return getProgram('home-db')!;
  return getProgram('home-basics')!;
}

export const dayMinutes = (day: WorkoutDay) =>
  Math.round(
    day.blocks.reduce((s, blk) => {
      const work = getExercise(blk.exerciseId)?.mode === 'hold' ? blk.target : blk.target * 3;
      return s + blk.sets * (work + blk.rest);
    }, 0) / 60,
  );

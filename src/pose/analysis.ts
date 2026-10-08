// Pose analysis: turns MediaPipe BlazePose landmarks into rep counts, form
// issues and per-rep scores. Pure TypeScript with no React Native imports so it
// can be unit tested with `node --test` and reused by any pose source.

export type Landmark = { x: number; y: number; z?: number; visibility?: number };
/** 33 BlazePose landmarks, normalized to the camera frame (0..1). */
export type Pose = Landmark[];

export const LM = {
  NOSE: 0,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_HIP: 23,
  R_HIP: 24,
  L_KNEE: 25,
  R_KNEE: 26,
  L_ANKLE: 27,
  R_ANKLE: 28,
} as const;

/** Bones drawn by the skeleton overlay. */
export const BONES: [number, number][] = [
  [LM.L_SHOULDER, LM.R_SHOULDER],
  [LM.L_SHOULDER, LM.L_ELBOW],
  [LM.L_ELBOW, LM.L_WRIST],
  [LM.R_SHOULDER, LM.R_ELBOW],
  [LM.R_ELBOW, LM.R_WRIST],
  [LM.L_SHOULDER, LM.L_HIP],
  [LM.R_SHOULDER, LM.R_HIP],
  [LM.L_HIP, LM.R_HIP],
  [LM.L_HIP, LM.L_KNEE],
  [LM.L_KNEE, LM.L_ANKLE],
  [LM.R_HIP, LM.R_KNEE],
  [LM.R_KNEE, LM.R_ANKLE],
];

export const JOINTS: number[] = [
  LM.NOSE,
  LM.L_SHOULDER,
  LM.R_SHOULDER,
  LM.L_ELBOW,
  LM.R_ELBOW,
  LM.L_WRIST,
  LM.R_WRIST,
  LM.L_HIP,
  LM.R_HIP,
  LM.L_KNEE,
  LM.R_KNEE,
  LM.L_ANKLE,
  LM.R_ANKLE,
];

const VISIBLE = 0.5;

// ---------- geometry ----------

/** Angle ABC in degrees (0..180), with B as the vertex. */
export function angle(a: Landmark, b: Landmark, c: Landmark): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const len = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  if (len === 0) return 0;
  const cos = Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / len));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function mid(a: Landmark, b: Landmark): Landmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1) };
}

/** Lean of the line from `low` up to `high`, in degrees away from vertical. */
export function leanFromVertical(low: Landmark, high: Landmark): number {
  return (Math.atan2(Math.abs(high.x - low.x), Math.abs(low.y - high.y)) * 180) / Math.PI;
}

/** Shoulder–hip–ankle angle averaged over both sides; 180 is a straight body line. */
export function bodyLine(p: Pose): number {
  return (angle(p[LM.L_SHOULDER], p[LM.L_HIP], p[LM.L_ANKLE]) + angle(p[LM.R_SHOULDER], p[LM.R_HIP], p[LM.R_ANKLE])) / 2;
}

/** Positive when the hips sit below the shoulder→ankle line (sagging), negative when piked. */
function hipOffsetFromLine(p: Pose): number {
  const s = mid(p[LM.L_SHOULDER], p[LM.R_SHOULDER]);
  const h = mid(p[LM.L_HIP], p[LM.R_HIP]);
  const a = mid(p[LM.L_ANKLE], p[LM.R_ANKLE]);
  if (a.x === s.x) return 0;
  const t = (h.x - s.x) / (a.x - s.x);
  return h.y - (s.y + t * (a.y - s.y));
}

/**
 * Squat depth that works from the front or the side: how far the knees sit
 * below the hips, in shin lengths. About 1 standing, 0 at parallel, negative below.
 */
export function squatDepth(p: Pose): number {
  const h = mid(p[LM.L_HIP], p[LM.R_HIP]);
  const k = mid(p[LM.L_KNEE], p[LM.R_KNEE]);
  const a = mid(p[LM.L_ANKLE], p[LM.R_ANKLE]);
  const shin = Math.max(0.01, a.y - k.y);
  return (k.y - h.y) / shin;
}

export function isVisible(p: Pose | null | undefined, required: number[]): boolean {
  if (!p) return false;
  return required.every((i) => (p[i]?.visibility ?? 0) >= VISIBLE);
}

/** Scales y so x and y share units; landmarks are normalized per axis. */
function toSquare(p: Pose, aspect: number): Pose {
  if (aspect === 1) return p;
  return p.map((l) => (l ? { ...l, y: l.y * aspect } : l));
}

// ---------- exercise rules ----------

export type Issue = {
  id: string;
  /** Landmark to highlight on the skeleton. */
  joint: number;
  cue: string;
  detail: string;
  penalty: number;
};

type Badge = { joint: number; label: string; value: string };

export type ExerciseRules = {
  mode: 'reps' | 'hold';
  required: number[];
  /** Primary signal for rep counting or hold position. */
  metric: (p: Pose) => number;
  /** Reps: true at the working end of the movement (bottom of a squat). */
  active?: (m: number) => boolean;
  /** Reps: true back at the start position. A rep counts on active → rest. */
  rest?: (m: number) => boolean;
  /** Which way the metric moves toward `active`, used to track rep depth. */
  dir?: 'down' | 'up';
  /** Hold: true while the user is in position, so the timer runs. */
  inPosition?: (m: number) => boolean;
  /** Form checks run on every frame outside the rest position. */
  checks: (p: Pose) => Issue[];
  /** Checks on the deepest point of a finished rep. */
  repEnd?: (extreme: number) => Issue[];
  badge: (p: Pose) => Badge;
};

const LEGS = [LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE];
const FULL = [LM.L_SHOULDER, LM.R_SHOULDER, ...LEGS];

function kneeCave(p: Pose): Issue[] {
  const midX = (p[LM.L_ANKLE].x + p[LM.R_ANKLE].x) / 2;
  const shin = Math.max(0.01, Math.abs(p[LM.L_ANKLE].y - p[LM.L_KNEE].y));
  const inward = (knee: number, ankle: number) =>
    (Math.abs(p[ankle].x - midX) - Math.abs(p[knee].x - midX)) / shin;
  const left = inward(LM.L_KNEE, LM.L_ANKLE);
  const right = inward(LM.R_KNEE, LM.R_ANKLE);
  const worst = left >= right ? { side: 'left', v: left, joint: LM.L_KNEE } : { side: 'right', v: right, joint: LM.R_KNEE };
  if (worst.v < 0.12) return [];
  return [
    {
      id: `knee-cave-${worst.side}`,
      joint: worst.joint,
      cue: `Push your ${worst.side} knee out`,
      detail: 'Knee caving inward. Keep it over your toes.',
      penalty: 15,
    },
  ];
}

function hipLine(p: Pose, sagCue: string): Issue[] {
  if (bodyLine(p) >= 160) return [];
  const sag = hipOffsetFromLine(p) > 0;
  return [
    {
      id: sag ? 'hip-sag' : 'hip-pike',
      joint: LM.L_HIP,
      cue: sag ? sagCue : 'Lower your hips',
      detail: sag ? 'Hips dropping below your body line.' : 'Hips piking above your body line.',
      penalty: 15,
    },
  ];
}

const knee = (p: Pose, side: 'L' | 'R') =>
  side === 'L' ? angle(p[LM.L_HIP], p[LM.L_KNEE], p[LM.L_ANKLE]) : angle(p[LM.R_HIP], p[LM.R_KNEE], p[LM.R_ANKLE]);
const elbows = (p: Pose) =>
  (angle(p[LM.L_SHOULDER], p[LM.L_ELBOW], p[LM.L_WRIST]) + angle(p[LM.R_SHOULDER], p[LM.R_ELBOW], p[LM.R_WRIST])) / 2;
const deg = (n: number) => `${Math.round(n)}°`;

export const RULES: Record<string, ExerciseRules> = {
  squat: {
    mode: 'reps',
    required: FULL,
    metric: squatDepth,
    active: (m) => m < 0.35,
    rest: (m) => m > 0.8,
    dir: 'down',
    checks: kneeCave,
    repEnd: (bottom) =>
      bottom > 0.15
        ? [{ id: 'depth', joint: LM.L_HIP, cue: 'Go a little deeper', detail: 'Hips stayed above knee level.', penalty: 10 }]
        : [],
    badge: (p) => ({ joint: LM.L_KNEE, label: 'Left knee', value: deg(knee(p, 'L')) }),
  },
  pushup: {
    mode: 'reps',
    required: [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_ELBOW, LM.R_ELBOW, LM.L_WRIST, LM.R_WRIST, LM.L_HIP, LM.R_HIP, LM.L_ANKLE, LM.R_ANKLE],
    metric: elbows,
    active: (m) => m < 95,
    rest: (m) => m > 150,
    dir: 'down',
    checks: (p) => hipLine(p, 'Lift your hips'),
    repEnd: (bottom) =>
      bottom > 85
        ? [{ id: 'depth', joint: LM.L_ELBOW, cue: 'Lower your chest more', detail: 'Elbows stopped short of 90°.', penalty: 10 }]
        : [],
    badge: (p) => ({ joint: LM.L_ELBOW, label: 'Elbow', value: deg(elbows(p)) }),
  },
  lunge: {
    mode: 'reps',
    required: FULL,
    metric: (p) => Math.min(knee(p, 'L'), knee(p, 'R')),
    active: (m) => m < 105,
    rest: (m) => m > 155,
    dir: 'down',
    checks: (p) => {
      const lean = leanFromVertical(mid(p[LM.L_HIP], p[LM.R_HIP]), mid(p[LM.L_SHOULDER], p[LM.R_SHOULDER]));
      return lean > 25
        ? [{ id: 'lean', joint: LM.L_SHOULDER, cue: 'Keep your chest up', detail: 'Torso leaning forward.', penalty: 10 }]
        : [];
    },
    repEnd: (bottom) =>
      bottom > 100
        ? [{ id: 'depth', joint: LM.L_KNEE, cue: 'Drop your back knee lower', detail: 'Front knee stayed above 90°.', penalty: 10 }]
        : [],
    badge: (p) => {
      const l = knee(p, 'L');
      const r = knee(p, 'R');
      return l <= r
        ? { joint: LM.L_KNEE, label: 'Front knee', value: deg(l) }
        : { joint: LM.R_KNEE, label: 'Front knee', value: deg(r) };
    },
  },
  bridge: {
    mode: 'reps',
    required: [LM.L_SHOULDER, LM.L_HIP, LM.L_KNEE, LM.L_ANKLE],
    metric: (p) => angle(p[LM.L_SHOULDER], p[LM.L_HIP], p[LM.L_KNEE]),
    active: (m) => m > 155,
    rest: (m) => m < 140,
    dir: 'up',
    checks: () => [],
    repEnd: (top) =>
      top < 160
        ? [{ id: 'height', joint: LM.L_HIP, cue: 'Squeeze and lift higher', detail: 'Hips stopped short of a straight line.', penalty: 10 }]
        : [],
    badge: (p) => ({ joint: LM.L_HIP, label: 'Hip', value: deg(angle(p[LM.L_SHOULDER], p[LM.L_HIP], p[LM.L_KNEE])) }),
  },
  jacks: {
    mode: 'reps',
    required: [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_WRIST, LM.R_WRIST, ...LEGS],
    metric: (p) => (angle(p[LM.L_HIP], p[LM.L_SHOULDER], p[LM.L_WRIST]) + angle(p[LM.R_HIP], p[LM.R_SHOULDER], p[LM.R_WRIST])) / 2,
    active: (m) => m > 140,
    rest: (m) => m < 50,
    dir: 'up',
    checks: () => [],
    repEnd: (top) =>
      top < 150
        ? [{ id: 'arms', joint: LM.L_WRIST, cue: 'Raise your arms all the way', detail: 'Hands stopped short of overhead.', penalty: 5 }]
        : [],
    badge: (p) => ({ joint: LM.L_SHOULDER, label: 'Arms', value: deg(angle(p[LM.L_HIP], p[LM.L_SHOULDER], p[LM.L_WRIST])) }),
  },
  plank: {
    mode: 'hold',
    required: [LM.L_SHOULDER, LM.L_HIP, LM.L_ANKLE],
    metric: bodyLine,
    inPosition: (m) => m > 140,
    checks: (p) => hipLine(p, 'Lift your hips'),
    badge: (p) => ({ joint: LM.L_HIP, label: 'Body line', value: deg(bodyLine(p)) }),
  },
  wallsit: {
    mode: 'hold',
    required: [LM.L_HIP, LM.L_KNEE, LM.L_ANKLE],
    metric: (p) => knee(p, 'L'),
    inPosition: (m) => m < 140,
    checks: (p) =>
      knee(p, 'L') > 110
        ? [{ id: 'height', joint: LM.L_KNEE, cue: 'Slide a little lower', detail: 'Aim for thighs parallel to the floor.', penalty: 10 }]
        : [],
    badge: (p) => ({ joint: LM.L_KNEE, label: 'Knee', value: deg(knee(p, 'L')) }),
  },
};

// ---------- rep tracking ----------

export type RepResult = {
  index: number;
  score: number;
  issues: Issue[];
  extreme: number;
  durationMs: number;
};

export type FrameResult = {
  visible: boolean;
  metric: number;
  phase: 'rest' | 'moving' | 'active';
  issues: Issue[];
  badge: Badge | null;
  rep?: RepResult;
};

export function scoreFrom(issues: Issue[]): number {
  return Math.max(0, 100 - issues.reduce((s, i) => s + i.penalty, 0));
}

export class RepTracker {
  readonly rules: ExerciseRules;
  reps: RepResult[] = [];
  holdMs = 0;
  /** Running form score for holds; per-rep scores for rep exercises. */
  holdIssueMs = 0;
  private state: 'rest' | 'active' = 'rest';
  private extreme = 0;
  private repStart: number | null = null;
  private repIssues = new Map<string, Issue>();
  private lastT: number | null = null;

  private aspect: number;

  constructor(exerciseId: string, aspect = 1) {
    this.aspect = aspect;
    const rules = RULES[exerciseId];
    if (!rules) throw new Error(`No pose rules for exercise "${exerciseId}"`);
    this.rules = rules;
  }

  get repCount(): number {
    return this.reps.length;
  }

  get averageScore(): number {
    if (this.rules.mode === 'hold') {
      return this.holdMs === 0 ? 0 : Math.round(100 - 15 * Math.min(1, this.holdIssueMs / this.holdMs));
    }
    if (this.reps.length === 0) return 0;
    return Math.round(this.reps.reduce((s, r) => s + r.score, 0) / this.reps.length);
  }

  update(raw: Pose | null, tMs: number): FrameResult {
    const dt = this.lastT === null ? 0 : Math.min(250, tMs - this.lastT);
    this.lastT = tMs;
    const r = this.rules;
    if (!raw || !isVisible(raw, r.required)) {
      return { visible: false, metric: 0, phase: this.state === 'active' ? 'active' : 'rest', issues: [], badge: null };
    }
    const p = toSquare(raw, this.aspect);
    const m = r.metric(p);
    const badge = r.badge(p);

    if (r.mode === 'hold') {
      const inPos = r.inPosition!(m);
      const issues = inPos ? r.checks(p) : [];
      if (inPos) {
        this.holdMs += dt;
        if (issues.length) this.holdIssueMs += dt;
      }
      return { visible: true, metric: m, phase: inPos ? 'active' : 'rest', issues, badge };
    }

    const atRest = r.rest!(m);
    const issues = atRest ? [] : r.checks(p);
    const deeper = (a: number, b: number) => (r.dir === 'up' ? Math.max(a, b) : Math.min(a, b));

    if (this.state === 'rest') {
      if (!atRest && this.repStart === null) {
        this.repStart = tMs;
        this.extreme = m;
      }
      if (!atRest) this.extreme = deeper(this.extreme, m);
      if (r.active!(m)) this.state = 'active';
      if (atRest) this.resetRep();
    } else {
      this.extreme = deeper(this.extreme, m);
    }
    for (const i of issues) this.repIssues.set(i.id, i);

    let rep: RepResult | undefined;
    if (this.state === 'active' && atRest) {
      const all = [...this.repIssues.values(), ...(r.repEnd?.(this.extreme) ?? [])];
      rep = {
        index: this.reps.length + 1,
        score: scoreFrom(all),
        issues: all,
        extreme: this.extreme,
        durationMs: this.repStart === null ? 0 : tMs - this.repStart,
      };
      this.reps.push(rep);
      this.state = 'rest';
      this.resetRep();
    }

    const phase = this.state === 'active' ? 'active' : atRest ? 'rest' : 'moving';
    return { visible: true, metric: m, phase, issues, badge, rep };
  }

  private resetRep() {
    this.repIssues.clear();
    this.repStart = null;
  }
}

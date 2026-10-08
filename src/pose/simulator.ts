// Demo pose source. Animates a body between two keyframes per exercise so the
// whole pipeline (overlay, rep counting, form cues) runs in Expo Go and on the
// web, where the native MediaPipe tracker is not available. Every few reps it
// injects a typical form fault so the coaching cues can be seen.

import type { Pose } from './analysis';

// Landmark order of a keyframe: nose, shoulders, elbows, wrists, hips, knees, ankles (left, right).
const ORDER = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
type Frame = [number, number][];
type Spec = {
  rest: Frame;
  active: Frame;
  /** Applied to the active frame on faulty reps (or late in a hold). */
  fault?: (f: Frame) => Frame;
  hold?: boolean;
};

const STAND: Frame = [
  [0.5, 0.17], [0.58, 0.28], [0.42, 0.28], [0.61, 0.39], [0.39, 0.39], [0.62, 0.49], [0.38, 0.49],
  [0.555, 0.52], [0.445, 0.52], [0.56, 0.68], [0.44, 0.68], [0.56, 0.84], [0.44, 0.84],
];

const set = (f: Frame, i: number, x: number, y: number): Frame => f.map((p, j) => (j === i ? [x, y] : p));
/** Several landmark moves at once: [frameIndex, x, y][]. */
const move = (f: Frame, moves: [number, number, number][]): Frame => moves.reduce((acc, [i, x, y]) => set(acc, i, x, y), f);
// Frame indexes: 0 nose, 1/2 shoulders, 3/4 elbows, 5/6 wrists, 7/8 hips, 9/10 knees, 11/12 ankles (left/right).

const SIDE_STAND: Frame = [
  [0.48, 0.17], [0.5, 0.28], [0.5, 0.28], [0.5, 0.4], [0.5, 0.4], [0.5, 0.5], [0.5, 0.5],
  [0.5, 0.52], [0.5, 0.52], [0.5, 0.68], [0.5, 0.68], [0.5, 0.84], [0.5, 0.84],
];
const HINGE: Frame = [
  [0.3, 0.4], [0.36, 0.4], [0.36, 0.4], [0.37, 0.5], [0.37, 0.5], [0.38, 0.6], [0.38, 0.6],
  [0.56, 0.52], [0.56, 0.52], [0.52, 0.68], [0.52, 0.68], [0.5, 0.84], [0.5, 0.84],
];
const HIGH_PLANK: Frame = [
  [0.22, 0.45], [0.3, 0.45], [0.3, 0.45], [0.3, 0.55], [0.3, 0.55], [0.3, 0.65], [0.3, 0.65],
  [0.55, 0.48], [0.55, 0.48], [0.72, 0.51], [0.72, 0.51], [0.88, 0.54], [0.88, 0.54],
];
const LYING: Frame = [
  [0.18, 0.7], [0.25, 0.7], [0.25, 0.7], [0.3, 0.66], [0.3, 0.66], [0.34, 0.62], [0.34, 0.62],
  [0.5, 0.7], [0.5, 0.7], [0.64, 0.56], [0.64, 0.56], [0.76, 0.7], [0.76, 0.7],
];
const both = (fn: (s: 'L' | 'R') => [number, number, number][]) => [...fn('L'), ...fn('R')];
// Mirror an x offset from the body's centre line (0.5) for the right side in front views.
const mx = (s: 'L' | 'R', x: number) => (s === 'L' ? x : 1 - x);
const arm = (s: 'L' | 'R', ex: number, ey: number, wx: number, wy: number): [number, number, number][] => [
  [s === 'L' ? 3 : 4, mx(s, ex), ey],
  [s === 'L' ? 5 : 6, mx(s, wx), wy],
];

const SPECS: Record<string, Spec> = {
  squat: {
    rest: STAND,
    active: [
      [0.5, 0.34], [0.58, 0.45], [0.42, 0.45], [0.6, 0.53], [0.4, 0.53], [0.53, 0.5], [0.47, 0.5],
      [0.555, 0.685], [0.445, 0.685], [0.6, 0.7], [0.4, 0.7], [0.56, 0.84], [0.44, 0.84],
    ],
    fault: (f) => set(f, 9, 0.51, 0.7), // left knee caves in
  },
  lunge: {
    rest: [
      [0.48, 0.17], [0.5, 0.28], [0.5, 0.28], [0.5, 0.4], [0.5, 0.4], [0.5, 0.5], [0.5, 0.5],
      [0.5, 0.52], [0.5, 0.52], [0.5, 0.68], [0.5, 0.68], [0.5, 0.84], [0.5, 0.84],
    ],
    active: [
      [0.48, 0.25], [0.5, 0.36], [0.5, 0.36], [0.5, 0.48], [0.5, 0.48], [0.5, 0.58], [0.5, 0.58],
      [0.5, 0.62], [0.5, 0.62], [0.38, 0.62], [0.56, 0.78], [0.4, 0.84], [0.68, 0.84],
    ],
    fault: (f) => set(set(f, 1, 0.38, 0.4), 2, 0.38, 0.4), // torso leans forward
  },
  pushup: {
    rest: [
      [0.22, 0.45], [0.3, 0.45], [0.3, 0.45], [0.3, 0.55], [0.3, 0.55], [0.3, 0.65], [0.3, 0.65],
      [0.55, 0.48], [0.55, 0.48], [0.72, 0.51], [0.72, 0.51], [0.88, 0.54], [0.88, 0.54],
    ],
    active: [
      [0.22, 0.58], [0.3, 0.58], [0.3, 0.58], [0.36, 0.62], [0.36, 0.62], [0.3, 0.65], [0.3, 0.65],
      [0.55, 0.6], [0.55, 0.6], [0.72, 0.58], [0.72, 0.58], [0.88, 0.56], [0.88, 0.56],
    ],
    fault: (f) => set(set(f, 7, 0.55, 0.68), 8, 0.55, 0.68), // hips sag
  },
  bridge: {
    rest: [
      [0.18, 0.7], [0.25, 0.7], [0.25, 0.7], [0.3, 0.74], [0.3, 0.74], [0.38, 0.74], [0.38, 0.74],
      [0.5, 0.72], [0.5, 0.72], [0.66, 0.58], [0.66, 0.58], [0.74, 0.72], [0.74, 0.72],
    ],
    active: [
      [0.18, 0.7], [0.25, 0.7], [0.25, 0.7], [0.3, 0.74], [0.3, 0.74], [0.38, 0.74], [0.38, 0.74],
      [0.47, 0.575], [0.47, 0.575], [0.66, 0.54], [0.66, 0.54], [0.74, 0.72], [0.74, 0.72],
    ],
  },
  jacks: {
    rest: STAND,
    active: [
      [0.5, 0.15], [0.58, 0.26], [0.42, 0.26], [0.66, 0.17], [0.34, 0.17], [0.7, 0.07], [0.3, 0.07],
      [0.555, 0.5], [0.445, 0.5], [0.62, 0.67], [0.38, 0.67], [0.66, 0.84], [0.34, 0.84],
    ],
  },
  plank: {
    hold: true,
    rest: [
      [0.22, 0.5], [0.3, 0.5], [0.3, 0.5], [0.3, 0.62], [0.3, 0.62], [0.4, 0.62], [0.4, 0.62],
      [0.55, 0.52], [0.55, 0.52], [0.72, 0.54], [0.72, 0.54], [0.88, 0.56], [0.88, 0.56],
    ],
    active: [],
    fault: (f) => set(set(f, 7, 0.55, 0.6), 8, 0.55, 0.6),
  },
  wallsit: {
    hold: true,
    rest: [
      [0.4, 0.2], [0.4, 0.3], [0.4, 0.3], [0.45, 0.42], [0.45, 0.42], [0.5, 0.5], [0.5, 0.5],
      [0.4, 0.55], [0.4, 0.55], [0.6, 0.56], [0.6, 0.56], [0.6, 0.8], [0.6, 0.8],
    ],
    active: [],
    fault: (f) => set(set(set(set(f, 7, 0.4, 0.5), 8, 0.4, 0.5), 9, 0.58, 0.58), 10, 0.58, 0.58),
  },
  curl: {
    rest: STAND,
    active: move(STAND, both((s) => arm(s, 0.61, 0.39, 0.62, 0.3))),
    fault: (f) => move(f, both((s) => arm(s, 0.62, 0.34, 0.62, 0.25))), // elbows swing forward
  },
  press: {
    rest: move(STAND, both((s) => arm(s, 0.66, 0.3, 0.65, 0.2))),
    active: move(STAND, both((s) => arm(s, 0.6, 0.165, 0.615, 0.05))),
    fault: (f) => move(f, both((s) => arm(s, 0.63, 0.19, 0.64, 0.09))), // stops short of lockout
  },
  raise: {
    rest: STAND,
    active: move(STAND, both((s) => arm(s, 0.72, 0.29, 0.84, 0.3))),
    fault: (f) => move(f, both((s) => arm(s, 0.7, 0.18, 0.8, 0.1))), // above shoulder height
  },
  rdl: {
    rest: SIDE_STAND,
    active: HINGE,
    fault: (f) => move(f, [[7, 0.56, 0.58], [8, 0.56, 0.58], [9, 0.44, 0.64], [10, 0.44, 0.64]]), // squats it
  },
  row: {
    rest: HINGE,
    active: move(HINGE, [[3, 0.45, 0.38], [4, 0.45, 0.38], [5, 0.4, 0.48], [6, 0.4, 0.48]]),
    fault: (f) =>
      move(f, [[1, 0.48, 0.32], [2, 0.48, 0.32], [3, 0.55, 0.4], [4, 0.55, 0.4], [5, 0.47, 0.44], [6, 0.47, 0.44]]), // stands up
  },
  highknees: {
    rest: STAND,
    active: move(STAND, [[9, 0.57, 0.5], [11, 0.58, 0.66]]),
    fault: (f) => move(f, [[9, 0.565, 0.555], [11, 0.57, 0.72]]), // knee stays low
  },
  situp: {
    rest: LYING,
    active: move(LYING, [[0, 0.36, 0.4], [1, 0.4, 0.48], [2, 0.4, 0.48], [3, 0.46, 0.46], [4, 0.46, 0.46], [5, 0.5, 0.44], [6, 0.5, 0.44]]),
    fault: (f) => move(f, [[0, 0.31, 0.47], [1, 0.35, 0.54], [2, 0.35, 0.54], [3, 0.41, 0.52], [4, 0.41, 0.52], [5, 0.45, 0.5], [6, 0.45, 0.5]]),
  },
  climbers: {
    rest: HIGH_PLANK,
    active: move(HIGH_PLANK, [[9, 0.42, 0.58], [11, 0.55, 0.62]]),
    fault: (f) => move(f, [[9, 0.55, 0.62], [11, 0.68, 0.64]]), // short knee drive
  },
};
SPECS.goblet = SPECS.squat;

const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

function lerp(a: Frame, b: Frame, t: number): Frame {
  return a.map(([x, y], i) => [x + (b[i][0] - x) * t, y + (b[i][1] - y) * t]);
}

function toPose(f: Frame, tMs: number): Pose {
  const pose: Pose = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
  f.forEach(([x, y], i) => {
    // Small jitter so the overlay looks like live tracking.
    const n = Math.sin(tMs / 97 + i * 1.7) * 0.0025;
    pose[ORDER[i]] = { x: x + n, y: y + n * 0.6, visibility: 0.97 };
  });
  return pose;
}

const REP_MS = 2800;

/** Returns a function giving the demo pose at a time in ms since the set started. */
export function createDemoPoseSource(exerciseId: string): (tMs: number) => Pose {
  const spec = SPECS[exerciseId] ?? SPECS.squat;
  if (spec.hold) {
    // Good form for 12 s, then the fault creeps in for 4 s, then recovers.
    return (t) => {
      const cycle = t % 16000;
      const k = cycle < 12000 ? 0 : ease(Math.min(1, (cycle - 12000) / 1200));
      const frame = spec.fault ? lerp(spec.rest, spec.fault(spec.rest), k) : spec.rest;
      return toPose(frame, t);
    };
  }
  return (t) => {
    // 0.6 s standing, 1.1 s down, 0.2 s hold, 0.9 s up.
    const rep = Math.floor(t / REP_MS);
    const c = t % REP_MS;
    const k = c < 600 ? 0 : c < 1700 ? ease((c - 600) / 1100) : c < 1900 ? 1 : 1 - ease((c - 1900) / 900);
    const faulty = spec.fault && rep % 4 === 2;
    const target = faulty ? spec.fault!(spec.active) : spec.active;
    return toPose(lerp(spec.rest, target, k), t);
  };
}

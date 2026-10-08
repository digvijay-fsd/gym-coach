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
};

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

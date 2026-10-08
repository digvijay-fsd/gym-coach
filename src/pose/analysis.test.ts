/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { angle, RepTracker, RULES, type Pose } from './analysis.ts';
import { createDemoPoseSource } from './simulator.ts';

function run(id: string, ms: number) {
  const tracker = new RepTracker(id);
  const source = createDemoPoseSource(id);
  const cues = new Set<string>();
  for (let t = 0; t <= ms; t += 33) {
    const r = tracker.update(source(t), t);
    r.issues.forEach((i) => cues.add(i.id));
    r.rep?.issues.forEach((i) => cues.add(i.id));
  }
  return { tracker, cues };
}

test('angle measures the vertex angle in degrees', () => {
  assert.equal(Math.round(angle({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 })), 90);
  assert.equal(Math.round(angle({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 })), 180);
});

for (const id of ['squat', 'goblet', 'lunge', 'pushup', 'bridge', 'jacks', 'curl', 'press', 'raise', 'rdl', 'row', 'highknees', 'situp', 'climbers']) {
  test(`${id}: counts one rep per demo cycle`, () => {
    const { tracker } = run(id, 2800 * 8 - 100);
    assert.equal(tracker.repCount, 8);
  });
}

test('squat: flags the caving knee on the faulty rep only', () => {
  const { tracker, cues } = run('squat', 2800 * 4 - 100);
  assert.ok(cues.has('knee-cave-left'));
  const faulty = tracker.reps.filter((r) => r.issues.some((i) => i.id === 'knee-cave-left'));
  assert.deepEqual(faulty.map((r) => r.index), [3]);
  assert.equal(tracker.reps[0].score, 100);
  assert.ok(tracker.reps[2].score < 100);
});

test('pushup: flags sagging hips', () => {
  assert.ok(run('pushup', 2800 * 4).cues.has('hip-sag'));
});

test('lunge: flags forward lean', () => {
  assert.ok(run('lunge', 2800 * 4).cues.has('lean'));
});

test('plank: times the hold and catches the sag', () => {
  const { tracker, cues } = run('plank', 15000);
  assert.ok(tracker.holdMs > 14000);
  assert.ok(cues.has('hip-sag'));
  assert.ok(tracker.averageScore < 100 && tracker.averageScore > 80);
});

test('wall sit: times the hold and asks to go lower', () => {
  const { tracker, cues } = run('wallsit', 15000);
  assert.ok(tracker.holdMs > 14000);
  assert.ok(cues.has('height'));
});

test('no reps are counted while the body is out of frame', () => {
  const tracker = new RepTracker('squat');
  const source = createDemoPoseSource('squat');
  for (let t = 0; t < 2800 * 3; t += 33) {
    const p: Pose = source(t).map((l, i) => (i === 27 ? { ...l, visibility: 0.1 } : l));
    assert.equal(tracker.update(p, t).visible, false);
  }
  assert.equal(tracker.repCount, 0);
});

// Each demo injects one faulty rep in four (rep 3); the matching cue must fire on that rep only.
const FAULTS: [string, string][] = [
  ['curl', 'elbow-drift'],
  ['press', 'lockout'],
  ['raise', 'too-high'],
  ['rdl', 'squatting'],
  ['row', 'upright'],
  ['highknees', 'height'],
  ['situp', 'range'],
  ['climbers', 'knee-drive'],
];
for (const [id, issue] of FAULTS) {
  test(`${id}: flags ${issue} on the faulty rep only`, () => {
    const { tracker } = run(id, 2800 * 4 - 100);
    const flagged = tracker.reps.filter((r) => r.issues.some((i) => i.id === issue)).map((r) => r.index);
    assert.deepEqual(flagged, [3]);
  });
}

test('every exercise has rules', () => {
  assert.deepEqual(Object.keys(RULES).sort(), [
    'bridge', 'climbers', 'curl', 'goblet', 'highknees', 'jacks', 'lunge', 'plank',
    'press', 'pushup', 'raise', 'rdl', 'row', 'situp', 'squat', 'wallsit',
  ]);
});

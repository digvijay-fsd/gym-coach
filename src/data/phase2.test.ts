/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { achievements, longestStreak } from './achievements.ts';
import { makeBackup, mergeById, readBackup } from './backup.ts';
import { bmi, bmiBand, changeOver, fromKg, toKg } from './body.ts';
import { e1rm, exercisesDone, isNewRecord, recordsFor } from './records.ts';

const DAY = 86_400_000;
const t0 = new Date(2026, 0, 5, 12).getTime();
const sess = (exerciseId: string, day: number, sets: number[], weights?: number[], score = 80) => ({
  exerciseId,
  finishedAt: t0 + day * DAY,
  mode: 'reps' as const,
  sets,
  weights,
  score,
});

test('e1rm uses the Epley formula and a single rep is the weight itself', () => {
  assert.equal(e1rm(100, 1), 100);
  assert.equal(e1rm(100, 10), 133.3);
  assert.equal(e1rm(0, 10), 0);
});

test('records track best weight, best set and an e1rm trend', () => {
  const h = [sess('bench', 0, [8, 8], [60, 60]), sess('bench', 2, [10, 6], [60, 65]), sess('squat', 1, [15])];
  const r = recordsFor(h, 'bench')!;
  assert.equal(r.sessions, 2);
  assert.equal(r.weighted, true);
  assert.equal(r.bestWeight, 65);
  assert.equal(r.bestSet, 10);
  assert.equal(r.bestTotal, 16);
  assert.deepEqual(r.trend.map((p) => p.value), [76, 80]);
  assert.equal(recordsFor(h, 'curl'), null);
});

test('bodyweight records trend on the best set', () => {
  const r = recordsFor([sess('pushup', 0, [10, 8]), sess('pushup', 1, [12, 9])], 'pushup')!;
  assert.equal(r.weighted, false);
  assert.deepEqual(r.trend.map((p) => p.value), [10, 12]);
});

test('a new record must beat every earlier session, and the first session is not one', () => {
  const a = sess('pushup', 0, [10]);
  const b = sess('pushup', 1, [12]);
  const c = sess('pushup', 2, [11]);
  const h = [a, b, c];
  assert.equal(isNewRecord(h, a), false);
  assert.equal(isNewRecord(h, b), true);
  assert.equal(isNewRecord(h, c), false);
});

test('exercises are listed most recent first', () => {
  assert.deepEqual(exercisesDone([sess('a', 0, [1]), sess('b', 2, [1]), sess('a', 1, [1])]), ['b', 'a']);
});

test('bmi and its bands', () => {
  assert.equal(bmi(70, 175), 22.9);
  assert.equal(bmi(70, undefined), null);
  assert.equal(bmiBand(22.9).healthy, true);
  assert.equal(bmiBand(31).label, 'Obese range');
  assert.equal(bmiBand(17).label, 'Underweight');
});

test('pounds convert both ways', () => {
  assert.equal(fromKg(toKg(180, 'lb'), 'lb'), 180);
  assert.equal(fromKg(100, 'lb'), 220.5);
  assert.equal(toKg(80, 'kg'), 80);
});

test('weight change over a period', () => {
  const log = [
    { id: '1', at: t0, kg: 82 },
    { id: '2', at: t0 + 20 * DAY, kg: 81 },
    { id: '3', at: t0 + 35 * DAY, kg: 79.5 },
  ];
  assert.equal(changeOver(log, 30, t0 + 35 * DAY), -2.5);
  assert.equal(changeOver(log.slice(0, 1), 30, t0), null);
});

test('longest streak counts consecutive days only', () => {
  assert.equal(longestStreak([]), 0);
  assert.equal(longestStreak([0, 1, 2, 4, 5].map((d) => ({ finishedAt: t0 + d * DAY }))), 3);
  assert.equal(longestStreak([{ finishedAt: t0 }, { finishedAt: t0 + 1000 }]), 1);
});

test('achievements reflect progress and earned state', () => {
  const history = [sess('pushup', 0, [50, 50]), sess('pushup', 1, [60], undefined, 95), sess('squat', 2, [20])];
  const badges = achievements({ history, workouts: 1, bodyEntries: 2, customWorkouts: 0 });
  const get = (id: string) => badges.find((b) => b.id === id)!;
  assert.equal(get('first').earned, true);
  assert.equal(get('workout').earned, true);
  assert.equal(get('streak3').earned, true);
  assert.equal(get('reps100').earned, true);
  assert.equal(get('reps1000').value, 180);
  assert.equal(get('form90').earned, true);
  assert.equal(get('form100').earned, false);
  assert.equal(get('record').earned, true);
  assert.equal(get('weighin').value, 2);
  assert.equal(get('builder').earned, false);
});

test('backups round-trip and reject other files', () => {
  const data = { profile: { name: 'Sam' }, history: [{ id: 'h1' }], workouts: [], bodyLog: [{ id: 'b1' }], customPrograms: [] };
  const read = readBackup(makeBackup(data, 42));
  assert.ok(read.ok);
  if (read.ok) {
    assert.deepEqual(read.data, data);
    assert.equal(read.exportedAt, 42);
  }
  assert.equal(readBackup('not json').ok, false);
  assert.equal(readBackup('{"app":"other","version":1,"data":{}}').ok, false);
  assert.equal(readBackup('{"app":"gym-coach","version":99,"data":{}}').ok, false);
  assert.equal(readBackup('{"app":"gym-coach","version":1,"data":{"history":[{"nope":1}]}}').ok, false);
});

test('merging keeps existing items and adds only new ones', () => {
  const { merged, added } = mergeById([{ id: 'a', v: 1 }], [{ id: 'a', v: 2 }, { id: 'b', v: 3 }]);
  assert.deepEqual(merged, [{ id: 'a', v: 1 }, { id: 'b', v: 3 }]);
  assert.equal(added, 1);
});

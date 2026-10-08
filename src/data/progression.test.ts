/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestNext, weightStep } from './progression.ts';

const press = { weighted: true, body: 'upper' as const };
const legs = { weighted: true, body: 'lower' as const };
const pushup = { weighted: false, body: 'upper' as const };

test('no history means no suggestion', () => {
  assert.deepEqual(suggestNext(press, undefined, 10, 'kg'), { weight: null, note: null });
});

test('adds the step after hitting every rep', () => {
  assert.equal(suggestNext(press, { sets: [10, 10, 10], weights: [20, 20, 20], target: 10 }, 10, 'kg').weight, 21.25);
  assert.equal(suggestNext(legs, { sets: [8, 8, 9], weights: [60, 60, 60], target: 8 }, 8, 'kg').weight, 62.5);
  assert.equal(suggestNext(legs, { sets: [8, 8], weights: [135, 135], target: 8 }, 8, 'lb').weight, 140);
});

test('repeats the weight when a set fell short', () => {
  const s = suggestNext(press, { sets: [10, 9, 7], weights: [20, 20, 20], target: 10 }, 10, 'kg');
  assert.equal(s.weight, 20);
  assert.match(s.note!, /Stay at 20 kg/);
});

test('uses the heaviest set when weights varied', () => {
  assert.equal(suggestNext(press, { sets: [10, 10], weights: [17.5, 20], target: 10 }, 10, 'kg').weight, 21.25);
});

test('bodyweight exercises progress by reps', () => {
  assert.match(suggestNext(pushup, { sets: [12, 12, 12], target: 12 }, 12, 'kg').note!, /Aim for 14/);
});

test('step sizes', () => {
  assert.equal(weightStep('upper', 'kg'), 1.25);
  assert.equal(weightStep('lower', 'kg'), 2.5);
  assert.equal(weightStep('upper', 'lb'), 2.5);
  assert.equal(weightStep('lower', 'lb'), 5);
});

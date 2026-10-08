/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { afterFailure, hashPassword, lockRemainingMs, passwordProblem, verifyPassword } from './password.ts';

const salt = () => new Uint8Array(randomBytes(16));

test('hash never contains the password and verifies only the right one', async () => {
  const rec = await hashPassword('squat-day-42', salt(), 1000);
  assert.ok(!JSON.stringify(rec).includes('squat-day-42'));
  assert.equal(rec.hash.length, 64);
  assert.equal(await verifyPassword('squat-day-42', rec), true);
  assert.equal(await verifyPassword('squat-day-43', rec), false);
  assert.equal(await verifyPassword('', rec), false);
});

test('same password with different salts gives different hashes', async () => {
  const a = await hashPassword('same-password', salt(), 1000);
  const b = await hashPassword('same-password', salt(), 1000);
  assert.notEqual(a.hash, b.hash);
});

test('matches the PBKDF2-SHA256 reference vector', async () => {
  // RFC 7914 §11: P="passwd", S="salt", c=1, dkLen=64 (first 32 bytes).
  const rec = await hashPassword('passwd', new TextEncoder().encode('salt'), 1);
  assert.equal(rec.hash, '55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc');
});

test('rejects weak passwords', () => {
  assert.ok(passwordProblem('abc'));
  assert.ok(passwordProblem('aaaaaaa'));
  assert.ok(passwordProblem('123456'));
  assert.ok(passwordProblem('Password'));
  assert.equal(passwordProblem('lift-heavy-7'), null);
});

test('locks after 5 failures, doubling the wait', () => {
  let s = { fails: 0, lockedUntil: 0 };
  for (let i = 0; i < 4; i++) s = afterFailure(s, 1000);
  assert.equal(lockRemainingMs(s, 1000), 0);
  s = afterFailure(s, 1000);
  assert.equal(lockRemainingMs(s, 1000), 30_000);
  for (let i = 0; i < 5; i++) s = afterFailure(s, 50_000);
  assert.equal(lockRemainingMs(s, 50_000), 60_000);
});

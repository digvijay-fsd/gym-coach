// Password hashing for on-device accounts. Pure TypeScript (no React Native
// imports) so it runs under `node --test`. Passwords are never stored: a random
// salt and PBKDF2-SHA256 produce a hash, which the app keeps in SecureStore.

import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

export const PBKDF2_ITERATIONS = 50_000;
export const MIN_PASSWORD_LENGTH = 6;

export type PasswordRecord = {
  v: 1;
  salt: string;
  hash: string;
  iterations: number;
};

/** Plain-language problem with a new password, or null when it is acceptable. */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (/^(.)\1+$/.test(password)) return 'Avoid repeating one character.';
  if (/^(0?123456?7?8?9?0?|password|qwerty)$/i.test(password)) return 'That password is too easy to guess.';
  return null;
}

/** `salt` must be random bytes (16+) from a secure source such as expo-crypto. */
export async function hashPassword(password: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS): Promise<PasswordRecord> {
  const key = await pbkdf2Async(sha256, utf8ToBytes(password.normalize('NFKC')), salt, { c: iterations, dkLen: 32 });
  return { v: 1, salt: bytesToHex(salt), hash: bytesToHex(key), iterations };
}

export async function verifyPassword(password: string, record: PasswordRecord): Promise<boolean> {
  const again = await hashPassword(password, hexToBytes(record.salt), record.iterations);
  return constantTimeEqual(again.hash, record.hash);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------- lockout after repeated wrong passwords ----------

export type LockState = { fails: number; lockedUntil: number };

export const FREE_ATTEMPTS = 5;
const BASE_LOCK_MS = 30_000;

/** State after a failed attempt: every 5th failure locks for 30 s, doubling each time. */
export function afterFailure(state: LockState, now: number): LockState {
  const fails = state.fails + 1;
  if (fails % FREE_ATTEMPTS !== 0) return { fails, lockedUntil: state.lockedUntil };
  const round = fails / FREE_ATTEMPTS - 1;
  return { fails, lockedUntil: now + BASE_LOCK_MS * 2 ** Math.min(round, 6) };
}

export function lockRemainingMs(state: LockState | undefined, now: number): number {
  return state ? Math.max(0, state.lockedUntil - now) : 0;
}

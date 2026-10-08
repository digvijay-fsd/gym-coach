// Backup file format: one account's data as JSON. Pure TypeScript so it is unit tested with `node --test`.

export const BACKUP_APP = 'gym-coach';
export const BACKUP_VERSION = 1;

export type BackupData = {
  profile: Record<string, unknown> | null;
  history: { id: string }[];
  workouts: { id: string }[];
  bodyLog: { id: string }[];
  customPrograms: { id: string }[];
};

export function makeBackup(data: BackupData, now: number): string {
  return JSON.stringify({ app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now, data });
}

const hasIds = (x: unknown): x is { id: string }[] => Array.isArray(x) && x.every((i) => i && typeof i === 'object' && typeof (i as { id?: unknown }).id === 'string');

export function readBackup(text: string): { ok: true; data: BackupData; exportedAt: number } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not a Gym Coach backup.' };
  }
  const file = raw as { app?: unknown; version?: unknown; exportedAt?: unknown; data?: Partial<Record<keyof BackupData, unknown>> };
  if (!file || file.app !== BACKUP_APP || !file.data) return { ok: false, error: 'That file is not a Gym Coach backup.' };
  if (typeof file.version !== 'number' || file.version > BACKUP_VERSION) return { ok: false, error: 'This backup is from a newer version of Gym Coach. Update the app first.' };
  const d = file.data;
  const list = (x: unknown) => (x === undefined ? [] : x);
  const lists = { history: list(d.history), workouts: list(d.workouts), bodyLog: list(d.bodyLog), customPrograms: list(d.customPrograms) };
  if (!Object.values(lists).every(hasIds)) return { ok: false, error: 'This backup file is damaged.' };
  const profile = d.profile && typeof d.profile === 'object' ? (d.profile as Record<string, unknown>) : null;
  return { ok: true, data: { profile, ...(lists as Omit<BackupData, 'profile'>) }, exportedAt: typeof file.exportedAt === 'number' ? file.exportedAt : 0 };
}

/** Items from `incoming` whose id is not already in `current`, added to it. Existing items win. */
export function mergeById<T extends { id: string }>(current: T[], incoming: T[]): { merged: T[]; added: number } {
  const ids = new Set(current.map((x) => x.id));
  const fresh = incoming.filter((x) => !ids.has(x.id));
  return { merged: [...current, ...fresh], added: fresh.length };
}

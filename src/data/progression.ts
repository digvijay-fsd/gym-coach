// Progressive overload: what to lift next time, from the last session.
// Pure TypeScript so it is unit tested with `node --test`.

export type Units = 'kg' | 'lb';
type Last = { sets: number[]; weights?: number[]; target?: number };

/** Weight added after a session where every set hit its target. */
export function weightStep(body: 'upper' | 'lower' | 'full', units: Units): number {
  const upper = body === 'upper';
  if (units === 'lb') return upper ? 2.5 : 5;
  return upper ? 1.25 : 2.5;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function suggestNext(
  ex: { weighted: boolean; body: 'upper' | 'lower' | 'full' },
  last: Last | undefined,
  target: number,
  units: Units,
): { weight: number | null; note: string | null } {
  if (!last || last.sets.length === 0) return { weight: null, note: null };
  const goal = last.target ?? target;
  const hitAll = last.sets.every((r) => r >= goal);
  if (!ex.weighted) {
    return hitAll
      ? { weight: null, note: `You hit ${goal} on every set last time. Aim for ${goal + 2} today.` }
      : { weight: null, note: `Last time: ${last.sets.join(', ')}. Aim for ${goal} on every set.` };
  }
  const used = Math.max(0, ...(last.weights ?? []).filter((w) => w > 0));
  if (!used) return { weight: null, note: null };
  if (hitAll) {
    const step = weightStep(ex.body, units);
    return { weight: round(used + step), note: `You hit every rep at ${used} ${units}. Try ${round(used + step)} ${units} today.` };
  }
  return { weight: used, note: `Stay at ${used} ${units} until you get ${goal} reps on every set.` };
}

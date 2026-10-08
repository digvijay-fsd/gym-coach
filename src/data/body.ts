// Body weight and BMI. Weights are stored in kg and shown in the profile's units.

export type Units = 'kg' | 'lb';
export type BodyEntry = { id: string; at: number; kg: number };

const LB = 0.45359237;
const round1 = (n: number) => Math.round(n * 10) / 10;

export const toKg = (value: number, units: Units) => (units === 'lb' ? value * LB : value);
export const fromKg = (kg: number, units: Units) => round1(units === 'lb' ? kg / LB : kg);

export function bmi(kg: number, heightCm: number | undefined): number | null {
  if (!heightCm || heightCm < 50 || kg <= 0) return null;
  const m = heightCm / 100;
  return round1(kg / (m * m));
}

/** WHO adult bands. */
export function bmiBand(value: number): { label: string; healthy: boolean } {
  if (value < 18.5) return { label: 'Underweight', healthy: false };
  if (value < 25) return { label: 'Healthy range', healthy: true };
  if (value < 30) return { label: 'Overweight', healthy: false };
  return { label: 'Obese range', healthy: false };
}

/** Change in kg between the latest entry and the newest one at least `days` old. Null without enough entries. */
export function changeOver(log: BodyEntry[], days: number, now: number): number | null {
  if (log.length < 2) return null;
  const sorted = [...log].sort((a, b) => b.at - a.at);
  const cutoff = now - days * 86_400_000;
  const past = sorted.find((e) => e.at <= cutoff) ?? sorted[sorted.length - 1];
  if (past === sorted[0]) return null;
  return round1(sorted[0].kg - past.kg);
}

import type { Subdivision } from '@/types/rhythm';

export const SUBDIVISION_LABELS: Record<Subdivision, string> = {
  quarter: 'Quarter (Crotchet)',
  eighth: 'Quaver (Eighth)',
  triplet: 'Triplet',
  sixteenth: 'Semiquaver (16th)',
  thirtySecond: 'Demisemiquaver (32nd)',
  sixtyFourth: 'Hemidemisemiquaver (64th)',
};

export const SUBDIVISION_COUNTS: Record<Subdivision, number> = {
  quarter: 1,
  eighth: 2,
  triplet: 3,
  sixteenth: 4,
  thirtySecond: 8,
  sixtyFourth: 16,
};

export function beatDurationMs(bpm: number): number {
  return 60_000 / bpm;
}

export function subdivisionIntervalMs(bpm: number, subdivision: Subdivision): number {
  return beatDurationMs(bpm) / SUBDIVISION_COUNTS[subdivision];
}

export function expectedEventTimeMs(
  sessionStartTime: number,
  bpm: number,
  beatIndex: number,
  subdivisionIndex = 0,
  subdivision: Subdivision = 'quarter',
): number {
  const beatMs = beatDurationMs(bpm);
  const divisions = SUBDIVISION_COUNTS[subdivision];
  return sessionStartTime + beatIndex * beatMs + (subdivisionIndex * beatMs) / divisions;
}

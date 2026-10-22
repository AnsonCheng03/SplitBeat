export const TIMING_WINDOWS = {
  perfectMs: 30,
  greatMs: 60,
  goodMs: 100,
} as const;

export type TapGrade = 'perfect' | 'great' | 'good';

export interface MatchableEvent {
  id: string;
  expectedTimeMs: number;
  matched: boolean;
}

export interface TapMatch {
  eventId: string;
  timingErrorMs: number;
  grade: TapGrade;
}

export function gradeTimingError(timingErrorMs: number): TapGrade | null {
  const absoluteError = Math.abs(timingErrorMs);
  if (absoluteError <= TIMING_WINDOWS.perfectMs) return 'perfect';
  if (absoluteError <= TIMING_WINDOWS.greatMs) return 'great';
  if (absoluteError <= TIMING_WINDOWS.goodMs) return 'good';
  return null;
}

export function matchTap(
  events: readonly MatchableEvent[],
  actualTapTimeMs: number,
): TapMatch | null {
  let nearest: MatchableEvent | undefined;
  let nearestError = Number.POSITIVE_INFINITY;

  for (const event of events) {
    if (event.matched) continue;
    const error = actualTapTimeMs - event.expectedTimeMs;
    if (Math.abs(error) < Math.abs(nearestError)) {
      nearest = event;
      nearestError = error;
    }
  }

  if (!nearest) return null;
  const grade = gradeTimingError(nearestError);
  return grade ? { eventId: nearest.id, timingErrorMs: nearestError, grade } : null;
}

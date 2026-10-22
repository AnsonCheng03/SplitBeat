export interface TimingWindows {
  perfectMs: number;
  greatMs: number;
  goodMs: number;
}

export const TIMING_WINDOWS: TimingWindows = {
  perfectMs: 30,
  greatMs: 60,
  goodMs: 100,
};

export function timingWindowsForGoodWindow(goodMs: number): TimingWindows {
  return {
    perfectMs: goodMs * 0.3,
    greatMs: goodMs * 0.6,
    goodMs,
  };
}

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

export function gradeTimingError(
  timingErrorMs: number,
  windows: TimingWindows = TIMING_WINDOWS,
): TapGrade | null {
  const absoluteError = Math.abs(timingErrorMs);
  if (absoluteError <= windows.perfectMs) return 'perfect';
  if (absoluteError <= windows.greatMs) return 'great';
  if (absoluteError <= windows.goodMs) return 'good';
  return null;
}

export function matchTap(
  events: readonly MatchableEvent[],
  actualTapTimeMs: number,
  windows: TimingWindows = TIMING_WINDOWS,
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
  const grade = gradeTimingError(nearestError, windows);
  return grade ? { eventId: nearest.id, timingErrorMs: nearestError, grade } : null;
}

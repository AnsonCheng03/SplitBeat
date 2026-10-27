export const TAP_TEMPO_WINDOW_MS = 5_000;
export const MIN_TAP_TEMPO_BPM = 40;
export const MAX_TAP_TEMPO_BPM = 200;

export interface TapTempoResult {
  tapTimes: number[];
  bpm: number | null;
}

/** Add a tap and estimate the tempo from valid intervals in the trailing window. */
export function addTapTempoSample(
  previousTapTimes: readonly number[],
  tappedAtMs: number,
  windowMs = TAP_TEMPO_WINDOW_MS,
): TapTempoResult {
  if (!Number.isFinite(tappedAtMs)) return { tapTimes: [...previousTapTimes], bpm: null };

  const recentTapTimes = previousTapTimes.filter((tapTime) =>
    Number.isFinite(tapTime) && tapTime <= tappedAtMs && tappedAtMs - tapTime <= windowMs,
  );
  const tapTimes = [...recentTapTimes, tappedAtMs];
  const intervals = tapTimes.slice(1).map((tapTime, index) => tapTime - tapTimes[index]);
  const validIntervals = intervals.filter((interval) =>
    interval >= 60_000 / MAX_TAP_TEMPO_BPM && interval <= 60_000 / MIN_TAP_TEMPO_BPM,
  );

  if (validIntervals.length === 0) return { tapTimes, bpm: null };

  const averageIntervalMs = validIntervals.reduce((total, interval) => total + interval, 0)
    / validIntervals.length;
  const bpm = Math.max(
    MIN_TAP_TEMPO_BPM,
    Math.min(MAX_TAP_TEMPO_BPM, Math.round(60_000 / averageIntervalMs)),
  );
  return { tapTimes, bpm };
}

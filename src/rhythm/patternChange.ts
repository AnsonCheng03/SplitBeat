import type { PracticeDisplayMode } from '@/types/rhythm';

/**
 * Keep repeated pattern changes aligned to bar lines when the requested beat
 * interval cannot tile the current meter. Beat intervals that divide a bar
 * (or contain whole bars) retain their exact length.
 */
export function alignedPatternChangeIntervalBeats(
  requestedIntervalBeats: number,
  beatsPerBar: number,
): number {
  if (
    !Number.isInteger(requestedIntervalBeats)
    || requestedIntervalBeats <= 0
    || !Number.isInteger(beatsPerBar)
    || beatsPerBar <= 0
  ) return requestedIntervalBeats;

  if (requestedIntervalBeats % beatsPerBar === 0 || beatsPerBar % requestedIntervalBeats === 0) {
    return requestedIntervalBeats;
  }

  return Math.ceil(requestedIntervalBeats / beatsPerBar) * beatsPerBar;
}

/** Rhythm-symbol patterns advance once per written measure, at its final beat. */
export function patternChangeIntervalForMode(
  displayMode: PracticeDisplayMode,
  requestedIntervalBeats: number,
  engineBeatsPerBar: number,
): number {
  if (displayMode === 'rhythm' && Number.isInteger(engineBeatsPerBar) && engineBeatsPerBar > 0) {
    return engineBeatsPerBar;
  }
  return alignedPatternChangeIntervalBeats(requestedIntervalBeats, engineBeatsPerBar);
}

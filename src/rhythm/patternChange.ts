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

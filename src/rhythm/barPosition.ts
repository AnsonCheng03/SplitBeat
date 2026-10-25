export interface BarPosition {
  /** Zero-based bar offset from the start of the session. */
  barOffset: number;
  /** Zero-based beat position within the bar. */
  beatInBar: number;
}

const BAR_BOUNDARY_EPSILON = 0.0000001;

/**
 * Convert a beat position to a bar and beat while absorbing floating-point
 * drift at exact bar boundaries (for example, 2.99999999999 in 3/8).
 */
export function barPositionForBeat(beatPosition: number, beatsPerBar: number): BarPosition {
  if (!Number.isFinite(beatPosition) || beatPosition < 0) {
    throw new RangeError('Beat position must be a non-negative finite number.');
  }
  if (!Number.isFinite(beatsPerBar) || beatsPerBar <= 0) {
    throw new RangeError('A bar must contain a positive number of beats.');
  }

  const nearestBarOffset = Math.round(beatPosition / beatsPerBar);
  const nearestBarPosition = nearestBarOffset * beatsPerBar;
  if (Math.abs(beatPosition - nearestBarPosition) <= BAR_BOUNDARY_EPSILON) {
    return { barOffset: nearestBarOffset, beatInBar: 0 };
  }

  const barOffset = Math.floor(beatPosition / beatsPerBar);
  return {
    barOffset,
    beatInBar: beatPosition - barOffset * beatsPerBar,
  };
}

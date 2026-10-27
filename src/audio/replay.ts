import type { ReplayExpectedEvent, ReplayTap, Hand } from '@/types/rhythm';

export interface ReplayAudioEvent {
  /** Milliseconds from the start of the selected bar. */
  offsetMs: number;
  hand: Hand;
  source: 'expected' | 'tap';
  midiPitches?: readonly number[];
}

export function createReplayAudioEvents(
  barIndex: number,
  beatsPerBar: number,
  bpm: number,
  expectedEvents: readonly ReplayExpectedEvent[],
  taps: readonly ReplayTap[],
): ReplayAudioEvent[] {
  const beatDurationMs = 60_000 / bpm;
  const barDurationMs = beatsPerBar * beatDurationMs;
  const barStartMs = (barIndex - 1) * barDurationMs;
  const events: ReplayAudioEvent[] = [];

  for (const event of expectedEvents) {
    if (event.barIndex !== barIndex) continue;
    const offsetMs = event.beatInBar * beatDurationMs;
    if (offsetMs < 0 || offsetMs >= barDurationMs) continue;
    events.push({
      offsetMs,
      hand: event.hand,
      source: 'expected',
      ...(event.midiPitches ? { midiPitches: event.midiPitches } : {}),
    });
  }

  for (const tap of taps) {
    if (tap.barIndex !== barIndex) continue;
    const rawOffsetMs = tap.timestampMs - barStartMs;
    const offsetMs = tap.matchedEventId
      ? Math.max(0, Math.min(rawOffsetMs, barDurationMs - 1))
      : rawOffsetMs;
    if (offsetMs < 0 || offsetMs >= barDurationMs) continue;
    events.push({
      offsetMs,
      hand: tap.hand,
      source: 'tap',
      ...(tap.midiPitches ? { midiPitches: tap.midiPitches } : {}),
    });
  }

  return events.sort((first, second) =>
    first.offsetMs - second.offsetMs
    || (first.source === second.source ? 0 : first.source === 'expected' ? -1 : 1)
    || first.hand.localeCompare(second.hand),
  );
}

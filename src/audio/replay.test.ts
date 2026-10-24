import assert from 'node:assert/strict';
import test from 'node:test';
import { createReplayAudioEvents } from '@/audio/replay';
import type { ReplayExpectedEvent, ReplayTap } from '@/types/rhythm';

const expectedEvents: ReplayExpectedEvent[] = [
  {
    id: 'expected-1', hand: 'left', barIndex: 1, beatInBar: 0,
    durationQuarter: 1, isScoreEvent: false, matched: true, expectedTimeMs: 100,
  },
  {
    id: 'expected-2', hand: 'right', barIndex: 2, beatInBar: 0.5,
    durationQuarter: 0.5, isScoreEvent: true, matched: false, expectedTimeMs: 500,
    midiPitches: [67, 72],
  },
];

const taps: ReplayTap[] = [
  { id: 'tap-1', hand: 'left', barIndex: 1, timestampMs: 18, matchedEventId: 'expected-1' },
  { id: 'tap-2', hand: 'right', barIndex: 2, timestampMs: 2_520, midiPitches: [67, 72] },
];

test('replay audio places expected notes and actual taps at their bar-relative times', () => {
  assert.deepEqual(createReplayAudioEvents(2, 4, 120, expectedEvents, taps), [
    { offsetMs: 250, hand: 'right', source: 'expected', midiPitches: [67, 72] },
    { offsetMs: 520, hand: 'right', source: 'tap', midiPitches: [67, 72] },
  ]);
});

test('replay audio keeps expected notes before taps at the same timestamp', () => {
  const events = createReplayAudioEvents(
    1,
    4,
    60,
    expectedEvents.slice(0, 1),
    [{ id: 'tap-now', hand: 'left', barIndex: 1, timestampMs: 0 }],
  );
  assert.deepEqual(events.map(({ source }) => source), ['expected', 'tap']);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAccompanimentNotesAtBeat,
  getBeatAudioTime,
  getResumeCountInPlan,
  isPatternChangeBeat,
  PATTERN_CHANGE_CUE,
  SESSION_START_CUE,
} from './musicPattern';

test('accompaniment follows the selected metronome beat and meter', () => {
  const commonTime = Array.from({ length: 8 }, (_, beat) => getAccompanimentNotesAtBeat(beat, 4));
  assert.equal(commonTime[0][0].midiPitch, 48);
  assert.equal(commonTime[0][1].midiPitch, 60);
  assert.deepEqual(commonTime.slice(1, 4).map((notes) => notes[0].midiPitch), [55, 52, 55]);
  assert.equal(commonTime[4][0].midiPitch, 53);
  assert.equal(commonTime[4][1].midiPitch, 65);

  const compound = Array.from({ length: 6 }, (_, beat) => getAccompanimentNotesAtBeat(beat, 2));
  assert.deepEqual(compound.map((notes) => notes[0].midiPitch), [48, 55, 53, 60, 55, 62]);
});

test('scheduled beat times are calculated from the session start without accumulating drift', () => {
  const start = 125.25;
  const bpm = 73;
  const beatDuration = 60 / bpm;
  const times = Array.from({ length: 1_000 }, (_, index) => getBeatAudioTime(start, bpm, index));

  assert.equal(times[0], start);
  assert.ok(Math.abs(times[999] - (start + 999 * beatDuration)) < Number.EPSILON * 128);
  assert.equal(getBeatAudioTime(start, 120, 12), start + 6);
});

test('start and pattern-change cues sit on the beat grid', () => {
  assert.deepEqual(SESSION_START_CUE.map(({ offsetBeats }) => offsetBeats), [-0.5, 0]);
  assert.deepEqual(PATTERN_CHANGE_CUE, { midiPitch: 79, level: 0.24 });
  assert.deepEqual(
    Array.from({ length: 9 }, (_, beat) => isPatternChangeBeat(beat, 4)),
    [false, false, false, false, true, false, false, false, true],
  );
  assert.equal(isPatternChangeBeat(0, 1), false);
  assert.equal(isPatternChangeBeat(2, 0), false);
});

test('resume count-in starts on the next beat and lasts half a bar', () => {
  const plan = getResumeCountInPlan(12.25, 10, 60, 4);

  assert.equal(plan.beatDurationMs, 1_000);
  assert.equal(plan.nextBeatIndex, 3);
  assert.equal(plan.firstBeatOffsetMs, 830);
  assert.equal(plan.countInBeats, 2);
  assert.equal(plan.durationMs, 2_830);
});

test('resume count-in uses half the pulse count in compound meter', () => {
  const plan = getResumeCountInPlan(10, 10, 60, 2);

  assert.equal(plan.countInBeats, 1);
  assert.equal(plan.durationMs, 2_080);
});

test('invalid meter and pulse inputs produce no accompaniment events', () => {
  assert.deepEqual(getAccompanimentNotesAtBeat(0, 0), []);
  assert.deepEqual(getAccompanimentNotesAtBeat(0.5, 4), []);
});

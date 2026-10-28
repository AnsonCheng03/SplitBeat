import assert from 'node:assert/strict';
import test from 'node:test';
import { createBackgroundMusicArrangement, getBackgroundMusicNotesAtBeat } from './backgroundMusic';
import {
  getBeatAudioTime,
  getResumeCountInPlan,
  isPatternChangeBeat,
  PATTERN_CHANGE_CUE,
  SESSION_START_CUE,
} from './musicPattern';

test('background music repeats a chord progression and melody over the selected meter', () => {
  const arrangement = createBackgroundMusicArrangement(42);
  const commonTime = Array.from({ length: 20 }, (_, beat) =>
    getBackgroundMusicNotesAtBeat(beat, 4, 2, arrangement));
  const firstBar = commonTime[0];
  const firstBarPad = firstBar.filter((note) => note.voice === 'pad');

  assert.equal(firstBarPad.length, 3);
  assert.equal(firstBar.filter((note) => note.voice === 'bass').length, 1);
  assert.equal(firstBar.filter((note) => note.voice === 'melody')[0].offsetBeats, 0.5);
  assert.equal(commonTime[1].length, 0);
  assert.equal(commonTime[2].filter((note) => note.voice === 'pad').length, 0);
  assert.equal(commonTime[2].filter((note) => note.voice === 'melody').length, 1);
  assert.deepEqual(
    commonTime[0].filter((note) => note.voice === 'pad').map((note) => note.midiPitch),
    commonTime[16].filter((note) => note.voice === 'pad').map((note) => note.midiPitch),
  );

  const compound = Array.from({ length: 4 }, (_, beat) =>
    getBackgroundMusicNotesAtBeat(beat, 2, 3, arrangement));
  assert.equal(compound[0].filter((note) => note.voice === 'melody')[0].offsetBeats, 1 / 3);
  assert.equal(compound[1].filter((note) => note.voice === 'melody')[0].offsetBeats, 2 / 3);
  assert.equal(compound[0].filter((note) => note.voice === 'pad').length, 3);
  assert.equal(compound[1].filter((note) => note.voice === 'pad').length, 0);
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
  const arrangement = createBackgroundMusicArrangement(1);
  assert.deepEqual(getBackgroundMusicNotesAtBeat(0, 0, 2, arrangement), []);
  assert.deepEqual(getBackgroundMusicNotesAtBeat(0.5, 4, 2, arrangement), []);
  assert.deepEqual(getBackgroundMusicNotesAtBeat(-1, 4, 2, arrangement), []);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { LEARN_COURSE } from '@/rhythm/learnCourse';
import { findLearnSong, LEARN_SONGS, learnSongsForLesson } from '@/rhythm/learnSongs';

test('the Learn song library only exposes app-authored original pieces', () => {
  assert.ok(LEARN_SONGS.length >= 5);
  assert.equal(new Set(LEARN_SONGS.map(({ id }) => id)).size, LEARN_SONGS.length);
  assert.ok(LEARN_SONGS.every(({ tags }) => tags.includes('Original')));
});

test('every lesson has an original song recommendation in the same meter', () => {
  for (const lesson of LEARN_COURSE) {
    const [song] = learnSongsForLesson(lesson.id);
    assert.ok(song, `${lesson.id} should have a song recommendation`);
    assert.equal(song.score.timeSignature, lesson.timeSignature, `${lesson.id} recommendation meter`);
  }
});

test('every song measure fills its meter and contains playable notes', () => {
  for (const song of LEARN_SONGS) {
    const [beats, denominator] = song.score.timeSignature.split('/').map(Number);
    const expectedMeasureQuarter = (beats! * 4) / denominator!;

    assert.ok(song.score.measures.length >= 4, `${song.id} should be a complete short song`);
    assert.equal(song.score.totalQuarterNotes, song.score.measures.length * expectedMeasureQuarter);

    for (const [index, measure] of song.score.measures.entries()) {
      assert.equal(measure.index, index, `${song.id} measure index`);
      assert.equal(measure.startQuarter, index * expectedMeasureQuarter, `${song.id} measure start`);
      assert.equal(measure.durationQuarter, expectedMeasureQuarter, `${song.id} measure length`);
      const events = [...measure.leftEvents, ...measure.rightEvents];
      assert.ok(events.some((event) => !event.isRest && event.midiPitches?.length), `${song.id} bar ${index + 1} should play notes`);
      assert.ok(events.every((event) => event.startQuarter >= 0 && event.startQuarter < expectedMeasureQuarter));
    }
  }
});

test('unknown song identifiers do not resolve to a course song', () => {
  assert.equal(findLearnSong(undefined), undefined);
  assert.equal(findLearnSong('not-a-song'), undefined);
});

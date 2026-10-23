/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getLessonAvailability,
  LEARN_COURSE,
  lessonProgressPercent,
  lessonSettings,
  markLessonCompleted,
  parseCompletedLessonIds,
} from '@/rhythm/learnCourse';
import type { ExerciseSettings } from '@/types/rhythm';

const preferences: ExerciseSettings = {
  bpm: 80,
  timeSignature: '4/4',
  durationSeconds: 60,
  changeIntervalBeats: 4,
  restBetweenChanges: false,
  enabledSubdivisions: ['quarter', 'eighth'],
  feel: 'straight',
  graceNotesEnabled: false,
  trainingMode: 'two-hand',
  singleHand: 'right',
  soundEnabled: false,
  metronomeSound: 'wood',
  leftHandSound: 'soft',
  rightHandSound: 'beep',
  leftFlashSource: 'tap',
  rightFlashSource: 'tap',
  tapResultFlashEnabled: true,
  referenceRhythmEnabled: false,
  leftTapOffsetMs: -20,
  rightTapOffsetMs: 15,
  goodWindowMs: 80,
  hapticsEnabled: false,
};

test('the course advances from a pulse through subdivisions, tuplets, and mixed meter', () => {
  assert.equal(LEARN_COURSE.length, 12);
  assert.equal(LEARN_COURSE[0].trainingMode, 'single-hand');
  assert.equal(LEARN_COURSE[1].patternPairs[0].leftSubdivision, 'quarter');
  assert.ok(LEARN_COURSE.some((lesson) => lesson.timeSignature === '6/8'));
  assert.ok(LEARN_COURSE.some((lesson) => lesson.feel === 'swing'));
  assert.ok(LEARN_COURSE.some((lesson) => lesson.patternPairs.some((pair) => pair.leftSubdivision === 'sixtyFourth' || pair.rightSubdivision === 'sixtyFourth')));
  assert.equal(LEARN_COURSE.at(-1)?.restBetweenChanges, true);
});

test('lessons unlock in order and completion can be revisited safely', () => {
  const first = LEARN_COURSE[0].id;
  const second = LEARN_COURSE[1].id;
  assert.equal(getLessonAvailability(first, []), 'available');
  assert.equal(getLessonAvailability(second, []), 'locked');

  const progress = markLessonCompleted([], first);
  assert.deepEqual(progress, [first]);
  assert.equal(getLessonAvailability(second, progress), 'available');
  assert.deepEqual(markLessonCompleted(progress, first), progress);
  assert.deepEqual(markLessonCompleted([], second), []);
  assert.equal(getLessonAvailability('unknown', progress), 'locked');
  assert.equal(lessonProgressPercent(progress), Math.round(100 / LEARN_COURSE.length));
});

test('saved progress ignores unknown ids and malformed data', () => {
  assert.deepEqual(parseCompletedLessonIds(JSON.stringify([
    LEARN_COURSE[2].id,
    'not-a-lesson',
    LEARN_COURSE[0].id,
  ])), [LEARN_COURSE[0].id, LEARN_COURSE[2].id]);
  assert.deepEqual(parseCompletedLessonIds('{bad json'), []);
  assert.deepEqual(parseCompletedLessonIds(JSON.stringify({ completed: [] })), []);
});

test('lesson setup uses course tempo and meter while preserving personal audio and timing preferences', () => {
  const lesson = LEARN_COURSE.find((item) => item.id === 'compound-meter');
  assert.ok(lesson);
  const settings = lessonSettings(lesson, preferences);

  assert.equal(settings.bpm, 64);
  assert.equal(settings.timeSignature, '6/8');
  assert.equal(settings.durationSeconds, 30);
  assert.deepEqual(settings.enabledSubdivisions, ['eighth', 'triplet']);
  assert.equal(settings.trainingMode, 'two-hand');
  assert.equal(settings.soundEnabled, false);
  assert.equal(settings.leftTapOffsetMs, -20);
  assert.equal(settings.rightTapOffsetMs, 15);
});

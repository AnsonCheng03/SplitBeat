/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BUILD_FEATURE_FLAGS } from '@/features/featureFlags';
import {
  createLearnCourse,
  getLessonAvailability,
  isLearnCourseCheckpoint,
  LEARN_COURSE,
  learnCourseContentRevision,
  lessonHandPatternOptions,
  lessonOffersHandSwaps,
  lessonProgressPercent,
  lessonSettings,
  markLessonCompleted,
  parseCompletedLessonIds,
  parseSkippedLessonIds,
} from '@/rhythm/learnCourse';
import type { ExerciseSettings } from '@/types/rhythm';

const preferences: ExerciseSettings = {
  bpm: 80,
  timeSignature: '4/4',
  durationSeconds: 60,
  changeIntervalBeats: 4,
  restBetweenChanges: false,
  handRestsEnabled: false,
  enabledSubdivisions: ['quarter', 'eighth'],
  enabledMixtures: [],
  feel: 'straight',
  graceNotesEnabled: false,
  trainingMode: 'two-hand',
  practiceDisplayMode: 'rhythm',
  singleHand: 'right',
  soundEnabled: false,
  backgroundMusicEnabled: false,
  sessionCuesEnabled: true,
  metronomeSound: 'wood',
  leftHandSound: 'soft',
  rightHandSound: 'beep',
  leftFlashSource: 'tap',
  rightFlashSource: 'tap',
  tapResultFlashEnabled: true,
  referenceRhythmEnabled: false,
  challengeAction: 'off',
  challengeTriggerMode: 'notes',
  challengeMissStreak: 3,
  challengeWrongBarStreak: 2,
  leftTapOffsetMs: -20,
  rightTapOffsetMs: 15,
  autoCalibrationEnabled: true,
  goodWindowMs: 80,
  hapticsEnabled: false,
};

test('the course advances from a pulse through subdivisions, tuplets, and mixed meter', () => {
  assert.equal(LEARN_COURSE.length, 20);
  assert.deepEqual(LEARN_COURSE.map((lesson) => lesson.number), Array.from({ length: 20 }, (_, index) => index + 1));
  assert.equal(LEARN_COURSE[0].trainingMode, 'single-hand');
  assert.equal(LEARN_COURSE[1].patternPairs[0].leftSubdivision, 'quarter');
  assert.ok(LEARN_COURSE.some((lesson) => lesson.timeSignature === '6/8'));
  assert.ok(LEARN_COURSE.some((lesson) => lesson.feel === 'swing'));
  assert.ok(LEARN_COURSE.some((lesson) => lesson.patternPairs.some((pair) => pair.leftSubdivision === 'thirtySecond' || pair.rightSubdivision === 'thirtySecond')));
  assert.equal(LEARN_COURSE.some((lesson) => lesson.patternPairs.some((pair) => pair.leftSubdivision === 'sixtyFourth' || pair.rightSubdivision === 'sixtyFourth')), BUILD_FEATURE_FLAGS.sixtyFourthNotes);
  assert.equal(LEARN_COURSE.at(-1)?.restBetweenChanges, true);
});

test('the 64th-note course content is build-gated and course revisions stay separate', () => {
  const limitedCourse = createLearnCourse({ sixtyFourthNotes: false });
  const enabledCourse = createLearnCourse({ sixtyFourthNotes: true });
  assert.ok(limitedCourse.every((lesson) => lesson.patternPairs.every((pair) => pair.leftSubdivision !== 'sixtyFourth' && pair.rightSubdivision !== 'sixtyFourth')));
  assert.ok(enabledCourse.some((lesson) => lesson.patternPairs.some((pair) => pair.leftSubdivision === 'sixtyFourth' || pair.rightSubdivision === 'sixtyFourth')));
  assert.notEqual(learnCourseContentRevision(limitedCourse), learnCourseContentRevision(enabledCourse));
});

test('two-hand lessons let either hand play each authored rhythm', () => {
  const twoHandLessons = LEARN_COURSE.filter((lesson) => lesson.trainingMode === 'two-hand');
  assert.ok(twoHandLessons.length > 0);

  for (const lesson of twoHandLessons) {
    for (const pattern of lesson.patternPairs) {
      assert.ok(lesson.patternPairs.some((candidate) => (
        candidate.leftSubdivision === pattern.rightSubdivision
        && candidate.rightSubdivision === pattern.leftSubdivision
        && (candidate.leftRest === true) === (pattern.rightRest === true)
        && (candidate.rightRest === true) === (pattern.leftRest === true)
      )), `${lesson.id} is missing the hand-swapped pattern`);
    }
  }

  assert.equal(lessonOffersHandSwaps(LEARN_COURSE[0]), false);
  assert.equal(lessonOffersHandSwaps(LEARN_COURSE[1]), false);
  assert.equal(lessonOffersHandSwaps(LEARN_COURSE[2]), true);
  assert.equal(lessonOffersHandSwaps(LEARN_COURSE.find((lesson) => lesson.id === 'share-the-rest')!), true);
});

test('early lessons keep a shared pulse before later lessons introduce per-hand weighted variety', () => {
  assert.deepEqual(LEARN_COURSE[1].patternPairs, [
    { leftSubdivision: 'quarter', rightSubdivision: 'quarter' },
  ]);

  const lesson = LEARN_COURSE.find((item) => item.id === 'sixteenth-notes');
  assert.ok(lesson);
  assert.deepEqual(lesson.handSubdivisionWeights, {
    quarter: 50,
    eighth: 30,
    triplet: 10,
    sixteenth: 10,
  });
  assert.equal(lesson.patternPairs.length, 16);
  assert.equal(lesson.patternPairWeights?.length, lesson.patternPairs.length);

  const totalWeight = lesson.patternPairWeights?.reduce((total, weight) => total + weight, 0) ?? 0;
  for (const hand of ['leftSubdivision', 'rightSubdivision'] as const) {
    for (const subdivision of ['quarter', 'eighth', 'triplet', 'sixteenth'] as const) {
      const expectedPercent: number = lesson.handSubdivisionWeights[subdivision] ?? 0;
      let handWeight = 0;
      lesson.patternPairs.forEach((pattern, index) => {
        if (pattern[hand] === subdivision) {
          handWeight += lesson.patternPairWeights?.[index] ?? 0;
        }
      });
      assert.equal(Math.round((handWeight / totalWeight) * 100), expectedPercent);
    }
  }
});

test('the limited fine-control lesson folds 64th-note weight into 32nd notes', () => {
  const fineControl = createLearnCourse({ sixtyFourthNotes: false }).find((lesson) => lesson.id === 'fast-subdivisions');
  assert.equal(fineControl?.handSubdivisionWeights?.thirtySecond, 15);
  assert.equal(fineControl?.handSubdivisionWeights?.sixtyFourth, undefined);
});

test('course previews expose every subdivision and rest each hand can receive', () => {
  const fineControl = LEARN_COURSE.find((lesson) => lesson.id === 'fast-subdivisions');
  assert.ok(fineControl);
  const expectedFastNotes = ['quarter', 'eighth', 'sixteenth', 'thirtySecond', ...(BUILD_FEATURE_FLAGS.sixtyFourthNotes ? ['sixtyFourth'] : [])];
  for (const hand of ['left', 'right'] as const) {
    const options = lessonHandPatternOptions(fineControl, hand);
    assert.deepEqual(options.subdivisions, expectedFastNotes);
    assert.equal(options.includesRest, false);
  }

  const handRestLesson = LEARN_COURSE.find((lesson) => lesson.id === 'share-the-rest');
  assert.ok(handRestLesson);
  assert.equal(lessonHandPatternOptions(handRestLesson, 'left').includesRest, true);
  assert.equal(lessonHandPatternOptions(handRestLesson, 'right').includesRest, true);
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

test('every fifth lesson is directly available as a checkpoint without unlocking lessons ahead of it', () => {
  const checkpoints = LEARN_COURSE.filter((lesson) => isLearnCourseCheckpoint(lesson.number));
  assert.deepEqual(checkpoints.map((lesson) => lesson.number), [5, 10, 15, 20]);

  for (const checkpoint of checkpoints) {
    assert.equal(getLessonAvailability(checkpoint.id, []), 'available');
    const followingLesson = LEARN_COURSE[checkpoint.number];
    if (followingLesson) assert.equal(getLessonAvailability(followingLesson.id, []), 'locked');
  }

  assert.equal(isLearnCourseCheckpoint(0), false);
  assert.equal(isLearnCourseCheckpoint(4), false);
  assert.equal(isLearnCourseCheckpoint(5), true);
});

test('saved progress ignores unknown ids and malformed data', () => {
  assert.deepEqual(parseCompletedLessonIds(JSON.stringify([
    LEARN_COURSE[2].id,
    'not-a-lesson',
    LEARN_COURSE[0].id,
  ])), [LEARN_COURSE[0].id, LEARN_COURSE[2].id]);
  assert.deepEqual(parseCompletedLessonIds('{bad json'), []);
  assert.deepEqual(parseCompletedLessonIds(JSON.stringify({ completed: [] })), []);
  assert.deepEqual(parseSkippedLessonIds(JSON.stringify([LEARN_COURSE[1].id, 'unknown'])), [LEARN_COURSE[1].id]);
  assert.deepEqual(parseSkippedLessonIds('{bad json'), []);
});

test('course progress includes skipped lessons without changing completed IDs', () => {
  assert.equal(lessonProgressPercent([LEARN_COURSE[0].id], [LEARN_COURSE[1].id]), Math.round(200 / LEARN_COURSE.length));
  assert.equal(lessonProgressPercent([LEARN_COURSE[0].id], [LEARN_COURSE[0].id]), Math.round(100 / LEARN_COURSE.length));
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

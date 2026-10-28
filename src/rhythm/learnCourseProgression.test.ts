import assert from 'node:assert/strict';
import test from 'node:test';
import { LEARN_COURSE } from '@/rhythm/learnCourse';
import {
  evaluateLearnLessonOutcome,
  getCheckpointUnlockedLessonIds,
} from '@/rhythm/learnCourseProgression';
import type { LearnLessonRating } from '@/rhythm/learnRating';

const emptyProgress = {
  completedLessonIds: [] as string[],
  skippedLessonIds: [] as string[],
  lessonRatings: [] as LearnLessonRating[],
};

test('a directly played checkpoint records a failed attempt but requires five stars to pass', () => {
  const checkpoint = LEARN_COURSE[4];
  const outcome = evaluateLearnLessonOutcome({
    ...emptyProgress,
    lessonId: checkpoint.id,
    accuracy: 94,
  });

  assert.equal(outcome.isCheckpointChallenge, true);
  assert.equal(outcome.checkpointPassed, false);
  assert.equal(outcome.lessonCompleted, false);
  assert.deepEqual(outcome.completedLessonIds, []);
  assert.deepEqual(outcome.checkpointUnlockedLessonIds, []);
  assert.equal(outcome.lessonRating?.bestAccuracy, 94);
});

test('five stars on lesson five unlock earlier lessons without marking them complete', () => {
  const checkpoint = LEARN_COURSE[4];
  const outcome = evaluateLearnLessonOutcome({
    ...emptyProgress,
    lessonId: checkpoint.id,
    accuracy: 95,
  });

  assert.equal(outcome.isCheckpointChallenge, true);
  assert.equal(outcome.checkpointPassed, true);
  assert.equal(outcome.lessonCompleted, true);
  assert.deepEqual(outcome.completedLessonIds, [checkpoint.id]);
  assert.deepEqual(outcome.checkpointUnlockedLessonIds, LEARN_COURSE.slice(0, 4).map((lesson) => lesson.id));
});

test('five stars on a later checkpoint unlock all lessons before that checkpoint', () => {
  const checkpoint = LEARN_COURSE[9];
  const outcome = evaluateLearnLessonOutcome({
    ...emptyProgress,
    lessonId: checkpoint.id,
    accuracy: 100,
  });

  assert.equal(outcome.checkpointPassed, true);
  assert.deepEqual(outcome.checkpointUnlockedLessonIds, LEARN_COURSE.slice(0, 9).map((lesson) => lesson.id));
  assert.deepEqual(outcome.completedLessonIds, [checkpoint.id]);
});

test('a checkpoint unlocked by a later five-star result can be played normally', () => {
  const laterCheckpointRating = {
    lessonId: LEARN_COURSE[9].id,
    lastAccuracy: 96,
    bestAccuracy: 96,
    attempts: 1,
  } satisfies LearnLessonRating;
  const checkpoint = LEARN_COURSE[4];
  const outcome = evaluateLearnLessonOutcome({
    ...emptyProgress,
    lessonRatings: [laterCheckpointRating],
    lessonId: checkpoint.id,
    accuracy: 60,
  });

  assert.equal(outcome.isCheckpointChallenge, false);
  assert.equal(outcome.lessonCompleted, true);
  assert.deepEqual(outcome.completedLessonIds, [checkpoint.id]);
});

test('five stars on a regular lesson do not unlock the course', () => {
  const outcome = evaluateLearnLessonOutcome({
    ...emptyProgress,
    lessonId: LEARN_COURSE[0].id,
    accuracy: 100,
  });

  assert.equal(outcome.isCheckpointChallenge, false);
  assert.deepEqual(getCheckpointUnlockedLessonIds(outcome.lessonRatings), []);
});

test('reaching a checkpoint through normal progression does not require five stars', () => {
  const completedLessonIds = LEARN_COURSE.slice(0, 4).map((lesson) => lesson.id);
  const outcome = evaluateLearnLessonOutcome({
    completedLessonIds,
    skippedLessonIds: [],
    lessonRatings: [],
    lessonId: LEARN_COURSE[4].id,
    accuracy: 70,
  });

  assert.equal(outcome.isCheckpointChallenge, false);
  assert.equal(outcome.lessonCompleted, true);
  assert.deepEqual(outcome.checkpointUnlockedLessonIds, []);
});

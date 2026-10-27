import assert from 'node:assert/strict';
import test from 'node:test';
import { LEARN_COURSE } from './learnCourse';
import { evaluateLearnCourseSkipGate, getLessonsToSkipBeforeTarget } from './learnCourseSkip';

const targetLessonId = LEARN_COURSE[6].id;
const firstLessonId = LEARN_COURSE[0].id;

test('paid learner can skip locked lessons after an 80 percent course average', () => {
  const gate = evaluateLearnCourseSkipGate({
    targetLessonId,
    hasFullCourseUnlock: true,
    completedLessonIds: [firstLessonId],
    skippedLessonIds: [],
    lessonRatings: [{ lessonId: firstLessonId, lastAccuracy: 82, bestAccuracy: 82, attempts: 1 }],
  });

  assert.equal(gate.canSkip, true);
  assert.equal(gate.averageBestAccuracy, 82);
  assert.deepEqual(gate.lessonsToSkip, LEARN_COURSE.slice(1, 6).map((lesson) => lesson.id));
});

test('a five-star lesson also qualifies even when the course average is below 80 percent', () => {
  const gate = evaluateLearnCourseSkipGate({
    targetLessonId,
    hasFullCourseUnlock: true,
    completedLessonIds: LEARN_COURSE.slice(0, 2).map((lesson) => lesson.id),
    skippedLessonIds: [],
    lessonRatings: [
      { lessonId: LEARN_COURSE[0].id, lastAccuracy: 100, bestAccuracy: 100, attempts: 1 },
      { lessonId: LEARN_COURSE[1].id, lastAccuracy: 40, bestAccuracy: 40, attempts: 1 },
    ],
  });

  assert.equal(gate.averageBestAccuracy, 70);
  assert.equal(gate.hasFiveStarLesson, true);
  assert.equal(gate.canSkip, true);
});

test('free access and scores below both thresholds cannot skip locked lessons', () => {
  const args = {
    targetLessonId,
    completedLessonIds: [firstLessonId],
    skippedLessonIds: [],
    lessonRatings: [{ lessonId: firstLessonId, lastAccuracy: 79, bestAccuracy: 79, attempts: 1 }],
  };

  assert.equal(evaluateLearnCourseSkipGate({ ...args, hasFullCourseUnlock: false }).canSkip, false);
  assert.equal(evaluateLearnCourseSkipGate({ ...args, hasFullCourseUnlock: true }).canSkip, false);
});

test('skipped lessons do not count toward the course accuracy gate', () => {
  const gate = evaluateLearnCourseSkipGate({
    targetLessonId,
    hasFullCourseUnlock: true,
    completedLessonIds: LEARN_COURSE.slice(0, 2).map((lesson) => lesson.id),
    skippedLessonIds: [LEARN_COURSE[0].id],
    lessonRatings: [
      { lessonId: LEARN_COURSE[0].id, lastAccuracy: 100, bestAccuracy: 100, attempts: 1 },
      { lessonId: LEARN_COURSE[1].id, lastAccuracy: 78, bestAccuracy: 78, attempts: 1 },
    ],
  });

  assert.equal(gate.completedScoreCount, 1);
  assert.equal(gate.averageBestAccuracy, 78);
  assert.equal(gate.hasFiveStarLesson, false);
  assert.equal(gate.canSkip, false);
});

test('course skips are available only for a locked, not-yet-completed target', () => {
  const gate = evaluateLearnCourseSkipGate({
    targetLessonId: firstLessonId,
    hasFullCourseUnlock: true,
    completedLessonIds: [],
    skippedLessonIds: [],
    lessonRatings: [{ lessonId: firstLessonId, lastAccuracy: 100, bestAccuracy: 100, attempts: 1 }],
  });

  assert.equal(gate.canSkip, false);
  assert.deepEqual(getLessonsToSkipBeforeTarget('unknown', []), []);
});

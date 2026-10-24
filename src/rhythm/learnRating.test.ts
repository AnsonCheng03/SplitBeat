/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LEARN_COURSE } from '@/rhythm/learnCourse';
import {
  parseLearnLessonRatings,
  starsForAccuracy,
  totalLearnStars,
  updateLearnLessonRating,
} from '@/rhythm/learnRating';

test('lesson accuracy maps to five consistent star thresholds', () => {
  assert.deepEqual(
    [0, 49, 50, 69, 70, 84, 85, 94, 95, 100].map(starsForAccuracy),
    [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
  );
  assert.equal(starsForAccuracy(94.6), 5);
});

test('lesson rating keeps the best score and counts each new attempt', () => {
  const lessonId = LEARN_COURSE[0].id;
  const first = updateLearnLessonRating([], lessonId, 72.35);
  const second = updateLearnLessonRating(first, lessonId, 61);
  const third = updateLearnLessonRating(second, LEARN_COURSE[1].id, 96);

  assert.deepEqual(first, [{ lessonId, lastAccuracy: 72.4, bestAccuracy: 72.4, attempts: 1 }]);
  assert.deepEqual(second[0], { lessonId, lastAccuracy: 61, bestAccuracy: 72.4, attempts: 2 });
  assert.deepEqual(third.map((rating) => rating.lessonId), [LEARN_COURSE[0].id, LEARN_COURSE[1].id]);
  assert.equal(totalLearnStars(third), 8);
  assert.deepEqual(updateLearnLessonRating(third, 'not-a-lesson', 90), third);
});

test('saved lesson ratings ignore malformed and unknown entries', () => {
  const parsed = parseLearnLessonRatings(JSON.stringify([
    { lessonId: LEARN_COURSE[1].id, lastAccuracy: 96, bestAccuracy: 96, attempts: 2 },
    { lessonId: 'unknown', lastAccuracy: 100, bestAccuracy: 100, attempts: 1 },
    { lessonId: LEARN_COURSE[0].id, lastAccuracy: 110, bestAccuracy: 80, attempts: 1 },
    { lessonId: LEARN_COURSE[2].id, lastAccuracy: 'bad', bestAccuracy: 80, attempts: 1 },
  ]));

  assert.deepEqual(parsed, [
    { lessonId: LEARN_COURSE[0].id, lastAccuracy: 100, bestAccuracy: 100, attempts: 1 },
    { lessonId: LEARN_COURSE[1].id, lastAccuracy: 96, bestAccuracy: 96, attempts: 2 },
  ]);
  assert.deepEqual(parseLearnLessonRatings('{bad json'), []);
  assert.deepEqual(parseLearnLessonRatings(null), []);
});

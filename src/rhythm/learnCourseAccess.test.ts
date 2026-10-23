/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FREE_LEARN_LESSON_COUNT, requiresLearnCourseUnlock } from '@/rhythm/learnCourseAccess';

test('first three Learn lessons are free and later lessons use a one-time course unlock', () => {
  assert.equal(FREE_LEARN_LESSON_COUNT, 3);
  assert.equal(requiresLearnCourseUnlock({ number: 1 }, false), false);
  assert.equal(requiresLearnCourseUnlock({ number: 3 }, false), false);
  assert.equal(requiresLearnCourseUnlock({ number: 4 }, false), true);
  assert.equal(requiresLearnCourseUnlock({ number: 12 }, false), true);
  assert.equal(requiresLearnCourseUnlock({ number: 12 }, true), false);
});

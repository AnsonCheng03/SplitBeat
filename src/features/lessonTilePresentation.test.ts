import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getLearnLessonAccessibilityStatusKeys,
  getLearnLessonTileBadge,
} from './learn/lessonTilePresentation';

test('checkpoint tiles are labeled as a direct five-star test', () => {
  const status = {
    skipped: false,
    completed: false,
    paywalled: false,
    isCheckpoint: true,
    checkpointChallenge: true,
    unlockedByCheckpoint: false,
    locked: false,
  };

  assert.equal(getLearnLessonTileBadge(status), 'TEST');
  assert.deepEqual(getLearnLessonAccessibilityStatusKeys(status), [
    ', checkpoint lesson, play to test for five stars',
  ]);
});

test('paid checkpoint labels explain both the purchase and checkpoint requirements', () => {
  const status = {
    skipped: false,
    completed: false,
    paywalled: true,
    isCheckpoint: true,
    checkpointChallenge: true,
    unlockedByCheckpoint: false,
    locked: false,
  };

  assert.equal(getLearnLessonTileBadge(status), 'PRO');
  assert.deepEqual(getLearnLessonAccessibilityStatusKeys(status), [
    ', paid course, tap to unlock',
    ', checkpoint lesson, play to test for five stars',
  ]);
});

test('checkpoint-unlocked lessons show as open while completed and skipped status stays distinct', () => {
  const unlocked = {
    skipped: false,
    completed: false,
    paywalled: false,
    isCheckpoint: true,
    checkpointChallenge: false,
    unlockedByCheckpoint: true,
    locked: false,
  };
  assert.equal(getLearnLessonTileBadge(unlocked), 'OPEN');
  assert.deepEqual(getLearnLessonAccessibilityStatusKeys(unlocked), [', unlocked by a five-star checkpoint']);
  assert.equal(getLearnLessonTileBadge({ ...unlocked, isCheckpoint: true }), 'OPEN');
  assert.deepEqual(getLearnLessonAccessibilityStatusKeys({ ...unlocked, isCheckpoint: true }), [
    ', unlocked by a five-star checkpoint',
  ]);

  assert.equal(getLearnLessonTileBadge({ ...unlocked, completed: true }), '✓');
  assert.equal(getLearnLessonTileBadge({ ...unlocked, skipped: true }), '↪');
});

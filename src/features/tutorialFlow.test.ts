import assert from 'node:assert/strict';
import test from 'node:test';
import {
  APP_TUTORIAL_STEPS,
  isLastTutorialStep,
  nextTutorialStepIndex,
  previousTutorialStepIndex,
} from './tutorial/tutorialFlow';

test('tutorial advances through every step and stays within its bounds', () => {
  assert.equal(APP_TUTORIAL_STEPS.length, 4);
  assert.equal(previousTutorialStepIndex(0), 0);
  assert.equal(nextTutorialStepIndex(0), 1);
  assert.equal(nextTutorialStepIndex(APP_TUTORIAL_STEPS.length - 1), APP_TUTORIAL_STEPS.length - 1);
  assert.equal(isLastTutorialStep(APP_TUTORIAL_STEPS.length - 1), true);
  assert.equal(isLastTutorialStep(0), false);
});

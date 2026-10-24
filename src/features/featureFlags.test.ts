import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ExerciseSettings } from '@/types/rhythm';
import {
  applyFeatureFlagsToPatternPairs,
  applyFeatureFlagsToSettings,
  DEFAULT_FEATURE_FLAGS,
  FEATURE_GROUPS,
  parseFeatureFlags,
} from './featureFlags';

const settings: ExerciseSettings = {
  bpm: 60,
  timeSignature: '6/8',
  durationSeconds: 60,
  changeIntervalBeats: 4,
  restBetweenChanges: true,
  handRestsEnabled: true,
  enabledSubdivisions: ['quarter', 'eighth', 'triplet'],
  enabledMixtures: ['dottedQuaverSemiquaver'],
  mixtureNoteValues: ['dottedEighth', 'sixteenth'],
  mixtureRestsEnabled: true,
  feel: 'swing',
  graceNotesEnabled: true,
  trainingMode: 'single-hand',
  practiceDisplayMode: 'score',
  singleHand: 'left',
  soundEnabled: true,
  backgroundMusicEnabled: true,
  sessionCuesEnabled: true,
  metronomeSound: 'wood',
  leftHandSound: 'soft',
  rightHandSound: 'beep',
  leftFlashSource: 'tap',
  rightFlashSource: 'beat',
  tapResultFlashEnabled: true,
  referenceRhythmEnabled: true,
  challengeAction: 'pause',
  challengeTriggerMode: 'notes',
  challengeMissStreak: 3,
  challengeWrongBarStreak: 2,
  leftTapOffsetMs: 0,
  rightTapOffsetMs: 0,
  goodWindowMs: 100,
  hapticsEnabled: true,
};

test('feature list defaults every listed feature to enabled', () => {
  const featureIds = FEATURE_GROUPS.flatMap((group) => group.features.map((feature) => feature.id));
  assert.equal(featureIds.length, Object.keys(DEFAULT_FEATURE_FLAGS).length);
  assert.ok(featureIds.every((id) => DEFAULT_FEATURE_FLAGS[id]));
});

test('feature flag persistence restores explicit values and defaults missing or malformed values to enabled', () => {
  assert.deepEqual(parseFeatureFlags(null), DEFAULT_FEATURE_FLAGS);
  assert.deepEqual(parseFeatureFlags('{broken'), DEFAULT_FEATURE_FLAGS);
  assert.equal(parseFeatureFlags('{"gameCenter":false}').gameCenter, false);
  assert.equal(parseFeatureFlags('{"gameCenter":false}').backgroundMusic, true);
});

test('disabled feature groups are removed from effective session settings', () => {
  const flags = {
    ...DEFAULT_FEATURE_FLAGS,
    oneHandMode: false,
    scoreNotation: false,
    rhythmExtensions: false,
    mixtures: false,
    restsAndGrace: false,
    soundEffects: false,
    backgroundMusic: false,
    sessionCues: false,
    shownRhythmPlayback: false,
    tapHaptics: false,
    tapFeedback: false,
    challengeMode: false,
  };
  const result = applyFeatureFlagsToSettings(settings, flags);
  assert.equal(result.trainingMode, 'two-hand');
  assert.equal(result.practiceDisplayMode, 'rhythm');
  assert.equal(result.timeSignature, '4/4');
  assert.equal(result.feel, 'straight');
  assert.deepEqual(result.enabledSubdivisions, ['quarter', 'eighth']);
  assert.deepEqual(result.enabledMixtures, []);
  assert.deepEqual(result.mixtureNoteValues, []);
  assert.equal(result.mixtureRestsEnabled, false);
  assert.equal(result.restBetweenChanges, false);
  assert.equal(result.handRestsEnabled, false);
  assert.equal(result.graceNotesEnabled, false);
  assert.equal(result.soundEnabled, false);
  assert.equal(result.backgroundMusicEnabled, false);
  assert.equal(result.sessionCuesEnabled, false);
  assert.equal(result.referenceRhythmEnabled, false);
  assert.equal(result.tapResultFlashEnabled, false);
  assert.equal(result.hapticsEnabled, false);
  assert.equal(result.challengeAction, 'off');
});

test('disabled rhythm extensions, mixtures, and rests also constrain explicitly prepared pairs', () => {
  const pairs = applyFeatureFlagsToPatternPairs([
    {
      leftSubdivision: 'thirtySecond',
      rightSubdivision: 'quarter',
      leftRest: true,
      rightMixture: 'dottedQuaverSemiquaver',
    },
  ], {
    ...DEFAULT_FEATURE_FLAGS,
    rhythmExtensions: false,
    mixtures: false,
    restsAndGrace: false,
  }, ['quarter', 'eighth']);

  assert.deepEqual(pairs, [{
    leftSubdivision: 'quarter',
    rightSubdivision: 'quarter',
    leftRest: false,
    rightMixture: undefined,
    rightRest: false,
    leftMixture: undefined,
  }]);
});

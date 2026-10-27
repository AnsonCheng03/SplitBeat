import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ExerciseSettings } from '@/types/rhythm';
import {
  applyFeatureFlagsToPatternPairs,
  applyFeatureFlagsToSettings,
  BUILD_FEATURE_FLAGS,
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAG_IDS,
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
  autoCalibrationEnabled: true,
  goodWindowMs: 100,
  hapticsEnabled: true,
};

test('build feature defaults enable every defined flag except optional 64th notes', () => {
  assert.equal(FEATURE_FLAG_IDS.length, Object.keys(DEFAULT_FEATURE_FLAGS).length);
  assert.ok(FEATURE_FLAG_IDS.every((id) => id === 'sixtyFourthNotes' ? !DEFAULT_FEATURE_FLAGS[id] : DEFAULT_FEATURE_FLAGS[id]));
});

test('build feature environment overrides explicit flags and defaults unspecified flags safely', () => {
  assert.deepEqual(parseFeatureFlags(null), DEFAULT_FEATURE_FLAGS);
  assert.deepEqual(parseFeatureFlags(undefined), DEFAULT_FEATURE_FLAGS);
  assert.deepEqual(parseFeatureFlags('{broken'), DEFAULT_FEATURE_FLAGS);
  assert.equal(parseFeatureFlags('{"gameCenter":false}').gameCenter, false);
  assert.equal(parseFeatureFlags('{"gameCenter":false}').backgroundMusic, true);
  assert.equal(parseFeatureFlags('{"gameCenter":"false"}').gameCenter, true);
  assert.equal(parseFeatureFlags('{"sixtyFourthNotes":true}').sixtyFourthNotes, true);
  assert.equal(parseFeatureFlags('{"sixtyFourthNotes":false}').sixtyFourthNotes, false);
  assert.deepEqual(BUILD_FEATURE_FLAGS, parseFeatureFlags(process.env.EXPO_PUBLIC_FEATURE_FLAGS));
});

test('64th-note selection is off by default and can be enabled by the build flag', () => {
  const fastSettings = {
    ...settings,
    enabledSubdivisions: ['quarter', 'thirtySecond', 'sixtyFourth'],
    mixtureNoteValues: ['thirtySecond', 'sixtyFourth'],
  } as ExerciseSettings;
  const limited = applyFeatureFlagsToSettings(fastSettings, DEFAULT_FEATURE_FLAGS);
  assert.deepEqual(limited.enabledSubdivisions, ['quarter', 'thirtySecond']);
  assert.deepEqual(limited.mixtureNoteValues, ['thirtySecond']);

  const enabledFlags = { ...DEFAULT_FEATURE_FLAGS, sixtyFourthNotes: true };
  const enabled = applyFeatureFlagsToSettings(fastSettings, enabledFlags);
  assert.deepEqual(enabled.enabledSubdivisions, ['quarter', 'thirtySecond', 'sixtyFourth']);
  assert.deepEqual(enabled.mixtureNoteValues, ['thirtySecond', 'sixtyFourth']);

  assert.deepEqual(applyFeatureFlagsToPatternPairs([
    { leftSubdivision: 'sixtyFourth', rightSubdivision: 'thirtySecond', leftMixture: 'mix1-n4-n8' },
  ], DEFAULT_FEATURE_FLAGS, limited.enabledSubdivisions), [
    { leftSubdivision: 'quarter', rightSubdivision: 'thirtySecond', leftMixture: undefined, rightMixture: undefined, leftRest: undefined, rightRest: undefined },
  ]);
  assert.equal(applyFeatureFlagsToPatternPairs([
    { leftSubdivision: 'sixtyFourth', rightSubdivision: 'thirtySecond', leftMixture: 'mix1-n4-n8' },
  ], enabledFlags, enabled.enabledSubdivisions)?.[0].leftSubdivision, 'sixtyFourth');
  assert.equal(applyFeatureFlagsToPatternPairs([
    { leftSubdivision: 'quarter', rightSubdivision: 'quarter', leftMixture: 'mix1-n4-n8' },
  ], enabledFlags, enabled.enabledSubdivisions)?.[0].leftMixture, 'mix1-n4-n8');
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

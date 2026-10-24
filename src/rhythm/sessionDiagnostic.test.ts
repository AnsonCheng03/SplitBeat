import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionDiagnosticLog } from '@/rhythm/sessionDiagnostic';
import { DEFAULT_FEATURE_FLAGS } from '@/features/featureFlags';
import type { ExerciseSettings, SessionResults } from '@/types/rhythm';

test('diagnostic export includes settings, live changes, expected notes and recorded input', () => {
  const settings = { bpm: 80 } as ExerciseSettings;
  const results = {
    bpm: 60,
    timeSignature: '4/4',
    feel: 'straight',
    goodWindowMs: 100,
    graceNotesEnabled: false,
    restBetweenChanges: false,
    trainingMode: 'two-hand',
    singleHand: 'left',
    left: { totalExpected: 1, totalHit: 1, perfect: 1, great: 0, good: 0, miss: 0, averageAbsoluteErrorMs: 0, averageSignedErrorMs: 0 },
    right: { totalExpected: 0, totalHit: 0, perfect: 0, great: 0, good: 0, miss: 0, averageAbsoluteErrorMs: 0, averageSignedErrorMs: 0 },
    stable: { totalExpected: 1, totalHit: 1 },
    transition: { totalExpected: 0, totalHit: 0 },
    longestCorrectStreak: 1,
    challengeMode: false,
    combinations: [],
    durationSeconds: 4,
    missedEvents: [],
    initialSettings: { bpm: 60 } as ExerciseSettings,
    settingChanges: [{ elapsedMs: 2_000, changes: { leftTapOffsetMs: 12 } }],
    replayExpectedEvents: [{
      id: 'expected-1',
      hand: 'left',
      barIndex: 2,
      beatInBar: 0.5,
      durationQuarter: 1,
      isScoreEvent: false,
      expectedTimeMs: 900_000,
      matched: true,
      reached: true,
      timingErrorMs: 0,
      pattern: { leftSubdivision: 'quarter', rightSubdivision: 'eighth', leftRest: false, rightRest: false },
    }],
    replayTaps: [{
      id: 'tap-1',
      hand: 'left',
      inputSource: 'keyboard',
      barIndex: 2,
      timestampMs: 4_500,
      matchedEventId: 'expected-1',
      timingErrorMs: 0,
    }],
  } as unknown as SessionResults;

  const log = createSessionDiagnosticLog(results, settings, {
    exportedAt: '2026-10-25T00:00:00.000Z',
    appVersion: '1.0.0',
    buildNumber: '13',
    platform: 'ios',
    operatingSystemVersion: '27.0',
    locale: 'en',
    featureFlags: DEFAULT_FEATURE_FLAGS,
  });

  assert.equal(log.settings.atStart?.bpm, 60);
  assert.equal(log.settings.atExport.bpm, 80);
  assert.equal(log.settings.changesDuringSession[0]?.elapsedMs, 2_000);
  assert.equal(log.userInput.taps[0]?.inputSource, 'keyboard');
  assert.equal(log.systemGenerated.expectedEvents[0]?.expectedElapsedMs, 4_500);
  assert.equal(log.systemGenerated.expectedEvents[0]?.expectedMonotonicTimestampMs, 900_000);
});

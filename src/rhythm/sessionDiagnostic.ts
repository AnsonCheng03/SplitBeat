import { timeSignatureMetrics } from '@/rhythm/subdivisions';
import type { FeatureFlags } from '@/features/featureFlags';
import type { ExerciseSettings, SessionResults } from '@/types/rhythm';

export interface SessionDiagnosticContext {
  exportedAt: string;
  appVersion: string;
  buildNumber: string;
  platform: string;
  operatingSystemVersion: string;
  locale: string;
  featureFlags: FeatureFlags;
  courseLesson?: {
    id: string;
    title: string;
  };
}

export function createSessionDiagnosticLog(
  results: SessionResults,
  finalSettings: ExerciseSettings,
  context: SessionDiagnosticContext,
) {
  const { beatDurationMs, beatsPerBar } = timeSignatureMetrics(results.bpm, results.timeSignature);
  const expectedEvents = (results.replayExpectedEvents ?? []).map((event) => {
    const { expectedTimeMs, ...eventDetails } = event;
    const expectedElapsedMs = (event.barIndex - 1) * beatsPerBar * beatDurationMs
      + event.beatInBar * beatDurationMs;
    return {
      ...eventDetails,
      expectedElapsedMs,
      expectedMonotonicTimestampMs: expectedTimeMs,
    };
  });

  return {
    logType: 'split-beat-session-diagnostic',
    schemaVersion: 1,
    exportedAt: context.exportedAt,
    application: {
      name: 'Beep Beep Beat - Rhythm Coach',
      version: context.appVersion,
      buildNumber: context.buildNumber,
      platform: context.platform,
      operatingSystemVersion: context.operatingSystemVersion,
      locale: context.locale,
    },
    session: {
      source: results.source ?? 'free-practice',
      scoreTitle: results.scoreTitle ?? null,
      courseLesson: context.courseLesson ?? null,
      bpm: results.bpm,
      timeSignature: results.timeSignature,
      feel: results.feel,
      durationSeconds: results.durationSeconds,
      trainingMode: results.trainingMode,
      singleHand: results.trainingMode === 'single-hand' ? results.singleHand : null,
      challengeMode: results.challengeMode,
      longestCorrectStreak: results.longestCorrectStreak,
      clock: {
        expectedElapsedMs: 'Time relative to the first exercise beat.',
        expectedMonotonicTimestampMs: 'Raw performance clock timestamp; only meaningful within this app process.',
        tapTimestampMs: 'Time relative to the first exercise beat.',
      },
    },
    settings: {
      atStart: results.initialSettings ?? finalSettings,
      atExport: finalSettings,
      changesDuringSession: results.settingChanges ?? [],
    },
    featureFlags: context.featureFlags,
    userInput: {
      tapCount: results.replayTaps?.length ?? 0,
      taps: results.replayTaps ?? [],
    },
    systemGenerated: {
      expectedEventCount: expectedEvents.length,
      expectedEvents,
      missedEvents: results.missedEvents,
      combinationStatistics: results.combinations,
    },
    evaluation: {
      left: results.left,
      right: results.right,
      stable: results.stable,
      transition: results.transition,
      timingWindowMs: results.goodWindowMs ?? null,
      graceNotesEnabled: results.graceNotesEnabled,
      restBetweenChanges: results.restBetweenChanges,
    },
  };
}

import { TUTORIAL_BAR_HANDS, TUTORIAL_BAR_MEASURE } from '@/features/tutorial/tutorialFlow';
import type { ExerciseStep, Hand, HandStats, SessionSnapshot } from '@/types/rhythm';

const EMPTY_HAND_STATS: HandStats = {
  totalExpected: 0,
  totalHit: 0,
  perfect: 0,
  great: 0,
  good: 0,
  miss: 0,
  averageAbsoluteErrorMs: 0,
  averageSignedErrorMs: 0,
};

function stepForBeat(beatIndex: number): ExerciseStep {
  const activeHand: Hand = TUTORIAL_BAR_HANDS[beatIndex] ?? TUTORIAL_BAR_HANDS[0];
  return {
    id: `tutorial-beat-${beatIndex + 1}`,
    leftSubdivision: 'quarter',
    rightSubdivision: 'quarter',
    leftRest: activeHand !== 'left',
    rightRest: activeHand !== 'right',
    startBeat: beatIndex,
    durationBeats: 1,
  };
}

export function createTutorialPracticeSnapshot(beatIndex: number): SessionSnapshot {
  const currentBeat = Math.max(0, Math.min(TUTORIAL_BAR_HANDS.length - 1, beatIndex));
  const barSteps = TUTORIAL_BAR_HANDS.map((_, index) => stepForBeat(index));
  const nextBeat = (currentBeat + 1) % barSteps.length;

  return {
    phase: 'running',
    bpm: 60,
    timeSignature: '4/4',
    beatsPerBar: 4,
    beatIndex: currentBeat,
    beatInBar: currentBeat,
    counterBeatsPerBar: 4,
    counterBeatInBar: currentBeat,
    isRest: false,
    currentStep: barSteps[currentBeat],
    barStartBeat: 0,
    barSteps,
    nextStep: barSteps[nextBeat],
    beatsUntilChange: 1,
    secondsUntilChange: 1,
    secondsRemaining: null,
    leftAccuracy: 0,
    rightAccuracy: 0,
    leftStats: EMPTY_HAND_STATS,
    rightStats: EMPTY_HAND_STATS,
    countdown: null,
    practiceScoreMeasure: TUTORIAL_BAR_MEASURE,
    practiceScorePreviousMeasure: TUTORIAL_BAR_MEASURE,
    practiceScoreNextMeasure: TUTORIAL_BAR_MEASURE,
    practiceScoreUpcomingMeasures: [TUTORIAL_BAR_MEASURE],
    practiceScoreSequence: 0,
    practiceScoreCount: 1,
    practiceScoreQuarterInMeasure: currentBeat,
  };
}

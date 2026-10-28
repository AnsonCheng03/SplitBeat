import type { Hand, PracticeDisplayMode } from '@/types/rhythm';

export const APP_TUTORIAL_STEPS = [
  {
    title: 'Choose your practice mode',
    description: 'Choose what to do in Practice Mode: play freely, review rhythms, follow a course, or use a score.',
  },
  {
    title: 'Choose your hands and notation',
    description: 'One hand uses the full screen; two hands use separate left and right sides. Rhythm symbols show note values; Score notes lay them out across a bar when available.',
  },
  {
    title: 'Set your pace and start',
    description: 'Settings lets you choose a tempo and end practice by time or bars. Tap the main button to start; some modes open one more setup step first.',
  },
  {
    title: 'Play, pause, and review',
    description: 'In one-hand mode, tap anywhere; with two hands, tap the matching half in time with the notes. Pause whenever you need a break, then review your results when you finish.',
  },
] as const;

export function isLastTutorialStep(stepIndex: number): boolean {
  return stepIndex >= APP_TUTORIAL_STEPS.length - 1;
}

export function nextTutorialStepIndex(stepIndex: number): number {
  return Math.min(APP_TUTORIAL_STEPS.length - 1, stepIndex + 1);
}

export function previousTutorialStepIndex(stepIndex: number): number {
  return Math.max(0, stepIndex - 1);
}

export const TUTORIAL_BAR_HANDS: readonly Hand[] = ['left', 'right', 'left', 'right'];

export interface TutorialModeStep {
  displayMode: PracticeDisplayMode;
  title: string;
  description: string;
}

export const TUTORIAL_MODE_STEPS: readonly TutorialModeStep[] = [
  {
    displayMode: 'rhythm',
    title: 'NOTE VIEW',
    description: 'Tap the hand shown by each note. The bar waits after each tap while you read the next hint.',
  },
  {
    displayMode: 'score',
    title: 'BAR VIEW',
    description: 'Read the full bar from left to right, then tap the hand for each beat.',
  },
];

export type TutorialPhase = 'practice' | 'mode-intro' | 'complete';

export interface TutorialTapTransition {
  correct: boolean;
  nextBeatIndex: number;
  nextPhase: TutorialPhase;
  nextModeIndex: number;
}

export function resolveTutorialTap(
  modeIndex: number,
  beatIndex: number,
  tappedHand: Hand,
): TutorialTapTransition {
  const expectedHand = TUTORIAL_BAR_HANDS[beatIndex];
  if (!expectedHand || tappedHand !== expectedHand) {
    return {
      correct: false,
      nextBeatIndex: 0,
      nextPhase: 'practice',
      nextModeIndex: modeIndex,
    };
  }

  if (beatIndex < TUTORIAL_BAR_HANDS.length - 1) {
    return {
      correct: true,
      nextBeatIndex: beatIndex + 1,
      nextPhase: 'practice',
      nextModeIndex: modeIndex,
    };
  }

  if (modeIndex === 0) {
    return {
      correct: true,
      nextBeatIndex: 0,
      nextPhase: 'mode-intro',
      nextModeIndex: 1,
    };
  }

  return {
    correct: true,
    nextBeatIndex: 0,
    nextPhase: 'complete',
    nextModeIndex: modeIndex,
  };
}

export function getExpectedTutorialHand(beatIndex: number): Hand {
  return TUTORIAL_BAR_HANDS[beatIndex] ?? TUTORIAL_BAR_HANDS[0];
}

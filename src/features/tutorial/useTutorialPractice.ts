import { useCallback, useState } from 'react';
import type { Hand } from '@/types/rhythm';
import { getExpectedTutorialHand, resolveTutorialTap, TUTORIAL_MODE_STEPS, type TutorialPhase } from '@/features/tutorial/tutorialFlow';

type TutorialFeedback = 'correct' | 'retry' | null;

export function useTutorialPractice() {
  const [phase, setPhase] = useState<TutorialPhase>('practice');
  const [modeIndex, setModeIndex] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [feedback, setFeedback] = useState<TutorialFeedback>(null);

  const mode = TUTORIAL_MODE_STEPS[modeIndex];
  const expectedHand = getExpectedTutorialHand(beatIndex);

  const tapHand = useCallback((hand: Hand) => {
    if (phase !== 'practice') return;
    const transition = resolveTutorialTap(modeIndex, beatIndex, hand);
    setFeedback(transition.correct ? 'correct' : 'retry');
    setBeatIndex(transition.nextBeatIndex);
    setModeIndex(transition.nextModeIndex);
    setPhase(transition.nextPhase);
  }, [beatIndex, modeIndex, phase]);

  const startBarView = useCallback(() => {
    setFeedback(null);
    setBeatIndex(0);
    setPhase('practice');
  }, []);

  const resetTutorial = useCallback(() => {
    setPhase('practice');
    setModeIndex(0);
    setBeatIndex(0);
    setFeedback(null);
  }, []);

  return {
    phase,
    mode,
    modeIndex,
    beatIndex,
    expectedHand,
    feedback,
    tapHand,
    startBarView,
    resetTutorial,
  };
}

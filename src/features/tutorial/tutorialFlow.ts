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
    description: 'Settings has tempo and session length. Tap the main button to start; some modes open one more setup step first.',
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

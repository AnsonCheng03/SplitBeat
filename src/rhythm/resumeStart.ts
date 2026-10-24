import { patternLabelForHand } from '@/rhythm/mixtures';
import type { ExerciseStep, Hand } from '@/types/rhythm';
import type { ScoreRhythmEvent } from '@/types/importedScore';

export interface ResumeStartNote {
  hand: Hand;
  label: string;
}

const TUPLET_LABELS: Record<number, string> = {
  2: 'Duplet (2)',
  3: 'Triplet (3)',
  4: 'Quadruplet (4)',
  5: 'Quintuplet (5)',
  6: 'Sextuplet (6)',
  7: 'Septuplet (7)',
  8: 'Octuplet (8)',
  9: 'Nonuplet (9)',
};

const NOTE_DURATION_LABELS: readonly [number, string][] = [
  [4, 'whole'],
  [3, 'dotted half'],
  [2, 'half'],
  [1.5, 'dotted quarter'],
  [1, 'Quarter (Crotchet)'],
  [0.75, 'dotted eighth'],
  [0.5, 'Quaver (Eighth)'],
  [0.375, 'dotted sixteenth'],
  [0.25, 'Semiquaver (16th)'],
  [0.125, 'Demisemiquaver (32nd)'],
  [0.0625, 'Hemidemisemiquaver (64th)'],
];

function scoreEventLabel(event: ScoreRhythmEvent | undefined): string {
  if (!event || event.isRest || event.isCrossBarTieContinuation) return 'Rest';
  if (event.tupletNumber !== undefined) return TUPLET_LABELS[event.tupletNumber] ?? 'score note';

  const duration = event.notationDurationQuarter ?? event.durationQuarter;
  const matchingDuration = NOTE_DURATION_LABELS.find(([quarterNotes]) => Math.abs(duration - quarterNotes) < 0.00001);
  return matchingDuration?.[1] ?? 'score note';
}

export function getResumeStartNotes({
  step,
  singleHand,
  focusedHand,
  scoreEvents,
}: {
  step: ExerciseStep;
  singleHand: boolean;
  focusedHand: Hand;
  scoreEvents?: Partial<Record<Hand, ScoreRhythmEvent | undefined>>;
}): ResumeStartNote[] {
  const hands: Hand[] = singleHand ? [focusedHand] : ['left', 'right'];

  return hands.map((hand) => {
    if (scoreEvents) return { hand, label: scoreEventLabel(scoreEvents[hand]) };

    return {
      hand,
      label: patternLabelForHand(
        hand === 'left' ? step.leftSubdivision : step.rightSubdivision,
        hand === 'left' ? step.leftRest : step.rightRest,
        hand === 'left' ? step.leftMixture : step.rightMixture,
      ),
    };
  });
}

import {
  isTupletSubdivision,
  SUBDIVISION_COUNTS,
  tupletCount,
} from '@/rhythm/subdivisions';
import type { ScoreRhythmEvent, ScoreRhythmMeasure } from '@/types/importedScore';
import { expandMixturePattern } from '@/rhythm/mixtures';
import type { ExerciseStep, Hand } from '@/types/rhythm';

const EPSILON = 0.000001;

export interface PracticeScoreMeasureOptions {
  barIndex: number;
  beatsPerBar: number;
  pulseQuarterNotes: number;
  changeIntervalBeats: number;
  restBetweenChanges: boolean;
  /** End of a finite session, in metronome beats. Omit for endless practice. */
  sessionEndBeat?: number;
  getStep: (stepIndex: number) => ExerciseStep;
}

/** Convert generated subdivision steps into the same pitch-free bar notation used for imported scores. */
export function createPracticeScoreMeasure({
  barIndex,
  beatsPerBar,
  pulseQuarterNotes,
  changeIntervalBeats,
  restBetweenChanges,
  sessionEndBeat,
  getStep,
}: PracticeScoreMeasureOptions): ScoreRhythmMeasure {
  const barStartBeat = barIndex * beatsPerBar;
  const barEndBeat = barStartBeat + beatsPerBar;
  const barStartQuarter = barStartBeat * pulseQuarterNotes;
  const leftEvents: ScoreRhythmEvent[] = [];
  const rightEvents: ScoreRhythmEvent[] = [];
  const firstStepIndex = Math.floor(barStartBeat / changeIntervalBeats);
  const lastRenderableBeat = Math.min(barEndBeat, sessionEndBeat ?? barEndBeat);
  const lastStepIndex = Math.floor(Math.max(barStartBeat, lastRenderableBeat - EPSILON) / changeIntervalBeats);

  for (let stepIndex = firstStepIndex; stepIndex <= lastStepIndex; stepIndex += 1) {
    const step = getStep(stepIndex);
    const stepEndBeat = step.startBeat + step.durationBeats;
    const hasFollowingStep = sessionEndBeat === undefined || stepEndBeat < sessionEndBeat - EPSILON;
    const restBeat = restBetweenChanges && hasFollowingStep
      ? stepEndBeat - 1
      : Number.NEGATIVE_INFINITY;

    appendHandEvents(leftEvents, step, 'left', {
      barStartBeat,
      barEndBeat,
      pulseQuarterNotes,
      restBeat,
      sessionEndBeat,
    });
    appendHandEvents(rightEvents, step, 'right', {
      barStartBeat,
      barEndBeat,
      pulseQuarterNotes,
      restBeat,
      sessionEndBeat,
    });
  }

  return {
    index: barIndex,
    startQuarter: barStartQuarter,
    durationQuarter: beatsPerBar * pulseQuarterNotes,
    leftEvents,
    rightEvents,
  };
}

function appendHandEvents(
  destination: ScoreRhythmEvent[],
  step: ExerciseStep,
  hand: Hand,
  options: {
    barStartBeat: number;
    barEndBeat: number;
    pulseQuarterNotes: number;
    restBeat: number;
    sessionEndBeat?: number;
  },
): void {
  if (hand === 'left' ? step.leftRest : step.rightRest) return;

  const mixtureId = hand === 'left' ? step.leftMixture : step.rightMixture;
  if (mixtureId) {
    const stepStartQuarter = step.startBeat * options.pulseQuarterNotes;
    const stepEndQuarter = (step.startBeat + step.durationBeats) * options.pulseQuarterNotes;
    const barStartQuarter = options.barStartBeat * options.pulseQuarterNotes;
    const barEndQuarter = options.barEndBeat * options.pulseQuarterNotes;
    const sessionEndQuarter = options.sessionEndBeat === undefined
      ? Number.POSITIVE_INFINITY
      : options.sessionEndBeat * options.pulseQuarterNotes;

    for (const atom of expandMixturePattern(mixtureId, stepStartQuarter, stepEndQuarter)) {
      const absoluteBeat = atom.startQuarter / options.pulseQuarterNotes;
      if (
        atom.startQuarter < barStartQuarter - EPSILON ||
        atom.startQuarter >= barEndQuarter - EPSILON ||
        atom.startQuarter >= sessionEndQuarter - EPSILON ||
        Math.floor(absoluteBeat + EPSILON) === options.restBeat
      ) continue;
      destination.push({
        startQuarter: Math.max(0, atom.startQuarter - barStartQuarter),
        durationQuarter: Math.min(atom.durationQuarter, barEndQuarter - atom.startQuarter, sessionEndQuarter - atom.startQuarter),
        ...(atom.kind === 'rest' ? { isRest: true } : {}),
      });
    }
    return;
  }

  const subdivision = hand === 'left' ? step.leftSubdivision : step.rightSubdivision;
  const isTuplet = isTupletSubdivision(subdivision);
  const divisions = isTuplet ? tupletCount(subdivision) : SUBDIVISION_COUNTS[subdivision];
  const stepStartQuarter = step.startBeat * options.pulseQuarterNotes;
  const barStartQuarter = options.barStartBeat * options.pulseQuarterNotes;
  const barEndQuarter = options.barEndBeat * options.pulseQuarterNotes;
  const sessionEndQuarter = options.sessionEndBeat === undefined
    ? Number.POSITIVE_INFINITY
    : options.sessionEndBeat * options.pulseQuarterNotes;
  const stepDurationQuarter = step.durationBeats * options.pulseQuarterNotes;
  const eventCount = isTuplet
    ? step.durationBeats * divisions
    : Math.ceil(stepDurationQuarter * divisions);

  for (let eventIndex = 0; eventIndex < eventCount; eventIndex += 1) {
    let offsetQuarter: number;
    let durationQuarter: number;

    if (isTuplet) {
      const beatOffset = Math.floor(eventIndex / divisions);
      const noteOffset = eventIndex % divisions;
      offsetQuarter = beatOffset * options.pulseQuarterNotes + noteOffset * options.pulseQuarterNotes / divisions;
      durationQuarter = options.pulseQuarterNotes / divisions;
    } else {
      const quarterIndex = Math.floor(eventIndex / divisions);
      const noteIndex = eventIndex % divisions;
      // Keep written binary values even when playback uses swing timing.
      offsetQuarter = quarterIndex + noteIndex / divisions;
      durationQuarter = 1 / divisions;
    }

    if (offsetQuarter >= stepDurationQuarter - EPSILON) continue;

    const absoluteQuarter = stepStartQuarter + offsetQuarter;
    const absoluteBeat = absoluteQuarter / options.pulseQuarterNotes;
    if (
      absoluteQuarter < barStartQuarter - EPSILON ||
      absoluteQuarter >= barEndQuarter - EPSILON ||
      absoluteQuarter >= sessionEndQuarter - EPSILON ||
      Math.floor(absoluteBeat + EPSILON) === options.restBeat
    ) continue;

    destination.push({
      startQuarter: Math.max(0, absoluteQuarter - barStartQuarter),
      durationQuarter,
      ...(isTuplet ? { tupletNumber: divisions } : {}),
    });
  }
}

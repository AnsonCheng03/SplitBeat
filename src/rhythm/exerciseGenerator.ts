import { SUBDIVISIONS } from '@/types/rhythm';
import type { ExerciseStep, RhythmPatternPair, Subdivision } from '@/types/rhythm';

export interface ExerciseGeneratorOptions {
  enabledSubdivisions: Subdivision[];
  changeIntervalBeats: number;
  patternPairs?: readonly RhythmPatternPair[];
  allowHandRests?: boolean;
  random?: () => number;
}

function samePattern(first: RhythmPatternPair, second: RhythmPatternPair): boolean {
  return first.leftSubdivision === second.leftSubdivision &&
    first.rightSubdivision === second.rightSubdivision &&
    (first.leftRest === true) === (second.leftRest === true) &&
    (first.rightRest === true) === (second.rightRest === true);
}

export function createExerciseStepGenerator(options: ExerciseGeneratorOptions) {
  const random = options.random ?? Math.random;
  const allowed = SUBDIVISIONS.filter((subdivision) =>
    options.enabledSubdivisions.includes(subdivision),
  );
  const steps: ExerciseStep[] = [];

  return (stepIndex: number): ExerciseStep => {
    while (steps.length <= stepIndex) {
      const previous = steps.at(-1);
      const candidates: RhythmPatternPair[] = options.patternPairs?.length
        ? options.patternPairs.filter((candidate, index, pairs) =>
            pairs.findIndex((pair) =>
              pair.leftSubdivision === candidate.leftSubdivision &&
              pair.rightSubdivision === candidate.rightSubdivision &&
              (pair.leftRest === true) === (candidate.leftRest === true) &&
              (pair.rightRest === true) === (candidate.rightRest === true),
            ) === index,
          )
        : allowed.flatMap((leftSubdivision) =>
            allowed.map((rightSubdivision) => ({ leftSubdivision, rightSubdivision })),
          );
      const restCandidates: RhythmPatternPair[] = options.allowHandRests && !options.patternPairs?.length
        ? candidates.flatMap((candidate) => [
            { ...candidate, leftRest: true },
            { ...candidate, rightRest: true },
          ])
        : [];
      const canAddRandomRests = restCandidates.length > 0;
      const preferRest = canAddRandomRests && random() < 0.2;
      const preferredCandidates = preferRest ? restCandidates : candidates;
      const alternateCandidates = preferRest ? candidates : restCandidates;
      const availablePreferred = preferredCandidates.filter((candidate) => !previous || !samePattern(candidate, previous));
      const availableAlternate = alternateCandidates.filter((candidate) => !previous || !samePattern(candidate, previous));
      const choices = availablePreferred.length > 0
        ? availablePreferred
        : availableAlternate.length > 0
          ? availableAlternate
          : preferredCandidates;
      const selected = choices[Math.floor(random() * choices.length)] ?? {
        leftSubdivision: 'quarter' as const,
        rightSubdivision: 'eighth' as const,
      };
      steps.push({
        id: `step-${steps.length}`,
        leftSubdivision: selected.leftSubdivision,
        rightSubdivision: selected.rightSubdivision,
        leftRest: selected.leftRest === true,
        rightRest: selected.rightRest === true,
        startBeat: steps.length * options.changeIntervalBeats,
        durationBeats: options.changeIntervalBeats,
      });
    }

    return steps[stepIndex];
  };
}

export function generateExerciseSteps(
  options: ExerciseGeneratorOptions,
  count: number,
): ExerciseStep[] {
  const getStep = createExerciseStepGenerator(options);
  return Array.from({ length: count }, (_, index) => getStep(index));
}

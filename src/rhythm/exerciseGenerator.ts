import { SUBDIVISIONS } from '@/types/rhythm';
import type { ExerciseStep, RhythmPatternPair, Subdivision } from '@/types/rhythm';

export interface ExerciseGeneratorOptions {
  enabledSubdivisions: Subdivision[];
  changeIntervalBeats: number;
  patternPairs?: readonly RhythmPatternPair[];
  patternPairWeights?: readonly number[];
  allowHandRests?: boolean;
  random?: () => number;
}

interface WeightedPattern {
  pattern: RhythmPatternPair;
  weight: number;
}

function samePattern(first: RhythmPatternPair, second: RhythmPatternPair): boolean {
  return first.leftSubdivision === second.leftSubdivision &&
    first.rightSubdivision === second.rightSubdivision &&
    (first.leftRest === true) === (second.leftRest === true) &&
    (first.rightRest === true) === (second.rightRest === true);
}

function patternKey(pattern: RhythmPatternPair): string {
  return [
    pattern.leftSubdivision,
    pattern.rightSubdivision,
    pattern.leftRest === true,
    pattern.rightRest === true,
  ].join(':');
}

function weightedPatterns(
  patterns: readonly RhythmPatternPair[],
  weights?: readonly number[],
): WeightedPattern[] {
  const uniquePatterns = new Map<string, WeightedPattern>();
  patterns.forEach((pattern, index) => {
    const weight = weights?.[index] ?? 1;
    if (weight <= 0) return;
    const key = patternKey(pattern);
    const existing = uniquePatterns.get(key);
    uniquePatterns.set(key, {
      pattern,
      weight: (existing?.weight ?? 0) + weight,
    });
  });
  return [...uniquePatterns.values()];
}

function selectWeightedPattern(
  choices: readonly WeightedPattern[],
  random: () => number,
): RhythmPatternPair | undefined {
  const totalWeight = choices.reduce((total, choice) => total + choice.weight, 0);
  if (totalWeight <= 0) return choices[0]?.pattern;

  let target = random() * totalWeight;
  for (const choice of choices) {
    if (target < choice.weight) return choice.pattern;
    target -= choice.weight;
  }
  return choices.at(-1)?.pattern;
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
      const candidates: WeightedPattern[] = options.patternPairs?.length
        ? weightedPatterns(options.patternPairs, options.patternPairWeights)
        : allowed.flatMap((leftSubdivision) =>
            allowed.map((rightSubdivision) => ({
              pattern: { leftSubdivision, rightSubdivision },
              weight: 1,
            })),
          );
      const restCandidates: WeightedPattern[] = options.allowHandRests && !options.patternPairs?.length
        ? candidates.flatMap((candidate) => [
            { pattern: { ...candidate.pattern, leftRest: true }, weight: candidate.weight },
            { pattern: { ...candidate.pattern, rightRest: true }, weight: candidate.weight },
          ])
        : [];
      const canAddRandomRests = restCandidates.length > 0;
      const preferRest = canAddRandomRests && random() < 0.2;
      const preferredCandidates = preferRest ? restCandidates : candidates;
      const alternateCandidates = preferRest ? candidates : restCandidates;
      const availablePreferred = preferredCandidates.filter((candidate) => !previous || !samePattern(candidate.pattern, previous));
      const availableAlternate = alternateCandidates.filter((candidate) => !previous || !samePattern(candidate.pattern, previous));
      const choices = availablePreferred.length > 0
        ? availablePreferred
        : availableAlternate.length > 0
          ? availableAlternate
          : preferredCandidates;
      const selected = selectWeightedPattern(choices, random) ?? {
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

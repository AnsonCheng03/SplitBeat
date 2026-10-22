import { SUBDIVISIONS } from '@/types/rhythm';
import type { ExerciseStep, Subdivision } from '@/types/rhythm';

export interface ExerciseGeneratorOptions {
  enabledSubdivisions: Subdivision[];
  changeIntervalBeats: number;
  random?: () => number;
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
      const candidates = allowed.flatMap((leftSubdivision) =>
        allowed.map((rightSubdivision) => ({ leftSubdivision, rightSubdivision })),
      );
      const nonRepeating = candidates.filter(
        (candidate) =>
          !previous ||
          candidate.leftSubdivision !== previous.leftSubdivision ||
          candidate.rightSubdivision !== previous.rightSubdivision,
      );
      const choices = nonRepeating.length > 0 ? nonRepeating : candidates;
      const selected = choices[Math.floor(random() * choices.length)] ?? {
        leftSubdivision: 'quarter' as const,
        rightSubdivision: 'eighth' as const,
      };
      steps.push({
        id: `step-${steps.length}`,
        leftSubdivision: selected.leftSubdivision,
        rightSubdivision: selected.rightSubdivision,
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

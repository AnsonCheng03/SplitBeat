import type { DurationOption, MixturePatternId, Subdivision } from '@/types/rhythm';

export type ExerciseTab = 'review' | 'later' | 'pair' | 'bar';

export interface ExerciseDurationOption {
  label: string;
  value: DurationOption;
}

export interface PatternSelection {
  subdivision: Subdivision;
  mixture?: MixturePatternId;
  rest: boolean;
}

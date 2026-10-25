import { getMixturePattern, MIXTURE_NOTE_OPTIONS } from '@/rhythm/mixtures';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import type { MixturePatternId, Subdivision } from '@/types/rhythm';

export interface PatternSelectionLabelInput {
  subdivision: Subdivision;
  mixture?: MixturePatternId;
  rest: boolean;
}

type Translate = (source: string, values?: Record<string, string | number>) => string;

/** Builds a localized spoken label from the selected note values, including generated mixtures. */
export function patternSelectionLabel(selection: PatternSelectionLabelInput, t: Translate): string {
  if (selection.rest) return t('Rest');
  if (!selection.mixture) return t(SUBDIVISION_LABELS[selection.subdivision]);

  const labels = getMixturePattern(selection.mixture).atoms.map((atom) => {
    const noteOption = MIXTURE_NOTE_OPTIONS.find((option) => atom.noteValue
      ? option.value === atom.noteValue
      : Math.abs(option.durationQuarter - atom.durationQuarter) < 0.00001);
    const noteSource = noteOption?.label ?? (atom.subdivision ? SUBDIVISION_LABELS[atom.subdivision] : 'Note');
    return atom.kind === 'rest' ? t(`${noteSource} rest`) : t(noteSource);
  });

  return labels.slice(1).reduce(
    (combined, label) => t('{first} + {second}', { first: combined, second: label }),
    labels[0] ?? t('Rhythm'),
  );
}

import { createBarNoteNotationPlan, createNoteNotationPlan } from '@/rhythm/noteNotation';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { COMPOSER_TUPLET_SYMBOLS, NOTE_VALUE_SYMBOLS } from '@/rhythm/scoreComposer';
import type { ComposerSymbolId } from '@/rhythm/scoreComposer';
import { TUPLET_SUBDIVISIONS } from '@/types/rhythm';
import type { TimeSignature } from '@/types/rhythm';
import type { NoteNotationPlan } from '@/rhythm/noteNotation';

export function composerSymbolLabelKey(symbolId: ComposerSymbolId): string {
  const noteValue = NOTE_VALUE_SYMBOLS.find((symbol) => symbol.id === symbolId);
  const tupletValue = COMPOSER_TUPLET_SYMBOLS.find((symbol) => symbol.id === symbolId);
  return noteValue?.label ?? tupletValue?.label ?? symbolId;
}

export function createComposerSymbolNotationPlan(
  symbolId: ComposerSymbolId,
  timeSignature: TimeSignature,
  isRest: boolean,
): NoteNotationPlan | null {
  const noteValue = NOTE_VALUE_SYMBOLS.find((symbol) => symbol.id === symbolId);
  if (isRest) {
    const durationQuarter = noteValue?.durationQuarter ?? pulseQuarterNotes(timeSignature);
    return createBarNoteNotationPlan([{
      startQuarter: durationQuarter / 2,
      durationQuarter,
    }], {
      durationQuarter: durationQuarter * 2,
      width: 45,
      size: 'mini',
      beamGroupQuarterNotes: durationQuarter,
    });
  }
  if (TUPLET_SUBDIVISIONS.includes(symbolId as (typeof TUPLET_SUBDIVISIONS)[number])) {
    return createNoteNotationPlan(symbolId as (typeof TUPLET_SUBDIVISIONS)[number], 'mini', timeSignature);
  }
  if (!noteValue) return null;
  return createBarNoteNotationPlan([{
    startQuarter: noteValue.durationQuarter / 2,
    durationQuarter: noteValue.durationQuarter,
  }], {
    durationQuarter: noteValue.durationQuarter * 2,
    width: 45,
    size: 'mini',
    beamGroupQuarterNotes: noteValue.durationQuarter,
  });
}

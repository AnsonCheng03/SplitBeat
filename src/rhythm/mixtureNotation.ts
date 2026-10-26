import { createRhythmSymbolNotationPlan, fitNotationScale } from '@/rhythm/noteNotation';
import type { NoteNotationEvent, NoteNotationPlan, NoteNotationSize } from '@/rhythm/noteNotation';
import type { MixturePattern } from '@/rhythm/mixtures';
import { getMixturePattern } from '@/rhythm/mixtures';
import type { MixturePatternId } from '@/types/rhythm';

/** Converts a mixture's ordered note and rest atoms into events for shared notation engraving. */
export function mixtureNotationEvents(pattern: MixturePattern): NoteNotationEvent[] {
  let startQuarter = 0;
  return pattern.atoms.map((atom) => {
    const event: NoteNotationEvent = {
      startQuarter,
      durationQuarter: atom.durationQuarter,
      ...(atom.kind === 'rest' ? { isRest: true } : {}),
    };
    startQuarter += atom.durationQuarter;
    return event;
  });
}

export function createMixtureSymbolNotationModel({
  mixtureId,
  compact,
  mini,
  scale,
  maxWidth,
  maxHeight,
  groupWidth,
}: {
  mixtureId: MixturePatternId;
  compact: boolean;
  mini: boolean;
  scale: number;
  maxWidth?: number;
  maxHeight?: number;
  groupWidth?: number;
}): { pattern: MixturePattern; plan: NoteNotationPlan; fittedScale: number } {
  const pattern = getMixturePattern(mixtureId);
  const size: NoteNotationSize = mini ? 'mini' : compact ? 'compact' : 'full';
  const notationWidth = mini
    ? Math.min(120, Math.max(42, pattern.atoms.length * 6))
    : compact
      ? Math.min(112, Math.max(58, pattern.atoms.length * 7))
      : Math.min(220, Math.max(82, pattern.atoms.length * 12));
  const noteEvents = mixtureNotationEvents(pattern);
  const symbolWidth = groupWidth ?? notationWidth;
  const shortestEvent = noteEvents.reduce(
    (shortest, event) => Math.min(shortest, event.durationQuarter),
    pattern.durationQuarter,
  );
  const noteSpacing = symbolWidth * shortestEvent / pattern.durationQuarter;
  const baseHeadWidth = size === 'mini' ? 4.2 : size === 'compact' ? 7 : 9.2;
  const noteHeadWidth = Math.max(size === 'full' ? 3.4 : 2.4, Math.min(baseHeadWidth, noteSpacing * 0.72));
  const plan = createRhythmSymbolNotationPlan(noteEvents, {
    durationQuarter: pattern.durationQuarter,
    width: symbolWidth,
    size,
    noteHeadWidth,
    beamGroupQuarterNotes: pattern.durationQuarter,
  });
  const fittedScale = fitNotationScale(plan.width, plan.height, scale, maxWidth, maxHeight);
  return { pattern, plan, fittedScale };
}

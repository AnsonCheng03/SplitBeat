import type { NoteNotationEvent } from '@/rhythm/noteNotation';
import type { MixturePattern } from '@/rhythm/mixtures';

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

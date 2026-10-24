import { patternLabel } from '@/rhythm/subdivisions';
import type { MixturePatternId, Subdivision } from '@/types/rhythm';

export interface MixtureAtom {
  kind: 'note' | 'rest';
  durationQuarter: number;
  subdivision?: Subdivision;
}

export interface MixturePattern {
  id: MixturePatternId;
  label: string;
  detail: string;
  atoms: readonly MixtureAtom[];
  durationQuarter: number;
}

export interface TimedMixtureAtom extends MixtureAtom {
  startQuarter: number;
}

const PATTERN_ATOMS: Record<MixturePatternId, readonly MixtureAtom[]> = {
  dottedQuaverSemiquaver: [
    { kind: 'note', subdivision: 'eighth', durationQuarter: 0.75 },
    { kind: 'note', subdivision: 'sixteenth', durationQuarter: 0.25 },
  ],
  // This half-beat figure repeats twice in a 4/4 quarter-note beat.
  semiquaverTwoDemisemiquavers: [
    { kind: 'note', subdivision: 'sixteenth', durationQuarter: 0.25 },
    { kind: 'note', subdivision: 'thirtySecond', durationQuarter: 0.125 },
    { kind: 'note', subdivision: 'thirtySecond', durationQuarter: 0.125 },
  ],
  semiquaverDemisemiquaverRestDemisemiquaver: [
    { kind: 'note', subdivision: 'sixteenth', durationQuarter: 0.25 },
    { kind: 'rest', subdivision: 'thirtySecond', durationQuarter: 0.125 },
    { kind: 'note', subdivision: 'thirtySecond', durationQuarter: 0.125 },
  ],
};

export const MIXTURE_PATTERNS: readonly MixturePattern[] = [
  {
    id: 'dottedQuaverSemiquaver',
    label: 'Dotted quaver + semiquaver',
    detail: 'A dotted eighth followed by a sixteenth',
    atoms: PATTERN_ATOMS.dottedQuaverSemiquaver,
    durationQuarter: 1,
  },
  {
    id: 'semiquaverTwoDemisemiquavers',
    label: 'Semiquaver + 2 demisemiquavers',
    detail: 'A sixteenth followed by two 32nd notes',
    atoms: PATTERN_ATOMS.semiquaverTwoDemisemiquavers,
    durationQuarter: 0.5,
  },
  {
    id: 'semiquaverDemisemiquaverRestDemisemiquaver',
    label: 'Semiquaver + 32nd rest + demisemiquaver',
    detail: 'A sixteenth, a 32nd rest, then a 32nd note',
    atoms: PATTERN_ATOMS.semiquaverDemisemiquaverRestDemisemiquaver,
    durationQuarter: 0.5,
  },
];

const PATTERNS_BY_ID = new Map(MIXTURE_PATTERNS.map((pattern) => [pattern.id, pattern]));

export function getMixturePattern(id: MixturePatternId): MixturePattern {
  const pattern = PATTERNS_BY_ID.get(id);
  if (!pattern) throw new RangeError(`Unknown mixture pattern: ${id}`);
  return pattern;
}

export function patternLabelForHand(
  subdivision: Subdivision,
  isRest: boolean,
  mixtureId?: MixturePatternId,
): string {
  if (isRest) return 'Rest';
  if (mixtureId) return getMixturePattern(mixtureId).label;
  return patternLabel(subdivision);
}

/** Repeat a mixture from its change boundary, clipping the final atom at the next change. */
export function expandMixturePattern(
  id: MixturePatternId,
  startQuarter: number,
  endQuarter: number,
): TimedMixtureAtom[] {
  const pattern = getMixturePattern(id);
  const result: TimedMixtureAtom[] = [];
  const epsilon = 1e-8;

  for (let cycleStart = startQuarter; cycleStart < endQuarter - epsilon; cycleStart += pattern.durationQuarter) {
    let atomStart = cycleStart;
    for (const atom of pattern.atoms) {
      if (atomStart >= endQuarter - epsilon) break;
      result.push({
        ...atom,
        startQuarter: atomStart,
        durationQuarter: Math.min(atom.durationQuarter, endQuarter - atomStart),
      });
      atomStart += atom.durationQuarter;
    }
  }

  return result;
}

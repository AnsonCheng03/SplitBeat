import { patternLabel } from '@/rhythm/subdivisions';
import type {
  LegacyMixturePatternId,
  MixtureNoteValue,
  MixturePatternId,
  Subdivision,
} from '@/types/rhythm';

export interface MixtureAtom {
  kind: 'note' | 'rest';
  durationQuarter: number;
  subdivision?: Subdivision;
  noteValue?: MixtureNoteValue;
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

export interface MixtureNoteOption {
  value: MixtureNoteValue;
  label: string;
  durationQuarter: number;
}

export const MIXTURE_NOTE_OPTIONS: readonly MixtureNoteOption[] = [
  { value: 'whole', label: 'Whole', durationQuarter: 4 },
  { value: 'dottedHalf', label: 'Dotted half', durationQuarter: 3 },
  { value: 'half', label: 'Half', durationQuarter: 2 },
  { value: 'dottedQuarter', label: 'Dotted quarter', durationQuarter: 1.5 },
  { value: 'quarter', label: 'Quarter', durationQuarter: 1 },
  { value: 'dottedEighth', label: 'Dotted eighth', durationQuarter: 0.75 },
  { value: 'eighth', label: 'Eighth', durationQuarter: 0.5 },
  { value: 'dottedSixteenth', label: 'Dotted sixteenth', durationQuarter: 0.375 },
  { value: 'sixteenth', label: 'Sixteenth', durationQuarter: 0.25 },
  { value: 'dottedThirtySecond', label: 'Dotted 32nd', durationQuarter: 0.1875 },
  { value: 'thirtySecond', label: '32nd', durationQuarter: 0.125 },
  { value: 'sixtyFourth', label: '64th', durationQuarter: 0.0625 },
];

const MAX_MIXTURE_ATOMS = 16;
const MAX_BAR_UNITS = 448;
const GENERATED_ID_PREFIX = 'mix1-';
const NOTE_OPTIONS_BY_VALUE = new Map(MIXTURE_NOTE_OPTIONS.map((option) => [option.value, option]));
const NOTE_VALUES_BY_DURATION = new Map(MIXTURE_NOTE_OPTIONS.map((option) => [option.durationQuarter, option.value]));

const PATTERN_ATOMS: Record<LegacyMixturePatternId, readonly MixtureAtom[]> = {
  dottedQuaverSemiquaver: [
    { kind: 'note', subdivision: 'eighth', durationQuarter: 0.75 },
    { kind: 'note', subdivision: 'sixteenth', durationQuarter: 0.25 },
  ],
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
const GENERATED_PATTERNS_BY_ID = new Map<string, MixturePattern>();

function mixtureUnits(durationQuarter: number): number {
  return Math.round(durationQuarter * 64);
}

function optionForValue(value: MixtureNoteValue): MixtureNoteOption | undefined {
  return NOTE_OPTIONS_BY_VALUE.get(value);
}

export function mixtureNoteOptionsForBar(maximumQuarterNotes: number, includeSixtyFourth = true): MixtureNoteOption[] {
  if (!Number.isFinite(maximumQuarterNotes) || maximumQuarterNotes <= 0) return [];
  return MIXTURE_NOTE_OPTIONS.filter((option) =>
    option.durationQuarter <= maximumQuarterNotes && (includeSixtyFourth || option.value !== 'sixtyFourth'),
  );
}

function atomLabel(atom: MixtureAtom): string {
  const value = atom.noteValue ?? NOTE_VALUES_BY_DURATION.get(atom.durationQuarter);
  const label = value ? optionForValue(value)?.label : undefined;
  if (atom.kind === 'rest') return `${label ?? 'Note'} rest`;
  return label ?? (atom.subdivision ? patternLabel(atom.subdivision) : 'Note');
}

function patternLabelForAtoms(atoms: readonly MixtureAtom[]): string {
  return [...new Set(atoms.map(atomLabel))].join(' + ');
}

function createPatternId(atoms: readonly MixtureAtom[]): MixturePatternId {
  return `${GENERATED_ID_PREFIX}${atoms
    .map((atom) => `${atom.kind === 'rest' ? 'r' : 'n'}${mixtureUnits(atom.durationQuarter)}`)
    .join('-')}` as MixturePatternId;
}

function generatedPatternFromId(id: string): MixturePattern | undefined {
  if (!id.startsWith(GENERATED_ID_PREFIX) || id.length > 128) return undefined;
  const tokens = id.slice(GENERATED_ID_PREFIX.length).split('-');
  if (tokens.length < 2 || tokens.length > MAX_MIXTURE_ATOMS) return undefined;

  const atoms: MixtureAtom[] = [];
  let totalUnits = 0;
  for (const token of tokens) {
    const match = /^([nr])(\d{1,3})$/.exec(token);
    const units = match ? Number(match[2]) : 0;
    if (!match || units < 1 || units > MAX_BAR_UNITS) return undefined;
    totalUnits += units;
    if (totalUnits > MAX_BAR_UNITS) return undefined;
    const durationQuarter = units / 64;
    const noteValue = NOTE_VALUES_BY_DURATION.get(durationQuarter);
    atoms.push({
      kind: match[1] === 'r' ? 'rest' : 'note',
      durationQuarter,
      ...(noteValue ? { noteValue } : {}),
    });
  }
  if (!atoms.some((atom) => atom.kind === 'note')) return undefined;

  return {
    id: id as MixturePatternId,
    label: patternLabelForAtoms(atoms),
    detail: 'Generated from the selected note values and kept within one bar',
    atoms,
    durationQuarter: totalUnits / 64,
  };
}

function selectedAtoms(
  values: readonly MixtureNoteValue[],
  maximumQuarterNotes: number,
): MixtureAtom[] {
  const maximumUnits = Math.min(MAX_BAR_UNITS, mixtureUnits(maximumQuarterNotes));
  const options = [...new Set(values)]
    .map(optionForValue)
    .filter((option): option is MixtureNoteOption => Boolean(option))
    .filter((option) => mixtureUnits(option.durationQuarter) <= maximumUnits);
  return options.map((option) => ({
    kind: 'note',
    durationQuarter: option.durationQuarter,
    noteValue: option.value,
  }));
}

function randomIndex(length: number, random: () => number): number {
  const value = random();
  return Math.min(length - 1, Math.max(0, Math.floor((Number.isFinite(value) ? value : 0) * length)));
}

/**
 * Builds a fresh mixed rhythm from user-selected note values. The sequence is
 * capped at one bar; shorter patterns repeat naturally when expanded over a
 * longer exercise step.
 */
export function generateMixturePattern(
  noteValues: readonly MixtureNoteValue[],
  maximumQuarterNotes: number,
  includeRests = false,
  random: () => number = Math.random,
): MixturePattern | null {
  if (!Number.isFinite(maximumQuarterNotes) || maximumQuarterNotes <= 0) return null;
  const options = selectedAtoms(noteValues, maximumQuarterNotes);
  const maximumUnits = Math.min(MAX_BAR_UNITS, mixtureUnits(maximumQuarterNotes));
  if (options.length === 0 || maximumUnits < 2) return null;

  const firstPairs: [MixtureAtom, MixtureAtom][] = [];
  for (let firstIndex = 0; firstIndex < options.length; firstIndex += 1) {
    const first = options[firstIndex];
    if (!first) continue;
    for (let secondIndex = 0; secondIndex < options.length; secondIndex += 1) {
      const second = options[secondIndex];
      if (!second || (first.noteValue === second.noteValue && !includeRests)) continue;
      if (mixtureUnits(first.durationQuarter + second.durationQuarter) > maximumUnits) continue;

      const sameValue = first.noteValue === second.noteValue;
      const kinds: ('note' | 'rest')[][] = sameValue
        ? [['rest', 'note'], ['note', 'rest']]
        : includeRests
          ? [['note', 'note'], ['rest', 'note'], ['note', 'rest']]
          : [['note', 'note']];
      for (const [firstKind, secondKind] of kinds) {
        if (firstKind === 'rest' && secondKind === 'rest') continue;
        firstPairs.push([
          { ...first, kind: firstKind },
          { ...second, kind: secondKind },
        ]);
      }
    }
  }
  if (firstPairs.length === 0) return null;

  const pair = firstPairs[randomIndex(firstPairs.length, random)];
  if (!pair) return null;
  const atoms = [...pair];
  let usedUnits = mixtureUnits(pair[0].durationQuarter + pair[1].durationQuarter);
  const availableAtoms = options.flatMap((option) => includeRests
    ? [{ ...option, kind: 'note' as const }, { ...option, kind: 'rest' as const }]
    : [{ ...option, kind: 'note' as const }]);

  while (atoms.length < MAX_MIXTURE_ATOMS && usedUnits < maximumUnits) {
    const fittingAtoms = availableAtoms.filter(
      (atom) => usedUnits + mixtureUnits(atom.durationQuarter) <= maximumUnits,
    );
    if (fittingAtoms.length === 0 || random() >= 0.58) break;
    const nextAtom = fittingAtoms[randomIndex(fittingAtoms.length, random)];
    if (!nextAtom) break;
    atoms.push(nextAtom);
    usedUnits += mixtureUnits(nextAtom.durationQuarter);
  }

  const id = createPatternId(atoms);
  return {
    id,
    label: patternLabelForAtoms(atoms),
    detail: 'Generated from the selected note values and kept within one bar',
    atoms,
    durationQuarter: usedUnits / 64,
  };
}

export function mixtureNoteValuesFromLegacyIds(ids: readonly string[]): MixtureNoteValue[] {
  const values = new Set<MixtureNoteValue>();
  for (const id of ids) {
    const pattern = PATTERNS_BY_ID.get(id as LegacyMixturePatternId);
    for (const atom of pattern?.atoms ?? []) {
      const value = atom.noteValue ?? NOTE_VALUES_BY_DURATION.get(atom.durationQuarter);
      if (atom.kind === 'note' && value) values.add(value);
    }
  }
  return MIXTURE_NOTE_OPTIONS.filter(({ value }) => values.has(value)).map(({ value }) => value);
}

export function legacyMixturesIncludeRests(ids: readonly string[]): boolean {
  return ids.includes('semiquaverDemisemiquaverRestDemisemiquaver');
}

export function isMixturePatternId(value: unknown): value is MixturePatternId {
  if (typeof value !== 'string') return false;
  return PATTERNS_BY_ID.has(value as LegacyMixturePatternId) || generatedPatternFromId(value) !== undefined;
}

export function getMixturePattern(id: MixturePatternId): MixturePattern {
  const pattern = PATTERNS_BY_ID.get(id as LegacyMixturePatternId);
  if (pattern) return pattern;
  const cached = GENERATED_PATTERNS_BY_ID.get(id);
  if (cached) return cached;
  const generated = generatedPatternFromId(id);
  if (!generated) throw new RangeError(`Unknown mixture pattern: ${id}`);
  GENERATED_PATTERNS_BY_ID.set(id, generated);
  return generated;
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

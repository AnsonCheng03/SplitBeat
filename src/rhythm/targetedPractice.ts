import { isMixturePatternId, patternLabelForHand } from '@/rhythm/mixtures';
import type { ImportedRhythmScore, ScoreRhythmEvent } from '@/types/importedScore';
import type {
  CombinationStats,
  Hand,
  MixturePatternId,
  ReplayPattern,
  RhythmPatternPair,
  Subdivision,
  TimeSignature,
  TrainingMode,
} from '@/types/rhythm';
import { SUBDIVISIONS, TIME_SIGNATURES } from '@/types/rhythm';

export interface CombinationProgress {
  id: string;
  timeSignature: TimeSignature;
  leftSubdivision: Subdivision;
  rightSubdivision: Subdivision;
  leftRest: boolean;
  rightRest: boolean;
  leftMixture?: MixturePatternId;
  rightMixture?: MixturePatternId;
  leftExpected: number;
  leftHit: number;
  rightExpected: number;
  rightHit: number;
  sessions: number;
  updatedAt: number;
}

export interface SavedPracticePair extends RhythmPatternPair {
  leftRest: boolean;
  rightRest: boolean;
  id: string;
  timeSignature: TimeSignature;
  savedAt: number;
}

export type CombinationFilter = 'all' | 'weak' | 'mixtures' | 'rests';

const WEAK_ACCURACY_LIMIT = 80;
const BAR_DURATION_EPSILON = 0.00001;

function combinationId(
  pair: Pick<RhythmPatternPair, 'leftSubdivision' | 'rightSubdivision' | 'leftRest' | 'rightRest' | 'leftMixture' | 'rightMixture'>,
  timeSignature: TimeSignature,
): string {
  const left = pair.leftRest ? 'rest' : pair.leftMixture ?? pair.leftSubdivision;
  const right = pair.rightRest ? 'rest' : pair.rightMixture ?? pair.rightSubdivision;
  return `${timeSignature}:${left}:${right}`;
}

export function savedPracticePairId(pair: RhythmPatternPair, timeSignature: TimeSignature): string {
  return combinationId(pair, timeSignature);
}

export function replayPatternsForPractice(events: readonly { pattern?: ReplayPattern }[]): ReplayPattern[] {
  const patterns = new Map<string, ReplayPattern>();
  for (const event of events) {
    if (event.pattern) patterns.set(JSON.stringify(event.pattern), event.pattern);
  }
  return [...patterns.values()];
}

export function savePracticePairsForLater(
  existing: readonly SavedPracticePair[],
  pairs: readonly RhythmPatternPair[],
  timeSignature: TimeSignature,
  savedAt: number,
): SavedPracticePair[] {
  const next = new Map(existing.map((pair) => [pair.id, pair]));
  for (const pair of pairs) {
    const leftRest = pair.leftRest === true;
    const rightRest = pair.rightRest === true;
    if (leftRest && rightRest) continue;
    const savedPair: SavedPracticePair = {
      id: savedPracticePairId(pair, timeSignature),
      timeSignature,
      leftSubdivision: pair.leftSubdivision,
      rightSubdivision: pair.rightSubdivision,
      leftRest,
      rightRest,
      ...(pair.leftMixture ? { leftMixture: pair.leftMixture } : {}),
      ...(pair.rightMixture ? { rightMixture: pair.rightMixture } : {}),
      savedAt,
    };
    next.set(savedPair.id, savedPair);
  }
  return [...next.values()].sort((first, second) => second.savedAt - first.savedAt).slice(0, 100);
}

export function removeSavedPracticePair(
  existing: readonly SavedPracticePair[],
  id: string,
): SavedPracticePair[] {
  return existing.filter((pair) => pair.id !== id);
}

function isSavedPracticePair(value: unknown): value is SavedPracticePair {
  if (!value || typeof value !== 'object') return false;
  const pair = value as Partial<SavedPracticePair>;
  return typeof pair.id === 'string' &&
    TIME_SIGNATURES.includes(pair.timeSignature as TimeSignature) &&
    isSubdivision(pair.leftSubdivision) && isSubdivision(pair.rightSubdivision) &&
    (pair.leftRest === undefined || typeof pair.leftRest === 'boolean') &&
    (pair.rightRest === undefined || typeof pair.rightRest === 'boolean') &&
    (pair.leftMixture === undefined || isMixture(pair.leftMixture)) &&
    (pair.rightMixture === undefined || isMixture(pair.rightMixture)) &&
    typeof pair.savedAt === 'number' && Number.isFinite(pair.savedAt) && pair.savedAt >= 0;
}

export function parseSavedPracticePairs(raw: string | null): SavedPracticePair[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isSavedPracticePair)
      .map((pair) => ({ ...pair, leftRest: pair.leftRest === true, rightRest: pair.rightRest === true }))
      .filter((pair) => !(pair.leftRest && pair.rightRest) && pair.id === savedPracticePairId(pair, pair.timeSignature))
      .sort((first, second) => second.savedAt - first.savedAt)
      .slice(0, 100);
  } catch {
    return [];
  }
}

export function combinationAccuracy(progress: Pick<CombinationProgress, 'leftExpected' | 'leftHit' | 'rightExpected' | 'rightHit'>): number {
  const expected = progress.leftExpected + progress.rightExpected;
  return expected === 0 ? 0 : ((progress.leftHit + progress.rightHit) / expected) * 100;
}

export function combinationHandAccuracy(
  progress: CombinationProgress,
  hand: Hand,
): number | null {
  const expected = hand === 'left' ? progress.leftExpected : progress.rightExpected;
  const hit = hand === 'left' ? progress.leftHit : progress.rightHit;
  return expected === 0 ? null : (hit / expected) * 100;
}

export function combinationTitle(progress: Pick<CombinationProgress, 'leftSubdivision' | 'rightSubdivision' | 'leftRest' | 'rightRest' | 'leftMixture' | 'rightMixture'>): string {
  const left = patternLabelForHand(progress.leftSubdivision, progress.leftRest, progress.leftMixture);
  const right = patternLabelForHand(progress.rightSubdivision, progress.rightRest, progress.rightMixture);
  return `L: ${left} · R: ${right}`;
}

export function recordCombinationProgress(
  existing: readonly CombinationProgress[],
  combinations: readonly CombinationStats[],
  timeSignature: TimeSignature,
  completedAt: number,
): CombinationProgress[] {
  if (combinations.length === 0) return existing as CombinationProgress[];
  const next = new Map(existing.map((item) => [item.id, item]));
  for (const combination of combinations) {
    const id = combinationId(combination, timeSignature);
    const current = next.get(id);
    next.set(id, {
      id,
      timeSignature,
      leftSubdivision: combination.leftSubdivision,
      rightSubdivision: combination.rightSubdivision,
      leftRest: combination.leftRest,
      rightRest: combination.rightRest,
      ...(combination.leftMixture ? { leftMixture: combination.leftMixture } : {}),
      ...(combination.rightMixture ? { rightMixture: combination.rightMixture } : {}),
      leftExpected: (current?.leftExpected ?? 0) + combination.left.totalExpected,
      leftHit: (current?.leftHit ?? 0) + combination.left.totalHit,
      rightExpected: (current?.rightExpected ?? 0) + combination.right.totalExpected,
      rightHit: (current?.rightHit ?? 0) + combination.right.totalHit,
      sessions: (current?.sessions ?? 0) + 1,
      updatedAt: completedAt,
    });
  }
  return [...next.values()].sort((first, second) => combinationAccuracy(first) - combinationAccuracy(second));
}

export function filterCombinationProgress(
  records: readonly CombinationProgress[],
  filter: CombinationFilter,
  query = '',
): CombinationProgress[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => {
      if (filter === 'weak' && combinationAccuracy(record) >= WEAK_ACCURACY_LIMIT) return false;
      if (filter === 'mixtures' && !record.leftMixture && !record.rightMixture) return false;
      if (filter === 'rests' && !record.leftRest && !record.rightRest) return false;
      return !normalizedQuery ||
        combinationTitle(record).toLowerCase().includes(normalizedQuery) ||
        record.timeSignature.toLowerCase().includes(normalizedQuery);
    })
    .sort((first, second) => combinationAccuracy(first) - combinationAccuracy(second));
}

function isSubdivision(value: unknown): value is Subdivision {
  return typeof value === 'string' && SUBDIVISIONS.includes(value as Subdivision);
}

function isMixture(value: unknown): value is MixturePatternId {
  return isMixturePatternId(value);
}

function isCombinationProgress(value: unknown): value is CombinationProgress {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<CombinationProgress>;
  return typeof record.id === 'string' &&
    TIME_SIGNATURES.includes(record.timeSignature as TimeSignature) &&
    isSubdivision(record.leftSubdivision) && isSubdivision(record.rightSubdivision) &&
    typeof record.leftRest === 'boolean' && typeof record.rightRest === 'boolean' &&
    (record.leftMixture === undefined || isMixture(record.leftMixture)) &&
    (record.rightMixture === undefined || isMixture(record.rightMixture)) &&
    [record.leftExpected, record.leftHit, record.rightExpected, record.rightHit, record.sessions, record.updatedAt]
      .every((number) => typeof number === 'number' && Number.isFinite(number) && number >= 0);
}

export function parseCombinationProgress(raw: string | null): CombinationProgress[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCombinationProgress) : [];
  } catch {
    return [];
  }
}

interface NoteToken {
  durationQuarter: number;
  rest: boolean;
}

const NOTE_DURATIONS: Record<string, number> = {
  w: 4, whole: 4,
  h: 2, half: 2,
  q: 1, quarter: 1,
  dq: 1.5, 'dotted-quarter': 1.5,
  e: 0.5, eighth: 0.5, quaver: 0.5,
  de: 0.75, 'dotted-eighth': 0.75, 'dotted-quaver': 0.75,
  '16': 0.25, sixteenth: 0.25, semiquaver: 0.25,
  d16: 0.375, 'dotted-sixteenth': 0.375, 'dotted-semiquaver': 0.375,
  '32': 0.125, thirtysecond: 0.125, demisemiquaver: 0.125,
  d32: 0.1875, 'dotted-thirtysecond': 0.1875,
  '64': 0.0625, sixtyfourth: 0.0625, hemidemisemiquaver: 0.0625,
};

function parseNoteToken(token: string): NoteToken | null {
  const normalized = token.toLowerCase().replaceAll('–', '-');
  const restPrefix = normalized.startsWith('rest-') ? 'rest-' : normalized.startsWith('rest') ? 'rest' : normalized.startsWith('r-') ? 'r-' : normalized.startsWith('r') ? 'r' : '';
  const noteName = restPrefix ? normalized.slice(restPrefix.length) : normalized;
  const durationQuarter = NOTE_DURATIONS[noteName];
  return durationQuarter === undefined ? null : { durationQuarter, rest: restPrefix.length > 0 };
}

export interface ParsedBar {
  events: ScoreRhythmEvent[];
  durationQuarter: number;
}

export type BarParseResult = {
  ok: true;
  bar: ParsedBar;
} | {
  ok: false;
  error: string;
}

export function parseTypedBar(input: string, timeSignature: TimeSignature): BarParseResult {
  const tokens = input.trim().split(/[\s,|]+/).filter(Boolean);
  if (tokens.length === 0) return { ok: false, error: 'Enter at least one note or rest.' };

  const events: ScoreRhythmEvent[] = [];
  let cursor = 0;
  for (const token of tokens) {
    const parsed = parseNoteToken(token);
    if (!parsed) return { ok: false, error: `“${token}” is not a note value. Use the guide below.` };
    events.push({
      startQuarter: cursor,
      durationQuarter: parsed.durationQuarter,
      ...(parsed.rest ? { isRest: true } : {}),
    });
    cursor += parsed.durationQuarter;
  }

  const expectedDuration = barDurationQuarterNotes(timeSignature);
  if (cursor > expectedDuration + BAR_DURATION_EPSILON) {
    return { ok: false, error: `These notes total ${cursor} quarter notes, longer than one ${timeSignature} bar (${expectedDuration}).` };
  }
  if (cursor < expectedDuration - BAR_DURATION_EPSILON) {
    return { ok: false, error: `These notes total ${cursor} quarter notes. Fill the full ${timeSignature} bar (${expectedDuration}).` };
  }
  return { ok: true, bar: { events, durationQuarter: expectedDuration } };
}

export function createTypedBarScore(
  leftText: string,
  rightText: string,
  timeSignature: TimeSignature,
  trainingMode: TrainingMode,
  singleHand: Hand,
): { ok: true; score: ImportedRhythmScore } | { ok: false; error: string } {
  const leftActive = trainingMode === 'two-hand' || singleHand === 'left';
  const rightActive = trainingMode === 'two-hand' || singleHand === 'right';
  const left = leftActive ? parseTypedBar(leftText, timeSignature) : undefined;
  const right = rightActive ? parseTypedBar(rightText, timeSignature) : undefined;
  if (left && !left.ok) return { ok: false, error: `Left hand: ${left.error}` };
  if (right && !right.ok) return { ok: false, error: `Right hand: ${right.error}` };
  const activeBars = [left, right].filter((result): result is Extract<BarParseResult, { ok: true }> => result?.ok === true);
  if (activeBars.every(({ bar }) => bar.events.every((event) => event.isRest))) {
    return { ok: false, error: 'Add at least one note to the active hand or hands.' };
  }

  const durationQuarter = barDurationQuarterNotes(timeSignature);
  return {
    ok: true,
    score: {
      formatVersion: 1,
      title: 'My typed rhythm',
      timeSignature,
      trackCount: trainingMode === 'two-hand' ? 2 : 1,
      bpm: null,
      measures: [{
        index: 0,
        startQuarter: 0,
        durationQuarter,
        leftEvents: left?.ok ? left.bar.events : [],
        rightEvents: right?.ok ? right.bar.events : [],
      }],
      totalQuarterNotes: durationQuarter,
      warnings: [],
    },
  };
}

export function practicePairFromProgress(progress: CombinationProgress): RhythmPatternPair {
  return {
    leftSubdivision: progress.leftSubdivision,
    rightSubdivision: progress.rightSubdivision,
    leftRest: progress.leftRest,
    rightRest: progress.rightRest,
    ...(progress.leftMixture ? { leftMixture: progress.leftMixture } : {}),
    ...(progress.rightMixture ? { rightMixture: progress.rightMixture } : {}),
  };
}

export function practicePairFromSelections(
  left: { subdivision: Subdivision; mixture?: MixturePatternId; rest: boolean },
  right: { subdivision: Subdivision; mixture?: MixturePatternId; rest: boolean },
): RhythmPatternPair {
  return {
    leftSubdivision: left.subdivision,
    rightSubdivision: right.subdivision,
    leftRest: left.rest,
    rightRest: right.rest,
    ...(left.mixture ? { leftMixture: left.mixture } : {}),
    ...(right.mixture ? { rightMixture: right.mixture } : {}),
  };
}

/** Get the notated bar length in quarter notes for any supported meter. */
export function barDurationQuarterNotes(timeSignature: TimeSignature): number {
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  return numerator * (4 / denominator);
}

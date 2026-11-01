import { TIME_SIGNATURES } from '@/types/rhythm';
import type { Hand } from '@/types/rhythm';
import type { ImportedRhythmScore, ScoreRhythmEvent } from '@/types/importedScore';
import { SCORE_TEMPLATE_TAGS } from '@/rhythm/scoreTemplates';

export type ImportedScoreSource = 'midi' | 'musicxml' | 'template' | 'created';

export interface ImportedScoreLibraryEntry {
  id: string;
  source: ImportedScoreSource;
  fileName: string;
  score: ImportedRhythmScore;
  lastUsedAt: number;
  saved: boolean;
  userTags?: string[];
}

const MAX_RECENT_SCORES = 20;
export const MAX_SAVED_SCORES = 100;
export const MAX_IMPORTED_SCORE_TAG_LENGTH = 24;
export const MAX_IMPORTED_SCORE_TAGS = 12;

const PROTECTED_SCORE_TAGS = new Set(
  [
    'Imported', '已匯入', 'One hand', '單手', 'Both hands', '雙手',
    ...SCORE_TEMPLATE_TAGS,
    '簡單', '困難', '節日', '旋律', '二重奏', '切分音', '原創',
  ].map(normalizeTagKey),
);

export type AddImportedScoreUserTagResult =
  | 'added'
  | 'duplicate'
  | 'protected'
  | 'empty'
  | 'too-long'
  | 'limit'
  | 'missing-score';

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeTag(value: string): string {
  return value.normalize('NFKC').trim();
}

function normalizeTagKey(value: string): string {
  return normalizeTag(value).toLocaleLowerCase('en-US');
}

function normalizeUserTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tags: string[] = [];
  for (const candidate of value) {
    if (typeof candidate !== 'string') continue;
    const tag = normalizeTag(candidate);
    const key = normalizeTagKey(tag);
    if (!tag || tag.length > MAX_IMPORTED_SCORE_TAG_LENGTH || PROTECTED_SCORE_TAGS.has(key)) continue;
    if (tags.some((existing) => normalizeTagKey(existing) === key)) continue;
    tags.push(tag);
    if (tags.length >= MAX_IMPORTED_SCORE_TAGS) break;
  }
  return tags;
}

function isScoreEvent(value: unknown): value is ScoreRhythmEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<ScoreRhythmEvent>;
  return finiteNumber(event.startQuarter)
    && finiteNumber(event.durationQuarter)
    && event.startQuarter >= 0
    && event.durationQuarter > 0
    && (event.notationDurationQuarter === undefined || (finiteNumber(event.notationDurationQuarter)
      && event.notationDurationQuarter > 0
      && event.notationDurationQuarter <= event.durationQuarter + 0.000001))
    && (event.isRest === undefined || typeof event.isRest === 'boolean')
    && (event.tieToNext === undefined || typeof event.tieToNext === 'boolean')
    && (event.tieFromPrevious === undefined || typeof event.tieFromPrevious === 'boolean')
    && (event.isTieContinuation === undefined || typeof event.isTieContinuation === 'boolean')
    && (event.isCrossBarTieContinuation === undefined || typeof event.isCrossBarTieContinuation === 'boolean')
    && (event.midiPitches === undefined || (Array.isArray(event.midiPitches)
      && event.midiPitches.every((pitch) => finiteNumber(pitch) && pitch >= 0 && pitch <= 127)))
    && (event.tupletNumber === undefined || (Number.isInteger(event.tupletNumber)
      && event.tupletNumber >= 2 && event.tupletNumber <= 16));
}

export function isImportedRhythmScore(value: unknown): value is ImportedRhythmScore {
  if (!value || typeof value !== 'object') return false;
  const score = value as Partial<ImportedRhythmScore>;
  return score.formatVersion === 1
    && typeof score.title === 'string'
    && typeof score.timeSignature === 'string'
    && TIME_SIGNATURES.includes(score.timeSignature as (typeof TIME_SIGNATURES)[number])
    && (score.trackCount === 1 || score.trackCount === 2)
    && (score.bpm === null || finiteNumber(score.bpm))
    && finiteNumber(score.totalQuarterNotes)
    && score.totalQuarterNotes > 0
    && Array.isArray(score.measures)
    && score.measures.length > 0
    && score.measures.length <= 2_000
    && score.measures.every((measure) => Boolean(measure)
      && Number.isInteger(measure.index)
      && finiteNumber(measure.startQuarter)
      && finiteNumber(measure.durationQuarter)
      && measure.startQuarter >= 0
      && measure.durationQuarter > 0
      && Array.isArray(measure.leftEvents)
      && measure.leftEvents.every(isScoreEvent)
      && Array.isArray(measure.rightEvents)
      && measure.rightEvents.every(isScoreEvent))
    && Array.isArray(score.warnings)
    && score.warnings.every((warning) => typeof warning === 'string');
}

function isLibraryEntry(value: unknown): value is ImportedScoreLibraryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<ImportedScoreLibraryEntry>;
  return typeof entry.id === 'string'
    && (entry.source === 'midi' || entry.source === 'musicxml' || entry.source === 'template' || entry.source === 'created')
    && typeof entry.fileName === 'string'
    && finiteNumber(entry.lastUsedAt)
    && typeof entry.saved === 'boolean'
    && (entry.userTags === undefined || Array.isArray(entry.userTags))
    && isImportedRhythmScore(entry.score);
}

export function parseImportedScoreLibrary(raw: string | null): ImportedScoreLibraryEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return [];
    const entries = (parsed as { entries?: unknown }).entries;
    if (!Array.isArray(entries)) return [];
    return entries
      .filter(isLibraryEntry)
      .map((entry) => ({ ...entry, userTags: normalizeUserTags(entry.userTags) }))
      .sort((first, second) => second.lastUsedAt - first.lastUsedAt);
  } catch {
    return [];
  }
}

function scoreFingerprint(source: ImportedScoreSource, fileName: string, score: ImportedRhythmScore): string {
  const serialized = JSON.stringify({ source, fileName, score });
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `score-${(hash >>> 0).toString(36)}`;
}

export function createImportedScoreEntry(
  source: ImportedScoreSource,
  fileName: string,
  score: ImportedRhythmScore,
  now: number,
): ImportedScoreLibraryEntry {
  return {
    id: scoreFingerprint(source, fileName, score),
    source,
    fileName,
    score,
    lastUsedAt: now,
    saved: false,
    userTags: [],
  };
}

export function rememberImportedScore(
  entries: readonly ImportedScoreLibraryEntry[],
  imported: ImportedScoreLibraryEntry,
): ImportedScoreLibraryEntry[] {
  const previous = entries.find((entry) => entry.id === imported.id);
  const updated = {
    ...imported,
    saved: previous?.saved ?? false,
    userTags: normalizeUserTags(previous?.userTags ?? imported.userTags),
  };
  const all = [updated, ...entries.filter((entry) => entry.id !== updated.id)];
  const saved = all.filter((entry) => entry.saved);
  const recent = all.filter((entry) => !entry.saved).slice(0, MAX_RECENT_SCORES);
  return [...saved, ...recent].sort((first, second) => second.lastUsedAt - first.lastUsedAt);
}

export function setImportedScoreSaved(
  entries: readonly ImportedScoreLibraryEntry[],
  id: string,
  saved: boolean,
): ImportedScoreLibraryEntry[] {
  const currentEntry = entries.find((entry) => entry.id === id);
  if (saved && currentEntry && !currentEntry.saved && entries.filter((entry) => entry.saved).length >= MAX_SAVED_SCORES) {
    throw new Error(`You can save up to ${MAX_SAVED_SCORES} scores.`);
  }
  return entries.map((entry) => entry.id === id ? { ...entry, saved } : entry);
}

export function filterImportedScores(
  entries: readonly ImportedScoreLibraryEntry[],
  tags: readonly string[] = [],
): ImportedScoreLibraryEntry[] {
  return entries
    .filter((entry) => entry.source === 'midi' || entry.source === 'musicxml')
    .filter((entry) => tags.every((tag) => (entry.userTags ?? []).some((userTag) => normalizeTagKey(userTag) === normalizeTagKey(tag))))
    .sort((first, second) => second.lastUsedAt - first.lastUsedAt);
}

export function getImportedScoreSystemTags(entry: ImportedScoreLibraryEntry): string[] {
  return ['Imported', entry.score.trackCount === 1 ? 'One hand' : 'Both hands'];
}

export function addImportedScoreUserTag(
  entries: readonly ImportedScoreLibraryEntry[],
  id: string,
  rawTag: string,
): { entries: ImportedScoreLibraryEntry[]; result: AddImportedScoreUserTagResult } {
  const entry = entries.find((candidate) => candidate.id === id);
  if (!entry || (entry.source !== 'midi' && entry.source !== 'musicxml')) return { entries: [...entries], result: 'missing-score' };

  const tag = normalizeTag(rawTag);
  if (!tag) return { entries: [...entries], result: 'empty' };
  if (tag.length > MAX_IMPORTED_SCORE_TAG_LENGTH) return { entries: [...entries], result: 'too-long' };
  const key = normalizeTagKey(tag);
  if (PROTECTED_SCORE_TAGS.has(key)) return { entries: [...entries], result: 'protected' };

  const userTags = normalizeUserTags(entry.userTags);
  if (userTags.some((existing) => normalizeTagKey(existing) === key)) return { entries: [...entries], result: 'duplicate' };
  if (userTags.length >= MAX_IMPORTED_SCORE_TAGS) return { entries: [...entries], result: 'limit' };

  return {
    entries: entries.map((candidate) => candidate.id === id ? { ...candidate, userTags: [...userTags, tag] } : candidate),
    result: 'added',
  };
}

export function removeImportedScoreUserTag(
  entries: readonly ImportedScoreLibraryEntry[],
  id: string,
  tagToRemove: string,
): ImportedScoreLibraryEntry[] {
  const key = normalizeTagKey(tagToRemove);
  if (PROTECTED_SCORE_TAGS.has(key)) return [...entries];
  return entries.map((entry) => entry.id === id
    ? { ...entry, userTags: normalizeUserTags(entry.userTags).filter((tag) => normalizeTagKey(tag) !== key) }
    : entry);
}

export function placeSingleTrackOnHand(
  score: ImportedRhythmScore,
  hand: Hand,
): ImportedRhythmScore {
  if (score.trackCount !== 1) return score;
  return {
    ...score,
    measures: score.measures.map((measure) => {
      const events = measure.rightEvents.length > 0 ? measure.rightEvents : measure.leftEvents;
      return {
        ...measure,
        leftEvents: hand === 'left' ? events : [],
        rightEvents: hand === 'right' ? events : [],
      };
    }),
  };
}

import type { Hand, ReplayExpectedEvent, ReplayTap, SessionResults } from '@/types/rhythm';

export interface SessionRecordReplay {
  expectedEvents: ReplayExpectedEvent[];
  taps: ReplayTap[];
}

export interface SessionRecord {
  id: string;
  completedAt: number;
  bpm: number;
  timeSignature: string;
  durationSeconds: number;
  trainingMode: 'two-hand' | 'single-hand';
  singleHand: 'left' | 'right';
  source?: 'score';
  scoreTitle?: string;
  overallAccuracy: number;
  leftAccuracy: number;
  rightAccuracy: number;
  longestCorrectStreak: number;
  starred: boolean;
  replay?: SessionRecordReplay;
}

const MAX_SESSION_RECORDS = 100;

function accuracy(totalExpected: number, totalHit: number): number {
  return totalExpected === 0 ? 0 : (totalHit / totalExpected) * 100;
}

export function createSessionRecord(
  id: string,
  completedAt: number,
  results: SessionResults,
): SessionRecord {
  const totalExpected = results.left.totalExpected + results.right.totalExpected;
  const totalHit = results.left.totalHit + results.right.totalHit;
  const replay = createSessionRecordReplay(results);
  return {
    id,
    completedAt,
    bpm: results.bpm,
    timeSignature: results.timeSignature,
    durationSeconds: results.durationSeconds,
    trainingMode: results.trainingMode,
    singleHand: results.singleHand,
    ...(results.source ? { source: results.source } : {}),
    ...(results.scoreTitle ? { scoreTitle: results.scoreTitle } : {}),
    overallAccuracy: accuracy(totalExpected, totalHit),
    leftAccuracy: accuracy(results.left.totalExpected, results.left.totalHit),
    rightAccuracy: accuracy(results.right.totalExpected, results.right.totalHit),
    longestCorrectStreak: results.longestCorrectStreak,
    starred: false,
    ...(replay ? { replay } : {}),
  };
}

function createSessionRecordReplay(results: SessionResults): SessionRecordReplay | null {
  if (!results.replayExpectedEvents || !results.replayTaps) return null;
  return {
    expectedEvents: results.replayExpectedEvents.map((event) => ({
      id: event.id,
      hand: event.hand,
      barIndex: event.barIndex,
      beatInBar: event.beatInBar,
      durationQuarter: event.durationQuarter,
      ...(event.tupletNumber === undefined ? {} : { tupletNumber: event.tupletNumber }),
      isScoreEvent: event.isScoreEvent,
      expectedTimeMs: event.expectedTimeMs,
      matched: event.matched,
      ...(event.reached === undefined ? {} : { reached: event.reached }),
      ...(event.timingErrorMs === undefined ? {} : { timingErrorMs: event.timingErrorMs }),
      ...(event.midiPitches === undefined ? {} : { midiPitches: [...event.midiPitches] }),
    })),
    taps: results.replayTaps.map((tap) => ({
      id: tap.id,
      hand: tap.hand,
      barIndex: tap.barIndex,
      timestampMs: tap.timestampMs,
      ...(tap.matchedEventId === undefined ? {} : { matchedEventId: tap.matchedEventId }),
      ...(tap.timingErrorMs === undefined ? {} : { timingErrorMs: tap.timingErrorMs }),
      ...(tap.midiPitches === undefined ? {} : { midiPitches: [...tap.midiPitches] }),
    })),
  };
}

function isHand(value: unknown): value is Hand {
  return value === 'left' || value === 'right';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseReplayExpectedEvent(value: unknown): ReplayExpectedEvent | null {
  if (!value || typeof value !== 'object') return null;
  const event = value as Partial<ReplayExpectedEvent>;
  if (
    typeof event.id !== 'string' ||
    !isHand(event.hand) ||
    !Number.isInteger(event.barIndex) || event.barIndex! < 1 ||
    !isFiniteNumber(event.beatInBar) || event.beatInBar < 0 ||
    !isFiniteNumber(event.durationQuarter) || event.durationQuarter <= 0 ||
    typeof event.isScoreEvent !== 'boolean' ||
    !isFiniteNumber(event.expectedTimeMs) ||
    typeof event.matched !== 'boolean' ||
    (event.reached !== undefined && typeof event.reached !== 'boolean') ||
    (event.tupletNumber !== undefined && (!Number.isInteger(event.tupletNumber) || event.tupletNumber! < 2)) ||
    (event.timingErrorMs !== undefined && !isFiniteNumber(event.timingErrorMs)) ||
    (event.midiPitches !== undefined && (!Array.isArray(event.midiPitches) || !event.midiPitches.every(isFiniteNumber)))
  ) return null;
  return {
    id: event.id,
    hand: event.hand,
    barIndex: event.barIndex!,
    beatInBar: event.beatInBar,
    durationQuarter: event.durationQuarter,
    ...(event.tupletNumber === undefined ? {} : { tupletNumber: event.tupletNumber }),
    isScoreEvent: event.isScoreEvent,
    expectedTimeMs: event.expectedTimeMs,
    matched: event.matched,
    ...(event.reached === undefined ? {} : { reached: event.reached }),
    ...(event.timingErrorMs === undefined ? {} : { timingErrorMs: event.timingErrorMs }),
    ...(event.midiPitches === undefined ? {} : { midiPitches: [...event.midiPitches] }),
  };
}

function parseReplayTap(value: unknown): ReplayTap | null {
  if (!value || typeof value !== 'object') return null;
  const tap = value as Partial<ReplayTap>;
  if (
    typeof tap.id !== 'string' ||
    !isHand(tap.hand) ||
    !Number.isInteger(tap.barIndex) || tap.barIndex! < 1 ||
    !isFiniteNumber(tap.timestampMs) || tap.timestampMs < 0 ||
    (tap.matchedEventId !== undefined && typeof tap.matchedEventId !== 'string') ||
    (tap.timingErrorMs !== undefined && !isFiniteNumber(tap.timingErrorMs)) ||
    (tap.midiPitches !== undefined && (!Array.isArray(tap.midiPitches) || !tap.midiPitches.every(isFiniteNumber)))
  ) return null;
  return {
    id: tap.id,
    hand: tap.hand,
    barIndex: tap.barIndex!,
    timestampMs: tap.timestampMs,
    ...(tap.matchedEventId === undefined ? {} : { matchedEventId: tap.matchedEventId }),
    ...(tap.timingErrorMs === undefined ? {} : { timingErrorMs: tap.timingErrorMs }),
    ...(tap.midiPitches === undefined ? {} : { midiPitches: [...tap.midiPitches] }),
  };
}

function parseSessionRecordReplay(value: unknown): SessionRecordReplay | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const replay = value as Partial<SessionRecordReplay>;
  if (!Array.isArray(replay.expectedEvents) || !Array.isArray(replay.taps)) return undefined;
  const expectedEvents = replay.expectedEvents.map(parseReplayExpectedEvent);
  const taps = replay.taps.map(parseReplayTap);
  if (expectedEvents.some((event) => event === null) || taps.some((tap) => tap === null)) return undefined;
  return {
    expectedEvents: expectedEvents as ReplayExpectedEvent[],
    taps: taps as ReplayTap[],
  };
}

function isSessionRecord(value: unknown): value is SessionRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<SessionRecord>;
  return typeof record.id === 'string' &&
    typeof record.completedAt === 'number' &&
    typeof record.bpm === 'number' &&
    typeof record.timeSignature === 'string' &&
    typeof record.durationSeconds === 'number' &&
    (record.trainingMode === 'two-hand' || record.trainingMode === 'single-hand') &&
    (record.singleHand === 'left' || record.singleHand === 'right') &&
    (record.source === undefined || record.source === 'score') &&
    (record.scoreTitle === undefined || typeof record.scoreTitle === 'string') &&
    typeof record.overallAccuracy === 'number' &&
    typeof record.leftAccuracy === 'number' &&
    typeof record.rightAccuracy === 'number' &&
    (record.starred === undefined || typeof record.starred === 'boolean') &&
    (record.longestCorrectStreak === undefined || Number.isInteger(record.longestCorrectStreak));
}

export function parseSessionHistory(raw: string | null): SessionRecord[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter(isSessionRecord)
          .map((record) => {
            const normalizedRecord = {
              ...record,
              starred: record.starred ?? false,
              longestCorrectStreak: record.longestCorrectStreak ?? 0,
            };
            const replay = parseSessionRecordReplay(record.replay);
            if (replay) normalizedRecord.replay = replay;
            else delete normalizedRecord.replay;
            return normalizedRecord;
          })
          .slice(0, MAX_SESSION_RECORDS)
      : [];
  } catch {
    return [];
  }
}

export function appendSessionRecord(
  records: readonly SessionRecord[],
  record: SessionRecord,
): SessionRecord[] {
  return [record, ...records.filter((item) => item.id !== record.id)]
    .slice(0, MAX_SESSION_RECORDS);
}

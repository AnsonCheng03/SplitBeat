import type { SessionResults } from '@/types/rhythm';

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
    typeof record.rightAccuracy === 'number';
}

export function parseSessionHistory(raw: string | null): SessionRecord[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(isSessionRecord).slice(0, MAX_SESSION_RECORDS)
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

import type { SessionRecord } from '@/store/sessionHistory';

export function formatCompletedAt(timestamp: number, locale: 'en' | 'zh-Hant'): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

export function primaryRecordHand(record: SessionRecord): 'left' | 'right' {
  return record.trainingMode === 'single-hand' ? record.singleHand : 'left';
}

export function primaryRecordAccuracy(record: SessionRecord): number {
  return primaryRecordHand(record) === 'left' ? record.leftAccuracy : record.rightAccuracy;
}

export function recordSessionTitle(record: SessionRecord): string {
  if (record.source === 'score') return record.scoreTitle || 'Imported score';
  return record.trainingMode === 'single-hand' ? 'One hand' : 'Two hands';
}

export function bestSessionRecord(records: readonly SessionRecord[]): SessionRecord | null {
  return records.reduce<SessionRecord | null>(
    (best, record) => !best || record.overallAccuracy > best.overallAccuracy ? record : best,
    null,
  );
}

export function longestSessionStreak(records: readonly SessionRecord[]): number {
  return records.reduce((best, record) => Math.max(best, record.longestCorrectStreak), 0);
}

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

export function favoriteSessionsFirst(records: readonly SessionRecord[]): SessionRecord[] {
  return [
    ...records.filter((record) => record.starred),
    ...records.filter((record) => !record.starred),
  ];
}

export function createSessionShareMessage(record: SessionRecord, locale: 'en' | 'zh-Hant'): string {
  const isChinese = locale === 'zh-Hant';
  const sessionTitle = record.source === 'score'
    ? record.scoreTitle || (isChinese ? '匯入樂譜' : 'Imported score')
    : isChinese
      ? record.trainingMode === 'single-hand' ? '單手練習' : '雙手練習'
      : record.trainingMode === 'single-hand' ? 'One-hand practice' : 'Two-hand practice';
  const handSummary = record.trainingMode === 'single-hand'
    ? isChinese
      ? `${record.singleHand === 'left' ? '左手' : '右手'} ${Math.round(record.singleHand === 'left' ? record.leftAccuracy : record.rightAccuracy)}%`
      : `${record.singleHand === 'left' ? 'Left' : 'Right'} hand ${Math.round(record.singleHand === 'left' ? record.leftAccuracy : record.rightAccuracy)}%`
    : isChinese
      ? `左手 ${Math.round(record.leftAccuracy)}% · 右手 ${Math.round(record.rightAccuracy)}%`
      : `Left ${Math.round(record.leftAccuracy)}% · Right ${Math.round(record.rightAccuracy)}%`;

  return isChinese
    ? [
      '我剛用 Beep Beep Beat 練習了節奏！',
      `練習：${sessionTitle}`,
      `拍號：${record.timeSignature} · 速度：${record.bpm} BPM`,
      `準確率：${Math.round(record.overallAccuracy)}%（${handSummary}）`,
      `連續正確：${record.longestCorrectStreak}`,
      '你也來試試吧！',
    ].join('\n')
    : [
      'I just practised rhythm with Beep Beep Beat!',
      `Session: ${sessionTitle}`,
      `Meter: ${record.timeSignature} · Tempo: ${record.bpm} BPM`,
      `Accuracy: ${Math.round(record.overallAccuracy)}% (${handSummary})`,
      `Longest clean run: ${record.longestCorrectStreak}`,
      'Try it with me!',
    ].join('\n');
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

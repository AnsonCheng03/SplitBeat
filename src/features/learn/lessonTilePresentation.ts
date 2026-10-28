export interface LearnLessonTileStatusInput {
  skipped: boolean;
  completed: boolean;
  paywalled: boolean;
  isCheckpoint: boolean;
  checkpointChallenge: boolean;
  unlockedByCheckpoint: boolean;
  locked: boolean;
}

export function getLearnLessonTileBadge({
  skipped,
  completed,
  paywalled,
  checkpointChallenge,
  unlockedByCheckpoint,
  locked,
}: LearnLessonTileStatusInput): string {
  if (skipped) return '↪';
  if (completed) return '✓';
  if (paywalled) return 'PRO';
  if (checkpointChallenge) return 'TEST';
  if (unlockedByCheckpoint) return 'OPEN';
  if (locked) return 'LOCKED';
  return '›';
}

export function getLearnLessonAccessibilityStatusKeys({
  skipped,
  completed,
  paywalled,
  isCheckpoint,
  checkpointChallenge,
  unlockedByCheckpoint,
  locked,
}: LearnLessonTileStatusInput): string[] {
  if (skipped) return [', skipped, can be replayed'];
  if (completed) return [', complete'];

  const statusKeys: string[] = [];
  if (paywalled) statusKeys.push(', paid course, tap to unlock');
  if (unlockedByCheckpoint) statusKeys.push(', unlocked by a five-star checkpoint');
  else if (checkpointChallenge) statusKeys.push(', checkpoint lesson, play to test for five stars');
  else if (isCheckpoint) statusKeys.push(', checkpoint lesson');
  if (locked && !paywalled) statusKeys.push(', locked');
  return statusKeys;
}

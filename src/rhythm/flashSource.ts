import type { FlashSource, TapFeedback } from '@/types/rhythm';

export function normalizeFlashSource(value: unknown, fallback: FlashSource = 'tap'): FlashSource {
  return value === 'tap' || value === 'beat' ? value : fallback;
}

export function shouldFlashOnTap(source: FlashSource, feedback: TapFeedback): boolean {
  return feedback === 'miss' || (feedback === 'hit' && source === 'tap');
}

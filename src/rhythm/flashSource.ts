import type { FlashSource, TapFeedback } from '@/types/rhythm';

export function normalizeFlashSource(value: unknown, fallback: FlashSource = 'tap'): FlashSource {
  return value === 'tap' || value === 'beat' ? value : fallback;
}

export function shouldFlashOnTap(source: FlashSource, feedback: TapFeedback): boolean {
  return feedback === 'hit' && source === 'tap';
}

export type TapResultFlash = 'correct' | 'incorrect';

export function getTapResultFlash(
  enabled: boolean,
  feedback: TapFeedback,
): TapResultFlash | null {
  if (!enabled || feedback === 'ignored') return null;
  return feedback === 'hit' ? 'correct' : 'incorrect';
}

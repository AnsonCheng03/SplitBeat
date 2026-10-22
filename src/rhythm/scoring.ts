import type { AccuracyStats, HandStats } from '@/types/rhythm';

export function accuracyPercent(stats: AccuracyStats): number {
  return stats.totalExpected === 0 ? 0 : (stats.totalHit / stats.totalExpected) * 100;
}

export function emptyHandStats(): HandStats {
  return {
    totalExpected: 0,
    totalHit: 0,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    averageAbsoluteErrorMs: 0,
    averageSignedErrorMs: 0,
  };
}

export function finalizeHandStats(
  totalExpected: number,
  totalHit: number,
  perfect: number,
  great: number,
  good: number,
  miss: number,
  absoluteErrorTotal: number,
  signedErrorTotal: number,
): HandStats {
  return {
    totalExpected,
    totalHit,
    perfect,
    great,
    good,
    miss,
    averageAbsoluteErrorMs: totalHit === 0 ? 0 : absoluteErrorTotal / totalHit,
    averageSignedErrorMs: totalHit === 0 ? 0 : signedErrorTotal / totalHit,
  };
}

import { useCallback, useRef } from 'react';
import { addTapTempoSample } from '@/rhythm/tapTempo';

function monotonicNow(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}

export function useTapTempo(onBpmChange: (bpm: number) => void) {
  const tapTimesRef = useRef<number[]>([]);

  return useCallback(() => {
    const sample = addTapTempoSample(tapTimesRef.current, monotonicNow());
    tapTimesRef.current = sample.tapTimes;
    if (sample.bpm !== null) onBpmChange(sample.bpm);
  }, [onBpmChange]);
}

import { useCallback, useEffect, useRef, useState } from 'react';

const SKIP_HOLD_DURATION_MS = 1_300;

export function useTutorialSkipHold(onSkip: () => void) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const triggeredRef = useRef(false);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const startHold = useCallback(() => {
    stopTimer();
    triggeredRef.current = false;
    startedAtRef.current = Date.now();
    setProgress(0);
    timerRef.current = setInterval(() => {
      const nextProgress = Math.min(1, (Date.now() - startedAtRef.current) / SKIP_HOLD_DURATION_MS);
      setProgress(nextProgress);
      if (nextProgress >= 1 && !triggeredRef.current) {
        triggeredRef.current = true;
        stopTimer();
        onSkip();
      }
    }, 32);
  }, [onSkip, stopTimer]);

  const endHold = useCallback(() => {
    stopTimer();
    if (!triggeredRef.current) setProgress(0);
  }, [stopTimer]);

  useEffect(() => stopTimer, [stopTimer]);

  return { progress, startHold, endHold };
}

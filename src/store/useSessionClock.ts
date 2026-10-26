import { useCallback, useEffect, useRef } from 'react';

export function useSessionClock() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stopSessionClock = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = undefined;
  }, []);

  const scheduleSessionClock = useCallback((
    advanceClock: () => boolean,
    initialDelayMs = 30,
  ) => {
    const runClockTick = () => {
      if (!advanceClock()) return;
      timerRef.current = setTimeout(runClockTick, 50);
    };
    timerRef.current = setTimeout(runClockTick, initialDelayMs);
  }, []);

  useEffect(() => () => stopSessionClock(), [stopSessionClock]);

  return { stopSessionClock, scheduleSessionClock };
}

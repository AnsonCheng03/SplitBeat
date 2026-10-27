import { useCallback, useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

export function useShakeToRevealOption({
  active,
  optionEnabled,
}: {
  active: boolean;
  optionEnabled: boolean;
}) {
  const [isRevealed, setIsRevealed] = useState(optionEnabled);
  const wasActive = useRef(false);

  useEffect(() => {
    if (!active) {
      wasActive.current = false;
      return;
    }

    if (!wasActive.current) {
      wasActive.current = true;
      setIsRevealed(optionEnabled);
    }
  }, [active, optionEnabled]);

  useEffect(() => {
    if (!active || optionEnabled || isRevealed) return;

    let disposed = false;
    let revealed = false;
    let previous: { x: number; y: number; z: number } | null = null;
    let shakeImpulses = 0;
    let lastImpulseAt = 0;
    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;

    const detectShake = (acceleration: { x: number; y: number; z: number }) => {
      const current = { x: acceleration.x, y: acceleration.y, z: acceleration.z };
      if (previous) {
        const delta = Math.hypot(
          current.x - previous.x,
          current.y - previous.y,
          current.z - previous.z,
        );
        const now = Date.now();
        if (delta > 1.25) {
          shakeImpulses = now - lastImpulseAt < 650 ? shakeImpulses + 1 : 1;
          lastImpulseAt = now;
          if (shakeImpulses >= 2 && !revealed) {
            revealed = true;
            setIsRevealed(true);
            subscription?.remove();
          }
        }
      }
      previous = current;
    };

    void Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!available || disposed) return;
        Accelerometer.setUpdateInterval(100);
        subscription = Accelerometer.addListener(detectShake);
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      subscription?.remove();
    };
  }, [active, isRevealed, optionEnabled]);

  const reveal = useCallback(() => setIsRevealed(true), []);

  return { isRevealed, reveal };
}

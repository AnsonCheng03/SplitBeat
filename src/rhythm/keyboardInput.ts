import type { Hand } from '@/types/rhythm';

export const KEYBOARD_KEYS_BY_HAND: Record<Hand, string> = {
  left: 'qwertasdfgzxcvb12345',
  right: 'yuiophjklmn67890',
};

export interface NativeHardwareKeyEvent {
  key: string;
  eventTimeMs: number;
  nativeTimeMs: number;
}

export interface SynchronizedKeyboardTimestamp {
  timestampMs: number;
  clockOffsetMs: number;
}

export function keyboardHandForKey(key: string): Hand | null {
  const normalizedKey = key.toLowerCase();
  if (normalizedKey.length !== 1) return null;
  if (KEYBOARD_KEYS_BY_HAND.left.includes(normalizedKey)) return 'left';
  if (KEYBOARD_KEYS_BY_HAND.right.includes(normalizedKey)) return 'right';
  return null;
}

export function isNativeHardwareKeyEvent(value: unknown): value is NativeHardwareKeyEvent {
  if (typeof value !== 'object' || value === null) return false;
  const event = value as Partial<NativeHardwareKeyEvent>;
  return (
    typeof event.key === 'string' &&
    typeof event.eventTimeMs === 'number' &&
    Number.isFinite(event.eventTimeMs) &&
    typeof event.nativeTimeMs === 'number' &&
    Number.isFinite(event.nativeTimeMs)
  );
}

export function synchronizeKeyboardTimestamp(
  eventTimeMs: number,
  nativeTimeMs: number,
  receivedAtMs: number,
  previousClockOffsetMs: number | null,
): SynchronizedKeyboardTimestamp {
  const sampledClockOffsetMs = receivedAtMs - nativeTimeMs;
  const clockOffsetMs =
    previousClockOffsetMs === null
      ? sampledClockOffsetMs
      : Math.min(previousClockOffsetMs, sampledClockOffsetMs);

  return {
    timestampMs: eventTimeMs + clockOffsetMs,
    clockOffsetMs,
  };
}

import { useCallback, useEffect, useRef } from 'react';
import { DeviceEventEmitter, Platform, TextInput } from 'react-native';
import type { Hand } from '@/types/rhythm';
import {
  isNativeHardwareKeyEvent,
  keyboardHandForKey,
  synchronizeKeyboardTimestamp,
} from '@/rhythm/keyboardInput';
import { HardwareKeyboardInputStyle1 } from '@/styles/shared';

const ANDROID_KEY_EVENT = 'SplitBeatHardwareKeyPress';

interface HardwareKeyboardInputProps {
  onTap: (hand: Hand, timestamp: number) => void;
}

export function HardwareKeyboardInput({ onTap }: HardwareKeyboardInputProps) {
  const inputRef = useRef<TextInput>(null);
  const clockOffsetMsRef = useRef<number | null>(null);

  const handleKey = useCallback(
    (key: string, nativeEventTimeMs?: number, nativeTimeMs?: number) => {
      const hand = keyboardHandForKey(key);
      if (!hand) return;

      let timestamp = globalThis.performance.now();
      if (nativeEventTimeMs !== undefined && nativeTimeMs !== undefined) {
        const synchronizedTime = synchronizeKeyboardTimestamp(
          nativeEventTimeMs,
          nativeTimeMs,
          timestamp,
          clockOffsetMsRef.current,
        );
        clockOffsetMsRef.current = synchronizedTime.clockOffsetMs;
        timestamp = synchronizedTime.timestampMs;
      }

      onTap(hand, timestamp);
    },
    [onTap],
  );

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = DeviceEventEmitter.addListener(ANDROID_KEY_EVENT, (value: unknown) => {
      if (!isNativeHardwareKeyEvent(value)) return;
      handleKey(value.key, value.eventTimeMs, value.nativeTimeMs);
    });

    return () => subscription.remove();
  }, [handleKey]);

  if (Platform.OS !== 'ios') return null;

  return (
    <TextInput
      ref={inputRef}
      testID="practice.keyboardInput"
      accessible={false}
      autoCapitalize="none"
      autoCorrect={false}
      autoFocus
      caretHidden
      contextMenuHidden
      maxLength={1}
      onChangeText={() => inputRef.current?.clear()}
      onKeyPress={(event) => handleKey(event.nativeEvent.key)}
      pointerEvents="none"
      showSoftInputOnFocus={false}
      style={HardwareKeyboardInputStyle1()}
    />
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Hand, TapFeedback } from '@/types/rhythm';
import { colors } from '@/theme';

interface TapZoneProps {
  hand: Hand;
  onTap: (hand: Hand, timestamp: number) => TapFeedback | null;
  hapticsEnabled: boolean;
  keyboardTapToken?: number;
  keyboardTapFeedback?: TapFeedback | null;
  enabled?: boolean;
  resting?: boolean;
  compact?: boolean;
}

const KEYBOARD_KEYS_BY_HAND = {
  left: 'Q W E R T · A S D F G · Z X C V B · 1–5',
  right: 'Y U I O P · H J K L · N M · 6–0',
} as const;

export function TapZone({
  hand,
  onTap,
  hapticsEnabled,
  keyboardTapToken = 0,
  keyboardTapFeedback = null,
  enabled = true,
  resting = false,
  compact = false,
}: TapZoneProps) {
  const [pressed, setPressed] = useState(false);
  const [missed, setMissed] = useState(false);
  const [missOpacity] = useState(() => new Animated.Value(0));
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousKeyboardTapToken = useRef(keyboardTapToken);
  const isLeft = hand === 'left';
  const accent = isLeft ? colors.left : colors.right;

  const showFeedback = useCallback((feedback: TapFeedback | null) => {
    if (!feedback || feedback === 'ignored') return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (feedback === 'miss') {
      setPressed(false);
      setMissed(true);
      missOpacity.stopAnimation();
      missOpacity.setValue(0.32);
      Animated.timing(missOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
      resetTimer.current = setTimeout(() => setMissed(false), 500);
    } else {
      setMissed(false);
      setPressed(true);
      resetTimer.current = setTimeout(() => setPressed(false), 110);
    }
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  }, [hapticsEnabled, missOpacity]);

  useEffect(
    () => () => {
      if (resetTimer.current !== undefined) clearTimeout(resetTimer.current);
      missOpacity.stopAnimation();
    },
    [missOpacity],
  );

  useEffect(() => {
    if (keyboardTapToken === previousKeyboardTapToken.current) return;
    previousKeyboardTapToken.current = keyboardTapToken;
    showFeedback(keyboardTapFeedback);
  }, [keyboardTapFeedback, keyboardTapToken, showFeedback]);

  const handleTouch = () => {
    if (!enabled) return;
    const timestamp = globalThis.performance.now();
    const feedback = onTap(hand, timestamp);
    showFeedback(feedback);
  };

  return (
    <View
      testID={`practice.tap.${hand}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      accessibilityLabel={missed
        ? 'OFF BEAT'
        : `${hand} hand tap zone${enabled ? `, keyboard keys ${KEYBOARD_KEYS_BY_HAND[hand]}` : ', inactive in single hand mode'}`}
      onTouchStart={handleTouch}
      collapsable={false}
      style={{
        flex: 1,
        minHeight: compact ? 90 : 180,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? (isLeft ? '#1D483D' : '#382B56') : isLeft ? colors.leftSurface : colors.rightSurface,
        borderColor: pressed ? accent : isLeft ? '#1A4037' : '#302747',
        borderWidth: 1,
        borderRadius: 18,
        marginHorizontal: 4,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        opacity: enabled ? 1 : 0.44,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 18, backgroundColor: colors.danger, opacity: missOpacity }}
      />
      <Text style={{ color: accent, fontSize: compact ? 11 : 12, fontWeight: '800', letterSpacing: 2 }}>
        {!enabled || resting ? 'REST' : isLeft ? 'LEFT' : 'RIGHT'}
      </Text>
      <Text style={{ color: colors.text, fontSize: compact ? 18 : 21, fontWeight: '700', marginTop: 6 }}>
        {!enabled ? 'OFF' : resting ? 'WAIT' : 'TAP'}
      </Text>
      <Text
        testID={`practice.keyboard.${hand}Keys`}
        numberOfLines={1}
        style={{
          color: colors.muted,
          fontSize: compact ? 7 : 8,
          fontWeight: '700',
          letterSpacing: 0.1,
          marginTop: 4,
        }}
      >
        {KEYBOARD_KEYS_BY_HAND[hand]}
      </Text>
      {missed ? (
        <Text
          testID={`practice.tap.${hand}.miss`}
          style={{ position: 'absolute', top: compact ? 8 : 11, right: 10, color: colors.danger, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }}
        >
          OFF BEAT
        </Text>
      ) : null}
      <View
        style={{
          position: 'absolute',
          bottom: compact ? 12 : 16,
          width: 30,
          height: 3,
          borderRadius: 4,
          backgroundColor: accent,
          opacity: pressed ? 1 : 0.5,
        }}
      />
    </View>
  );
}

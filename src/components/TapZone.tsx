import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Hand } from '@/types/rhythm';
import { colors } from '@/theme';

interface TapZoneProps {
  hand: Hand;
  onTap: (hand: Hand, timestamp: number) => void;
  hapticsEnabled: boolean;
  keyboardTapToken?: number;
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
  compact = false,
}: TapZoneProps) {
  const [pressed, setPressed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousKeyboardTapToken = useRef(keyboardTapToken);
  const isLeft = hand === 'left';
  const accent = isLeft ? colors.left : colors.right;

  const showFeedback = useCallback(() => {
    setPressed(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setPressed(false), 110);
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  }, [hapticsEnabled]);

  useEffect(
    () => () => {
      if (resetTimer.current !== undefined) clearTimeout(resetTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (keyboardTapToken === previousKeyboardTapToken.current) return;
    previousKeyboardTapToken.current = keyboardTapToken;
    showFeedback();
  }, [keyboardTapToken, showFeedback]);

  const handleTouch = () => {
    const timestamp = globalThis.performance.now();
    onTap(hand, timestamp);
    showFeedback();
  };

  return (
    <View
      testID={`practice.tap.${hand}`}
      accessibilityRole="button"
      accessibilityLabel={`${hand} hand tap zone, keyboard keys ${KEYBOARD_KEYS_BY_HAND[hand]}`}
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
      }}
    >
      <Text style={{ color: accent, fontSize: compact ? 11 : 12, fontWeight: '800', letterSpacing: 2 }}>
        {isLeft ? 'LEFT' : 'RIGHT'}
      </Text>
      <Text style={{ color: colors.text, fontSize: compact ? 18 : 21, fontWeight: '700', marginTop: 6 }}>
        TAP
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

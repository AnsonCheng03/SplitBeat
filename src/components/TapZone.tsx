import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Hand } from '@/types/rhythm';
import { colors } from '@/theme';

interface TapZoneProps {
  hand: Hand;
  onTap: (hand: Hand, timestamp: number) => void;
  hapticsEnabled: boolean;
  compact?: boolean;
}

export function TapZone({ hand, onTap, hapticsEnabled, compact = false }: TapZoneProps) {
  const [pressed, setPressed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isLeft = hand === 'left';
  const accent = isLeft ? colors.left : colors.right;

  useEffect(
    () => () => {
      if (resetTimer.current !== undefined) clearTimeout(resetTimer.current);
    },
    [],
  );

  const handleTouch = () => {
    const timestamp = globalThis.performance.now();
    onTap(hand, timestamp);
    setPressed(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setPressed(false), 110);
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  };

  return (
    <View
      testID={`practice.tap.${hand}`}
      accessibilityRole="button"
      accessibilityLabel={`${hand} hand tap zone`}
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

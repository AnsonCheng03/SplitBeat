import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { colors } from '@/theme';
import type { ExerciseStep, Hand, Subdivision, TimeSignature } from '@/types/rhythm';

interface NextPatternPreviewProps {
  step: ExerciseStep | null;
  beatsUntilChange: number;
  graceNotesEnabled?: boolean;
  restBeforeChange?: boolean;
  compact?: boolean;
  timeSignature: TimeSignature;
  top: number;
  height: number;
}

interface HandPreviewProps {
  hand: Hand;
  subdivision: Subdivision;
  timeSignature: TimeSignature;
  compact: boolean;
}

function HandPreview({ hand, subdivision, timeSignature, compact }: HandPreviewProps) {
  const color = hand === 'left' ? colors.left : colors.right;

  return (
    <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: compact ? 3 : 5 }}>
      <Text
        numberOfLines={1}
        style={{ color, fontSize: compact ? 11 : 12, fontWeight: '900', letterSpacing: 1 }}
      >
        {hand.toUpperCase()}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 9 : 12, minWidth: 0 }}>
        <RhythmSymbol subdivision={subdivision} color={color} timeSignature={timeSignature} />
        <Text
          numberOfLines={2}
          style={{
            flexShrink: 1,
            color: colors.text,
            fontSize: compact ? 14 : 16,
            lineHeight: compact ? 17 : 19,
            fontWeight: '800',
          }}
        >
          {SUBDIVISION_LABELS[subdivision]}
        </Text>
      </View>
    </View>
  );
}

export function NextPatternPreview({
  step,
  beatsUntilChange,
  graceNotesEnabled = false,
  restBeforeChange = false,
  compact = false,
  timeSignature,
  top,
  height,
}: NextPatternPreviewProps) {
  const [slideProgress] = useState(() => new Animated.Value(0));
  const stepId = step?.id;

  useEffect(() => {
    if (!stepId) return;

    slideProgress.setValue(0);
    const animation = Animated.timing(slideProgress, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [slideProgress, stepId]);

  if (!step) return null;

  const countLabel = beatsUntilChange === 1 ? 'BEAT' : 'BEATS';
  const changeDetail = restBeforeChange
    ? ', with a rest before the change'
    : graceNotesEnabled
      ? ', with a grace note pickup before the change'
      : '';

  return (
    <Animated.View
      testID="practice.nextPattern"
      pointerEvents="none"
      accessibilityLabel={
        `Next pattern. Changes in ${beatsUntilChange} ${beatsUntilChange === 1 ? 'beat' : 'beats'}. ` +
        `Left hand: ${SUBDIVISION_LABELS[step.leftSubdivision]}. ` +
        `Right hand: ${SUBDIVISION_LABELS[step.rightSubdivision]}` + changeDetail
      }
      style={{
        position: 'absolute',
        top,
        alignSelf: 'center',
        width: '94%',
        maxWidth: 760,
        height,
        opacity: slideProgress,
        transform: [{ translateY: slideProgress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderWidth: 1,
          borderRadius: 13,
          paddingHorizontal: compact ? 10 : 14,
          paddingVertical: compact ? 6 : 9,
          gap: compact ? 8 : 12,
        }}
      >
        <View style={{ width: compact ? 94 : 116, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: compact ? 10 : 11, fontWeight: '900', letterSpacing: 1 }}>
            UP NEXT
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 2 }}>
            <Text
              testID="practice.nextPattern.countdown"
              style={{ color: colors.accent, fontSize: compact ? 29 : 34, lineHeight: compact ? 33 : 38, fontWeight: '900', fontVariant: ['tabular-nums'] }}
            >
              {beatsUntilChange}
            </Text>
            <Text style={{ color: colors.accent, fontSize: compact ? 11 : 12, fontWeight: '900', letterSpacing: 0.5 }}>
              {countLabel}
            </Text>
          </View>
          {restBeforeChange || graceNotesEnabled ? (
            <Text style={{ color: colors.accent, fontSize: compact ? 9 : 10, fontWeight: '800', letterSpacing: 0.4 }}>
              {restBeforeChange ? 'REST FIRST' : 'GRACE PICKUP'}
            </Text>
          ) : null}
        </View>

        <View style={{ width: 1, height: '76%', backgroundColor: colors.line }} />
        <HandPreview hand="left" subdivision={step.leftSubdivision} timeSignature={timeSignature} compact={compact} />
        <View style={{ width: 1, height: '76%', backgroundColor: colors.line }} />
        <HandPreview hand="right" subdivision={step.rightSubdivision} timeSignature={timeSignature} compact={compact} />
      </View>
    </Animated.View>
  );
}

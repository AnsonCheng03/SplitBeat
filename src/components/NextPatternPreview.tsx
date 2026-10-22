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
}

interface HandPreviewProps {
  hand: Hand;
  subdivision: Subdivision;
  timeSignature: TimeSignature;
  compact?: boolean;
}

function HandPreview({ hand, subdivision, timeSignature, compact = false }: HandPreviewProps) {
  const color = hand === 'left' ? colors.left : colors.right;

  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: compact ? 3 : 7 }}>
      <RhythmSymbol subdivision={subdivision} color={color} mini timeSignature={timeSignature} />
      <View style={{ flexShrink: 1 }}>
        <Text style={{ color, fontSize: compact ? 8 : 9, fontWeight: '800', letterSpacing: 1 }}>
          {hand.toUpperCase()}
        </Text>
        <Text numberOfLines={2} style={{ color: colors.text, fontSize: compact ? 9 : 11, fontWeight: '700' }}>
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
}: NextPatternPreviewProps) {
  const [slideProgress] = useState(() => new Animated.Value(0));
  const stepId = step?.id;

  useEffect(() => {
    if (!stepId || beatsUntilChange > 1) return;

    slideProgress.setValue(0);
    const animation = Animated.timing(slideProgress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [beatsUntilChange, slideProgress, stepId]);

  if (!step || beatsUntilChange > 1) return null;

  const translateY = slideProgress.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] });

  return (
    <Animated.View
      testID="practice.nextPattern"
      accessibilityLabel={
        `Next pattern in ${beatsUntilChange} ${beatsUntilChange === 1 ? 'beat' : 'beats'}: left ` +
        `${SUBDIVISION_LABELS[step.leftSubdivision]}, right ${SUBDIVISION_LABELS[step.rightSubdivision]}` +
        (restBeforeChange ? ', with a rest before the change' : graceNotesEnabled ? ', with a grace note pickup before the change' : '')
      }
      style={{
        opacity: slideProgress,
        transform: [{ translateY }],
        alignSelf: 'center',
        width: compact ? 420 : 460,
        maxWidth: '100%',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 9,
          paddingHorizontal: compact ? 7 : 10,
          height: compact ? 34 : 38,
          gap: compact ? 5 : 8,
        }}
      >
        <View style={{ alignItems: 'flex-start', justifyContent: 'center' }}>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: compact ? 7 : 8, fontWeight: '800', letterSpacing: 0.8 }}>
            UP NEXT
          </Text>
          <Text testID="practice.nextPattern.countdown" style={{ color: colors.accent, fontSize: compact ? 9 : 10, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
            {beatsUntilChange} {beatsUntilChange === 1 ? 'BEAT' : 'BEATS'}
          </Text>
            {restBeforeChange ? (
            <Text testID="practice.restPreview" style={{ position: 'absolute', left: compact ? 48 : 56, top: 1, color: colors.accent, fontSize: compact ? 6 : 7, fontWeight: '900', letterSpacing: 0.3 }}>
              REST
            </Text>
          ) : graceNotesEnabled ? (
            <Text testID="practice.gracePreview" style={{ position: 'absolute', left: compact ? 48 : 56, top: 1, color: colors.accent, fontSize: compact ? 6 : 7, fontWeight: '900', letterSpacing: 0.3 }}>
              GRACE
            </Text>
          ) : null}
        </View>
        <View style={{ width: 1, height: compact ? 23 : 27, backgroundColor: colors.line }} />
        <HandPreview hand="left" subdivision={step.leftSubdivision} timeSignature={timeSignature} compact={compact} />
        <View style={{ width: 1, height: compact ? 23 : 27, backgroundColor: colors.line }} />
        <HandPreview hand="right" subdivision={step.rightSubdivision} timeSignature={timeSignature} compact={compact} />
      </View>
    </Animated.View>
  );
}

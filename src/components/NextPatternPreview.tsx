import { Text, View } from 'react-native';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { colors } from '@/theme';
import type { ExerciseStep, Hand, Subdivision } from '@/types/rhythm';

interface NextPatternPreviewProps {
  step: ExerciseStep | null;
  beatsUntilChange: number;
  secondsUntilChange: number | null;
  compact?: boolean;
}

interface HandPreviewProps {
  hand: Hand;
  subdivision: Subdivision;
  compact?: boolean;
}

function HandPreview({ hand, subdivision, compact = false }: HandPreviewProps) {
  const color = hand === 'left' ? colors.left : colors.right;

  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: compact ? 3 : 7 }}>
      <RhythmSymbol subdivision={subdivision} color={color} mini />
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
  secondsUntilChange,
  compact = false,
}: NextPatternPreviewProps) {
  if (!step || secondsUntilChange === null) return null;

  const displayedSeconds = (Math.ceil(secondsUntilChange * 10) / 10).toFixed(1);

  return (
    <View
      testID="practice.nextPattern"
      accessibilityLabel={
        `Next pattern in ${displayedSeconds} seconds: left ` +
        `${SUBDIVISION_LABELS[step.leftSubdivision]}, right ${SUBDIVISION_LABELS[step.rightSubdivision]}`
      }
      style={{
        minHeight: compact ? 50 : 58,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: 13,
        paddingHorizontal: compact ? 8 : 12,
        marginTop: compact ? 3 : 6,
        marginBottom: compact ? 2 : 4,
      }}
    >
      <View style={{ width: compact ? 84 : 100, alignItems: 'center' }}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.muted, fontSize: compact ? 8 : 9, fontWeight: '800', letterSpacing: 1 }}>
          NEXT · {beatsUntilChange} {beatsUntilChange === 1 ? 'BEAT' : 'BEATS'}
        </Text>
        <Text style={{ color: colors.accent, fontSize: compact ? 17 : 20, fontWeight: '900', fontVariant: ['tabular-nums'], marginTop: 1 }}>
          {displayedSeconds}s
        </Text>
      </View>
      <View style={{ width: 1, height: compact ? 32 : 38, backgroundColor: colors.line, marginHorizontal: compact ? 4 : 8 }} />
      <HandPreview hand="left" subdivision={step.leftSubdivision} compact={compact} />
      <View style={{ width: 1, height: compact ? 32 : 38, backgroundColor: colors.line, marginHorizontal: compact ? 3 : 6 }} />
      <HandPreview hand="right" subdivision={step.rightSubdivision} compact={compact} />
    </View>
  );
}

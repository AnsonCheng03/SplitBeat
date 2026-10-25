import { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createRhythmSymbolNotationPlan, fitNotationScale, type NoteNotationSize } from '@/rhythm/noteNotation';
import { getMixturePattern } from '@/rhythm/mixtures';
import type { MixturePatternId } from '@/types/rhythm';

export function MixtureSymbol({
  mixtureId,
  color,
  compact = false,
  mini = false,
  scale = 1,
  maxWidth,
  maxHeight,
  readyTestID,
}: {
  mixtureId: MixturePatternId;
  color: string;
  compact?: boolean;
  mini?: boolean;
  scale?: number;
  maxWidth?: number;
  maxHeight?: number;
  readyTestID?: string;
}) {
  const { t } = useI18n();
  const pattern = getMixturePattern(mixtureId);
  const size: NoteNotationSize = mini ? 'mini' : compact ? 'compact' : 'full';
  const notationWidth = mini
    ? Math.min(120, Math.max(42, pattern.atoms.length * 6))
    : compact
    ? Math.min(112, Math.max(58, pattern.atoms.length * 7))
    : Math.min(220, Math.max(82, pattern.atoms.length * 12));
  const noteEvents = useMemo(() => {
    return pattern.atoms.flatMap((atom, index) => atom.kind === 'note'
      ? [{
          startQuarter: pattern.atoms
            .slice(0, index)
            .reduce((sum, previous) => sum + previous.durationQuarter, 0),
          durationQuarter: atom.durationQuarter,
        }]
      : []);
  }, [pattern]);
  const plan = useMemo(() => createRhythmSymbolNotationPlan(noteEvents, {
    durationQuarter: pattern.durationQuarter,
    width: notationWidth,
    size,
    beamGroupQuarterNotes: pattern.durationQuarter,
  }), [notationWidth, noteEvents, pattern.durationQuarter, size]);
  const fittedScale = fitNotationScale(plan.width, plan.height, scale, maxWidth, maxHeight);

  return (
    <View style={{ width: plan.width * fittedScale, height: plan.height * fittedScale, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: plan.width, height: plan.height, transform: [{ scale: fittedScale }], alignItems: 'center', justifyContent: 'center' }}>
        <NoteNotation plan={plan} color={color} accessibilityLabel={t(pattern.label)} readyTestID={readyTestID} />
        {pattern.atoms.map((atom, index) => atom.kind === 'rest' ? (
          <Text
            key={`${mixtureId}.rest.${index}`}
            style={{
              position: 'absolute',
              left: plan.anchorStartX + ((pattern.atoms.slice(0, index).reduce((sum, item) => sum + item.durationQuarter, 0) + atom.durationQuarter / 2) / pattern.durationQuarter) * plan.anchorWidth - 11,
              top: plan.height * 0.45,
              width: 22,
              color,
              fontSize: mini ? 5 : compact ? 6 : 7,
              fontWeight: '900',
              letterSpacing: 0.2,
              textAlign: 'center',
            }}
          >
            R
          </Text>
        ) : null)}
      </View>
    </View>
  );
}

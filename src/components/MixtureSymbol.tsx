import { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createBarNoteNotationPlan, type NoteNotationSize } from '@/rhythm/noteNotation';
import { getMixturePattern } from '@/rhythm/mixtures';
import type { MixturePatternId } from '@/types/rhythm';

export function MixtureSymbol({
  mixtureId,
  color,
  compact = false,
  scale = 1,
}: {
  mixtureId: MixturePatternId;
  color: string;
  compact?: boolean;
  scale?: number;
}) {
  const { t } = useI18n();
  const pattern = getMixturePattern(mixtureId);
  const size: NoteNotationSize = compact ? 'compact' : 'full';
  const notationWidth = compact ? 58 : 82;
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
  const plan = useMemo(() => createBarNoteNotationPlan(noteEvents, {
    durationQuarter: pattern.durationQuarter,
    width: notationWidth,
    size,
    beamGroupQuarterNotes: pattern.durationQuarter,
  }), [notationWidth, noteEvents, pattern.durationQuarter, size]);

  return (
    <View style={{ width: plan.width * scale, height: plan.height * scale, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: plan.width, height: plan.height, transform: [{ scale }], alignItems: 'center', justifyContent: 'center' }}>
        <NoteNotation plan={plan} color={color} accessibilityLabel={t(pattern.label)} />
        {pattern.atoms.map((atom, index) => atom.kind === 'rest' ? (
          <Text
            key={`${mixtureId}.rest.${index}`}
            style={{
              position: 'absolute',
              left: ((pattern.atoms.slice(0, index).reduce((sum, item) => sum + item.durationQuarter, 0) + atom.durationQuarter / 2) / pattern.durationQuarter) * plan.width - 11,
              top: plan.height * 0.45,
              width: 22,
              color,
              fontSize: compact ? 6 : 7,
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

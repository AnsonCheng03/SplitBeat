import { useMemo } from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { BeatDurationGuide } from '@/components/BeatDurationGuide';
import { NoteNotation } from '@/components/NoteNotation';
import { createRhythmSymbolNotationPlan, fitNotationScale, type NoteNotationSize } from '@/rhythm/noteNotation';
import { mixtureNotationEvents } from '@/rhythm/mixtureNotation';
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
  groupWidth,
  showDurationGuide = false,
  accessibilityLabel,
  readyTestID,
}: {
  mixtureId: MixturePatternId;
  color: string;
  compact?: boolean;
  mini?: boolean;
  scale?: number;
  maxWidth?: number;
  maxHeight?: number;
  /** Common visual span used when aligning this hand with the other hand. */
  groupWidth?: number;
  /** Show the shared beat span beneath live practice notation. */
  showDurationGuide?: boolean;
  accessibilityLabel?: string;
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
  const noteEvents = useMemo(() => mixtureNotationEvents(pattern), [pattern]);
  const plan = useMemo(() => createRhythmSymbolNotationPlan(noteEvents, {
    durationQuarter: pattern.durationQuarter,
    width: groupWidth ?? notationWidth,
    size,
    beamGroupQuarterNotes: pattern.durationQuarter,
  }), [groupWidth, notationWidth, noteEvents, pattern.durationQuarter, size]);
  const fittedScale = fitNotationScale(plan.width, plan.height, scale, maxWidth, maxHeight);

  return (
    <View style={{ width: plan.width * fittedScale, height: (plan.height + (showDurationGuide ? 12 : 0)) * fittedScale, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: plan.width, height: plan.height, transform: [{ scale: fittedScale }], alignItems: 'center', justifyContent: 'center' }}>
        <NoteNotation plan={plan} color={color} accessibilityLabel={accessibilityLabel ?? t(pattern.label)} readyTestID={readyTestID} />
      </View>
      {showDurationGuide ? (
        <View style={{ position: 'absolute', bottom: 0, transform: [{ scale: fittedScale }] }}>
          <BeatDurationGuide width={plan.width} color={color} />
        </View>
      ) : null}
    </View>
  );
}

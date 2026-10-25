import { useMemo } from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
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
  const symbolWidth = groupWidth ?? notationWidth;
  const shortestEvent = noteEvents.reduce((shortest, event) => Math.min(shortest, event.durationQuarter), pattern.durationQuarter);
  const noteSpacing = symbolWidth * shortestEvent / pattern.durationQuarter;
  const baseHeadWidth = size === 'mini' ? 4.2 : size === 'compact' ? 7 : 9.2;
  const noteHeadWidth = Math.max(size === 'full' ? 3.4 : 2.4, Math.min(baseHeadWidth, noteSpacing * 0.72));
  const plan = useMemo(() => createRhythmSymbolNotationPlan(noteEvents, {
    durationQuarter: pattern.durationQuarter,
    width: symbolWidth,
    size,
    noteHeadWidth,
    beamGroupQuarterNotes: pattern.durationQuarter,
  }), [noteEvents, noteHeadWidth, pattern.durationQuarter, size, symbolWidth]);
  const fittedScale = fitNotationScale(plan.width, plan.height, scale, maxWidth, maxHeight);

  return (
    <View style={{ width: plan.width * fittedScale, height: plan.height * fittedScale, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: plan.width, height: plan.height, transform: [{ scale: fittedScale }], alignItems: 'center', justifyContent: 'center' }}>
        <NoteNotation plan={plan} color={color} accessibilityLabel={accessibilityLabel ?? t(pattern.label)} readyTestID={readyTestID} />
      </View>
    </View>
  );
}

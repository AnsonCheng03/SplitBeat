import { useMemo } from 'react';
import { View } from 'react-native';
import { NoteNotation } from '@/components/NoteNotation';
import { createBarNoteNotationPlan } from '@/rhythm/noteNotation';
import { markNotationReady } from '@/rhythm/notationReadiness';
import { useTheme } from '@/theme/ThemeProvider';

/** Start VexFlow's DOM renderer while the player is still on the app's opening screen. */
export function NotationPreloader() {
  const { colors } = useTheme();
  const plan = useMemo(() => createBarNoteNotationPlan([
    { startQuarter: 0, durationQuarter: 0.5 },
    { startQuarter: 0.5, durationQuarter: 0.5 },
    { startQuarter: 1, durationQuarter: 0.25 },
    { startQuarter: 1.25, durationQuarter: 0.25, isRest: true },
  ], {
    durationQuarter: 2,
    width: 104,
    size: 'full',
    beamGroupQuarterNotes: 1,
  }), []);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', left: 0, top: 0, width: plan.width, height: plan.height, opacity: 0 }}
    >
      <NoteNotation
        plan={plan}
        color={colors.text}
        onReady={markNotationReady}
      />
    </View>
  );
}

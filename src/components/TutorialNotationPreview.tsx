import { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { PracticeRhythmDisplay } from '@/components/PracticeRhythmDisplay';
import { practiceLayoutForScreen } from '@/features/deviceLayout/practiceLayout';
import { useDeviceReservedRegions } from '@/features/deviceLayout/useDeviceReservedRegions';
import { createTutorialPracticeSnapshot } from '@/features/tutorial/tutorialPracticeDisplay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_SCORE_DISPLAY_MODE } from '@/rhythm/scoreStaff';
import { useRhythmSession } from '@/store/sessionStore';
import type { PracticeDisplayMode, TimeSignature } from '@/types/rhythm';
import { tutorialStylePracticeDisplayFrame } from '@/styles/tutorial';

export function TutorialNotationPreview({
  displayMode,
  beatIndex,
  compact,
}: {
  displayMode: PracticeDisplayMode;
  beatIndex: number;
  compact: boolean;
}) {
  const { settings } = useRhythmSession();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reservedRegions = useDeviceReservedRegions(width, height);
  const practiceLayout = useMemo(
    () => practiceLayoutForScreen(width, height, reservedRegions),
    [height, reservedRegions, width],
  );
  const snapshot = useMemo(() => createTutorialPracticeSnapshot(beatIndex), [beatIndex]);
  const displaySettings = useMemo(() => ({
    ...settings,
    timeSignature: '4/4' as TimeSignature,
    trainingMode: 'two-hand' as const,
    practiceDisplayMode: displayMode,
  }), [displayMode, settings]);
  return (
    <View
      testID={displayMode === 'rhythm' ? 'tutorial.notation.note' : 'tutorial.notation.bar'}
      style={tutorialStylePracticeDisplayFrame()}
    >
      <PracticeRhythmDisplay
        snapshot={snapshot}
        settings={displaySettings}
        tutorialVisible={false}
        scoreDisplayMode={displaySettings.scoreMotionMode ?? DEFAULT_SCORE_DISPLAY_MODE}
        compact={compact}
        width={width}
        height={height}
        topInset={insets.top}
        bottomInset={insets.bottom}
        leftInset={insets.left}
        rightInset={insets.right}
        layout={practiceLayout}
      />
    </View>
  );
}

import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { MixtureSymbol } from '@/components/MixtureSymbol';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExerciseSettings, ExerciseStep, Hand } from '@/types/rhythm';
import type { PracticeLayout } from '@/features/deviceLayout/practiceLayout';
import {
  PracticeRhythmDisplayStyle6,
  PracticeRhythmDisplayStyle7,
  PracticeRhythmDisplayStyle8,
  PracticeRhythmDisplayStyle9,
} from '@/styles/practice';

export function PracticeHandRhythmDisplay({
  step,
  settings,
  compact,
  groupWidth,
  maxWidth,
  maxHeight,
  layout,
}: {
  step: ExerciseStep;
  settings: ExerciseSettings;
  compact: boolean;
  groupWidth: number;
  maxWidth: number;
  maxHeight: number;
  layout: PracticeLayout;
}) {
  const { colors } = useTheme();
  if (settings.trainingMode === 'single-hand') {
    return (
      <View style={PracticeRhythmDisplayStyle6({ compact, frame: layout.division ? layout[`${settings.singleHand}Hand`] : undefined })}>
        <Text style={PracticeRhythmDisplayStyle7({ colors, compact })}>{settings.singleHand.toUpperCase()}</Text>
        <HandRhythmNote
          hand={settings.singleHand}
          step={step}
          settings={settings}
          color={colors.accent}
          groupWidth={groupWidth}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          testID={`practice.rhythmNote.${settings.singleHand}.ready`}
        />
      </View>
    );
  }

  return (
    <>
      {(['left', 'right'] as const).map((hand) => (
        <View key={hand} style={PracticeRhythmDisplayStyle8({ compact, enabled: true, frame: layout.division ? layout[`${hand}Hand`] : undefined })}>
          <Text style={PracticeRhythmDisplayStyle9({ hand, colors, compact })}>{hand.toUpperCase()}</Text>
          <HandRhythmNote
            hand={hand}
            step={step}
            settings={settings}
            color={hand === 'left' ? colors.left : colors.right}
            groupWidth={groupWidth}
            maxWidth={maxWidth}
            maxHeight={maxHeight}
            testID={`practice.rhythmNote.${hand}.ready`}
          />
        </View>
      ))}
    </>
  );
}

function HandRhythmNote({
  hand,
  step,
  settings,
  color,
  groupWidth,
  maxWidth,
  maxHeight,
  testID,
}: {
  hand: Hand;
  step: ExerciseStep;
  settings: ExerciseSettings;
  color: string;
  groupWidth: number;
  maxWidth: number;
  maxHeight: number;
  testID: string;
}) {
  const subdivision = hand === 'left' ? step.leftSubdivision : step.rightSubdivision;
  const isRest = hand === 'left' ? step.leftRest : step.rightRest;
  const mixtureId = hand === 'left' ? step.leftMixture : step.rightMixture;
  const notationProps = { color, timeSignature: settings.timeSignature, scale: 1.2, groupWidth, maxWidth, maxHeight, readyTestID: testID };

  if (mixtureId && !isRest) {
    return (
      <MixtureSymbol
        mixtureId={mixtureId}
        color={color}
        scale={1.2}
        groupWidth={groupWidth}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        readyTestID={testID}
      />
    );
  }

  return <RhythmSymbol subdivision={subdivision} {...notationProps} rest={isRest} />;
}

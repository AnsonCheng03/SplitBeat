import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { PatternPicker, PrimaryButton } from '@/components/ExercisePatternPicker';
import type { PatternSelection } from '@/components/ExercisePatternPicker';
import type { MixturePattern } from '@/rhythm/mixtures';
import { useTheme } from '@/theme/ThemeProvider';
import type { TimeSignature } from '@/types/rhythm';
import { ExercisePairPanelStyle1, ExercisePairPanelStyle2 } from '@/styles/exercise';

export function ExercisePairPanel({
  leftSelection,
  rightSelection,
  mixtures,
  includeSixtyFourth,
  timeSignature,
  starting,
  onLeftChange,
  onRightChange,
  onPractice,
}: {
  leftSelection: PatternSelection;
  rightSelection: PatternSelection;
  mixtures: MixturePattern[];
  includeSixtyFourth: boolean;
  timeSignature: TimeSignature;
  starting: boolean;
  onLeftChange: (selection: PatternSelection) => void;
  onRightChange: (selection: PatternSelection) => void;
  onPractice: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <>
      <Text style={ExercisePairPanelStyle1({ colors })}>CHOOSE A RHYTHM FOR EACH HAND</Text>
      <View style={ExercisePairPanelStyle2()}>
        <PatternPicker hand="left" selection={leftSelection} mixtures={mixtures} includeSixtyFourth={includeSixtyFourth} timeSignature={timeSignature} onChange={onLeftChange} />
        <PatternPicker hand="right" selection={rightSelection} mixtures={mixtures} includeSixtyFourth={includeSixtyFourth} timeSignature={timeSignature} onChange={onRightChange} />
      </View>
      <PrimaryButton testID="exercise.practicePair" title={starting ? t('PREPARING…') : t('PRACTICE THIS PAIR')} onPress={onPractice} disabled={starting} />
    </>
  );
}

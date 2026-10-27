import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useAppTutorial } from '@/store/AppTutorialProvider';
import { useTheme } from '@/theme/ThemeProvider';
import {
  tutorialReplayStyle1,
  tutorialReplayStyle2,
  tutorialReplayStyle3,
  tutorialReplayStyle4,
  tutorialReplayStyle5,
  tutorialReplayStyle6,
  tutorialReplayStyle7,
} from '@/styles/settings';

export function TutorialReplayCard() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { replayTutorial } = useAppTutorial();

  return (
    <View style={tutorialReplayStyle1({ colors })}>
      <View style={tutorialReplayStyle2()}>
        <View style={tutorialReplayStyle3({ colors })} />
        <Text style={tutorialReplayStyle4({ colors })}>{t('APP TUTORIAL')}</Text>
      </View>
      <Text style={tutorialReplayStyle5({ colors })}>
        {t('Review the main practice modes and how to get started.')}
      </Text>
      <Pressable
        testID="setup.tutorial.replay"
        accessibilityRole="button"
        accessibilityLabel={t('Replay app tutorial')}
        onPress={replayTutorial}
        style={({ pressed }) => tutorialReplayStyle6({ colors, pressed })}
      >
        <Text style={tutorialReplayStyle7({ colors })}>{t('REPLAY TUTORIAL')}</Text>
      </Pressable>
    </View>
  );
}

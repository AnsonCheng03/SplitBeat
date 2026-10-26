import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import {
  PracticePauseOverlaysStyle53,
  PracticePauseOverlaysStyle54,
  PracticePauseOverlaysStyle55,
  PracticePauseOverlaysStyle56,
  PracticePauseOverlaysStyle57,
  PracticePauseOverlaysStyle58,
  PracticePauseOverlaysStyle59,
  PracticePauseOverlaysStyle60,
  PracticePauseOverlaysStyle61,
  PracticePauseOverlaysStyle62,
} from '@/styles/practice';

export function PracticePauseMenuActions({
  compact,
  actionLoading,
  onResume,
  onOpenQuickSettings,
  onStop,
  onBackHome,
}: {
  compact: boolean;
  actionLoading: boolean;
  onResume: () => Promise<void>;
  onOpenQuickSettings: () => void;
  onStop: () => void;
  onBackHome: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <>
      <View style={PracticePauseOverlaysStyle53({ compact })}>
        <Pressable
          testID="practice.pause.continue"
          accessibilityRole="button"
          disabled={actionLoading}
          onPress={() => void onResume()}
          style={PracticePauseOverlaysStyle54({ compact, colors, pauseActionLoading: actionLoading })}
        >
          <Text style={PracticePauseOverlaysStyle55({ colors, compact })}>{t('CONTINUE')}</Text>
        </Pressable>
        <Pressable
          testID="practice.pause.liveSettings"
          accessibilityRole="button"
          onPress={onOpenQuickSettings}
          style={PracticePauseOverlaysStyle56({ compact })}
        >
          <Text style={PracticePauseOverlaysStyle57({ colors, compact })}>{t('LIVE SETTINGS')}</Text>
        </Pressable>
      </View>
      <View style={PracticePauseOverlaysStyle58({ compact })}>
        <Pressable testID="practice.pause.finish" accessibilityRole="button" onPress={onStop} style={PracticePauseOverlaysStyle59()}>
          <Text style={PracticePauseOverlaysStyle60({ colors, compact })}>{t('END SESSION')}</Text>
        </Pressable>
        <Pressable testID="practice.pause.home" accessibilityRole="button" onPress={onBackHome} style={PracticePauseOverlaysStyle61()}>
          <Text style={PracticePauseOverlaysStyle62({ colors, compact })}>{t('BACK HOME')}</Text>
        </Pressable>
      </View>
    </>
  );
}

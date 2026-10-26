import type { RefObject } from 'react';
import { Pressable, View, type View as NativeView } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PracticeOverlayBackdrop } from '@/components/PracticeOverlayBackdrop';
import { useTheme } from '@/theme/ThemeProvider';
import type { SessionSnapshot } from '@/types/rhythm';
import {
  PracticePauseOverlaysStyle9,
  PracticePauseOverlaysStyle10,
  PracticePauseOverlaysStyle11,
  PracticePauseOverlaysStyle12,
  PracticePauseOverlaysStyle13,
  PracticePauseOverlaysStyle14,
  PracticePauseOverlaysStyle15,
  PracticePauseOverlaysStyle16,
  PracticePauseOverlaysStyle17,
  PracticePauseOverlaysStyle63,
} from '@/styles/practice';

export function PracticeChallengePause({
  snapshot,
  quickSettingsOpen,
  blurTarget,
  compact,
  onOpenQuickSettings,
  onResume,
  onStop,
}: {
  snapshot: SessionSnapshot | null;
  quickSettingsOpen: boolean;
  blurTarget: RefObject<NativeView | null>;
  compact: boolean;
  onOpenQuickSettings: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  if (snapshot?.phase !== 'paused' || !snapshot.challengeMessage || quickSettingsOpen) return null;

  return (
    <PracticeOverlayBackdrop
      testID="practice.challengePause"
      blurTarget={blurTarget}
      contentStyle={PracticePauseOverlaysStyle63({ insets })}
    >
      <View style={PracticePauseOverlaysStyle9({ compact })}>
        <Text style={PracticePauseOverlaysStyle10({ colors, compact })}>{t('CHALLENGE PAUSE')}</Text>
        <Text style={PracticePauseOverlaysStyle11({ colors, compact })}>{snapshot.challengeMessage}</Text>
        <Pressable
          testID="practice.challengeLiveSettings"
          accessibilityRole="button"
          onPress={onOpenQuickSettings}
          style={PracticePauseOverlaysStyle12()}
        >
          <Text style={PracticePauseOverlaysStyle13({ colors })}>{t('LIVE SETTINGS')}</Text>
        </Pressable>
        <Pressable
          testID="practice.challengeResume"
          accessibilityRole="button"
          onPress={onResume}
          style={PracticePauseOverlaysStyle14({ colors })}
        >
          <Text style={PracticePauseOverlaysStyle15({ colors })}>{t('CONTINUE')}</Text>
        </Pressable>
        <Pressable
          testID="practice.challengeEnd"
          accessibilityRole="button"
          onPress={onStop}
          style={PracticePauseOverlaysStyle16()}
        >
          <Text style={PracticePauseOverlaysStyle17({ colors })}>{t('END SESSION')}</Text>
        </Pressable>
      </View>
    </PracticeOverlayBackdrop>
  );
}

import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';
import type { LearnCourseProgressSnapshot } from '@/rhythm/learnProgressSync';
import { useGameCenterCourseProgress } from '@/features/gameCenter/useGameCenterCourseProgress';
import { GameCenterCourseProgressButtonStyle1, GameCenterCourseProgressButtonStyle2, GameCenterCourseProgressButtonStyle3, GameCenterCourseProgressButtonStyle4, GameCenterCourseProgressButtonStyle5 } from '@/styles/records';

interface GameCenterCourseProgressButtonProps {
  onProgressSynced: (snapshot: LearnCourseProgressSnapshot) => void;
}

export function GameCenterCourseProgressButton({
  onProgressSynced,
}: GameCenterCourseProgressButtonProps) {
  const { colors } = useTheme();
  const { t, status, syncing, message, hasError, handlePress } = useGameCenterCourseProgress(onProgressSynced);

  if (!status.available) return null;

  return (
    <View style={GameCenterCourseProgressButtonStyle1()}>
      <Pressable
        testID="learn.syncProgress"
        accessibilityRole="button"
        accessibilityLabel={t(status.authenticated ? 'Sync course progress' : 'Restore course progress from Game Center')}
        accessibilityState={{ disabled: syncing || !status.available }}
        disabled={syncing || !status.available}
        onPress={handlePress}
        style={({ pressed }) => (GameCenterCourseProgressButtonStyle2({ colors, syncing, pressed }))}
      >
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={GameCenterCourseProgressButtonStyle3({ colors })}>
          {t(syncing ? 'SYNCING COURSE…' : status.authenticated ? 'SYNC COURSE PROGRESS' : 'RESTORE FROM GAME CENTER')}
        </Text>
      </Pressable>
      <Text style={GameCenterCourseProgressButtonStyle4({ colors })}>
        {t('Course progress syncs through Game Center and your iCloud account. Course content changes start a separate progress version.')}
      </Text>
      {message ? (
        <Text testID="learn.syncProgress.status" accessibilityLiveRegion="polite" style={GameCenterCourseProgressButtonStyle5({ hasError, colors })}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

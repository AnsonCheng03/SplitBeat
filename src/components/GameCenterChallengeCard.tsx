import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';
import { useGameCenterChallenge } from '@/features/gameCenter/useGameCenterChallenge';
import {
  GameCenterChallengeCardStyle1,
  GameCenterChallengeCardStyle2,
  GameCenterChallengeCardStyle3,
  GameCenterChallengeCardStyle4,
  GameCenterChallengeCardStyle5,
  GameCenterChallengeCardStyle6,
  GameCenterChallengeCardStyle7,
  GameCenterChallengeCardStyle8,
  GameCenterChallengeCardStyle9,
  GameCenterChallengeCardStyle10
} from '@/styles/records';

interface GameCenterChallengeCardProps {
  challengeMode?: boolean;
  longestCorrectStreak?: number;
  testID?: string;
}

export function GameCenterChallengeCard({
  challengeMode = false,
  longestCorrectStreak,
  testID = 'gameCenter.challenge',
}: GameCenterChallengeCardProps) {
  const { colors } = useTheme();
  const { t, status, message, submitting, authenticating, hasScore, actionLabel, description, handleAction } = useGameCenterChallenge({
    challengeMode,
    longestCorrectStreak,
  });

  return (
    <View
      testID={testID}
      style={GameCenterChallengeCardStyle1({ colors })}
    >
      <View style={GameCenterChallengeCardStyle2()}>
        <View style={GameCenterChallengeCardStyle3()}>
          <Text style={GameCenterChallengeCardStyle4({ colors })}>{t('GAME CENTER')}</Text>
          <Text style={GameCenterChallengeCardStyle5({ colors })}>
            {hasScore
              ? t('Longest clean run · {count} notes', { count: longestCorrectStreak ?? 0 })
              : t('Leaderboard · Longest clean run')}
          </Text>
        </View>
        {status.authenticated ? (
          <Text numberOfLines={1} style={GameCenterChallengeCardStyle6({ colors })}>
            {status.playerAlias || 'SIGNED IN'}
          </Text>
        ) : null}
      </View>

      <Text style={GameCenterChallengeCardStyle7({ colors })}>
        {t(description)}
      </Text>

      {status.available ? (
        <Pressable
          testID={`${testID}.action`}
          accessibilityRole="button"
          accessibilityLabel={t(status.authenticated ? 'View Game Center leaderboard' : 'Sign in to Game Center')}
          disabled={submitting || authenticating}
          onPress={handleAction}
          style={({ pressed }) => (GameCenterChallengeCardStyle8({ pressed, colors, submitting }))}
        >
          <Text style={GameCenterChallengeCardStyle9({ colors })}>
            {t(submitting ? 'SUBMITTING…' : authenticating ? 'SIGNING IN…' : actionLabel)}
          </Text>
        </Pressable>
      ) : null}

      {message ? (
        <Text accessibilityLiveRegion="polite" style={GameCenterChallengeCardStyle10({ colors })}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

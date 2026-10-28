import { GameCenterChallengeCard } from '@/components/GameCenterChallengeCard';
import { GameCenterCourseProgressButton } from '@/components/GameCenterCourseProgressButton';
import { SettingsPage } from '@/components/SettingsPage';

export default function GameCenterSettingsScreen() {
  return (
    <SettingsPage
      testID="settings.gameCenter.screen"
      backTestID="settings.gameCenter.back"
      section="gameCenter"
      title="Game Center"
      description="Manage your Game Center sign-in, course progress, and challenge leaderboard."
    >
      <GameCenterCourseProgressButton />
      <GameCenterChallengeCard testID="settings.gameCenter.leaderboard" />
    </SettingsPage>
  );
}

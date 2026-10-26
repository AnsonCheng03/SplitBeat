import { useRouter } from 'expo-router';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import { bestSessionRecord, longestSessionStreak } from '@/features/records/recordPresentation';

export function useRecordsScreen() {
  const { colors } = useTheme();
  const { sessionHistory, sessionHistoryLoaded } = useRhythmSession();
  const router = useRouter();

  return {
    colors,
    sessionHistory,
    sessionHistoryLoaded,
    bestRecord: bestSessionRecord(sessionHistory),
    bestStreak: longestSessionStreak(sessionHistory),
    returnHome: () => router.replace('/'),
  };
}

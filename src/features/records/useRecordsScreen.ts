import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Share } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import { bestSessionRecord, createSessionShareMessage, favoriteSessionsFirst, longestSessionStreak } from '@/features/records/recordPresentation';
import type { SessionRecord } from '@/store/sessionHistory';

export function useRecordsScreen() {
  const { colors } = useTheme();
  const { locale, t } = useI18n();
  const { sessionHistory, sessionHistoryLoaded, toggleSessionFavorite } = useRhythmSession();
  const router = useRouter();
  const [replayRecord, setReplayRecord] = useState<SessionRecord | null>(null);
  const orderedSessionHistory = useMemo(() => favoriteSessionsFirst(sessionHistory), [sessionHistory]);
  const closeReplay = useCallback(() => setReplayRecord(null), []);
  const returnHome = useCallback(() => router.replace('/'), [router]);
  const shareSession = useCallback(async (record: SessionRecord) => {
    try {
      await Share.share({
        title: t('Share session'),
        message: createSessionShareMessage(record, locale),
      });
    } catch {
      Alert.alert(t('Share unavailable'), t('Please try again.'));
    }
  }, [locale, t]);

  return {
    colors,
    sessionHistory: orderedSessionHistory,
    sessionHistoryLoaded,
    bestRecord: bestSessionRecord(sessionHistory),
    bestStreak: longestSessionStreak(sessionHistory),
    toggleSessionFavorite,
    replayRecord,
    openReplay: setReplayRecord,
    closeReplay,
    shareSession,
    returnHome,
  };
}

import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DEFAULT_SCORE_DISPLAY_MODE, scoreTrainingMode } from '@/rhythm/scoreStaff';
import { findLearnSong } from '@/rhythm/learnSongs';
import { placeSingleTrackOnHand } from '@/rhythm/importedScoreLibrary';
import type { ScoreTemplate } from '@/rhythm/scoreTemplates';
import { keepModeLoadingVisible, waitForModeLoadingFrame } from '@/features/modeLoadingFeedback';
import { useI18n } from '@/i18n/I18nProvider';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';

export function useLearnSongsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { songId: rawSongId } = useLocalSearchParams<{ songId?: string }>();
  const songId = Array.isArray(rawSongId) ? rawSongId[0] : rawSongId;
  const { settings, featureFlags, prepareExercise } = useRhythmSession();
  const [startingSongId, setStartingSongId] = useState<string | null>(null);

  useEffect(() => {
    if (!featureFlags.learnCourse) router.replace('/');
  }, [featureFlags.learnCourse, router]);

  const startSong = useCallback(async (song: ScoreTemplate) => {
    if (startingSongId) return;
    setStartingSongId(song.id);
    const loadingStartedAt = Date.now();
    try {
      await waitForModeLoadingFrame();
      const score = placeSingleTrackOnHand(song.score, settings.singleHand);
      const trainingMode = scoreTrainingMode(score, settings.singleHand);
      if (trainingMode.trainingMode === 'single-hand' && !featureFlags.oneHandMode) {
        setStartingSongId(null);
        Alert.alert(
          t('One-hand score training is unavailable in this build.'),
          t('Choose a two-hand score or install a build with one-hand practice enabled.'),
        );
        return;
      }
      await prepareExercise(score, {
        settings: {
          bpm: score.bpm ?? settings.bpm,
          timeSignature: score.timeSignature,
          ...trainingMode,
          practiceDisplayMode: featureFlags.scoreNotation ? 'score' : 'rhythm',
          referenceRhythmEnabled: featureFlags.shownRhythmPlayback,
        },
      });
      await keepModeLoadingVisible(loadingStartedAt);
      router.replace({
        pathname: '/practice',
        params: {
          scoreDisplayMode: featureFlags.scoreNotation
            ? settings.scoreMotionMode ?? DEFAULT_SCORE_DISPLAY_MODE
            : 'focus',
        },
      });
    } catch {
      setStartingSongId(null);
      Alert.alert(t('Audio could not start'), t('Check your device audio settings and try again.'));
    }
  }, [featureFlags.oneHandMode, featureFlags.scoreNotation, featureFlags.shownRhythmPlayback, prepareExercise, router, settings, startingSongId, t]);

  const returnToCourse = useCallback(() => router.replace('/learn'), [router]);

  return {
    colors,
    t,
    selectedSong: findLearnSong(songId),
    startingSongId,
    startSong,
    returnToCourse,
  };
}

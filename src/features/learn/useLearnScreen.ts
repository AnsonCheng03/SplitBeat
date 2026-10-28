import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, useWindowDimensions } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getLessonAvailability,
  LEARN_COURSE,
  lessonProgressPercent,
  lessonSettings,
} from '@/rhythm/learnCourse';
import { totalLearnStars } from '@/rhythm/learnRating';
import {
  getCheckpointUnlockedLessonIds,
  isLearnLessonCheckpointChallenge,
} from '@/rhythm/learnCourseProgression';
import { evaluateLearnCourseSkipGate } from '@/rhythm/learnCourseSkip';
import { requiresLearnCourseUnlock } from '@/rhythm/learnCourseAccess';
import { useLearnCoursePurchase } from '@/hooks/useLearnCoursePurchase';
import { readLearnProgress, readLearnRatings, readSkippedLearnLessons, skipLearnLessons, syncLearnProgressIfEnabled } from '@/store/learnProgress';
import type { LearnCourseProgressSnapshot } from '@/rhythm/learnProgressSync';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import { keepModeLoadingVisible, waitForModeLoadingFrame } from '@/features/modeLoadingFeedback';

export function useLearnScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lessonId: routeLessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const { settings, featureFlags, audioStatus, prepareExercise } = useRhythmSession();
  const purchase = useLearnCoursePurchase();
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [skippedLessonIds, setSkippedLessonIds] = useState<string[]>([]);
  const [lessonRatings, setLessonRatings] = useState<Awaited<ReturnType<typeof readLearnRatings>>>([]);
  const [selectedLessonId, setSelectedLessonId] = useState(LEARN_COURSE[0].id);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [starting, setStarting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const compact = width < 950;
  const detailWidth = (width - insets.left - insets.right) * (compact ? 0.56 : 0.64);

  useEffect(() => {
    if (!featureFlags.learnCourse) router.replace('/');
  }, [featureFlags.learnCourse, router]);

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.all([readLearnProgress(), readLearnRatings(), readSkippedLearnLessons()]).then(([completed, ratings, skipped]) => {
      if (!active) return;
      setCompletedLessonIds(completed);
      setLessonRatings(ratings);
      setSkippedLessonIds(skipped);
      const requested = LEARN_COURSE.find((lesson) => lesson.id === routeLessonId);
      const nextLesson = LEARN_COURSE.find((lesson) => !completed.includes(lesson.id));
      const selection = requested && !completed.includes(requested.id)
        ? requested
        : nextLesson ?? requested ?? LEARN_COURSE.at(-1)!;
      setSelectedLessonId(selection.id);
      setProgressLoaded(true);
    });

    void syncLearnProgressIfEnabled().then(async () => {
      if (!active) return;
      const [completed, ratings, skipped] = await Promise.all([
        readLearnProgress(),
        readLearnRatings(),
        readSkippedLearnLessons(),
      ]);
      if (!active) return;
      setCompletedLessonIds(completed);
      setLessonRatings(ratings);
      setSkippedLessonIds(skipped);
      setSelectedLessonId((current) => (
        completed.includes(current)
          ? LEARN_COURSE.find((lesson) => !completed.includes(lesson.id))?.id ?? LEARN_COURSE.at(-1)!.id
          : current
      ));
    }).catch(() => {});

    return () => { active = false; };
  }, [routeLessonId]));

  const selectedLesson = useMemo(
    () => LEARN_COURSE.find((lesson) => lesson.id === selectedLessonId) ?? LEARN_COURSE[0],
    [selectedLessonId],
  );
  const checkpointUnlockedLessonIds = useMemo(
    () => getCheckpointUnlockedLessonIds(lessonRatings),
    [lessonRatings],
  );
  const lessonAvailability = getLessonAvailability(
    selectedLesson.id,
    completedLessonIds,
    checkpointUnlockedLessonIds,
  );
  const requiresPurchase = requiresLearnCourseUnlock(selectedLesson, purchase.hasFullCourseUnlock);
  const lessonSequenceLocked = lessonAvailability === 'locked';
  const progressedCount = new Set([...completedLessonIds, ...skippedLessonIds]).size;
  const starsEarned = totalLearnStars(lessonRatings);
  const skipGate = evaluateLearnCourseSkipGate({
    targetLessonId: selectedLesson.id,
    hasFullCourseUnlock: purchase.hasFullCourseUnlock,
    completedLessonIds,
    skippedLessonIds,
    lessonRatings,
    checkpointUnlockedLessonIds,
  });
  const lessonNumber = String(selectedLesson.number).padStart(2, '0');
  const previousLessonNumber = String(selectedLesson.number - 1).padStart(2, '0');
  const lessonStartDisabled = starting || !progressLoaded || lessonSequenceLocked || audioStatus === 'loading';
  const lessonStartLabel = lessonSequenceLocked
    ? `COMPLETE LESSON ${previousLessonNumber} FIRST`
    : starting
      ? 'PREPARING…'
      : !progressLoaded
        ? 'LOADING COURSE…'
        : audioStatus === 'loading'
          ? 'PREPARING AUDIO…'
          : audioStatus === 'error'
            ? 'RETRY AUDIO & START'
            : 'START LESSON';
  const lessonStartAccessibilityLabel = t('Start lesson {number}: {title}', {
    number: selectedLesson.number,
    title: t(selectedLesson.title),
  });
  const skipStatusMessage = !lessonSequenceLocked || requiresPurchase
    ? null
    : skipGate.canSkip
      ? t('Your {accuracy}% course average qualifies you to skip here. Skipped lessons do not earn stars.', {
          accuracy: Math.round(skipGate.averageBestAccuracy),
        })
      : skipGate.completedScoreCount === 0
        ? t('Reach an 80% course average to skip ahead. Every 5th lesson is a checkpoint.')
        : t('Your course average is {accuracy}%. Reach 80% for paid skip, or earn 5 stars on a checkpoint to unlock earlier lessons.', {
          accuracy: Math.round(skipGate.averageBestAccuracy),
        });
  const skipButtonTitle = skipping ? t('SKIPPING…') : t('SKIP TO THIS LESSON');
  const skipButtonAccessibilityLabel = t('Skip ahead to Lesson {number}', { number: selectedLesson.number });
  const purchaseStatusMessage = purchase.errorMessage
    ? purchase.errorMessage
    : purchase.storeErrorMessage
      ? purchase.storeErrorMessage
      : purchase.notice
        ? purchase.notice
        : purchase.connected && purchase.productLookupFinished && !purchase.unlockProduct
          ? 'The course offer is not available in the store yet. Check the in-app purchase setup and try again.'
          : null;
  const purchaseStatusKind = purchase.errorMessage
    ? 'error'
    : purchase.storeErrorMessage
      ? 'store-error'
      : purchase.notice
        ? 'notice'
        : purchaseStatusMessage
          ? 'unavailable'
          : null;
  const showPurchaseRetry = Boolean(
    purchase.storeErrorMessage || (purchase.connected && purchase.productLookupFinished && !purchase.unlockProduct),
  );
  const purchaseRetryLabel = purchase.isRetryingStore
    ? 'CHECKING STORE…'
    : purchase.connected
      ? 'RELOAD STORE OFFER'
      : 'RETRY STORE CONNECTION';
  const purchaseRetryAccessibilityLabel = purchase.connected
    ? 'Reload course offer from the store'
    : 'Retry app store connection';
  const restorePurchaseLabel = purchase.isRestoring ? 'RESTORING…' : 'RESTORE PURCHASE';
  const restorePurchaseDisabled = !purchase.connected || purchase.isRestoring;
  const unlockCourseDisabled = !purchase.connected
    || !purchase.unlockProduct
    || purchase.isPurchasing
    || !purchase.entitlementLoaded;
  const purchaseButtonTitle = purchase.isCheckingStoreEnvironment || !purchase.entitlementLoaded
    ? t('CHECKING ACCESS…')
    : !purchase.connected
      ? t('CONNECTING TO STORE…')
      : !purchase.productLookupFinished
        ? t('LOADING OFFER…')
        : purchase.isPurchasing
          ? t('PURCHASING…')
          : purchase.unlockProduct
            ? t('UNLOCK FULL COURSE · {price}', { price: purchase.unlockProduct.displayPrice })
            : t('OFFER UNAVAILABLE');

  const startLesson = useCallback(async () => {
    if (starting || skipping || !progressLoaded || requiresPurchase || lessonSequenceLocked || audioStatus === 'loading') return;
    const loadingStartedAt = Date.now();
    setStarting(true);
    try {
      await waitForModeLoadingFrame();
      await prepareExercise(undefined, {
        settings: lessonSettings(selectedLesson, settings),
        patternPairs: selectedLesson.patternPairs,
        patternPairWeights: selectedLesson.patternPairWeights,
      });
      await keepModeLoadingVisible(loadingStartedAt);
      router.replace({ pathname: '/practice', params: { lessonId: selectedLesson.id } });
    } catch {
      Alert.alert(t('Audio could not start'), t('Check your device audio settings and try again.'));
    } finally {
      setStarting(false);
    }
  }, [audioStatus, lessonSequenceLocked, prepareExercise, progressLoaded, requiresPurchase, router, selectedLesson, settings, skipping, starting, t]);

  const skipToSelectedLesson = useCallback(async () => {
    if (skipping || !progressLoaded || !skipGate.canSkip) return;
    setSkipping(true);
    try {
      const progress = await skipLearnLessons(skipGate.lessonsToSkip);
      setCompletedLessonIds(progress.completedLessonIds);
      setSkippedLessonIds(progress.skippedLessonIds);
    } catch {
      Alert.alert(t('Could not save course progress'), t('Try again to skip to this lesson.'));
    } finally {
      setSkipping(false);
    }
  }, [progressLoaded, skipGate, skipping, t]);

  const handleProgressSynced = useCallback((snapshot: LearnCourseProgressSnapshot) => {
    setCompletedLessonIds(snapshot.completedLessonIds);
    setLessonRatings(snapshot.ratings);
    setSkippedLessonIds(snapshot.skippedLessonIds);
    const requested = LEARN_COURSE.find((lesson) => lesson.id === routeLessonId);
    const nextLesson = LEARN_COURSE.find((lesson) => !snapshot.completedLessonIds.includes(lesson.id));
    const selectedLesson = requested && !snapshot.completedLessonIds.includes(requested.id)
      ? requested
      : nextLesson ?? LEARN_COURSE.at(-1)!;
    setSelectedLessonId(selectedLesson.id);
  }, [routeLessonId]);

  const returnHome = useCallback(() => router.replace('/'), [router]);
  const restorePurchase = purchase.restoreFullCourse;
  const buyCourse = purchase.buyFullCourse;
  const retryStore = purchase.retryStoreConnection;

  return {
    colors,
    t,
    settings,
    featureFlags,
    audioStatus,
    purchase,
    completedLessonIds,
    skippedLessonIds,
    lessonRatings,
    selectedLesson,
    progressLoaded,
    starting,
    skipping,
    compact,
    detailWidth,
    insets,
    progressedCount,
    starsEarned,
    lessonNumber,
    previousLessonNumber,
    selectedLessonIsCheckpointChallenge: isLearnLessonCheckpointChallenge({
      lessonId: selectedLesson.id,
      completedLessonIds,
      skippedLessonIds,
      lessonRatings,
      checkpointUnlockedLessonIds,
    }),
    lessonSequenceLocked,
    requiresPurchase,
    lessonStartDisabled,
    lessonStartLabel,
    lessonStartAccessibilityLabel,
    skipGate,
    skipStatusMessage,
    skipButtonTitle,
    skipButtonAccessibilityLabel,
    skipToSelectedLesson,
    purchaseStatusMessage,
    purchaseStatusKind,
    showPurchaseRetry,
    purchaseRetryLabel,
    purchaseRetryAccessibilityLabel,
    restorePurchaseLabel,
    restorePurchaseDisabled,
    unlockCourseDisabled,
    purchaseButtonTitle,
    lessonProgressPercent,
    totalLessons: LEARN_COURSE.length,
    startLesson,
    handleProgressSynced,
    returnHome,
    restorePurchase,
    buyCourse,
    retryStore,
    onSelectLesson: setSelectedLessonId,
  };
}

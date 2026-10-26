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
import { requiresLearnCourseUnlock } from '@/rhythm/learnCourseAccess';
import { useLearnCoursePurchase } from '@/hooks/useLearnCoursePurchase';
import { readLearnProgress, readLearnRatings, syncLearnProgressIfEnabled } from '@/store/learnProgress';
import type { LearnCourseProgressSnapshot } from '@/rhythm/learnProgressSync';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';

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
  const [lessonRatings, setLessonRatings] = useState<Awaited<ReturnType<typeof readLearnRatings>>>([]);
  const [selectedLessonId, setSelectedLessonId] = useState(LEARN_COURSE[0].id);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [starting, setStarting] = useState(false);
  const compact = width < 950;
  const detailWidth = (width - insets.left - insets.right) * (compact ? 0.56 : 0.64);

  useEffect(() => {
    if (!featureFlags.learnCourse) router.replace('/');
  }, [featureFlags.learnCourse, router]);

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.all([readLearnProgress(), readLearnRatings()]).then(([completed, ratings]) => {
      if (!active) return;
      setCompletedLessonIds(completed);
      setLessonRatings(ratings);
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
      const [completed, ratings] = await Promise.all([readLearnProgress(), readLearnRatings()]);
      if (!active) return;
      setCompletedLessonIds(completed);
      setLessonRatings(ratings);
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
  const lessonAvailability = getLessonAvailability(selectedLesson.id, completedLessonIds);
  const requiresPurchase = requiresLearnCourseUnlock(selectedLesson, purchase.hasFullCourseUnlock);
  const lessonSequenceLocked = lessonAvailability === 'locked';
  const completedCount = completedLessonIds.length;
  const starsEarned = totalLearnStars(lessonRatings);
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
    if (starting || !progressLoaded || requiresPurchase || lessonSequenceLocked || audioStatus === 'loading') return;
    setStarting(true);
    try {
      await prepareExercise(undefined, {
        settings: lessonSettings(selectedLesson, settings),
        patternPairs: selectedLesson.patternPairs,
        patternPairWeights: selectedLesson.patternPairWeights,
      });
      router.replace({ pathname: '/practice', params: { lessonId: selectedLesson.id } });
    } catch {
      Alert.alert(t('Audio could not start'), t('Check your device audio settings and try again.'));
    } finally {
      setStarting(false);
    }
  }, [audioStatus, lessonSequenceLocked, prepareExercise, progressLoaded, requiresPurchase, router, selectedLesson, settings, starting, t]);

  const handleProgressSynced = useCallback((snapshot: LearnCourseProgressSnapshot) => {
    setCompletedLessonIds(snapshot.completedLessonIds);
    setLessonRatings(snapshot.ratings);
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
    lessonRatings,
    selectedLesson,
    progressLoaded,
    starting,
    compact,
    detailWidth,
    insets,
    completedCount,
    starsEarned,
    lessonNumber,
    previousLessonNumber,
    lessonSequenceLocked,
    requiresPurchase,
    lessonStartDisabled,
    lessonStartLabel,
    lessonStartAccessibilityLabel,
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

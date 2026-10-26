import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullBleedSafeArea } from '@/components/FullBleedSafeArea';
import {
  getLessonAvailability,
  LEARN_COURSE,
  lessonProgressPercent,
  lessonSettings,
} from '@/rhythm/learnCourse';
import { totalLearnStars } from '@/rhythm/learnRating';
import { requiresLearnCourseUnlock } from '@/rhythm/learnCourseAccess';
import { useLearnCoursePurchase } from '@/hooks/useLearnCoursePurchase';
import {
  readLearnProgress,
  readLearnRatings,
  syncLearnProgressIfEnabled,
} from '@/store/learnProgress';
import { GameCenterCourseProgressButton } from '@/components/GameCenterCourseProgressButton';
import type { LearnCourseProgressSnapshot } from '@/rhythm/learnProgressSync';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import { LearnPatternPreview } from '@/components/LearnPatternPreview';
import { LearnCoursePath } from '@/components/LearnCoursePath';
import { learnStyle1,
  learnStyle2,
  learnStyle3,
  learnStyle4,
  learnStyle5,
  learnStyle6,
  learnStyle7,
  learnStyle8,
  learnStyle9,
  learnStyle10,
  learnStyle11,
  learnStyle12,
  learnStyle13,
  learnStyle14,
  learnStyle15,
  learnStyle16,
  learnStyle17,
  learnStyle18,
  learnStyle19,
  learnStyle20,
  learnStyle21,
  learnStyle22,
  learnStyle23,
  learnStyle24,
  learnStyle25,
  learnStyle26,
  learnStyle27,
  learnStyle28,
  learnStyle29,
  learnStyle30,
  learnStyle31,
  learnStyle32,
  learnStyle33,
  learnStyle34,
  learnStyle35,
  learnStyle36,
  learnStyle37,
  learnStyle38,
  learnStyle39,
  learnStyle40,
  learnStyle41,
  learnStyle42, learnStyle43, learnStyle44 } from '@/styles/learn';

export default function LearnScreen() {
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
    return () => {
      active = false;
    };
  }, [routeLessonId]));

  const selectedLesson = useMemo(
    () => LEARN_COURSE.find((lesson) => lesson.id === selectedLessonId) ?? LEARN_COURSE[0],
    [selectedLessonId],
  );
  const completedCount = completedLessonIds.length;
  const lessonAvailability = getLessonAvailability(selectedLesson.id, completedLessonIds);
  const requiresPurchase = requiresLearnCourseUnlock(selectedLesson, purchase.hasFullCourseUnlock);
  const lessonSequenceLocked = lessonAvailability === 'locked';

  const startLesson = async () => {
    if (
      starting
      || !progressLoaded
      || requiresPurchase
      || lessonSequenceLocked
      || audioStatus === 'loading'
    ) return;
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
  };

  const handleProgressSynced = useCallback((snapshot: LearnCourseProgressSnapshot) => {
    setCompletedLessonIds(snapshot.completedLessonIds);
    setLessonRatings(snapshot.ratings);
    const requested = LEARN_COURSE.find((lesson) => lesson.id === routeLessonId);
    const nextLesson = LEARN_COURSE.find((lesson) => !snapshot.completedLessonIds.includes(lesson.id));
    setSelectedLessonId((requested && !snapshot.completedLessonIds.includes(requested.id)
      ? requested
      : nextLesson ?? LEARN_COURSE.at(-1)!).id);
  }, [routeLessonId]);

  return (
    <FullBleedSafeArea
      testID="learn.screen"
      backgroundColor={colors.background}
      contentStyle={learnStyle43()}
      underlay={(
        <View
          pointerEvents="none"
          style={learnStyle1({ detailWidth, insets, colors })}
        />
      )}
    >
      <ScrollView
        style={learnStyle2({ detailWidth })}
        contentContainerStyle={learnStyle44({ compact })}
        showsVerticalScrollIndicator={false}
      >
        <Pressable testID="learn.home" onPress={() => router.replace('/')} hitSlop={8} style={learnStyle3()}>
          <Text style={learnStyle4({ colors })}>‹  HOME</Text>
        </Pressable>
        <Text style={learnStyle5({ colors, compact })}>
          GUIDED COURSE
        </Text>
        <Text style={learnStyle6({ colors, compact })}>
          Learn rhythm.
        </Text>
        <Text style={learnStyle7({ colors })}>
          A simple path from steady pulse to independent rhythms.
        </Text>

        <View style={learnStyle8({ compact })}>
          <View style={learnStyle9()}>
            <Text style={learnStyle10({ colors })}>YOUR PROGRESS</Text>
            <Text testID="learn.progress.count" style={learnStyle11({ colors })}>
              {completedCount} / {LEARN_COURSE.length}
            </Text>
          </View>
          <View style={learnStyle12({ colors })}>
            <View style={learnStyle13({ lessonProgressPercent, completedLessonIds, colors })} />
          </View>
          <Text testID="learn.progress.stars" style={learnStyle14({ colors })}>
              {totalLearnStars(lessonRatings)} / {LEARN_COURSE.length * 5} {t('course stars earned')}
          </Text>
          {purchase.isTestFlightFreeAccess ? (
            <View testID="learn.testflight-free" style={learnStyle15({ compact, colors })}>
              <Text style={learnStyle16({ colors })}>{t('TESTFLIGHT · FULL COURSE FREE')}</Text>
            </View>
          ) : (
            <Pressable
              testID="learn.restore"
              accessibilityRole="button"
              accessibilityLabel={t('Restore Learn course purchase')}
              accessibilityState={{ disabled: !purchase.connected || purchase.isRestoring }}
              disabled={!purchase.connected || purchase.isRestoring}
              onPress={() => void purchase.restoreFullCourse()}
              style={({ pressed }) => (learnStyle17({ compact, colors, purchase, pressed }))}
            >
              <Text style={learnStyle18({ colors })}>
                {purchase.isRestoring ? t('RESTORING…') : t('RESTORE PURCHASE')}
              </Text>
            </Pressable>
          )}
          {featureFlags.gameCenter ? (
            <GameCenterCourseProgressButton onProgressSynced={handleProgressSynced} />
          ) : null}
        </View>

        <View style={learnStyle19({ compact })}>
          <Text style={learnStyle20({ colors })}>
            {t('LESSON {number} · {level}', { number: String(selectedLesson.number).padStart(2, '0'), level: t(selectedLesson.level) })}
          </Text>
          <Text testID="learn.selected.title" style={learnStyle21({ colors, compact })}>
            {selectedLesson.title}
          </Text>
          <Text style={learnStyle22({ colors })}>
            {t(selectedLesson.skill)} · {selectedLesson.timeSignature}
          </Text>
          <Text numberOfLines={compact ? 2 : 3} style={learnStyle23({ colors })}>
            {selectedLesson.instruction}
          </Text>
          <LearnPatternPreview lesson={selectedLesson} />
        </View>

        {requiresPurchase ? (
          <View testID="learn.purchase.offer" style={learnStyle24({ colors })}>
            <Text style={learnStyle25({ colors })}>{t('FULL COURSE · ONE-TIME UNLOCK')}</Text>
            <Text style={learnStyle26({ colors })}>{t('Try the first 3 lessons free, then unlock all {count} lessons with one purchase.', { count: LEARN_COURSE.length })}</Text>
          </View>
        ) : lessonSequenceLocked ? (
          <Text style={learnStyle27({ colors })}>
            {t('Complete Lesson {number} first to open this lesson.', { number: String(selectedLesson.number - 1).padStart(2, '0') })}
          </Text>
        ) : null}

        <View style={learnStyle28({ compact })} />
        {requiresPurchase ? (
          <Pressable
            testID="learn.purchase"
            accessibilityRole="button"
            accessibilityLabel={t('Unlock the full Learn course')}
            accessibilityState={{ disabled: !purchase.connected || !purchase.unlockProduct || purchase.isPurchasing || !purchase.entitlementLoaded }}
            disabled={!purchase.connected || !purchase.unlockProduct || purchase.isPurchasing || !purchase.entitlementLoaded}
            onPress={() => void purchase.buyFullCourse()}
            style={({ pressed }) => (learnStyle29({ compact, colors, purchase, pressed }))}
          >
            <View>
              <Text style={learnStyle30({ colors })}>
                {purchase.isCheckingStoreEnvironment ? t('CHECKING ACCESS…') : !purchase.entitlementLoaded ? t('CHECKING ACCESS…') : !purchase.connected ? t('CONNECTING TO STORE…') : !purchase.productLookupFinished ? t('LOADING OFFER…') : purchase.isPurchasing ? t('PURCHASING…') : purchase.unlockProduct ? t('UNLOCK FULL COURSE · {price}', { price: purchase.unlockProduct.displayPrice }) : t('OFFER UNAVAILABLE')}
              </Text>
              <Text style={learnStyle31({ colors })}>
                {t('One-time purchase · 3 lessons free')}
              </Text>
            </View>
            <Text style={learnStyle32({ colors })}>›</Text>
          </Pressable>
        ) : (
          <Pressable
            testID="learn.start"
            accessibilityRole="button"
            accessibilityLabel={t('Start lesson {number}: {title}', { number: selectedLesson.number, title: t(selectedLesson.title) })}
            accessibilityState={{ disabled: starting || !progressLoaded || lessonSequenceLocked || audioStatus === 'loading' }}
            disabled={starting || !progressLoaded || lessonSequenceLocked || audioStatus === 'loading'}
            onPress={() => void startLesson()}
            style={({ pressed }) => (learnStyle33({ compact, colors, starting, progressLoaded, lessonSequenceLocked, audioStatus, pressed }))}
          >
            <View>
              <Text style={learnStyle34({ colors })}>
                {lessonSequenceLocked ? t('COMPLETE LESSON {number} FIRST', { number: String(selectedLesson.number - 1).padStart(2, '0') }) : starting ? 'PREPARING…' : !progressLoaded ? 'LOADING COURSE…' : audioStatus === 'loading' ? 'PREPARING AUDIO…' : audioStatus === 'error' ? 'RETRY AUDIO & START' : 'START LESSON'}
              </Text>
              <Text style={learnStyle35()}>
                {t('{bpm} BPM · about 30 seconds', { bpm: selectedLesson.bpm })}
              </Text>
            </View>
            <Text style={learnStyle36({ colors })}>›</Text>
          </Pressable>
        )}

        {purchase.errorMessage ? (
          <Text accessibilityLiveRegion="polite" numberOfLines={2} style={learnStyle37({ colors })}>
            {t(purchase.errorMessage)}
          </Text>
        ) : purchase.storeErrorMessage ? (
          <Text accessibilityLiveRegion="polite" numberOfLines={2} style={learnStyle38({ colors })}>
            {t(purchase.storeErrorMessage)}
          </Text>
        ) : purchase.notice ? (
          <Text accessibilityLiveRegion="polite" numberOfLines={2} style={learnStyle39({ colors })}>
            {t(purchase.notice)}
          </Text>
        ) : purchase.connected && purchase.productLookupFinished && !purchase.unlockProduct ? (
          <Text accessibilityLiveRegion="polite" numberOfLines={2} style={learnStyle40({ colors })}>
            {t('The course offer is not available in the store yet. Check the in-app purchase setup and try again.')}
          </Text>
        ) : null}
        {purchase.storeErrorMessage || (purchase.connected && purchase.productLookupFinished && !purchase.unlockProduct) ? (
          <Pressable
            testID="learn.purchase.retry"
            accessibilityRole="button"
            accessibilityLabel={t(purchase.connected ? 'Reload course offer from the store' : 'Retry app store connection')}
            disabled={purchase.isRetryingStore}
            onPress={() => void purchase.retryStoreConnection()}
            style={({ pressed }) => (learnStyle41({ purchase, pressed }))}
          >
            <Text style={learnStyle42({ colors })}>{purchase.isRetryingStore ? t('CHECKING STORE…') : purchase.connected ? t('RELOAD STORE OFFER') : t('RETRY STORE CONNECTION')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <LearnCoursePath
        compact={compact}
        completedLessonIds={completedLessonIds}
        hasFullCourseUnlock={purchase.hasFullCourseUnlock}
        lessonRatings={lessonRatings}
        selectedLessonId={selectedLesson.id}
        onSelectLesson={setSelectedLessonId}
      />
    </FullBleedSafeArea>
  );
}

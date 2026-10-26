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
      contentStyle={{ flexDirection: 'row' }}
      underlay={(
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: detailWidth + insets.left,
            borderRightWidth: 1,
            borderRightColor: colors.line,
            backgroundColor: colors.surface,
          }}
        />
      )}
    >
      <ScrollView
        style={{ width: detailWidth, flexGrow: 0, backgroundColor: 'transparent' }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: compact ? 16 : 24, paddingVertical: compact ? 10 : 18 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable testID="learn.home" onPress={() => router.replace('/')} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.9 }}>‹  HOME</Text>
        </Pressable>
        <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: compact ? 7 : 15 }}>
          GUIDED COURSE
        </Text>
        <Text style={{ color: colors.text, fontSize: compact ? 24 : 30, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 }}>
          Learn rhythm.
        </Text>
        <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>
          A simple path from steady pulse to independent rhythms.
        </Text>

        <View style={{ marginTop: compact ? 13 : 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>YOUR PROGRESS</Text>
            <Text testID="learn.progress.count" style={{ color: colors.accent, fontSize: 11, fontWeight: '900' }}>
              {completedCount} / {LEARN_COURSE.length}
            </Text>
          </View>
          <View style={{ height: 5, borderRadius: 4, backgroundColor: colors.line, marginTop: 8, overflow: 'hidden' }}>
            <View style={{ width: `${lessonProgressPercent(completedLessonIds)}%`, height: 5, borderRadius: 4, backgroundColor: colors.left }} />
          </View>
          <Text testID="learn.progress.stars" style={{ color: colors.muted, fontSize: 9, fontWeight: '800', marginTop: 6 }}>
              {totalLearnStars(lessonRatings)} / {LEARN_COURSE.length * 5} {t('course stars earned')}
          </Text>
          {purchase.isTestFlightFreeAccess ? (
            <View testID="learn.testflight-free" style={{ alignSelf: 'flex-start', minHeight: 44, marginTop: compact ? 10 : 12, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 10, backgroundColor: colors.surfaceRaised }}>
              <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>{t('TESTFLIGHT · FULL COURSE FREE')}</Text>
            </View>
          ) : (
            <Pressable
              testID="learn.restore"
              accessibilityRole="button"
              accessibilityLabel={t('Restore Learn course purchase')}
              accessibilityState={{ disabled: !purchase.connected || purchase.isRestoring }}
              disabled={!purchase.connected || purchase.isRestoring}
              onPress={() => void purchase.restoreFullCourse()}
              style={({ pressed }) => ({ alignSelf: 'flex-end', minHeight: 44, marginTop: compact ? 10 : 12, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, opacity: !purchase.connected || purchase.isRestoring ? 0.5 : pressed ? 0.7 : 1 })}
            >
              <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>
                {purchase.isRestoring ? t('RESTORING…') : t('RESTORE PURCHASE')}
              </Text>
            </Pressable>
          )}
          {featureFlags.gameCenter ? (
            <GameCenterCourseProgressButton onProgressSynced={handleProgressSynced} />
          ) : null}
        </View>

        <View style={{ marginTop: compact ? 14 : 23 }}>
          <Text style={{ color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }}>
            {t('LESSON {number} · {level}', { number: String(selectedLesson.number).padStart(2, '0'), level: t(selectedLesson.level) })}
          </Text>
          <Text testID="learn.selected.title" style={{ color: colors.text, fontSize: compact ? 18 : 22, fontWeight: '900', marginTop: 5 }}>
            {selectedLesson.title}
          </Text>
          <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800', marginTop: 3 }}>
            {t(selectedLesson.skill)} · {selectedLesson.timeSignature}
          </Text>
          <Text numberOfLines={compact ? 2 : 3} style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 7 }}>
            {selectedLesson.instruction}
          </Text>
          <LearnPatternPreview lesson={selectedLesson} />
        </View>

        {requiresPurchase ? (
          <View testID="learn.purchase.offer" style={{ marginTop: 14, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.9 }}>{t('FULL COURSE · ONE-TIME UNLOCK')}</Text>
            <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 4 }}>{t('Try the first 3 lessons free, then unlock all {count} lessons with one purchase.', { count: LEARN_COURSE.length })}</Text>
          </View>
        ) : lessonSequenceLocked ? (
          <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 12 }}>
            {t('Complete Lesson {number} first to open this lesson.', { number: String(selectedLesson.number - 1).padStart(2, '0') })}
          </Text>
        ) : null}

        <View style={{ flex: 1, minHeight: compact ? 8 : 18 }} />
        {requiresPurchase ? (
          <Pressable
            testID="learn.purchase"
            accessibilityRole="button"
            accessibilityLabel={t('Unlock the full Learn course')}
            accessibilityState={{ disabled: !purchase.connected || !purchase.unlockProduct || purchase.isPurchasing || !purchase.entitlementLoaded }}
            disabled={!purchase.connected || !purchase.unlockProduct || purchase.isPurchasing || !purchase.entitlementLoaded}
            onPress={() => void purchase.buyFullCourse()}
            style={({ pressed }) => ({ minHeight: compact ? 50 : 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderRadius: 15, backgroundColor: colors.accent, opacity: !purchase.connected || !purchase.unlockProduct || purchase.isPurchasing || !purchase.entitlementLoaded ? 0.6 : pressed ? 0.82 : 1 })}
          >
            <View>
              <Text style={{ color: colors.background, fontSize: 12, fontWeight: '900', letterSpacing: 0.4 }}>
                {purchase.isCheckingStoreEnvironment ? t('CHECKING ACCESS…') : !purchase.entitlementLoaded ? t('CHECKING ACCESS…') : !purchase.connected ? t('CONNECTING TO STORE…') : !purchase.productLookupFinished ? t('LOADING OFFER…') : purchase.isPurchasing ? t('PURCHASING…') : purchase.unlockProduct ? t('UNLOCK FULL COURSE · {price}', { price: purchase.unlockProduct.displayPrice }) : t('OFFER UNAVAILABLE')}
              </Text>
              <Text style={{ color: colors.background, fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                {t('One-time purchase · 3 lessons free')}
              </Text>
            </View>
            <Text style={{ color: colors.background, fontSize: 22, fontWeight: '700' }}>›</Text>
          </Pressable>
        ) : (
          <Pressable
            testID="learn.start"
            accessibilityRole="button"
            accessibilityLabel={t('Start lesson {number}: {title}', { number: selectedLesson.number, title: t(selectedLesson.title) })}
            accessibilityState={{ disabled: starting || !progressLoaded || lessonSequenceLocked || audioStatus === 'loading' }}
            disabled={starting || !progressLoaded || lessonSequenceLocked || audioStatus === 'loading'}
            onPress={() => void startLesson()}
            style={({ pressed }) => ({ minHeight: compact ? 50 : 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderRadius: 15, backgroundColor: colors.left, opacity: starting || !progressLoaded || lessonSequenceLocked || audioStatus === 'loading' ? 0.65 : pressed ? 0.84 : 1 })}
          >
            <View>
              <Text style={{ color: colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }}>
                {lessonSequenceLocked ? t('COMPLETE LESSON {number} FIRST', { number: String(selectedLesson.number - 1).padStart(2, '0') }) : starting ? 'PREPARING…' : !progressLoaded ? 'LOADING COURSE…' : audioStatus === 'loading' ? 'PREPARING AUDIO…' : audioStatus === 'error' ? 'RETRY AUDIO & START' : 'START LESSON'}
              </Text>
              <Text style={{ color: '#18352C', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                {t('{bpm} BPM · about 30 seconds', { bpm: selectedLesson.bpm })}
              </Text>
            </View>
            <Text style={{ color: colors.background, fontSize: 22, fontWeight: '700' }}>›</Text>
          </Pressable>
        )}

        {purchase.errorMessage ? (
          <Text accessibilityLiveRegion="polite" numberOfLines={2} style={{ color: colors.right, fontSize: 9, lineHeight: 13, marginTop: 6 }}>
            {t(purchase.errorMessage)}
          </Text>
        ) : purchase.storeErrorMessage ? (
          <Text accessibilityLiveRegion="polite" numberOfLines={2} style={{ color: colors.right, fontSize: 9, lineHeight: 13, marginTop: 6 }}>
            {t(purchase.storeErrorMessage)}
          </Text>
        ) : purchase.notice ? (
          <Text accessibilityLiveRegion="polite" numberOfLines={2} style={{ color: colors.left, fontSize: 9, lineHeight: 13, marginTop: 6 }}>
            {t(purchase.notice)}
          </Text>
        ) : purchase.connected && purchase.productLookupFinished && !purchase.unlockProduct ? (
          <Text accessibilityLiveRegion="polite" numberOfLines={2} style={{ color: colors.muted, fontSize: 9, lineHeight: 13, marginTop: 6 }}>
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
            style={({ pressed }) => ({ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, opacity: purchase.isRetryingStore ? 0.55 : pressed ? 0.7 : 1 })}
          >
            <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 }}>{purchase.isRetryingStore ? t('CHECKING STORE…') : purchase.connected ? t('RELOAD STORE OFFER') : t('RETRY STORE CONNECTION')}</Text>
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

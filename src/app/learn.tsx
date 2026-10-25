import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullBleedSafeArea } from '@/components/FullBleedSafeArea';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import {
  getLessonAvailability,
  LEARN_COURSE,
  lessonHandPatternOptions,
  lessonOffersHandSwaps,
  lessonProgressPercent,
  lessonSettings,
} from '@/rhythm/learnCourse';
import { starsForAccuracy, totalLearnStars } from '@/rhythm/learnRating';
import { requiresLearnCourseUnlock } from '@/rhythm/learnCourseAccess';
import { useLearnCoursePurchase } from '@/hooks/useLearnCoursePurchase';
import { readLearnProgress, readLearnRatings } from '@/store/learnProgress';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { LearnLesson } from '@/rhythm/learnCourse';

function LessonTile({
  lesson,
  selected,
  completed,
  locked,
  paywalled,
  rating,
  onPress,
}: {
  lesson: LearnLesson;
  selected: boolean;
  completed: boolean;
  locked: boolean;
  paywalled: boolean;
  rating?: { bestAccuracy: number; attempts: number };
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const disabled = locked && !paywalled;
  const stars = rating ? starsForAccuracy(rating.bestAccuracy) : 0;
  const lessonStatus = completed
    ? t(', complete')
    : paywalled
      ? t(', paid course, tap to unlock')
      : locked
        ? t(', locked')
        : '';
  const lessonRating = rating
    ? t(', best {accuracy} percent, {stars} of 5 stars', { accuracy: Math.round(rating.bestAccuracy), stars })
    : '';
  return (
    <Pressable
      testID={`learn.lesson.${lesson.id}`}
      accessibilityRole="button"
      accessibilityLabel={t('Lesson {number}, {title}{status}{rating}', {
        number: lesson.number,
        title: t(lesson.title),
        status: lessonStatus,
        rating: lessonRating,
      })}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexGrow: 0,
        flexBasis: 'auto',
        width: '100%',
        minWidth: 0,
        minHeight: 82,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: selected ? colors.surfaceRaised : colors.surface,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? colors.accent : colors.line,
        opacity: disabled ? 0.42 : pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }}>
          {String(lesson.number).padStart(2, '0')} · {t(lesson.level)}
        </Text>
        <Text style={{ color: completed ? colors.left : disabled ? colors.dim : colors.accent, fontSize: 11, fontWeight: '900' }}>
          {completed ? '✓' : paywalled ? 'PRO' : locked ? 'LOCKED' : '›'}
        </Text>
      </View>
      <Text numberOfLines={1} style={{ color: disabled ? colors.muted : colors.text, fontSize: 14, fontWeight: '800', marginTop: 8 }}>
        {lesson.title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 3 }}>
        <Text numberOfLines={1} style={{ flex: 1, color: colors.muted, fontSize: 10 }}>
          {lesson.skill}
        </Text>
        {rating ? (
          <Text testID={`learn.rating.${lesson.id}`} style={{ color: colors.accent, fontSize: 9, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
            {Math.round(rating.bestAccuracy)}% · {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          </Text>
        ) : completed ? (
          <Text style={{ color: colors.dim, fontSize: 8, fontWeight: '800' }}>REPLAY FOR RATING</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function PatternPreview({ lesson }: { lesson: LearnLesson }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const weights = lesson.handSubdivisionWeights;
  if (weights) {
    const distribution = Object.entries(weights)
      .filter((entry): entry is [LearnLesson['patternPairs'][number]['leftSubdivision'], number] => entry[1] > 0);
    return (
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 }}>
          LEFT + RIGHT · WEIGHTED MIX
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
          {distribution.map(([subdivision, weight]) => (
            <View
              key={subdivision}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}
            >
              <RhythmSymbol subdivision={subdivision} color={colors.accent} mini timeSignature={lesson.timeSignature} />
              <Text style={{ color: colors.text, fontSize: 8, fontWeight: '800' }}>
                {Math.round(weight)}% {t(SUBDIVISION_LABELS[subdivision])}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ color: colors.dim, fontSize: 8, fontWeight: '700', marginTop: 6 }}>
          Each hand chooses independently from this mix.
        </Text>
        {lessonOffersHandSwaps(lesson) ? (
          <Text style={{ color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 5 }}>
            ↔ BOTH HANDS TAKE EACH RHYTHM
          </Text>
        ) : null}
      </View>
    );
  }

  if (lesson.patternPairs.length > 1) {
    const leftOptions = lessonHandPatternOptions(lesson, 'left');
    const rightOptions = lessonHandPatternOptions(lesson, 'right');
    return (
      <View style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
          <PatternNoteOptions label="LEFT" options={leftOptions} color={colors.left} timeSignature={lesson.timeSignature} />
          {lesson.trainingMode === 'two-hand' ? (
            <PatternNoteOptions label="RIGHT" options={rightOptions} color={colors.right} timeSignature={lesson.timeSignature} />
          ) : null}
        </View>
        {lessonOffersHandSwaps(lesson) ? (
          <Text style={{ color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 8 }}>
            ↔ BOTH HANDS TAKE EACH RHYTHM
          </Text>
        ) : null}
      </View>
    );
  }

  const pair = lesson.patternPairs[0];
  const oneHand = lesson.trainingMode === 'single-hand';
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <PatternNote label={oneHand ? 'ONE HAND' : 'LEFT'} subdivision={pair.leftSubdivision} color={oneHand ? colors.accent : colors.left} timeSignature={lesson.timeSignature} />
        {oneHand ? null : <PatternNote label="RIGHT" subdivision={pair.rightSubdivision} color={colors.right} timeSignature={lesson.timeSignature} />}
      </View>
      {lessonOffersHandSwaps(lesson) ? (
        <Text style={{ color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 8 }}>
          ↔ BOTH HANDS TAKE EACH RHYTHM
        </Text>
      ) : null}
    </View>
  );
}

function PatternNote({
  label,
  subdivision,
  color,
  timeSignature,
}: {
  label: string;
  subdivision: LearnLesson['patternPairs'][number]['leftSubdivision'];
  color: string;
  timeSignature: LearnLesson['timeSignature'];
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const displayName = t(SUBDIVISION_LABELS[subdivision]).replace(' (', '\n(');
  return (
    <View style={{ flex: 1, minWidth: 0, minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
      <Text style={{ alignSelf: 'stretch', color, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>{label}</Text>
      <RhythmSymbol subdivision={subdivision} color={color} compact timeSignature={timeSignature} />
      <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.65} style={{ alignSelf: 'stretch', color: colors.text, fontSize: 10, lineHeight: 12, fontWeight: '700', textAlign: 'center' }}>{displayName}</Text>
    </View>
  );
}

function PatternNoteOptions({
  label,
  options,
  color,
  timeSignature,
}: {
  label: string;
  options: ReturnType<typeof lessonHandPatternOptions>;
  color: string;
  timeSignature: LearnLesson['timeSignature'];
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const names = [
    ...options.subdivisions.map((subdivision) => t(SUBDIVISION_LABELS[subdivision])),
    ...(options.includesRest ? [t('Rest')] : []),
  ];
  return (
    <View style={{ flex: 1, minWidth: 0, minHeight: 82, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
      <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }}>
        {options.subdivisions.map((subdivision) => (
          <RhythmSymbol key={subdivision} subdivision={subdivision} color={color} mini timeSignature={timeSignature} />
        ))}
        {options.includesRest ? (
          <Text style={{ color, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }}>REST</Text>
        ) : null}
      </View>
      <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: colors.text, fontSize: 9, lineHeight: 11, fontWeight: '700', marginTop: 4 }}>
        {names.join(' · ')}
      </Text>
    </View>
  );
}

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
          <PatternPreview lesson={selectedLesson} />
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

      <View style={{ flex: 1, minWidth: 0, paddingHorizontal: compact ? 10 : 18, paddingTop: compact ? 13 : 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: compact ? 9 : 14 }}>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }}>COURSE PATH</Text>
          <Text numberOfLines={1} style={{ color: colors.dim, fontSize: compact ? 9 : 10, fontWeight: '700' }}>First 3 free · finish each to progress</Text>
        </View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
          {LEARN_COURSE.map((lesson) => {
            const availability = getLessonAvailability(lesson.id, completedLessonIds);
            const paywalled = requiresLearnCourseUnlock(lesson, purchase.hasFullCourseUnlock);
            return (
              <LessonTile
                key={lesson.id}
                lesson={lesson}
                selected={selectedLesson.id === lesson.id}
                completed={availability === 'complete'}
                locked={availability === 'locked'}
                paywalled={paywalled}
                rating={lessonRatings.find((rating) => rating.lessonId === lesson.id)}
                onPress={() => setSelectedLessonId(lesson.id)}
              />
            );
          })}
        </ScrollView>
      </View>
    </FullBleedSafeArea>
  );
}

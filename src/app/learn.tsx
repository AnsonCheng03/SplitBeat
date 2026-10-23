import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullBleedSafeArea } from '@/components/FullBleedSafeArea';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import {
  getLessonAvailability,
  LEARN_COURSE,
  lessonProgressPercent,
  lessonSettings,
} from '@/rhythm/learnCourse';
import { requiresLearnCourseUnlock } from '@/rhythm/learnCourseAccess';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { useLearnCoursePurchase } from '@/hooks/useLearnCoursePurchase';
import { readLearnProgress } from '@/store/learnProgress';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';
import type { LearnLesson } from '@/rhythm/learnCourse';

function LessonTile({
  lesson,
  selected,
  completed,
  locked,
  paywalled,
  onPress,
}: {
  lesson: LearnLesson;
  selected: boolean;
  completed: boolean;
  locked: boolean;
  paywalled: boolean;
  onPress: () => void;
}) {
  const disabled = locked && !paywalled;
  return (
    <Pressable
      testID={`learn.lesson.${lesson.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Lesson ${lesson.number}, ${lesson.title}${completed ? ', complete' : paywalled ? ', paid course, tap to unlock' : locked ? ', locked' : ''}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexGrow: 0,
        flexBasis: 'auto',
        width: '100%',
        minWidth: 0,
        minHeight: 76,
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
          {String(lesson.number).padStart(2, '0')} · {lesson.level}
        </Text>
        <Text style={{ color: completed ? colors.left : disabled ? colors.dim : colors.accent, fontSize: 11, fontWeight: '900' }}>
          {completed ? '✓' : paywalled ? 'PRO' : locked ? 'LOCKED' : '›'}
        </Text>
      </View>
      <Text numberOfLines={1} style={{ color: disabled ? colors.muted : colors.text, fontSize: 14, fontWeight: '800', marginTop: 8 }}>
        {lesson.title}
      </Text>
      <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 10, marginTop: 3 }}>
        {lesson.skill}
      </Text>
    </Pressable>
  );
}

function PatternPreview({ lesson }: { lesson: LearnLesson }) {
  const pair = lesson.patternPairs[0];
  const oneHand = lesson.trainingMode === 'single-hand';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
      <PatternNote label={oneHand ? 'ONE HAND' : 'LEFT'} subdivision={pair.leftSubdivision} color={oneHand ? colors.accent : colors.left} timeSignature={lesson.timeSignature} />
      {oneHand ? null : <PatternNote label="RIGHT" subdivision={pair.rightSubdivision} color={colors.right} timeSignature={lesson.timeSignature} />}
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
  return (
    <View style={{ flex: 1, minWidth: 0, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
      <RhythmSymbol subdivision={subdivision} color={color} compact timeSignature={timeSignature} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>{label}</Text>
        <Text numberOfLines={1} style={{ color: colors.text, fontSize: 11, fontWeight: '700', marginTop: 2 }}>{SUBDIVISION_LABELS[subdivision]}</Text>
      </View>
    </View>
  );
}

export default function LearnScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lessonId: routeLessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const { settings, audioStatus, prepareExercise } = useRhythmSession();
  const purchase = useLearnCoursePurchase();
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState(LEARN_COURSE[0].id);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [starting, setStarting] = useState(false);
  const compact = width < 950;
  const detailWidth = (width - insets.left - insets.right) * (compact ? 0.56 : 0.64);

  useFocusEffect(useCallback(() => {
    let active = true;
    void readLearnProgress().then((completed) => {
      if (!active) return;
      setCompletedLessonIds(completed);
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
      });
      router.replace({ pathname: '/practice', params: { lessonId: selectedLesson.id } });
    } catch {
      Alert.alert('Audio could not start', 'Check your device audio settings and try again.');
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
          <Pressable
            testID="learn.restore"
            accessibilityRole="button"
            accessibilityLabel="Restore Learn course purchase"
            accessibilityState={{ disabled: !purchase.connected || purchase.isRestoring }}
            disabled={!purchase.connected || purchase.isRestoring}
            onPress={() => void purchase.restoreFullCourse()}
            style={({ pressed }) => ({ alignSelf: 'flex-end', minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, opacity: !purchase.connected || purchase.isRestoring ? 0.5 : pressed ? 0.7 : 1 })}
          >
            <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>
              {purchase.isRestoring ? 'RESTORING…' : 'RESTORE PURCHASE'}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: compact ? 14 : 23 }}>
          <Text style={{ color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }}>
            LESSON {String(selectedLesson.number).padStart(2, '0')} · {selectedLesson.level}
          </Text>
          <Text testID="learn.selected.title" style={{ color: colors.text, fontSize: compact ? 18 : 22, fontWeight: '900', marginTop: 5 }}>
            {selectedLesson.title}
          </Text>
          <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800', marginTop: 3 }}>
            {selectedLesson.skill} · {selectedLesson.timeSignature}
          </Text>
          <Text numberOfLines={compact ? 2 : 3} style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 7 }}>
            {selectedLesson.instruction}
          </Text>
          <PatternPreview lesson={selectedLesson} />
        </View>

        {requiresPurchase ? (
          <View testID="learn.purchase.offer" style={{ marginTop: 14, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.9 }}>FULL COURSE · ONE-TIME UNLOCK</Text>
            <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 4 }}>Try the first 3 lessons free, then unlock all 12 lessons with one purchase.</Text>
          </View>
        ) : lessonSequenceLocked ? (
          <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 12 }}>
            Complete Lesson {String(selectedLesson.number - 1).padStart(2, '0')} first to open this lesson.
          </Text>
        ) : null}

        <View style={{ flex: 1, minHeight: compact ? 8 : 18 }} />
        {requiresPurchase ? (
          <Pressable
            testID="learn.purchase"
            accessibilityRole="button"
            accessibilityLabel="Unlock the full Learn course"
            accessibilityState={{ disabled: !purchase.connected || !purchase.unlockProduct || purchase.isPurchasing || !purchase.entitlementLoaded }}
            disabled={!purchase.connected || !purchase.unlockProduct || purchase.isPurchasing || !purchase.entitlementLoaded}
            onPress={() => void purchase.buyFullCourse()}
            style={({ pressed }) => ({ minHeight: compact ? 50 : 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderRadius: 15, backgroundColor: colors.accent, opacity: !purchase.connected || !purchase.unlockProduct || purchase.isPurchasing || !purchase.entitlementLoaded ? 0.6 : pressed ? 0.82 : 1 })}
          >
            <View>
              <Text style={{ color: colors.background, fontSize: 12, fontWeight: '900', letterSpacing: 0.4 }}>
                {!purchase.entitlementLoaded ? 'CHECKING ACCESS…' : !purchase.connected ? 'CONNECTING TO STORE…' : !purchase.productLookupFinished ? 'LOADING OFFER…' : purchase.isPurchasing ? 'PURCHASING…' : purchase.unlockProduct ? `UNLOCK FULL COURSE · ${purchase.unlockProduct.displayPrice}` : 'OFFER UNAVAILABLE'}
              </Text>
              <Text style={{ color: colors.background, fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                One-time purchase · 3 lessons free
              </Text>
            </View>
            <Text style={{ color: colors.background, fontSize: 22, fontWeight: '700' }}>›</Text>
          </Pressable>
        ) : (
          <Pressable
            testID="learn.start"
            accessibilityRole="button"
            accessibilityLabel={`Start lesson ${selectedLesson.number}: ${selectedLesson.title}`}
            accessibilityState={{ disabled: starting || !progressLoaded || lessonSequenceLocked || audioStatus === 'loading' }}
            disabled={starting || !progressLoaded || lessonSequenceLocked || audioStatus === 'loading'}
            onPress={() => void startLesson()}
            style={({ pressed }) => ({ minHeight: compact ? 50 : 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderRadius: 15, backgroundColor: colors.left, opacity: starting || !progressLoaded || lessonSequenceLocked || audioStatus === 'loading' ? 0.65 : pressed ? 0.84 : 1 })}
          >
            <View>
              <Text style={{ color: colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }}>
                {lessonSequenceLocked ? `COMPLETE LESSON ${String(selectedLesson.number - 1).padStart(2, '0')} FIRST` : starting ? 'PREPARING…' : !progressLoaded ? 'LOADING COURSE…' : audioStatus === 'loading' ? 'PREPARING AUDIO…' : audioStatus === 'error' ? 'RETRY AUDIO & START' : 'START LESSON'}
              </Text>
              <Text style={{ color: '#18352C', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                {selectedLesson.bpm} BPM · about 30 seconds
              </Text>
            </View>
            <Text style={{ color: colors.background, fontSize: 22, fontWeight: '700' }}>›</Text>
          </Pressable>
        )}

        {purchase.errorMessage ? (
          <Text accessibilityLiveRegion="polite" numberOfLines={2} style={{ color: colors.right, fontSize: 9, lineHeight: 13, marginTop: 6 }}>
            {purchase.errorMessage}
          </Text>
        ) : purchase.storeErrorMessage ? (
          <Text accessibilityLiveRegion="polite" numberOfLines={2} style={{ color: colors.right, fontSize: 9, lineHeight: 13, marginTop: 6 }}>
            {purchase.storeErrorMessage}
          </Text>
        ) : purchase.notice ? (
          <Text accessibilityLiveRegion="polite" numberOfLines={2} style={{ color: colors.left, fontSize: 9, lineHeight: 13, marginTop: 6 }}>
            {purchase.notice}
          </Text>
        ) : purchase.connected && purchase.productLookupFinished && !purchase.unlockProduct ? (
          <Text accessibilityLiveRegion="polite" numberOfLines={2} style={{ color: colors.muted, fontSize: 9, lineHeight: 13, marginTop: 6 }}>
            The course offer is not available in the store yet. Check the in-app purchase setup and try again.
          </Text>
        ) : null}
        {purchase.storeErrorMessage || (purchase.connected && purchase.productLookupFinished && !purchase.unlockProduct) ? (
          <Pressable
            testID="learn.purchase.retry"
            accessibilityRole="button"
            accessibilityLabel={purchase.connected ? 'Reload course offer from the store' : 'Retry app store connection'}
            disabled={purchase.isRetryingStore}
            onPress={() => void purchase.retryStoreConnection()}
            style={({ pressed }) => ({ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, opacity: purchase.isRetryingStore ? 0.55 : pressed ? 0.7 : 1 })}
          >
            <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 }}>{purchase.isRetryingStore ? 'CHECKING STORE…' : purchase.connected ? 'RELOAD STORE OFFER' : 'RETRY STORE CONNECTION'}</Text>
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
                onPress={() => setSelectedLessonId(lesson.id)}
              />
            );
          })}
        </ScrollView>
      </View>
    </FullBleedSafeArea>
  );
}

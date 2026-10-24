import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MetronomeAudio } from '@/audio/metronome';
import { createReplayAudioEvents } from '@/audio/replay';
import { ReplayTimeline } from '@/components/ReplayTimeline';
import { GameCenterChallengeCard } from '@/components/GameCenterChallengeCard';
import { accuracyPercent } from '@/rhythm/scoring';
import { analyzeSessionSwingFeel, recountSessionFeel } from '@/rhythm/swingFeel';
import { LEARN_COURSE } from '@/rhythm/learnCourse';
import { starsForAccuracy } from '@/rhythm/learnRating';
import { getMixturePattern } from '@/rhythm/mixtures';
import { SUBDIVISION_LABELS, timeSignatureMetrics } from '@/rhythm/subdivisions';
import { completeLearnLesson, recordLearnLessonResult } from '@/store/learnProgress';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { HandStats, MixturePatternId, MissedEvent, ReplayTap, RhythmicFeel, SessionResults, Subdivision } from '@/types/rhythm';

function percent(value: number) {
  return Math.round(value) + '%';
}

function sessionAccuracy(results: SessionResults): number {
  const expected = results.left.totalExpected + results.right.totalExpected;
  const hits = results.left.totalHit + results.right.totalHit;
  return expected === 0 ? 0 : (hits / expected) * 100;
}

function timingText(stats: HandStats): string {
  if (stats.totalHit === 0) return '—';
  const rounded = Math.round(stats.averageSignedErrorMs);
  return (rounded > 0 ? '+' : '') + rounded + ' ms';
}

function timingNote(stats: HandStats): string {
  if (stats.totalHit === 0 || Math.abs(stats.averageSignedErrorMs) < 15) return 'On time';
  return stats.averageSignedErrorMs > 0 ? 'Slightly late' : 'Slightly early';
}

function weakestCombination(results: SessionResults) {
  const available = results.combinations.filter(
    (combination) => (results.trainingMode === 'single-hand'
      ? combination[results.singleHand].totalExpected
      : combination.left.totalExpected + combination.right.totalExpected) >= 4,
  );
  return available
    .map((combination) => {
      const leftAccuracy = accuracyPercent(combination.left);
      const rightAccuracy = accuracyPercent(combination.right);
      const weakHand = results.trainingMode === 'single-hand'
        ? results.singleHand
        : combination.leftRest
          ? 'right'
          : combination.rightRest
            ? 'left'
            : leftAccuracy <= rightAccuracy ? 'left' : 'right';
      return {
        ...combination,
        weakHand,
        accuracy: results.trainingMode === 'single-hand'
          ? accuracyPercent(combination[results.singleHand])
          : combination.leftRest
            ? rightAccuracy
            : combination.rightRest
              ? leftAccuracy
              : Math.min(leftAccuracy, rightAccuracy),
        sampleSize: results.trainingMode === 'single-hand'
          ? combination[results.singleHand].totalExpected
          : combination.leftRest
            ? combination.right.totalExpected
            : combination.rightRest
              ? combination.left.totalExpected
              : combination.left.totalExpected + combination.right.totalExpected,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy || b.sampleSize - a.sampleSize)[0];
}

function buildFeedback(
  results: SessionResults,
  weak: ReturnType<typeof weakestCombination> | undefined,
  t: (source: string, values?: Record<string, string | number>) => string,
) {
  if (results.source === 'score') {
    if (results.trainingMode === 'single-hand') {
      const stats = results[results.singleHand];
      return [
        results.scoreTitle ? t('You trained from “{title}”.', { title: results.scoreTitle }) : t('You trained from an imported score.'),
        Math.abs(stats.averageSignedErrorMs) > 15
          ? t('Your taps tend to {timing}.', { timing: t(stats.averageSignedErrorMs > 0 ? 'play late' : 'rush') })
          : t('Your one-hand timing stayed steady through the score.'),
      ];
    }
    const weakerHand = accuracyPercent(results.left) <= accuracyPercent(results.right) ? 'left' : 'right';
    const weakerAccuracy = Math.min(accuracyPercent(results.left), accuracyPercent(results.right));
    return [
      results.scoreTitle ? t('You trained from “{title}”.', { title: results.scoreTitle }) : t('You trained from an imported score.'),
      weakerAccuracy < 80
        ? t('Give the {hand} hand a few focused passes, then bring both hands back together.', { hand: t(weakerHand) })
        : t('Your score rhythm stayed steady. Try a faster tempo or a narrower timing window next time.'),
    ];
  }
  const messages: string[] = [];
  if (results.trainingMode === 'single-hand') {
    const average = results[results.singleHand].averageSignedErrorMs;
    if (average < -15) messages.push(t('Your taps tend to rush.'));
    if (average > 15) messages.push(t('Your taps tend to play late.'));
  } else {
    for (const hand of ['left', 'right'] as const) {
      const average = results[hand].averageSignedErrorMs;
      if (average < -15) messages.push(t('Your {hand} hand tends to {timing}.', { hand: t(hand), timing: t('rush') }));
      if (average > 15) messages.push(t('Your {hand} hand tends to {timing}.', { hand: t(hand), timing: t('play late') }));
    }
  }

  if (weak && weak.accuracy < 85) {
    const handName = weak.weakHand === 'left' ? 'Left' : 'Right';
    const affectedSubdivision =
      weak.weakHand === 'left' ? weak.leftSubdivision : weak.rightSubdivision;
    const affectedMixture = weak.weakHand === 'left' ? weak.leftMixture : weak.rightMixture;
    const affectedPattern: Record<Subdivision, string> = {
      quarter: 'quarter-note pulse',
      eighth: 'eighth-note subdivisions',
      duplet: 'duplets',
      triplet: 'triplets',
      quadruplet: 'quadruplets',
      quintuplet: 'quintuplets',
      sextuplet: 'sextuplets',
      septuplet: 'septuplets',
      octuplet: 'octuplets',
      nonuplet: 'nonuplets',
      sixteenth: 'sixteenth-note subdivisions',
      thirtySecond: '32nd-note subdivisions',
      sixtyFourth: '64th-note subdivisions',
    };
    if (results.trainingMode === 'single-hand') {
      messages.push(t('Your one-hand {pattern} need extra practice.', {
        pattern: t(affectedMixture ? getMixturePattern(affectedMixture).label.toLowerCase() : affectedPattern[affectedSubdivision]),
      }));
    } else {
      const otherHandName = weak.weakHand === 'left' ? 'right' : 'left';
      const otherSubdivision = weak.weakHand === 'left' ? weak.rightSubdivision : weak.leftSubdivision;
      const otherMixture = weak.weakHand === 'left' ? weak.rightMixture : weak.leftMixture;
      const otherHandRests = weak.weakHand === 'left' ? weak.rightRest : weak.leftRest;
      const playedPattern: Record<Subdivision, string> = {
        quarter: 'quarter notes',
        eighth: 'eighth notes',
        duplet: 'duplets',
        triplet: 'triplets',
        quadruplet: 'quadruplets',
        quintuplet: 'quintuplets',
        sextuplet: 'sextuplets',
        septuplet: 'septuplets',
        octuplet: 'octuplets',
        nonuplet: 'nonuplets',
        sixteenth: 'sixteenth notes',
        thirtySecond: '32nd notes',
        sixtyFourth: '64th notes',
      };
      const affectedPatternName = affectedMixture
        ? getMixturePattern(affectedMixture).label.toLowerCase()
        : affectedPattern[affectedSubdivision];
      const otherPatternName = otherMixture
        ? getMixturePattern(otherMixture).label.toLowerCase()
        : playedPattern[otherSubdivision];
      messages.push(t('Your {hand}-hand {pattern} {verb} less steady when your {otherHand} hand {action}.', {
        hand: t(handName.toLowerCase()),
        pattern: t(affectedPatternName),
        verb: t(affectedMixture || affectedSubdivision === 'quarter' ? 'is' : 'are'),
        otherHand: t(otherHandName),
        action: otherHandRests ? t('rests') : t('plays {pattern}', { pattern: t(otherPatternName) }),
      }));
    }
  }

  const stableAccuracy = accuracyPercent(results.stable);
  const transitionAccuracy = accuracyPercent(results.transition);
  if (results.transition.totalExpected > 0 && stableAccuracy - transitionAccuracy >= 10) {
    messages.push(t('Your steady timing is strong; give subdivision changes a little more practice.'));
  }
  return messages.length > 0
    ? messages
    : [t('Your timing stayed balanced. Try a faster tempo or shorter change interval next time.')];
}

function ScorePanel({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15 }}>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>{label}</Text>
      <Text style={{ color: accent ?? colors.text, fontSize: 25, fontWeight: '900', marginTop: 7 }}>{value}</Text>
      {detail ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{detail}</Text> : null}
    </View>
  );
}

function DisclosureHeader({
  title,
  expanded,
  onPress,
  testID,
}: {
  title: string;
  expanded: boolean;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t('{title}, {action} details', { title: t(title), action: t(expanded ? 'Hide' : 'Show') })}
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: 13,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
      })}
    >
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', flex: 1 }}>{title}</Text>
      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 }}>
        {expanded ? 'HIDE  −' : 'VIEW  +'}
      </Text>
    </Pressable>
  );
}

function ResultsActionRow({
  testID,
  label,
  accessibilityLabel,
  color,
  onPress,
  last = false,
}: {
  testID: string;
  label: string;
  accessibilityLabel: string;
  color: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => ({
          minHeight: 58,
          paddingHorizontal: 17,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: pressed ? colors.surfaceRaised : 'transparent',
        })}
      >
        <Text style={{ color, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 }}>{label}</Text>
        <Text accessibilityElementsHidden style={{ color, fontSize: 23, lineHeight: 27, fontWeight: '500' }}>›</Text>
      </Pressable>
      {!last ? <View style={{ height: 1, marginHorizontal: 16, backgroundColor: colors.line }} /> : null}
    </View>
  );
}

function weakLabel(subdivision: Subdivision, rest = false, mixtureId?: MixturePatternId) {
  return rest ? 'REST' : mixtureId ? getMixturePattern(mixtureId).label.toUpperCase() : SUBDIVISION_LABELS[subdivision].toUpperCase();
}

interface ReplayErrorGroup {
  barIndex: number;
  missedEvents: MissedEvent[];
  extraTaps: ReplayTap[];
}

function replayErrorBarGroups(results: SessionResults | null): ReplayErrorGroup[] {
  if (!results) return [];
  const groups = new Map<number, ReplayErrorGroup>();
  const getGroup = (barIndex: number) => {
    const group = groups.get(barIndex) ?? { barIndex, missedEvents: [], extraTaps: [] };
    groups.set(barIndex, group);
    return group;
  };
  for (const event of results.missedEvents) {
    getGroup(event.barIndex).missedEvents.push(event);
  }
  for (const tap of results.replayTaps ?? []) {
    if (!tap.matchedEventId) getGroup(tap.barIndex).extraTaps.push(tap);
  }
  return Array.from(groups.values()).sort((first, second) => first.barIndex - second.barIndex);
}

function missedPosition(event: MissedEvent, t: (source: string, values?: Record<string, string | number>) => string): string {
  const beat = Math.floor(event.beatInBar) + 1;
  const fraction = event.beatInBar - Math.floor(event.beatInBar);
  const offset = fraction < 0.005 ? '' : ` + ${fraction.toFixed(2)}`;
  const rhythm = event.subdivision
    ? SUBDIVISION_LABELS[event.subdivision]
    : event.durationQuarter === undefined
      ? 'score note'
      : scoreDurationLabel(event.durationQuarter, event.tupletNumber);
  return t('beat {beat}{offset} · {rhythm}', { beat, offset, rhythm: t(rhythm) });
}

function replayErrorSummary(
  label: string,
  missedEvents: readonly MissedEvent[],
  extraTaps: readonly ReplayTap[],
  t: (source: string, values?: Record<string, string | number>) => string,
) {
  const counts = [
    ...(missedEvents.length ? [t('{count} missed', { count: missedEvents.length })] : []),
    ...(extraTaps.length ? [t('{count} extra', { count: extraTaps.length })] : []),
  ];
  const positions = missedEvents.slice(0, 4).map((event) => missedPosition(event, t)).join(', ');
  const moreMisses = missedEvents.length > 4 ? t(', +{count}', { count: missedEvents.length - 4 }) : '';
  return `${t(label)} · ${counts.join(' · ')}${positions ? ` · ${positions}${moreMisses}` : ''}`;
}

function scoreDurationLabel(durationQuarter: number, tupletNumber?: number): string {
  if (tupletNumber) return `${tupletNumber}-note tuplet`;
  const noteValues = [
    [4, 'whole'], [3, 'dotted half'], [2, 'half'], [1.5, 'dotted quarter'], [1, 'quarter'],
    [0.75, 'dotted eighth'], [0.5, 'eighth'], [0.375, 'dotted sixteenth'], [0.25, 'sixteenth'],
    [0.1875, 'dotted 32nd'], [0.125, '32nd'], [0.09375, 'dotted 64th'], [0.0625, '64th'],
  ] as const;
  const noteValue = noteValues.find(([duration]) => Math.abs(duration - durationQuarter) < 0.00001);
  return noteValue?.[1] ?? 'score note';
}

export default function ResultsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { results, settings, sessionSettings, featureFlags, prepareRepeatExercise, discardReplayData } = useRhythmSession();
  const router = useRouter();
  const { lessonId: rawLessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const lessonId = Array.isArray(rawLessonId) ? rawLessonId[0] : rawLessonId;
  const [replay, setReplay] = useState<{ barIndex: number; playbackId: number; isPlaying: boolean; isStarting: boolean } | null>(null);
  const replaySequenceRef = useRef(0);
  const replayAudioRef = useRef<{ playbackId: number; audio: MetronomeAudio } | null>(null);
  const [startingAgain, setStartingAgain] = useState(false);
  const [showMissedNotes, setShowMissedNotes] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [lessonRating, setLessonRating] = useState<Awaited<ReturnType<typeof recordLearnLessonResult>>>(null);
  const [countAsFeel, setCountAsFeel] = useState<RhythmicFeel>(results?.feel ?? 'straight');
  const completionAttemptedRef = useRef<string | null>(null);
  const courseLesson = LEARN_COURSE.find((lesson) => lesson.id === lessonId);
  const lessonAccuracy = results ? sessionAccuracy(results) : 0;
  const countedResults = useMemo(
    () => results ? recountSessionFeel(results, countAsFeel) : null,
    [countAsFeel, results],
  );
  const viewResults = countedResults ?? results!;
  const swingFeelAnalysis = useMemo(
    () => results ? analyzeSessionSwingFeel(results) : null,
    [results],
  );
  const replayErrorBars = replayErrorBarGroups(viewResults);
  const extraTapCount = (viewResults?.replayTaps ?? []).filter((tap) => !tap.matchedEventId).length;
  const replaySoundEnabled = (sessionSettings ?? settings).soundEnabled && featureFlags.soundEffects;

  const stopReplayAudio = useCallback(async (playbackId?: number) => {
    const current = replayAudioRef.current;
    if (!current || (playbackId !== undefined && current.playbackId !== playbackId)) return;
    replayAudioRef.current = null;
    await current.audio.stop();
  }, []);

  useEffect(() => {
    if (!results || !courseLesson || completionAttemptedRef.current === courseLesson.id) return;
    completionAttemptedRef.current = courseLesson.id;
    void Promise.all([
      completeLearnLesson(courseLesson.id),
      recordLearnLessonResult(courseLesson.id, lessonAccuracy),
    ]).then(([completedIds, rating]) => {
      setLessonCompleted(completedIds.includes(courseLesson.id));
      setLessonRating(rating);
    });
  }, [courseLesson, lessonAccuracy, results]);

  useFocusEffect(useCallback(() => () => {
    void stopReplayAudio();
    discardReplayData();
  }, [discardReplayData, stopReplayAudio]));

  const replayBar = useCallback(async (
    barIndex: number,
    expectedEvents: NonNullable<SessionResults['replayExpectedEvents']>,
    taps: NonNullable<SessionResults['replayTaps']>,
    beatsPerBar: number,
  ) => {
    replaySequenceRef.current += 1;
    const playbackId = replaySequenceRef.current;
    setReplay({ barIndex, playbackId, isPlaying: false, isStarting: true });
    await stopReplayAudio();
    if (playbackId !== replaySequenceRef.current) return;

    if (!replaySoundEnabled || process.env.EXPO_PUBLIC_E2E_SILENT === '1') {
      setReplay({ barIndex, playbackId, isPlaying: true, isStarting: false });
      return;
    }

    const audio = new MetronomeAudio();
    replayAudioRef.current = { playbackId, audio };
    try {
      await audio.prepare();
      await audio.resume();
      if (playbackId !== replaySequenceRef.current) {
        await stopReplayAudio(playbackId);
        return;
      }
      const replayEvents = createReplayAudioEvents(barIndex, beatsPerBar, results?.bpm ?? 60, expectedEvents, taps);
      audio.playReplayEvents(replayEvents, {
        metronome: settings.metronomeSound,
        leftHand: settings.leftHandSound,
        rightHand: settings.rightHandSound,
      }, beatsPerBar * 60_000 / (results?.bpm ?? 60));
      setReplay({ barIndex, playbackId, isPlaying: true, isStarting: false });
    } catch {
      await stopReplayAudio(playbackId);
      if (playbackId !== replaySequenceRef.current) return;
      setReplay({ barIndex, playbackId, isPlaying: true, isStarting: false });
      Alert.alert(t('Replay sound unavailable'), t('The visual replay will continue. Check your device audio and try again.'));
    }
  }, [replaySoundEnabled, results, settings.leftHandSound, settings.metronomeSound, settings.rightHandSound, stopReplayAudio, t]);

  const finishVisualReplay = useCallback((barIndex: number, playbackId: number) => {
    setReplay((current) => current?.barIndex === barIndex && current.playbackId === playbackId
      ? { ...current, isPlaying: false, isStarting: false }
      : current,
    );
    void stopReplayAudio(playbackId);
  }, [stopReplayAudio]);

  const startAgain = async () => {
    if (startingAgain) return;
    setStartingAgain(true);
    try {
      await prepareRepeatExercise();
      discardReplayData();
      router.replace(lessonId ? { pathname: '/practice', params: { lessonId } } : '/practice');
    } catch {
      setStartingAgain(false);
      Alert.alert(t('Audio could not start'), t('Check your device audio settings and try again.'));
    }
  };

  if (!results) {
    return (
      <SafeAreaView testID="results.screen" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.muted }}>{t('No session results yet.')}</Text>
        <Pressable onPress={() => router.replace('/setup')} style={{ padding: 16 }}>
          <Text style={{ color: colors.left, fontWeight: '800' }}>{t('SET UP A SESSION')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const visibleOverall = sessionAccuracy(viewResults);
  const overall = visibleOverall;
  const weakest = weakestCombination(viewResults);
  const feedback = buildFeedback(viewResults, weakest, t);
  const displayedHands = viewResults.trainingMode === 'single-hand' ? [viewResults.singleHand] : ['left', 'right'] as const;
  const combinations = [...viewResults.combinations].sort(
    (a, b) =>
      (viewResults.trainingMode === 'single-hand' ? accuracyPercent(a[viewResults.singleHand]) : Math.min(accuracyPercent(a.left), accuracyPercent(a.right))) -
      (viewResults.trainingMode === 'single-hand' ? accuracyPercent(b[viewResults.singleHand]) : Math.min(accuracyPercent(b.left), accuracyPercent(b.right))),
  );
  const sessionOptions = [
    t(viewResults.feel === 'swing' ? 'Swing' : 'Straight'),
    viewResults.graceNotesEnabled ? t('GRACE PICKUPS') : null,
    viewResults.restBetweenChanges ? t('REST BEFORE CHANGES') : null,
    t(viewResults.trainingMode === 'single-hand' ? 'ONE HAND' : 'TWO HANDS'),
  ].filter(Boolean).join(' · ');

  return (
    <SafeAreaView testID="results.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 }}>{courseLesson ? lessonCompleted ? 'LESSON COMPLETE' : 'LESSON FINISHED' : viewResults.source === 'score' ? 'SCORE SESSION COMPLETE' : 'SESSION COMPLETE'}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, maxWidth: '68%', textAlign: 'right' }}>
            {viewResults.bpm} BPM · {viewResults.timeSignature} · {viewResults.source === 'score' ? viewResults.scoreTitle : sessionOptions}
          </Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 }}>{courseLesson ? courseLesson.title : 'Your timing.'}</Text>
        {courseLesson && lessonCompleted ? (
          <Text testID="results.lessonComplete" style={{ color: colors.left, fontSize: 13, fontWeight: '800', marginTop: 7 }}>
            {courseLesson.number === LEARN_COURSE.length ? 'Course complete. You have reached the final lesson.' : 'Lesson complete. The next lesson is ready.'}
          </Text>
        ) : null}

        {viewResults.source !== 'score' && viewResults.replayExpectedEvents?.length ? (
          <View testID="results.feelCount" style={{ paddingHorizontal: 13, paddingVertical: 11, marginTop: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: swingFeelAnalysis?.likelyStraight && results.feel === 'swing' ? colors.accent : colors.line }}>
            {swingFeelAnalysis?.likelyStraight && results.feel === 'swing' ? (
              <Text testID="results.swingFeelWarning" style={{ color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: '800', marginBottom: 8 }}>
                {t('This was set to swing, but your taps line up more closely with straight timing.')}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }}>{t('COUNT THIS SESSION AS')}</Text>
                <Text style={{ color: colors.dim, fontSize: 10, lineHeight: 14, marginTop: 3 }}>{t('Recount these taps without playing again.')}</Text>
              </View>
              {(['straight', 'swing'] as const).map((feel) => (
                <Pressable
                  key={feel}
                  testID={`results.countAs.${feel}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: countAsFeel === feel }}
                  onPress={() => setCountAsFeel(feel)}
                  style={{ minWidth: 76, minHeight: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 10, backgroundColor: countAsFeel === feel ? colors.accent : colors.background, borderWidth: 1, borderColor: countAsFeel === feel ? colors.accent : colors.line }}
                >
                  <Text style={{ color: countAsFeel === feel ? colors.background : colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>{t(feel === 'straight' ? 'Straight' : 'Swing').toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 20, marginTop: 17 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>{courseLesson ? 'LESSON ACCURACY' : viewResults.source === 'score' ? 'SCORE ACCURACY' : 'OVERALL ACCURACY'}</Text>
          <Text style={{ color: colors.text, fontSize: 58, lineHeight: 66, fontWeight: '900', marginTop: 4 }}>{percent(overall)}</Text>
          {courseLesson ? (
            <View testID="results.lessonRating" accessibilityLabel={t('{score} correct, {stars} out of 5 stars', { score: percent(overall), stars: starsForAccuracy(overall) })} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <Text testID="results.lessonStars" style={{ color: colors.accent, fontSize: 19, fontWeight: '900', letterSpacing: 1.4 }}>
                {'★'.repeat(starsForAccuracy(overall))}{'☆'.repeat(5 - starsForAccuracy(overall))}
              </Text>
              <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 }}>
                {t('{count} / 5 STARS', { count: starsForAccuracy(overall) })}
              </Text>
            </View>
          ) : null}
          {courseLesson && lessonRating ? (
            <Text testID="results.lessonBest" style={{ color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 7 }}>
              Best: {percent(lessonRating.bestAccuracy)} · {lessonRating.attempts} {lessonRating.attempts === 1 ? 'attempt' : 'attempts'}
            </Text>
          ) : null}
          <View style={{ height: 4, borderRadius: 3, backgroundColor: colors.line, marginTop: 11, overflow: 'hidden' }}>
            <View style={{ width: (String(overall) + '%') as DimensionValue, height: 4, backgroundColor: colors.accent, borderRadius: 3 }} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 11 }}>
          {displayedHands.map((hand) => (
            <ScorePanel
              key={hand}
              label={viewResults.trainingMode === 'single-hand' ? 'ONE HAND' : `${hand.toUpperCase()} HAND`}
              value={percent(accuracyPercent(viewResults[hand]))}
              detail={timingText(viewResults[hand])}
              accent={viewResults.trainingMode === 'single-hand' ? colors.accent : hand === 'left' ? colors.left : colors.right}
            />
          ))}
        </View>
        {viewResults.source === 'score' ? null : (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <ScorePanel label="STEADY RHYTHM" value={viewResults.stable.totalExpected ? percent(accuracyPercent(viewResults.stable)) : '—'} detail="Outside switch window" />
            <ScorePanel label="DURING SWITCHES" value={viewResults.transition.totalExpected ? percent(accuracyPercent(viewResults.transition)) : '—'} detail="First 2 beats after change" />
          </View>
        )}

        {featureFlags.gameCenter && viewResults.challengeMode ? (
          <GameCenterChallengeCard
            testID="results.gameCenter"
            challengeMode
            longestCorrectStreak={results.longestCorrectStreak}
          />
        ) : null}

        {featureFlags.missedNoteReplay && replayErrorBars.length > 0 ? (
          <View style={{ marginTop: 22 }}>
            <DisclosureHeader
              testID="results.missedNotes"
              title={`WRONG NOTES · ${viewResults.missedEvents.length + extraTapCount}`}
              expanded={showMissedNotes}
              onPress={() => setShowMissedNotes((expanded) => !expanded)}
            />
            {showMissedNotes ? (
              <View style={{ paddingTop: 12 }}>
                <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>
                  {t('{missed} missed · {extra} extra. Both lower accuracy. Replay shows the expected notes beside your taps; leaving this page clears replay.', { missed: viewResults.missedEvents.length, extra: extraTapCount })}
                </Text>
                {!replaySoundEnabled && process.env.EXPO_PUBLIC_E2E_SILENT !== '1' ? (
                  <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 9 }}>
                    Replay sound is off. Turn it on in Settings → Sounds to hear the notes.
                  </Text>
                ) : null}
                {replayErrorBars.map(({ barIndex, missedEvents, extraTaps }) => {
                  const leftEvents = missedEvents.filter((event) => event.hand === 'left');
                  const rightEvents = missedEvents.filter((event) => event.hand === 'right');
                  const leftExtraTaps = extraTaps.filter((tap) => tap.hand === 'left');
                  const rightExtraTaps = extraTaps.filter((tap) => tap.hand === 'right');
                  const expectedEvents = viewResults.replayExpectedEvents?.filter((event) => event.barIndex === barIndex) ?? [];
                  const taps = viewResults.replayTaps?.filter((tap) => tap.barIndex === barIndex) ?? [];
                  const replayHands = viewResults.trainingMode === 'single-hand'
                    ? [viewResults.singleHand]
                    : ['left', 'right'] as const;
                  const metrics = timeSignatureMetrics(viewResults.bpm, viewResults.timeSignature);
                  return (
                    <View key={barIndex} testID={`results.missedBar.${barIndex}`} style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{t('BAR {bar}', { bar: barIndex })}</Text>
                          {leftEvents.length + leftExtraTaps.length > 0 ? (
                            <Text numberOfLines={2} style={{ color: colors.left, fontSize: 11, lineHeight: 16 }}>
                              {replayErrorSummary(viewResults.trainingMode === 'single-hand' ? 'ONE HAND' : 'LEFT', leftEvents, leftExtraTaps, t)}
                            </Text>
                          ) : null}
                          {rightEvents.length + rightExtraTaps.length > 0 ? (
                            <Text numberOfLines={2} style={{ color: colors.right, fontSize: 11, lineHeight: 16 }}>
                              {replayErrorSummary(viewResults.trainingMode === 'single-hand' ? 'ONE HAND' : 'RIGHT', rightEvents, rightExtraTaps, t)}
                            </Text>
                          ) : null}
                        </View>
                        <Pressable
                          testID={`results.replayBar.${barIndex}`}
                          accessibilityRole="button"
                          accessibilityLabel={t('Play replay with sound for bar {bar}', { bar: barIndex })}
                          onPress={() => void replayBar(barIndex, expectedEvents, taps, metrics.beatsPerBar)}
                          style={({ pressed }) => ({ paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', borderRadius: 11, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: replay?.barIndex === barIndex && replay.isPlaying ? colors.accent : colors.line })}
                        >
                          <Text style={{ color: replay?.barIndex === barIndex && replay.isPlaying ? colors.accent : colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 }}>
                            {replay?.barIndex === barIndex && replay.isStarting ? 'LOADING' : replay?.barIndex === barIndex && replay.isPlaying ? 'PLAYING' : 'REPLAY'}
                          </Text>
                        </Pressable>
                      </View>
                      {replay?.barIndex === barIndex && !replay.isStarting ? (
                        <ReplayTimeline
                          key={`${barIndex}.${replay.playbackId}`}
                          barIndex={barIndex}
                          expectedEvents={expectedEvents}
                          taps={taps}
                          hands={replayHands}
                          beatsPerBar={metrics.beatsPerBar}
                          bpm={viewResults.bpm}
                          timeSignature={viewResults.timeSignature}
                          playbackId={replay.playbackId}
                          onPlaybackEnd={finishVisualReplay}
                        />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ marginTop: 25 }}>
          <DisclosureHeader
            testID="results.breakdown"
            title="PERFORMANCE BREAKDOWN"
            expanded={showBreakdown}
            onPress={() => setShowBreakdown((expanded) => !expanded)}
          />
          {showBreakdown ? (
            <View style={{ paddingTop: 16 }}>
              <Text testID="results.breakdown.details" style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 3 }}>
                {viewResults.trainingMode === 'single-hand' ? 'ONE-HAND TIMING' : 'HAND TIMING'}
              </Text>
              {displayedHands.map((hand) => {
                const stats = viewResults[hand];
                return (
                  <View key={hand} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                    <View>
                      <Text style={{ color: hand === 'left' ? colors.left : colors.right, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>
                        {viewResults.trainingMode === 'single-hand' ? 'ONE HAND' : `${hand.toUpperCase()} HAND`}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{timingNote(stats)}</Text>
                    </View>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                      {timingText(stats)}
                    </Text>
                  </View>
                );
              })}

              {weakest && viewResults.source !== 'score' ? (
                <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 17, marginTop: 22 }}>
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>{viewResults.trainingMode === 'single-hand' ? 'MOST DIFFICULT PATTERN' : 'MOST DIFFICULT PAIR'}</Text>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 13 }}>
                    {viewResults.trainingMode === 'single-hand'
                      ? `ONE HAND · ${weakLabel(weakest[viewResults.singleHand === 'left' ? 'leftSubdivision' : 'rightSubdivision'], weakest[viewResults.singleHand === 'left' ? 'leftRest' : 'rightRest'], weakest[viewResults.singleHand === 'left' ? 'leftMixture' : 'rightMixture'])}`
                      : `Left: ${weakLabel(weakest.leftSubdivision, weakest.leftRest, weakest.leftMixture)}   ·   Right: ${weakLabel(weakest.rightSubdivision, weakest.rightRest, weakest.rightMixture)}`}
                  </Text>
                  <Text style={{ color: colors.accent, fontSize: 30, fontWeight: '900', marginTop: 5 }}>
                    {viewResults.trainingMode === 'single-hand' ? 'ONE HAND' : weakest.weakHand.toUpperCase()} {percent(weakest.accuracy)}
                  </Text>
                </View>
              ) : null}

              {combinations.length > 0 && viewResults.source !== 'score' ? (
                <View style={{ marginTop: 22 }}>
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 5 }}>{viewResults.trainingMode === 'single-hand' ? 'PATTERN BREAKDOWN' : 'PAIR BREAKDOWN'}</Text>
                  {combinations.map((combination) => (
                    <View key={`${combination.leftRest ? 'rest' : combination.leftMixture ?? combination.leftSubdivision}:${combination.rightRest ? 'rest' : combination.rightMixture ?? combination.rightSubdivision}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                      <Text style={{ color: colors.muted, flex: 1, fontSize: 12 }}>
                        {viewResults.trainingMode === 'single-hand'
                          ? `ONE HAND · ${weakLabel(combination[viewResults.singleHand === 'left' ? 'leftSubdivision' : 'rightSubdivision'], combination[viewResults.singleHand === 'left' ? 'leftRest' : 'rightRest'], combination[viewResults.singleHand === 'left' ? 'leftMixture' : 'rightMixture'])}`
                          : `${weakLabel(combination.leftSubdivision, combination.leftRest, combination.leftMixture)} / ${weakLabel(combination.rightSubdivision, combination.rightRest, combination.rightMixture)}`}
                      </Text>
                      {viewResults.trainingMode === 'single-hand' ? (
                        <Text style={{ color: colors.accent, width: 58, textAlign: 'right', fontSize: 12, fontWeight: '800' }}>
                          {percent(accuracyPercent(combination[viewResults.singleHand]))}
                        </Text>
                      ) : (
                        <>
                          <Text style={{ color: colors.left, width: 58, textAlign: 'right', fontSize: 12, fontWeight: '800' }}>
                            {percent(accuracyPercent(combination.left))}
                          </Text>
                          <Text style={{ color: colors.right, width: 58, textAlign: 'right', fontSize: 12, fontWeight: '800' }}>
                            {percent(accuracyPercent(combination.right))}
                          </Text>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={{ marginTop: 23, gap: 9 }}>
                {feedback.map((message) => (
                  <Text key={message} style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>{message}</Text>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <Pressable
          testID="results.startAgain"
          accessibilityRole="button"
          accessibilityLabel={t('Start the same exercise again')}
          accessibilityState={{ disabled: startingAgain }}
          disabled={startingAgain}
          onPress={() => void startAgain()}
          style={({ pressed }) => ({ backgroundColor: pressed ? '#A8EADB' : colors.left, minHeight: 64, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 30, opacity: startingAgain ? 0.72 : 1 })}
        >
          <Text style={{ color: colors.background, fontSize: 15, fontWeight: '900', letterSpacing: 0.8 }}>
            {startingAgain ? 'PREPARING…' : 'START AGAIN'}
          </Text>
        </Pressable>
        {featureFlags.learnCourse && courseLesson && lessonCompleted ? (
          <Pressable
            testID="results.continueLearning"
            accessibilityRole="button"
            accessibilityLabel={t('Continue the guided course')}
            onPress={() => {
              discardReplayData();
              router.replace({ pathname: '/learn', params: { lessonId } });
            }}
            style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceRaised : colors.surface, minHeight: 60, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 14, borderWidth: 1, borderColor: colors.line })}
          >
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 }}>
              {courseLesson.number === LEARN_COURSE.length ? 'VIEW COURSE' : 'CONTINUE LEARNING'}
            </Text>
          </Pressable>
        ) : null}
        <View testID="results.navigation" style={{ marginTop: 14, marginBottom: 18, overflow: 'hidden', borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
          <ResultsActionRow
            testID="results.settings"
            label={t('CHANGE SETTINGS')}
            accessibilityLabel={t('Change settings')}
            color={colors.text}
            onPress={() => {
              discardReplayData();
              router.replace('/setup');
            }}
          />
          {featureFlags.sessionRecords ? (
            <ResultsActionRow
              testID="results.records"
              label={t('VIEW MY RECORD')}
              accessibilityLabel={t('View my record')}
              color={colors.left}
              onPress={() => {
                discardReplayData();
                router.replace('/records');
              }}
            />
          ) : null}
          <ResultsActionRow
            testID="results.home"
            label={t('BACK HOME')}
            accessibilityLabel={t('Back home')}
            color={colors.muted}
            onPress={() => {
              discardReplayData();
              router.replace('/');
            }}
            last
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

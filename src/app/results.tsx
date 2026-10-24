import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReplayTimeline } from '@/components/ReplayTimeline';
import { GameCenterChallengeCard } from '@/components/GameCenterChallengeCard';
import { accuracyPercent } from '@/rhythm/scoring';
import { LEARN_COURSE } from '@/rhythm/learnCourse';
import { SUBDIVISION_LABELS, timeSignatureMetrics } from '@/rhythm/subdivisions';
import { completeLearnLesson } from '@/store/learnProgress';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';
import type { HandStats, MissedEvent, SessionResults, Subdivision } from '@/types/rhythm';

function percent(value: number) {
  return Math.round(value) + '%';
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
        : leftAccuracy <= rightAccuracy ? 'left' : 'right';
      return {
        ...combination,
        weakHand,
        accuracy: results.trainingMode === 'single-hand'
          ? accuracyPercent(combination[results.singleHand])
          : Math.min(leftAccuracy, rightAccuracy),
        sampleSize: results.trainingMode === 'single-hand'
          ? combination[results.singleHand].totalExpected
          : combination.left.totalExpected + combination.right.totalExpected,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy || b.sampleSize - a.sampleSize)[0];
}

function buildFeedback(results: SessionResults, weak?: ReturnType<typeof weakestCombination>) {
  if (results.source === 'score') {
    if (results.trainingMode === 'single-hand') {
      const stats = results[results.singleHand];
      return [
        results.scoreTitle ? `You trained from “${results.scoreTitle}”.` : 'You trained from an imported score.',
        Math.abs(stats.averageSignedErrorMs) > 15
          ? `Your taps tend to ${stats.averageSignedErrorMs > 0 ? 'play late' : 'rush'}.`
          : 'Your one-hand timing stayed steady through the score.',
      ];
    }
    const weakerHand = accuracyPercent(results.left) <= accuracyPercent(results.right) ? 'left' : 'right';
    const weakerAccuracy = Math.min(accuracyPercent(results.left), accuracyPercent(results.right));
    return [
      results.scoreTitle ? `You trained from “${results.scoreTitle}”.` : 'You trained from an imported score.',
      weakerAccuracy < 80
        ? `Give the ${weakerHand} hand a few focused passes, then bring both hands back together.`
        : 'Your score rhythm stayed steady. Try a faster tempo or a narrower timing window next time.',
    ];
  }
  const messages: string[] = [];
  if (results.trainingMode === 'single-hand') {
    const average = results[results.singleHand].averageSignedErrorMs;
    if (average < -15) messages.push('Your taps tend to rush.');
    if (average > 15) messages.push('Your taps tend to play late.');
  } else {
    for (const hand of ['left', 'right'] as const) {
      const average = results[hand].averageSignedErrorMs;
      if (average < -15) messages.push(`Your ${hand} hand tends to rush.`);
      if (average > 15) messages.push(`Your ${hand} hand tends to play late.`);
    }
  }

  if (weak && weak.accuracy < 85) {
    const handName = weak.weakHand === 'left' ? 'Left' : 'Right';
    const affectedSubdivision =
      weak.weakHand === 'left' ? weak.leftSubdivision : weak.rightSubdivision;
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
      messages.push(`Your one-hand ${affectedPattern[affectedSubdivision]} need extra practice.`);
    } else {
      const otherHandName = weak.weakHand === 'left' ? 'right' : 'left';
      const otherSubdivision = weak.weakHand === 'left' ? weak.rightSubdivision : weak.leftSubdivision;
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
      const verb = affectedSubdivision === 'quarter' ? 'is' : 'are';
      messages.push(
        'Your ' + handName.toLowerCase() + '-hand ' + affectedPattern[affectedSubdivision] + ' ' + verb +
        ' less steady when your ' + otherHandName + ' hand plays ' + playedPattern[otherSubdivision] + '.',
      );
    }
  }

  const stableAccuracy = accuracyPercent(results.stable);
  const transitionAccuracy = accuracyPercent(results.transition);
  if (results.transition.totalExpected > 0 && stableAccuracy - transitionAccuracy >= 10) {
    messages.push('Your steady timing is strong; give subdivision changes a little more practice.');
  }
  return messages.length > 0
    ? messages
    : ['Your timing stayed balanced. Try a faster tempo or shorter change interval next time.'];
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
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${expanded ? 'hide' : 'show'} details`}
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

function weakLabel(subdivision: Subdivision) {
  return SUBDIVISION_LABELS[subdivision].toUpperCase();
}

function missedBarGroups(events: readonly MissedEvent[]) {
  const groups = new Map<number, MissedEvent[]>();
  for (const event of events) {
    const group = groups.get(event.barIndex) ?? [];
    group.push(event);
    groups.set(event.barIndex, group);
  }
  return Array.from(groups.entries()).sort(([first], [second]) => first - second);
}

function missedPosition(event: MissedEvent): string {
  const beat = Math.floor(event.beatInBar) + 1;
  const fraction = event.beatInBar - Math.floor(event.beatInBar);
  const offset = fraction < 0.005 ? '' : ` + ${fraction.toFixed(2)}`;
  const rhythm = event.subdivision
    ? SUBDIVISION_LABELS[event.subdivision]
    : event.durationQuarter === undefined
      ? 'score note'
      : scoreDurationLabel(event.durationQuarter, event.tupletNumber);
  return `beat ${beat}${offset} · ${rhythm}`;
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
  const { results, prepareRepeatExercise, discardReplayData } = useRhythmSession();
  const router = useRouter();
  const { lessonId: rawLessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const lessonId = Array.isArray(rawLessonId) ? rawLessonId[0] : rawLessonId;
  const [replay, setReplay] = useState<{ barIndex: number; playbackId: number; isPlaying: boolean } | null>(null);
  const replaySequenceRef = useRef(0);
  const [startingAgain, setStartingAgain] = useState(false);
  const [showMissedNotes, setShowMissedNotes] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const completionAttemptedRef = useRef<string | null>(null);
  const courseLesson = LEARN_COURSE.find((lesson) => lesson.id === lessonId);
  const missedBars = missedBarGroups(results?.missedEvents ?? []);

  useEffect(() => {
    if (!results || !courseLesson || completionAttemptedRef.current === courseLesson.id) return;
    completionAttemptedRef.current = courseLesson.id;
    void completeLearnLesson(courseLesson.id).then((completedIds) => {
      setLessonCompleted(completedIds.includes(courseLesson.id));
    });
  }, [courseLesson, results]);

  useFocusEffect(useCallback(() => () => {
    discardReplayData();
  }, [discardReplayData]));

  const replayBar = useCallback((barIndex: number) => {
    replaySequenceRef.current += 1;
    setReplay({ barIndex, playbackId: replaySequenceRef.current, isPlaying: true });
  }, []);

  const finishVisualReplay = useCallback((barIndex: number, playbackId: number) => {
    setReplay((current) => current?.barIndex === barIndex && current.playbackId === playbackId
      ? { ...current, isPlaying: false }
      : current,
    );
  }, []);

  const startAgain = async () => {
    if (startingAgain) return;
    setStartingAgain(true);
    try {
      await prepareRepeatExercise();
      discardReplayData();
      router.replace('/practice');
    } catch {
      setStartingAgain(false);
      Alert.alert('Audio could not start', 'Check your device audio settings and try again.');
    }
  };

  if (!results) {
    return (
      <SafeAreaView testID="results.screen" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.muted }}>No session results yet.</Text>
        <Pressable onPress={() => router.replace('/setup')} style={{ padding: 16 }}>
          <Text style={{ color: colors.left, fontWeight: '800' }}>SET UP A SESSION</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const allExpected = results.left.totalExpected + results.right.totalExpected;
  const allHits = results.left.totalHit + results.right.totalHit;
  const overall = allExpected === 0 ? 0 : (allHits / allExpected) * 100;
  const weakest = weakestCombination(results);
  const feedback = buildFeedback(results, weakest);
  const displayedHands = results.trainingMode === 'single-hand' ? [results.singleHand] : ['left', 'right'] as const;
  const combinations = [...results.combinations].sort(
    (a, b) =>
      (results.trainingMode === 'single-hand' ? accuracyPercent(a[results.singleHand]) : Math.min(accuracyPercent(a.left), accuracyPercent(a.right))) -
      (results.trainingMode === 'single-hand' ? accuracyPercent(b[results.singleHand]) : Math.min(accuracyPercent(b.left), accuracyPercent(b.right))),
  );
  const sessionOptions = [
    results.feel === 'swing' ? 'SWING' : 'STRAIGHT',
    results.graceNotesEnabled ? 'GRACE PICKUPS' : null,
    results.restBetweenChanges ? 'REST BEFORE CHANGES' : null,
    results.trainingMode === 'single-hand' ? 'ONE HAND' : 'TWO HANDS',
  ].filter(Boolean).join(' · ');

  return (
    <SafeAreaView testID="results.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 }}>{courseLesson ? lessonCompleted ? 'LESSON COMPLETE' : 'LESSON FINISHED' : results.source === 'score' ? 'SCORE SESSION COMPLETE' : 'SESSION COMPLETE'}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, maxWidth: '68%', textAlign: 'right' }}>
            {results.bpm} BPM · {results.timeSignature} · {results.source === 'score' ? results.scoreTitle : sessionOptions}
          </Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 }}>{courseLesson ? courseLesson.title : 'Your timing.'}</Text>
        {courseLesson && lessonCompleted ? (
          <Text testID="results.lessonComplete" style={{ color: colors.left, fontSize: 13, fontWeight: '800', marginTop: 7 }}>
            {courseLesson.number === LEARN_COURSE.length ? 'Course complete. You have reached the final lesson.' : 'Lesson complete. The next lesson is ready.'}
          </Text>
        ) : null}

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 20, marginTop: 17 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>{results.source === 'score' ? 'SCORE ACCURACY' : 'OVERALL ACCURACY'}</Text>
          <Text style={{ color: colors.text, fontSize: 58, lineHeight: 66, fontWeight: '900', marginTop: 4 }}>{percent(overall)}</Text>
          <View style={{ height: 4, borderRadius: 3, backgroundColor: colors.line, marginTop: 11, overflow: 'hidden' }}>
            <View style={{ width: (String(overall) + '%') as DimensionValue, height: 4, backgroundColor: colors.accent, borderRadius: 3 }} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 11 }}>
          {displayedHands.map((hand) => (
            <ScorePanel
              key={hand}
              label={results.trainingMode === 'single-hand' ? 'ONE HAND' : `${hand.toUpperCase()} HAND`}
              value={percent(accuracyPercent(results[hand]))}
              detail={timingText(results[hand])}
              accent={results.trainingMode === 'single-hand' ? colors.accent : hand === 'left' ? colors.left : colors.right}
            />
          ))}
        </View>
        {results.source === 'score' ? null : (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <ScorePanel label="STEADY RHYTHM" value={results.stable.totalExpected ? percent(accuracyPercent(results.stable)) : '—'} detail="Outside switch window" />
            <ScorePanel label="DURING SWITCHES" value={results.transition.totalExpected ? percent(accuracyPercent(results.transition)) : '—'} detail="First 2 beats after change" />
          </View>
        )}

        {results.challengeMode ? (
          <GameCenterChallengeCard
            testID="results.gameCenter"
            challengeMode
            longestCorrectStreak={results.longestCorrectStreak}
          />
        ) : null}

        {missedBars.length > 0 ? (
          <View style={{ marginTop: 22 }}>
            <DisclosureHeader
              testID="results.missedNotes"
              title={`MISSED NOTES · ${results.missedEvents.length}`}
              expanded={showMissedNotes}
              onPress={() => setShowMissedNotes((expanded) => !expanded)}
            />
            {showMissedNotes ? (
              <View style={{ paddingTop: 12 }}>
                <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>
                  Replay shows the expected notes beside your recorded taps. Leaving this page clears replay.
                </Text>
                {missedBars.map(([barIndex, events]) => {
                  const leftEvents = events.filter((event) => event.hand === 'left');
                  const rightEvents = events.filter((event) => event.hand === 'right');
                  const expectedEvents = results.replayExpectedEvents?.filter((event) => event.barIndex === barIndex) ?? [];
                  const taps = results.replayTaps?.filter((tap) => tap.barIndex === barIndex) ?? [];
                  const replayHands = results.trainingMode === 'single-hand'
                    ? [results.singleHand]
                    : ['left', 'right'] as const;
                  const metrics = timeSignatureMetrics(results.bpm, results.timeSignature);
                  return (
                    <View key={barIndex} testID={`results.missedBar.${barIndex}`} style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>BAR {barIndex}</Text>
                          {leftEvents.length > 0 ? (
                            <Text numberOfLines={2} style={{ color: colors.left, fontSize: 11, lineHeight: 16 }}>
                              {results.trainingMode === 'single-hand' ? 'ONE HAND' : 'LEFT'} · {leftEvents.length} missed · {leftEvents.slice(0, 4).map(missedPosition).join(', ')}{leftEvents.length > 4 ? `, +${leftEvents.length - 4}` : ''}
                            </Text>
                          ) : null}
                          {rightEvents.length > 0 ? (
                            <Text numberOfLines={2} style={{ color: colors.right, fontSize: 11, lineHeight: 16 }}>
                              {results.trainingMode === 'single-hand' ? 'ONE HAND' : 'RIGHT'} · {rightEvents.length} missed · {rightEvents.slice(0, 4).map(missedPosition).join(', ')}{rightEvents.length > 4 ? `, +${rightEvents.length - 4}` : ''}
                            </Text>
                          ) : null}
                        </View>
                        <Pressable
                          testID={`results.replayBar.${barIndex}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Play visual replay for bar ${barIndex}`}
                          onPress={() => replayBar(barIndex)}
                          style={({ pressed }) => ({ paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', borderRadius: 11, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: replay?.barIndex === barIndex && replay.isPlaying ? colors.accent : colors.line })}
                        >
                          <Text style={{ color: replay?.barIndex === barIndex && replay.isPlaying ? colors.accent : colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 }}>
                            {replay?.barIndex === barIndex && replay.isPlaying ? 'PLAYING' : 'REPLAY'}
                          </Text>
                        </Pressable>
                      </View>
                      {replay?.barIndex === barIndex ? (
                        <ReplayTimeline
                          key={`${barIndex}.${replay.playbackId}`}
                          barIndex={barIndex}
                          expectedEvents={expectedEvents}
                          taps={taps}
                          hands={replayHands}
                          beatsPerBar={metrics.beatsPerBar}
                          bpm={results.bpm}
                          timeSignature={results.timeSignature}
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
                {results.trainingMode === 'single-hand' ? 'ONE-HAND TIMING' : 'HAND TIMING'}
              </Text>
              {displayedHands.map((hand) => {
                const stats = results[hand];
                return (
                  <View key={hand} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                    <View>
                      <Text style={{ color: hand === 'left' ? colors.left : colors.right, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>
                        {results.trainingMode === 'single-hand' ? 'ONE HAND' : `${hand.toUpperCase()} HAND`}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{timingNote(stats)}</Text>
                    </View>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                      {timingText(stats)}
                    </Text>
                  </View>
                );
              })}

              {weakest && results.source !== 'score' ? (
                <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 17, marginTop: 22 }}>
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>{results.trainingMode === 'single-hand' ? 'MOST DIFFICULT PATTERN' : 'MOST DIFFICULT PAIR'}</Text>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 13 }}>
                    {results.trainingMode === 'single-hand'
                      ? `ONE HAND · ${SUBDIVISION_LABELS[weakest[results.singleHand === 'left' ? 'leftSubdivision' : 'rightSubdivision']]}`
                      : `Left: ${SUBDIVISION_LABELS[weakest.leftSubdivision]}   ·   Right: ${SUBDIVISION_LABELS[weakest.rightSubdivision]}`}
                  </Text>
                  <Text style={{ color: colors.accent, fontSize: 30, fontWeight: '900', marginTop: 5 }}>
                    {results.trainingMode === 'single-hand' ? 'ONE HAND' : weakest.weakHand.toUpperCase()} {percent(weakest.accuracy)}
                  </Text>
                </View>
              ) : null}

              {combinations.length > 0 && results.source !== 'score' ? (
                <View style={{ marginTop: 22 }}>
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 5 }}>{results.trainingMode === 'single-hand' ? 'PATTERN BREAKDOWN' : 'PAIR BREAKDOWN'}</Text>
                  {combinations.map((combination) => (
                    <View key={combination.leftSubdivision + ':' + combination.rightSubdivision} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                      <Text style={{ color: colors.muted, flex: 1, fontSize: 12 }}>
                        {results.trainingMode === 'single-hand'
                          ? `ONE HAND · ${weakLabel(combination[results.singleHand === 'left' ? 'leftSubdivision' : 'rightSubdivision'])}`
                          : `${weakLabel(combination.leftSubdivision)} / ${weakLabel(combination.rightSubdivision)}`}
                      </Text>
                      {results.trainingMode === 'single-hand' ? (
                        <Text style={{ color: colors.accent, width: 58, textAlign: 'right', fontSize: 12, fontWeight: '800' }}>
                          {percent(accuracyPercent(combination[results.singleHand]))}
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
          accessibilityLabel="Start the same exercise again"
          accessibilityState={{ disabled: startingAgain }}
          disabled={startingAgain}
          onPress={() => void startAgain()}
          style={({ pressed }) => ({ backgroundColor: pressed ? '#A8EADB' : colors.left, minHeight: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 27, opacity: startingAgain ? 0.72 : 1 })}
        >
          <Text style={{ color: colors.background, fontSize: 15, fontWeight: '900', letterSpacing: 0.8 }}>
            {startingAgain ? 'PREPARING…' : 'START AGAIN'}
          </Text>
        </Pressable>
        {courseLesson && lessonCompleted ? (
          <Pressable
            testID="results.continueLearning"
            accessibilityRole="button"
            accessibilityLabel="Continue the guided course"
            onPress={() => {
              discardReplayData();
              router.replace({ pathname: '/learn', params: { lessonId } });
            }}
            style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceRaised : colors.surface, minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderWidth: 1, borderColor: colors.line })}
          >
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 }}>
              {courseLesson.number === LEARN_COURSE.length ? 'VIEW COURSE' : 'CONTINUE LEARNING'}
            </Text>
          </Pressable>
        ) : null}
        <Link href="/setup" asChild>
          <Pressable
            testID="results.settings"
            accessibilityRole="button"
            accessibilityLabel="Change settings"
            onPress={discardReplayData}
            style={({ pressed }) => ({ flexDirection: 'row', backgroundColor: pressed ? colors.surface : colors.surfaceRaised, minHeight: 56, paddingHorizontal: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'space-between', marginTop: 10, borderWidth: 1, borderColor: colors.line })}
          >
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 }}>CHANGE SETTINGS</Text>
            <Text accessibilityElementsHidden style={{ color: colors.muted, fontSize: 24, lineHeight: 28, fontWeight: '500' }}>›</Text>
          </Pressable>
        </Link>
        <Link href="/records" asChild>
          <Pressable
            testID="results.records"
            accessibilityRole="button"
            accessibilityLabel="View my record"
            onPress={discardReplayData}
            style={({ pressed }) => ({ flexDirection: 'row', backgroundColor: pressed ? colors.surface : colors.surfaceRaised, minHeight: 56, paddingHorizontal: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'space-between', marginTop: 10, borderWidth: 1, borderColor: colors.line })}
          >
            <Text style={{ color: colors.left, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 }}>VIEW MY RECORD</Text>
            <Text accessibilityElementsHidden style={{ color: colors.left, fontSize: 24, lineHeight: 28, fontWeight: '500' }}>›</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

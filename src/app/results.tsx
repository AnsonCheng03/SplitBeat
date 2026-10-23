import { Link, useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import type { DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { accuracyPercent } from '@/rhythm/scoring';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
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
          ? `Your ${results.singleHand} hand tends to ${stats.averageSignedErrorMs > 0 ? 'play late' : 'rush'}.`
          : 'Your selected hand stayed steady through the score.',
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
  const trainedHands = results.trainingMode === 'single-hand' ? [results.singleHand] : ['left', 'right'] as const;
  for (const hand of trainedHands) {
    const average = results[hand].averageSignedErrorMs;
    if (average < -15) messages.push(`Your ${hand} hand tends to rush.`);
    if (average > 15) messages.push(`Your ${hand} hand tends to play late.`);
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
      messages.push(`Your ${handName.toLowerCase()} hand's ${affectedPattern[affectedSubdivision]} need extra practice.`);
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
  const { results, replayMissedBar, discardReplayData } = useRhythmSession();
  const router = useRouter();
  const [playingBar, setPlayingBar] = useState<number | null>(null);
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const missedBars = missedBarGroups(results?.missedEvents ?? []);

  useFocusEffect(useCallback(() => () => {
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    replayTimerRef.current = undefined;
    setPlayingBar(null);
    discardReplayData();
  }, [discardReplayData]));

  const replayBar = useCallback(async (barIndex: number, events: readonly MissedEvent[]) => {
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    setPlayingBar(barIndex);
    try {
      const durationMs = await replayMissedBar(events);
      replayTimerRef.current = setTimeout(() => {
        replayTimerRef.current = undefined;
        setPlayingBar(null);
      }, durationMs);
    } catch {
      setPlayingBar(null);
    }
  }, [replayMissedBar]);

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
    results.trainingMode === 'single-hand' ? `${results.singleHand.toUpperCase()} HAND` : 'TWO HANDS',
  ].filter(Boolean).join(' · ');

  return (
    <SafeAreaView testID="results.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 }}>{results.source === 'score' ? 'SCORE SESSION COMPLETE' : 'SESSION COMPLETE'}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, maxWidth: '68%', textAlign: 'right' }}>
            {results.bpm} BPM · {results.timeSignature} · {results.source === 'score' ? results.scoreTitle : sessionOptions}
          </Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 }}>Your timing.</Text>

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
              label={`${hand.toUpperCase()} HAND${results.trainingMode === 'single-hand' ? ' · FOCUSED' : ''}`}
              value={percent(accuracyPercent(results[hand]))}
              detail={timingText(results[hand])}
              accent={hand === 'left' ? colors.left : colors.right}
            />
          ))}
        </View>
        {results.source === 'score' ? null : (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <ScorePanel label="STEADY RHYTHM" value={results.stable.totalExpected ? percent(accuracyPercent(results.stable)) : '—'} detail="Outside switch window" />
            <ScorePanel label="DURING SWITCHES" value={results.transition.totalExpected ? percent(accuracyPercent(results.transition)) : '—'} detail="First 2 beats after change" />
          </View>
        )}

        {missedBars.length > 0 ? (
          <View style={{ marginTop: 22 }}>
            <Text testID="results.missedNotes" style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 5 }}>
              MISSED NOTES · {results.missedEvents.length}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>
              Tap Replay to hear the missed notes in a bar. Leaving this page clears replay.
            </Text>
            {missedBars.map(([barIndex, events]) => {
              const leftEvents = events.filter((event) => event.hand === 'left');
              const rightEvents = events.filter((event) => event.hand === 'right');
              return (
                <View key={barIndex} testID={`results.missedBar.${barIndex}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>BAR {barIndex}</Text>
                    {leftEvents.length > 0 ? (
                      <Text numberOfLines={2} style={{ color: colors.left, fontSize: 11, lineHeight: 16 }}>
                        LEFT · {leftEvents.length} missed · {leftEvents.slice(0, 4).map(missedPosition).join(', ')}{leftEvents.length > 4 ? `, +${leftEvents.length - 4}` : ''}
                      </Text>
                    ) : null}
                    {rightEvents.length > 0 ? (
                      <Text numberOfLines={2} style={{ color: colors.right, fontSize: 11, lineHeight: 16 }}>
                        RIGHT · {rightEvents.length} missed · {rightEvents.slice(0, 4).map(missedPosition).join(', ')}{rightEvents.length > 4 ? `, +${rightEvents.length - 4}` : ''}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    testID={`results.replayBar.${barIndex}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Replay missed notes from bar ${barIndex}`}
                    onPress={() => void replayBar(barIndex, events)}
                    style={({ pressed }) => ({ paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', borderRadius: 11, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: playingBar === barIndex ? colors.accent : colors.line })}
                  >
                    <Text style={{ color: playingBar === barIndex ? colors.accent : colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 }}>
                      {playingBar === barIndex ? 'PLAYING' : 'REPLAY'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}

        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 25, marginBottom: 10 }}>HAND TIMING</Text>
        {displayedHands.map((hand) => {
          const stats = results[hand];
          return (
            <View key={hand} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <View>
                <Text style={{ color: hand === 'left' ? colors.left : colors.right, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>
                  {hand.toUpperCase()} HAND
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
                ? `${results.singleHand.toUpperCase()}: ${SUBDIVISION_LABELS[weakest[results.singleHand === 'left' ? 'leftSubdivision' : 'rightSubdivision']]}`
                : `Left: ${SUBDIVISION_LABELS[weakest.leftSubdivision]}   ·   Right: ${SUBDIVISION_LABELS[weakest.rightSubdivision]}`}
            </Text>
            <Text style={{ color: colors.accent, fontSize: 30, fontWeight: '900', marginTop: 5 }}>
              {weakest.weakHand.toUpperCase()} {percent(weakest.accuracy)}
            </Text>
          </View>
        ) : null}

        {combinations.length > 0 && results.source !== 'score' ? (
          <View style={{ marginTop: 22 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 5 }}>{results.trainingMode === 'single-hand' ? 'PATTERN BREAKDOWN' : 'PAIR BREAKDOWN'}</Text>
            {combinations.map((combination) => (
              <View key={combination.leftSubdivision + ':' + combination.rightSubdivision} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                <Text style={{ color: colors.muted, flex: 1, fontSize: 12 }}>
                  {results.trainingMode === 'single-hand'
                    ? `${results.singleHand.toUpperCase()} · ${weakLabel(combination[results.singleHand === 'left' ? 'leftSubdivision' : 'rightSubdivision'])}`
                    : `${weakLabel(combination.leftSubdivision)} / ${weakLabel(combination.rightSubdivision)}`}
                </Text>
                {results.trainingMode === 'single-hand' ? (
                  <Text style={{ color: results.singleHand === 'left' ? colors.left : colors.right, width: 58, textAlign: 'right', fontSize: 12, fontWeight: '800' }}>
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

        <Link href="/setup" asChild>
          <Pressable onPress={discardReplayData} style={({ pressed }) => ({ backgroundColor: pressed ? '#A8EADB' : colors.left, minHeight: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 27 })}>
            <Text style={{ color: colors.background, fontSize: 15, fontWeight: '900', letterSpacing: 0.8 }}>TRAIN AGAIN</Text>
          </Pressable>
        </Link>
        <Link href="/records" asChild>
          <Pressable testID="results.records" onPress={discardReplayData} style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceRaised : colors.surface, minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderWidth: 1, borderColor: colors.line })}>
            <Text style={{ color: colors.left, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 }}>VIEW MY RECORD</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

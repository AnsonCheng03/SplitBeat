import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { accuracyPercent } from '@/rhythm/scoring';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';
import type { HandStats, SessionResults, Subdivision } from '@/types/rhythm';

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
    (combination) => combination.left.totalExpected + combination.right.totalExpected >= 4,
  );
  return available
    .map((combination) => {
      const leftAccuracy = accuracyPercent(combination.left);
      const rightAccuracy = accuracyPercent(combination.right);
      const weakHand = leftAccuracy <= rightAccuracy ? 'left' : 'right';
      return {
        ...combination,
        weakHand,
        accuracy: Math.min(leftAccuracy, rightAccuracy),
        sampleSize: combination.left.totalExpected + combination.right.totalExpected,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy || b.sampleSize - a.sampleSize)[0];
}

function buildFeedback(results: SessionResults, weak?: ReturnType<typeof weakestCombination>) {
  const messages: string[] = [];
  if (results.right.averageSignedErrorMs < -15) messages.push('Your right hand tends to rush.');
  if (results.left.averageSignedErrorMs > 15) messages.push('Your left hand tends to play late.');
  if (results.left.averageSignedErrorMs < -15) messages.push('Your left hand tends to rush.');
  if (results.right.averageSignedErrorMs > 15) messages.push('Your right hand tends to play late.');

  if (weak && weak.accuracy < 85) {
    const handName = weak.weakHand === 'left' ? 'Left' : 'Right';
    const otherHandName = weak.weakHand === 'left' ? 'right' : 'left';
    const affectedSubdivision =
      weak.weakHand === 'left' ? weak.leftSubdivision : weak.rightSubdivision;
    const otherSubdivision =
      weak.weakHand === 'left' ? weak.rightSubdivision : weak.leftSubdivision;
    const affectedPattern: Record<Subdivision, string> = {
      quarter: 'quarter-note pulse',
      eighth: 'eighth-note subdivisions',
      triplet: 'triplets',
      sixteenth: 'sixteenth-note subdivisions',
      thirtySecond: '32nd-note subdivisions',
      sixtyFourth: '64th-note subdivisions',
    };
    const playedPattern: Record<Subdivision, string> = {
      quarter: 'quarter notes',
      eighth: 'eighth notes',
      triplet: 'triplets',
      sixteenth: 'sixteenth notes',
      thirtySecond: '32nd notes',
      sixtyFourth: '64th notes',
    };
    const verb = affectedSubdivision === 'quarter' ? 'is' : 'are';
    messages.push(
      'Your ' +
        handName.toLowerCase() +
        '-hand ' +
        affectedPattern[affectedSubdivision] +
        ' ' +
        verb +
        ' less steady when your ' +
        otherHandName +
        ' hand plays ' +
        playedPattern[otherSubdivision] +
        '.',
    );
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

export default function ResultsScreen() {
  const { results } = useRhythmSession();
  const router = useRouter();

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
  const combinations = [...results.combinations].sort(
    (a, b) =>
      Math.min(accuracyPercent(a.left), accuracyPercent(a.right)) -
      Math.min(accuracyPercent(b.left), accuracyPercent(b.right)),
  );

  return (
    <SafeAreaView testID="results.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 }}>SESSION COMPLETE</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{results.bpm} BPM · {results.timeSignature}</Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 }}>Your timing.</Text>

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 20, marginTop: 17 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>OVERALL ACCURACY</Text>
          <Text style={{ color: colors.text, fontSize: 58, lineHeight: 66, fontWeight: '900', marginTop: 4 }}>{percent(overall)}</Text>
          <View style={{ height: 4, borderRadius: 3, backgroundColor: colors.line, marginTop: 11, overflow: 'hidden' }}>
            <View style={{ width: (String(overall) + '%') as DimensionValue, height: 4, backgroundColor: colors.accent, borderRadius: 3 }} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 11 }}>
          <ScorePanel label="LEFT HAND" value={percent(accuracyPercent(results.left))} detail={timingText(results.left)} accent={colors.left} />
          <ScorePanel label="RIGHT HAND" value={percent(accuracyPercent(results.right))} detail={timingText(results.right)} accent={colors.right} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <ScorePanel label="STEADY RHYTHM" value={results.stable.totalExpected ? percent(accuracyPercent(results.stable)) : '—'} detail="Outside switch window" />
          <ScorePanel label="DURING SWITCHES" value={results.transition.totalExpected ? percent(accuracyPercent(results.transition)) : '—'} detail="First 2 beats after change" />
        </View>

        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 25, marginBottom: 10 }}>HAND TIMING</Text>
        {(['left', 'right'] as const).map((hand) => {
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

        {weakest ? (
          <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 17, marginTop: 22 }}>
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>MOST DIFFICULT PAIR</Text>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 13 }}>
              Left: {SUBDIVISION_LABELS[weakest.leftSubdivision]}   ·   Right: {SUBDIVISION_LABELS[weakest.rightSubdivision]}
            </Text>
            <Text style={{ color: colors.accent, fontSize: 30, fontWeight: '900', marginTop: 5 }}>
              {weakest.weakHand.toUpperCase()} {percent(weakest.accuracy)}
            </Text>
          </View>
        ) : null}

        {combinations.length > 0 ? (
          <View style={{ marginTop: 22 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 5 }}>PAIR BREAKDOWN</Text>
            {combinations.map((combination) => (
              <View key={combination.leftSubdivision + ':' + combination.rightSubdivision} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                <Text style={{ color: colors.muted, flex: 1, fontSize: 12 }}>
                  {weakLabel(combination.leftSubdivision)} / {weakLabel(combination.rightSubdivision)}
                </Text>
                <Text style={{ color: colors.left, width: 58, textAlign: 'right', fontSize: 12, fontWeight: '800' }}>
                  {percent(accuracyPercent(combination.left))}
                </Text>
                <Text style={{ color: colors.right, width: 58, textAlign: 'right', fontSize: 12, fontWeight: '800' }}>
                  {percent(accuracyPercent(combination.right))}
                </Text>
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
          <Pressable style={({ pressed }) => ({ backgroundColor: pressed ? '#A8EADB' : colors.left, minHeight: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 27 })}>
            <Text style={{ color: colors.background, fontSize: 15, fontWeight: '900', letterSpacing: 0.8 }}>TRAIN AGAIN</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

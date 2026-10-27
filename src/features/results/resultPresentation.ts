import { accuracyPercent } from '@/rhythm/scoring';
import { getMixturePattern } from '@/rhythm/mixtures';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import type { HandStats, MixturePatternId, MissedEvent, ReplayTap, SessionResults, Subdivision } from '@/types/rhythm';

export function percent(value: number) {
  return Math.round(value) + '%';
}

export function sessionAccuracy(results: SessionResults): number {
  const expected = results.left.totalExpected + results.right.totalExpected;
  const hits = results.left.totalHit + results.right.totalHit;
  return expected === 0 ? 0 : (hits / expected) * 100;
}

export function shouldSuggestTimingCalibration(
  results: Pick<SessionResults, 'trainingMode' | 'singleHand' | 'left' | 'right' | 'replayTaps'>,
): boolean {
  const hands = results.trainingMode === 'single-hand'
    ? [results[results.singleHand]]
    : [results.left, results.right];
  const expected = hands.reduce((total, stats) => total + stats.totalExpected, 0);
  const hits = hands.reduce((total, stats) => total + stats.totalHit, 0);
  const tapCount = results.replayTaps?.length ?? 0;
  if (expected < 12 || tapCount < 8) return false;

  const lowAccuracy = hits / expected < 0.5;
  const consistentTimingBias = hands.some((stats) =>
    stats.totalHit >= 4 && Math.abs(stats.averageSignedErrorMs) >= 40,
  );
  return lowAccuracy || consistentTimingBias;
}

export function timingText(stats: HandStats): string {
  if (stats.totalHit === 0) return '—';
  const rounded = Math.round(stats.averageSignedErrorMs);
  return (rounded > 0 ? '+' : '') + rounded + ' ms';
}

export function timingNote(stats: HandStats): string {
  if (stats.totalHit === 0 || Math.abs(stats.averageSignedErrorMs) < 15) return 'On time';
  return stats.averageSignedErrorMs > 0 ? 'Slightly late' : 'Slightly early';
}

export function weakestCombination(results: SessionResults) {
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

export function buildFeedback(
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

export function weakLabel(subdivision: Subdivision, rest = false, mixtureId?: MixturePatternId) {
  return rest ? 'REST' : mixtureId ? getMixturePattern(mixtureId).label.toUpperCase() : SUBDIVISION_LABELS[subdivision].toUpperCase();
}

export interface ReplayErrorGroup {
  barIndex: number;
  missedEvents: MissedEvent[];
  extraTaps: ReplayTap[];
}

export function replayErrorBarGroups(results: SessionResults | null): ReplayErrorGroup[] {
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

export function missedPosition(event: MissedEvent, t: (source: string, values?: Record<string, string | number>) => string): string {
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

export function replayErrorSummary(
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

export function scoreDurationLabel(durationQuarter: number, tupletNumber?: number): string {
  if (tupletNumber) return `${tupletNumber}-note tuplet`;
  const noteValues = [
    [4, 'whole'], [3, 'dotted half'], [2, 'half'], [1.5, 'dotted quarter'], [1, 'quarter'],
    [0.75, 'dotted eighth'], [0.5, 'eighth'], [0.375, 'dotted sixteenth'], [0.25, 'sixteenth'],
    [0.1875, 'dotted 32nd'], [0.125, '32nd'], [0.09375, 'dotted 64th'], [0.0625, '64th'],
  ] as const;
  const noteValue = noteValues.find(([duration]) => Math.abs(duration - durationQuarter) < 0.00001);
  return noteValue?.[1] ?? 'score note';
}

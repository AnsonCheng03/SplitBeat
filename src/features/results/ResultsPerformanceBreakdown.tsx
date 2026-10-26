import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { ResultsDisclosureHeader } from '@/features/results/ResultsControls';
import { accuracyPercent } from '@/rhythm/scoring';
import { percent, timingNote, timingText, weakLabel, weakestCombination } from '@/features/results/resultPresentation';
import { useTheme } from '@/theme/ThemeProvider';
import type { SessionResults } from '@/types/rhythm';

export function ResultsPerformanceBreakdown({
  results,
  expanded,
  feedback,
  onToggle,
}: {
  results: SessionResults;
  expanded: boolean;
  feedback: readonly string[];
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const weakest = weakestCombination(results);
  const displayedHands = results.trainingMode === 'single-hand' ? [results.singleHand] : ['left', 'right'] as const;
  const combinations = [...results.combinations].sort(
    (a, b) => (results.trainingMode === 'single-hand'
      ? accuracyPercent(a[results.singleHand])
      : Math.min(accuracyPercent(a.left), accuracyPercent(a.right))) -
      (results.trainingMode === 'single-hand'
        ? accuracyPercent(b[results.singleHand])
        : Math.min(accuracyPercent(b.left), accuracyPercent(b.right))),
  );

  return (
    <View style={{ marginTop: 25 }}>
      <ResultsDisclosureHeader
        testID="results.breakdown"
        title="PERFORMANCE BREAKDOWN"
        expanded={expanded}
        onPress={onToggle}
      />
      {expanded ? (
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
                  ? `ONE HAND · ${weakLabel(weakest[results.singleHand === 'left' ? 'leftSubdivision' : 'rightSubdivision'], weakest[results.singleHand === 'left' ? 'leftRest' : 'rightRest'], weakest[results.singleHand === 'left' ? 'leftMixture' : 'rightMixture'])}`
                  : `Left: ${weakLabel(weakest.leftSubdivision, weakest.leftRest, weakest.leftMixture)}   ·   Right: ${weakLabel(weakest.rightSubdivision, weakest.rightRest, weakest.rightMixture)}`}
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
                <View key={`${combination.leftRest ? 'rest' : combination.leftMixture ?? combination.leftSubdivision}:${combination.rightRest ? 'rest' : combination.rightMixture ?? combination.rightSubdivision}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                  <Text style={{ color: colors.muted, flex: 1, fontSize: 12 }}>
                    {results.trainingMode === 'single-hand'
                      ? `ONE HAND · ${weakLabel(combination[results.singleHand === 'left' ? 'leftSubdivision' : 'rightSubdivision'], combination[results.singleHand === 'left' ? 'leftRest' : 'rightRest'], combination[results.singleHand === 'left' ? 'leftMixture' : 'rightMixture'])}`
                      : `${weakLabel(combination.leftSubdivision, combination.leftRest, combination.leftMixture)} / ${weakLabel(combination.rightSubdivision, combination.rightRest, combination.rightMixture)}`}
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
  );
}

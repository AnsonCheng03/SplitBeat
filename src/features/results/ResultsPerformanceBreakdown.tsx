import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { ResultsDisclosureHeader } from '@/features/results/ResultsControls';
import { accuracyPercent } from '@/rhythm/scoring';
import { percent, timingNote, timingText, weakLabel, weakestCombination } from '@/features/results/resultPresentation';
import { useTheme } from '@/theme/ThemeProvider';
import type { SessionResults } from '@/types/rhythm';
import {
  ResultsPerformanceBreakdownStyle1,
  ResultsPerformanceBreakdownStyle2,
  ResultsPerformanceBreakdownStyle3,
  ResultsPerformanceBreakdownStyle4,
  ResultsPerformanceBreakdownStyle5,
  ResultsPerformanceBreakdownStyle6,
  ResultsPerformanceBreakdownStyle7,
  ResultsPerformanceBreakdownStyle8,
  ResultsPerformanceBreakdownStyle9,
  ResultsPerformanceBreakdownStyle10,
  ResultsPerformanceBreakdownStyle11,
  ResultsPerformanceBreakdownStyle12,
  ResultsPerformanceBreakdownStyle13,
  ResultsPerformanceBreakdownStyle14,
  ResultsPerformanceBreakdownStyle15,
  ResultsPerformanceBreakdownStyle16,
  ResultsPerformanceBreakdownStyle17,
  ResultsPerformanceBreakdownStyle18,
  ResultsPerformanceBreakdownStyle19,
  ResultsPerformanceBreakdownStyle20
} from '@/styles/results';

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
    <View style={ResultsPerformanceBreakdownStyle1()}>
      <ResultsDisclosureHeader
        testID="results.breakdown"
        title="PERFORMANCE BREAKDOWN"
        expanded={expanded}
        onPress={onToggle}
      />
      {expanded ? (
        <View style={ResultsPerformanceBreakdownStyle2()}>
          <Text testID="results.breakdown.details" style={ResultsPerformanceBreakdownStyle3({ colors })}>
            {results.trainingMode === 'single-hand' ? 'ONE-HAND TIMING' : 'HAND TIMING'}
          </Text>
          {displayedHands.map((hand) => {
            const stats = results[hand];
            return (
              <View key={hand} style={ResultsPerformanceBreakdownStyle4({ colors })}>
                <View>
                  <Text style={ResultsPerformanceBreakdownStyle5({ hand, colors })}>
                    {results.trainingMode === 'single-hand' ? 'ONE HAND' : `${hand.toUpperCase()} HAND`}
                  </Text>
                  <Text style={ResultsPerformanceBreakdownStyle6({ colors })}>{timingNote(stats)}</Text>
                </View>
                <Text style={ResultsPerformanceBreakdownStyle7({ colors })}>
                  {timingText(stats)}
                </Text>
              </View>
            );
          })}

          {weakest && results.source !== 'score' ? (
            <View style={ResultsPerformanceBreakdownStyle8({ colors })}>
              <Text style={ResultsPerformanceBreakdownStyle9({ colors })}>{results.trainingMode === 'single-hand' ? 'MOST DIFFICULT PATTERN' : 'MOST DIFFICULT PAIR'}</Text>
              <Text style={ResultsPerformanceBreakdownStyle10({ colors })}>
                {results.trainingMode === 'single-hand'
                  ? `ONE HAND · ${weakLabel(weakest[results.singleHand === 'left' ? 'leftSubdivision' : 'rightSubdivision'], weakest[results.singleHand === 'left' ? 'leftRest' : 'rightRest'], weakest[results.singleHand === 'left' ? 'leftMixture' : 'rightMixture'])}`
                  : `Left: ${weakLabel(weakest.leftSubdivision, weakest.leftRest, weakest.leftMixture)}   ·   Right: ${weakLabel(weakest.rightSubdivision, weakest.rightRest, weakest.rightMixture)}`}
              </Text>
              <Text style={ResultsPerformanceBreakdownStyle11({ colors })}>
                {results.trainingMode === 'single-hand' ? 'ONE HAND' : weakest.weakHand.toUpperCase()} {percent(weakest.accuracy)}
              </Text>
            </View>
          ) : null}

          {combinations.length > 0 && results.source !== 'score' ? (
            <View style={ResultsPerformanceBreakdownStyle12()}>
              <Text style={ResultsPerformanceBreakdownStyle13({ colors })}>{results.trainingMode === 'single-hand' ? 'PATTERN BREAKDOWN' : 'PAIR BREAKDOWN'}</Text>
              {combinations.map((combination) => (
                <View key={`${combination.leftRest ? 'rest' : combination.leftMixture ?? combination.leftSubdivision}:${combination.rightRest ? 'rest' : combination.rightMixture ?? combination.rightSubdivision}`} style={ResultsPerformanceBreakdownStyle14({ colors })}>
                  <Text style={ResultsPerformanceBreakdownStyle15({ colors })}>
                    {results.trainingMode === 'single-hand'
                      ? `ONE HAND · ${weakLabel(combination[results.singleHand === 'left' ? 'leftSubdivision' : 'rightSubdivision'], combination[results.singleHand === 'left' ? 'leftRest' : 'rightRest'], combination[results.singleHand === 'left' ? 'leftMixture' : 'rightMixture'])}`
                      : `${weakLabel(combination.leftSubdivision, combination.leftRest, combination.leftMixture)} / ${weakLabel(combination.rightSubdivision, combination.rightRest, combination.rightMixture)}`}
                  </Text>
                  {results.trainingMode === 'single-hand' ? (
                    <Text style={ResultsPerformanceBreakdownStyle16({ colors })}>
                      {percent(accuracyPercent(combination[results.singleHand]))}
                    </Text>
                  ) : (
                    <>
                      <Text style={ResultsPerformanceBreakdownStyle17({ colors })}>
                        {percent(accuracyPercent(combination.left))}
                      </Text>
                      <Text style={ResultsPerformanceBreakdownStyle18({ colors })}>
                        {percent(accuracyPercent(combination.right))}
                      </Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          ) : null}

          <View style={ResultsPerformanceBreakdownStyle19()}>
            {feedback.map((message) => (
              <Text key={message} style={ResultsPerformanceBreakdownStyle20({ colors })}>{message}</Text>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

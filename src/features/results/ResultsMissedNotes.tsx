import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ReplayTimeline } from '@/components/ReplayTimeline';
import { ResultsDisclosureHeader } from '@/features/results/ResultsControls';
import { replayErrorSummary } from '@/features/results/resultPresentation';
import { timeSignatureMetrics } from '@/rhythm/subdivisions';
import { replayPatternsForPractice } from '@/rhythm/targetedPractice';
import type { ReplayErrorGroup } from '@/features/results/resultPresentation';
import type { ReplayPattern, SessionResults } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ResultsMissedNotesStyle1,
  ResultsMissedNotesStyle2,
  ResultsMissedNotesStyle3,
  ResultsMissedNotesStyle4,
  ResultsMissedNotesStyle5,
  ResultsMissedNotesStyle6,
  ResultsMissedNotesStyle7,
  ResultsMissedNotesStyle8,
  ResultsMissedNotesStyle9,
  ResultsMissedNotesStyle10,
  ResultsMissedNotesStyle11,
  ResultsMissedNotesStyle12,
  ResultsMissedNotesStyle13,
  ResultsMissedNotesStyle14
} from '@/styles/results';

type ReplayState = { barIndex: number; playbackId: number; isPlaying: boolean; isStarting: boolean } | null;
type ExpectedEvents = NonNullable<SessionResults['replayExpectedEvents']>;
type ReplayTaps = NonNullable<SessionResults['replayTaps']>;

export function ResultsMissedNotes({
  results,
  groups,
  extraTapCount,
  expanded,
  replay,
  replaySoundEnabled,
  savedBars,
  savedPracticePairsLoaded,
  focusPracticeEnabled,
  onToggle,
  onReplay,
  onSaveForLater,
  onPlaybackEnd,
}: {
  results: SessionResults;
  groups: ReplayErrorGroup[];
  extraTapCount: number;
  expanded: boolean;
  replay: ReplayState;
  replaySoundEnabled: boolean;
  savedBars: ReadonlySet<number>;
  savedPracticePairsLoaded: boolean;
  focusPracticeEnabled: boolean;
  onToggle: () => void;
  onReplay: (barIndex: number, events: ExpectedEvents, taps: ReplayTaps, beatsPerBar: number) => void;
  onSaveForLater: (barIndex: number, patterns: readonly ReplayPattern[]) => void;
  onPlaybackEnd: (barIndex: number, playbackId: number) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={ResultsMissedNotesStyle1()}>
      <ResultsDisclosureHeader
        testID="results.missedNotes"
        title={`WRONG NOTES · ${results.missedEvents.length + extraTapCount}`}
        expanded={expanded}
        onPress={onToggle}
      />
      {expanded ? (
        <View style={ResultsMissedNotesStyle2()}>
          <Text style={ResultsMissedNotesStyle3({ colors })}>
            {t('{missed} missed · {extra} extra. Both lower accuracy. Replay shows the expected notes beside your taps; leaving this page clears replay.', { missed: results.missedEvents.length, extra: extraTapCount })}
          </Text>
          {!replaySoundEnabled && process.env.EXPO_PUBLIC_E2E_SILENT !== '1' ? (
            <Text style={ResultsMissedNotesStyle4({ colors })}>
              Replay sound is off. Turn it on in Settings → Sounds to hear the notes.
            </Text>
          ) : null}
          {groups.map(({ barIndex, missedEvents, extraTaps }) => {
            const leftEvents = missedEvents.filter((event) => event.hand === 'left');
            const rightEvents = missedEvents.filter((event) => event.hand === 'right');
            const leftExtraTaps = extraTaps.filter((tap) => tap.hand === 'left');
            const rightExtraTaps = extraTaps.filter((tap) => tap.hand === 'right');
            const expectedEvents = results.replayExpectedEvents?.filter((event) => event.barIndex === barIndex) ?? [];
            const barPatterns = replayPatternsForPractice(expectedEvents);
            const canSaveForLater = focusPracticeEnabled && results.trainingMode === 'two-hand' && results.source !== 'score' && barPatterns.length > 0;
            const taps = results.replayTaps?.filter((tap) => tap.barIndex === barIndex) ?? [];
            const replayHands = results.trainingMode === 'single-hand'
              ? [results.singleHand]
              : ['left', 'right'] as const;
            const metrics = timeSignatureMetrics(results.bpm, results.timeSignature);
            const replayActive = replay?.barIndex === barIndex;

            return (
              <View key={barIndex} testID={`results.missedBar.${barIndex}`} style={ResultsMissedNotesStyle5({ colors })}>
                <View style={ResultsMissedNotesStyle6()}>
                  <View style={ResultsMissedNotesStyle7()}>
                    <Text style={ResultsMissedNotesStyle8({ colors })}>{t('BAR {bar}', { bar: barIndex })}</Text>
                    {leftEvents.length + leftExtraTaps.length > 0 ? (
                      <Text numberOfLines={2} style={ResultsMissedNotesStyle9({ colors })}>
                        {replayErrorSummary(results.trainingMode === 'single-hand' ? 'ONE HAND' : 'LEFT', leftEvents, leftExtraTaps, t)}
                      </Text>
                    ) : null}
                    {rightEvents.length + rightExtraTaps.length > 0 ? (
                      <Text numberOfLines={2} style={ResultsMissedNotesStyle10({ colors })}>
                        {replayErrorSummary(results.trainingMode === 'single-hand' ? 'ONE HAND' : 'RIGHT', rightEvents, rightExtraTaps, t)}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    testID={`results.replayBar.${barIndex}`}
                    accessibilityRole="button"
                    accessibilityLabel={t('Play replay with sound for bar {bar}', { bar: barIndex })}
                    onPress={() => onReplay(barIndex, expectedEvents, taps, metrics.beatsPerBar)}
                    style={({ pressed }) => (ResultsMissedNotesStyle11({ pressed, colors, replayActive, replay }))}
                  >
                    <Text style={ResultsMissedNotesStyle12({ replayActive, replay, colors })}>
                      {replayActive && replay.isStarting ? 'LOADING' : replayActive && replay.isPlaying ? 'PLAYING' : 'REPLAY'}
                    </Text>
                  </Pressable>
                  {canSaveForLater ? (
                    <Pressable
                      testID={`results.practiceLater.${barIndex}`}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: savedBars.has(barIndex) || !savedPracticePairsLoaded }}
                      accessibilityLabel={savedBars.has(barIndex) ? t('Bar {bar} saved for later practice', { bar: barIndex }) : t('Save bar {bar} for later practice', { bar: barIndex })}
                      disabled={savedBars.has(barIndex) || !savedPracticePairsLoaded}
                      onPress={() => onSaveForLater(barIndex, barPatterns)}
                      style={({ pressed }) => (ResultsMissedNotesStyle13({ pressed, colors, savedBars, barIndex }))}
                    >
                      <Text style={ResultsMissedNotesStyle14({ savedBars, barIndex, colors })}>
                        {savedBars.has(barIndex) ? t('SAVED') : t('PRACTICE LATER')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                {replayActive && !replay.isStarting ? (
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
                    onPlaybackEnd={onPlaybackEnd}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

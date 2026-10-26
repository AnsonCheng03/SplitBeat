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
    <View style={{ marginTop: 22 }}>
      <ResultsDisclosureHeader
        testID="results.missedNotes"
        title={`WRONG NOTES · ${results.missedEvents.length + extraTapCount}`}
        expanded={expanded}
        onPress={onToggle}
      />
      {expanded ? (
        <View style={{ paddingTop: 12 }}>
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>
            {t('{missed} missed · {extra} extra. Both lower accuracy. Replay shows the expected notes beside your taps; leaving this page clears replay.', { missed: results.missedEvents.length, extra: extraTapCount })}
          </Text>
          {!replaySoundEnabled && process.env.EXPO_PUBLIC_E2E_SILENT !== '1' ? (
            <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 9 }}>
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
              <View key={barIndex} testID={`results.missedBar.${barIndex}`} style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{t('BAR {bar}', { bar: barIndex })}</Text>
                    {leftEvents.length + leftExtraTaps.length > 0 ? (
                      <Text numberOfLines={2} style={{ color: colors.left, fontSize: 11, lineHeight: 16 }}>
                        {replayErrorSummary(results.trainingMode === 'single-hand' ? 'ONE HAND' : 'LEFT', leftEvents, leftExtraTaps, t)}
                      </Text>
                    ) : null}
                    {rightEvents.length + rightExtraTaps.length > 0 ? (
                      <Text numberOfLines={2} style={{ color: colors.right, fontSize: 11, lineHeight: 16 }}>
                        {replayErrorSummary(results.trainingMode === 'single-hand' ? 'ONE HAND' : 'RIGHT', rightEvents, rightExtraTaps, t)}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    testID={`results.replayBar.${barIndex}`}
                    accessibilityRole="button"
                    accessibilityLabel={t('Play replay with sound for bar {bar}', { bar: barIndex })}
                    onPress={() => onReplay(barIndex, expectedEvents, taps, metrics.beatsPerBar)}
                    style={({ pressed }) => ({ paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', borderRadius: 11, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: replayActive && replay.isPlaying ? colors.accent : colors.line })}
                  >
                    <Text style={{ color: replayActive && replay.isPlaying ? colors.accent : colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 }}>
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
                      style={({ pressed }) => ({ paddingHorizontal: 11, minHeight: 40, justifyContent: 'center', borderRadius: 11, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: savedBars.has(barIndex) ? colors.left : colors.line })}
                    >
                      <Text style={{ color: savedBars.has(barIndex) ? colors.left : colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 }}>
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

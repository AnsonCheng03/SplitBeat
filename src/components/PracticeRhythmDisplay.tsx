import { View, type ViewStyle } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { MixtureSymbol } from '@/components/MixtureSymbol';
import { NextPatternPreview } from '@/components/NextPatternPreview';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { ScoreBeatFocus } from '@/components/ScoreBeatFocus';
import { ScrollingScoreRhythm } from '@/components/ScrollingScoreRhythm';
import { type ScoreDisplayMode } from '@/rhythm/scoreStaff';
import { maxRhythmSymbolWidth } from '@/rhythm/noteNotation';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExerciseSettings, ExerciseStep, Hand, SessionSnapshot } from '@/types/rhythm';

export function PracticeRhythmDisplay({
  snapshot,
  settings,
  tutorialVisible,
  scoreDisplayMode,
  compact,
  width,
  height,
  topInset,
  bottomInset,
  leftInset,
  rightInset,
}: {
  snapshot: SessionSnapshot | null;
  settings: ExerciseSettings;
  tutorialVisible: boolean;
  scoreDisplayMode: ScoreDisplayMode;
  compact: boolean;
  width: number;
  height: number;
  topInset: number;
  bottomInset: number;
  leftInset: number;
  rightInset: number;
}) {
  const { colors } = useTheme();
  const singleHandMode = settings.trainingMode === 'single-hand';
  const focusedHand = settings.singleHand;
  const scoreContentMargin = Math.max(24, leftInset + 24, rightInset + 24);
  const initialScoreContentWidth = Math.max(0, width - scoreContentMargin * 2);
  const initialScoreFocusWidth = Math.min(620, initialScoreContentWidth * (singleHandMode ? 0.76 : 0.38));
  const initialScoreViewportWidth = initialScoreContentWidth;
  const notationMaxWidth = width * (singleHandMode ? 0.82 : 0.42);
  const importedScoreMeasure = snapshot?.scoreMeasure;
  const practiceScoreMeasure = settings.practiceDisplayMode === 'score' ? snapshot?.practiceScoreMeasure : undefined;
  const displayScoreMeasure = importedScoreMeasure ?? practiceScoreMeasure;
  const isScoreDisplay = Boolean(displayScoreMeasure);
  const isScoreFocusDisplay = Boolean(importedScoreMeasure && scoreDisplayMode === 'focus');
  const scoreDisplayTop = Math.max(topInset, 12) + (compact ? 46 : 58);
  const scoreDisplayHeight = compact
    ? Math.min(180, Math.max(110, height * 0.25))
    : Math.min(200, Math.max(136, height * 0.27));
  const showNextPattern = Boolean(!isScoreDisplay && snapshot?.nextStep);
  const previewTop = Math.max(topInset, 12) + (compact ? 46 : 58);
  const previewHeight = isScoreDisplay
    ? Math.min(220, Math.max(112, height * 0.25))
    : compact ? 124 : 104;
  const scoreHandToShow = singleHandMode ? focusedHand : undefined;
  const scoreHandColor = scoreHandToShow === 'left' ? colors.left : colors.right;
  const currentPatternGroupWidth = Math.min(notationMaxWidth, maxRhythmSymbolWidth('full'));
  const nextPatternGroupWidth = Math.min(notationMaxWidth, maxRhythmSymbolWidth('mini'));
  const displayScoreSequence = importedScoreMeasure
    ? snapshot?.scoreMeasureSequence ?? 0
    : snapshot?.practiceScoreSequence ?? 0;
  const displayScoreCount = importedScoreMeasure
    ? snapshot?.scoreMeasureCount ?? 1
    : snapshot?.practiceScoreCount ?? 1;
  const displayScorePreviousMeasure = importedScoreMeasure
    ? snapshot?.scorePreviousMeasure
    : snapshot?.practiceScorePreviousMeasure;
  const displayScoreNextMeasure = importedScoreMeasure
    ? snapshot?.scoreNextMeasure
    : snapshot?.practiceScoreNextMeasure;
  const displayScoreUpcomingMeasures = importedScoreMeasure
    ? snapshot?.scoreUpcomingMeasures
    : snapshot?.practiceScoreUpcomingMeasures;
  const scoreQuarterInMeasure = snapshot?.scoreQuarterInMeasure ?? 0;
  const step = snapshot?.currentStep;
  const preloadSubdivision = settings.enabledSubdivisions[0] ?? 'quarter';
  const displayStep: ExerciseStep | undefined = step ?? (tutorialVisible ? {
    id: 'notation-preload',
    leftSubdivision: preloadSubdivision,
    rightSubdivision: preloadSubdivision,
    leftRest: false,
    rightRest: false,
    startBeat: 0,
    durationBeats: 1,
  } : undefined);
  const rhythmDisplayStyle: ViewStyle = isScoreDisplay && !isScoreFocusDisplay
    ? { top: scoreDisplayTop, height: scoreDisplayHeight }
    : { top: Math.max(topInset, 12), bottom: compact ? 0 : height * 0.18 };
  const notationMaxHeight = Math.max(0, height - Math.max(0, previewTop + previewHeight) - bottomInset - 30);

  return (
    <>
      {!tutorialVisible && isScoreDisplay && !isScoreFocusDisplay && snapshot ? (
        <View
          testID="practice.scoreBackground"
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: -leftInset, right: -rightInset, height: scoreDisplayTop + scoreDisplayHeight, backgroundColor: colors.surface }}
        />
      ) : null}

      {!tutorialVisible && showNextPattern && snapshot && !snapshot.resumeCountIn ? (
        <NextPatternPreview
          step={snapshot.scoreMeasure ? null : snapshot.nextStep}
          beatsUntilChange={snapshot.beatsUntilChange}
          graceNotesEnabled={settings.graceNotesEnabled}
          restBeforeChange={settings.restBetweenChanges}
          compact={compact}
          timeSignature={settings.timeSignature}
          leftInset={leftInset}
          rightInset={rightInset}
          top={previewTop}
          height={previewHeight}
          scoreMeasure={snapshot.scoreNextMeasure}
          scoreMeasureNumber={snapshot.scoreMeasureCount && snapshot.scoreMeasureSequence !== undefined
            ? (snapshot.scoreMeasureSequence + 1) % snapshot.scoreMeasureCount + 1
            : undefined}
          scoreMeasureCount={snapshot.scoreMeasureCount}
          scoreMeasureSequence={snapshot.scoreMeasureSequence}
          scoreBeatsUntilChange={snapshot.beatsPerBar - snapshot.beatInBar}
          beamGroupQuarterNotes={pulseQuarterNotes(settings.timeSignature)}
          focusedHand={singleHandMode ? focusedHand : undefined}
          groupWidth={nextPatternGroupWidth}
          maxNoteWidth={notationMaxWidth}
          maxNoteHeight={Math.max(0, previewHeight - 8)}
        />
      ) : null}

      {(tutorialVisible || snapshot) ? (
        <View
          testID="practice.rhythmDisplay"
          pointerEvents="none"
          style={[{ position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: isScoreDisplay && !isScoreFocusDisplay ? colors.surface : 'transparent' }, rhythmDisplayStyle]}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: isScoreDisplay ? scoreContentMargin : 0 }}>
            {displayScoreMeasure ? (
              importedScoreMeasure && scoreDisplayMode === 'focus' ? (
                singleHandMode ? (
                  <ScoreBeatFocus
                    measure={importedScoreMeasure}
                    nextMeasure={snapshot?.scoreNextMeasure}
                    quarterInMeasure={scoreQuarterInMeasure}
                    beatDurationQuarter={pulseQuarterNotes(settings.timeSignature)}
                    hand={focusedHand}
                    color={colors.accent}
                    oneHand
                    compact={compact}
                    initialWidth={initialScoreFocusWidth * 0.86}
                  />
                ) : (
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    {(['left', 'right'] as const).map((hand) => (
                      <ScoreBeatFocus
                        key={hand}
                        measure={importedScoreMeasure}
                        nextMeasure={snapshot?.scoreNextMeasure}
                        quarterInMeasure={scoreQuarterInMeasure}
                        beatDurationQuarter={pulseQuarterNotes(settings.timeSignature)}
                        hand={hand}
                        color={hand === 'left' ? colors.left : colors.right}
                        oneHand={false}
                        compact={compact}
                        initialWidth={initialScoreFocusWidth}
                      />
                    ))}
                  </View>
                )
              ) : (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <ScrollingScoreRhythm
                    measure={displayScoreMeasure}
                    previousMeasure={displayScorePreviousMeasure}
                    nextMeasure={displayScoreNextMeasure ?? displayScoreMeasure}
                    upcomingMeasures={displayScoreUpcomingMeasures}
                    sequence={displayScoreSequence}
                    count={displayScoreCount}
                    compact={compact}
                    beamGroupQuarterNotes={pulseQuarterNotes(settings.timeSignature)}
                    minimal
                    showHandLabels
                    visibleHand={scoreHandToShow}
                    focusedColor={singleHandMode ? scoreHandColor : undefined}
                    initialViewportWidth={initialScoreViewportWidth}
                  />
                </View>
              )
            ) : singleHandMode && displayStep ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10 }}>
                <Text style={{ color: colors.accent, fontSize: compact ? 11 : 14, fontWeight: '900', letterSpacing: 2 }}>{focusedHand.toUpperCase()}</Text>
                <HandRhythmNote
                  hand={focusedHand}
                  step={displayStep}
                  settings={settings}
                  color={colors.accent}
                  groupWidth={currentPatternGroupWidth}
                  maxWidth={notationMaxWidth}
                  maxHeight={notationMaxHeight}
                  testID={`practice.rhythmNote.${focusedHand}.ready`}
                />
              </View>
            ) : displayStep ? (
              (['left', 'right'] as const).map((hand) => {
                const enabled = settings.trainingMode !== 'single-hand' || settings.singleHand === hand;
                return (
                  <View key={hand} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10, opacity: enabled ? 1 : 0.12 }}>
                    {enabled ? (
                      <>
                        <Text style={{ color: hand === 'left' ? colors.left : colors.right, fontSize: compact ? 11 : 14, fontWeight: '900', letterSpacing: 2 }}>{hand.toUpperCase()}</Text>
                        <HandRhythmNote
                          hand={hand}
                          step={displayStep}
                          settings={settings}
                          color={hand === 'left' ? colors.left : colors.right}
                          groupWidth={currentPatternGroupWidth}
                          maxWidth={notationMaxWidth}
                          maxHeight={notationMaxHeight}
                          testID={`practice.rhythmNote.${hand}.ready`}
                        />
                      </>
                    ) : null}
                  </View>
                );
              })
            ) : null}
          </View>
        </View>
      ) : null}
    </>
  );
}

function HandRhythmNote({
  hand,
  step,
  settings,
  color,
  groupWidth,
  maxWidth,
  maxHeight,
  testID,
}: {
  hand: Hand;
  step: ExerciseStep;
  settings: ExerciseSettings;
  color: string;
  groupWidth: number;
  maxWidth: number;
  maxHeight: number;
  testID: string;
}) {
  const subdivision = hand === 'left' ? step.leftSubdivision : step.rightSubdivision;
  const isRest = hand === 'left' ? step.leftRest : step.rightRest;
  const mixtureId = hand === 'left' ? step.leftMixture : step.rightMixture;
  const common = { color, timeSignature: settings.timeSignature, scale: 1.2, groupWidth, maxWidth, maxHeight, readyTestID: testID };

  if (mixtureId && !isRest) {
    return <MixtureSymbol mixtureId={mixtureId} color={color} scale={1.2} groupWidth={groupWidth} maxWidth={maxWidth} maxHeight={maxHeight} readyTestID={testID} />;
  }
  return <RhythmSymbol subdivision={subdivision} {...common} rest={isRest} />;
}

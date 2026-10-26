import { View, type ViewStyle } from 'react-native';
import { NextPatternPreview } from '@/components/NextPatternPreview';
import { PracticeHandRhythmDisplay } from '@/components/PracticeHandRhythmDisplay';
import { PracticeScoreDisplay } from '@/components/PracticeScoreDisplay';
import type { ScoreDisplayMode } from '@/rhythm/scoreStaff';
import { maxRhythmSymbolWidth } from '@/rhythm/noteNotation';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExerciseSettings, ExerciseStep, SessionSnapshot } from '@/types/rhythm';
import type { PracticeLayout } from '@/features/deviceLayout/practiceLayout';
import {
  PracticeRhythmDisplayStyle1,
  PracticeRhythmDisplayStyle2,
  PracticeRhythmDisplayStyle3,
} from '@/styles/practice';

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
  layout,
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
  layout: PracticeLayout;
}) {
  const { colors } = useTheme();
  const singleHandMode = settings.trainingMode === 'single-hand';
  const focusedHand = settings.singleHand;
  const scoreFrame = layout.division ? layout.leftHand : { left: 0, top: 0, width, height };
  const scoreContentMargin = Math.max(24, leftInset + 24, layout.division ? 24 : rightInset + 24);
  const initialScoreContentWidth = Math.max(0, scoreFrame.width - scoreContentMargin * 2);
  const initialScoreFocusWidth = Math.min(620, initialScoreContentWidth * (singleHandMode ? 0.76 : 0.38));
  const initialScoreViewportWidth = initialScoreContentWidth;
  const notationPaneWidth = layout.axis === 'horizontal'
    ? Math.min(layout.leftHand.width, layout.rightHand.width)
    : width;
  const notationMaxWidth = Math.min(maxRhythmSymbolWidth('full'), notationPaneWidth * 0.84);
  const importedScoreMeasure = snapshot?.scoreMeasure;
  const practiceScoreMeasure = settings.practiceDisplayMode === 'score' ? snapshot?.practiceScoreMeasure : undefined;
  const displayScoreMeasure = importedScoreMeasure ?? practiceScoreMeasure;
  const isScoreDisplay = Boolean(displayScoreMeasure);
  const isScoreFocusDisplay = Boolean(importedScoreMeasure && scoreDisplayMode === 'focus');
  const safeTopInset = Math.max(topInset, layout.safeTopInset, 12);
  const scoreDisplayTop = safeTopInset + (compact ? 46 : 58);
  const requestedScoreDisplayHeight = compact
    ? Math.min(180, Math.max(110, height * 0.25))
    : Math.min(200, Math.max(136, height * 0.27));
  const scoreDisplayHeight = layout.division
    ? Math.min(requestedScoreDisplayHeight, Math.max(0, scoreFrame.top + scoreFrame.height - scoreDisplayTop - bottomInset))
    : requestedScoreDisplayHeight;
  const showNextPattern = Boolean(!isScoreDisplay && snapshot?.nextStep);
  const previewTop = safeTopInset + (compact ? 35 : 47);
  const requestedPreviewHeight = isScoreDisplay
    ? Math.min(220, Math.max(112, layout.preview.height * 0.25))
    : compact ? 124 : 104;
  const previewHeight = Math.min(requestedPreviewHeight, Math.max(0, layout.preview.height - previewTop - bottomInset));
  const currentPatternGroupWidth = Math.min(notationMaxWidth, maxRhythmSymbolWidth('full'));
  const nextPatternGroupWidth = Math.min(layout.preview.width * 0.84, maxRhythmSymbolWidth('mini'));
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
    : layout.division
      ? { top: 0, bottom: 0 }
      : { top: safeTopInset, bottom: compact ? 0 : height * 0.18 };
  const availableNotationHeight = layout.division
    ? Math.min(layout.leftHand.height, layout.rightHand.height)
    : height - safeTopInset - (compact ? 0 : height * 0.18);
  const notationMaxHeight = Math.max(0, Math.min(availableNotationHeight, height - Math.max(0, previewTop + previewHeight) - bottomInset) - 30);

  return (
    <>
      {!tutorialVisible && isScoreDisplay && !isScoreFocusDisplay && snapshot ? (
        <View
          testID="practice.scoreBackground"
          pointerEvents="none"
          style={PracticeRhythmDisplayStyle1({ leftInset, rightInset, scoreDisplayTop, scoreDisplayHeight, colors })}
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
          frame={layout.preview}
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
          maxNoteHeight={Math.max(0, previewHeight - 8)}
        />
      ) : null}

      {(tutorialVisible || snapshot) ? (
        <View
          testID="practice.rhythmDisplay"
          pointerEvents="none"
          style={[PracticeRhythmDisplayStyle2({ isScoreDisplay, isScoreFocusDisplay, colors, layout }), rhythmDisplayStyle]}
        >
          <View style={PracticeRhythmDisplayStyle3({ isScoreDisplay, scoreContentMargin, layout })}>
            {displayScoreMeasure ? (
              <PracticeScoreDisplay
                importedMeasure={importedScoreMeasure}
                displayMeasure={displayScoreMeasure}
                snapshot={snapshot}
                settings={settings}
                scoreDisplayMode={scoreDisplayMode}
                compact={compact}
                singleHandMode={singleHandMode}
                focusedHand={focusedHand}
                focusWidth={initialScoreFocusWidth}
                viewportWidth={initialScoreViewportWidth}
              />
            ) : displayStep ? (
              <PracticeHandRhythmDisplay
                step={displayStep}
                settings={settings}
                compact={compact}
                groupWidth={currentPatternGroupWidth}
                maxWidth={notationMaxWidth}
                maxHeight={notationMaxHeight}
                layout={layout}
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </>
  );
}

import { BlurTargetView } from 'expo-blur';
import { View } from 'react-native';
import { HardwareKeyboardInput } from '@/components/HardwareKeyboardInput';
import { PracticeIntroOverlay } from '@/components/PracticeIntroOverlay';
import { PracticePauseOverlays } from '@/components/PracticePauseOverlays';
import { PracticeRhythmDisplay } from '@/components/PracticeRhythmDisplay';
import { PracticeStatusBar } from '@/components/PracticeStatusBar';
import { PracticeTapZones } from '@/components/PracticeTapZones';
import { ModeLoadingScreen } from '@/components/ModeLoadingScreen';
import { SessionEndingOverlay } from '@/components/SessionEndingOverlay';
import { usePracticeScreen } from '@/features/practice/usePracticeScreen';
import { useI18n } from '@/i18n/I18nProvider';
import { practiceStyle1, practiceStyle2, practiceStyle3, practiceStyle4 } from '@/styles/practice';

export default function PracticeScreen() {
  const { t } = useI18n();
  const {
    colors,
    width,
    height,
    insets,
    compact,
    practiceLayout,
    featureFlags,
    snapshot,
    activeSettings,
    tapFeedbackEnabled,
    blurTargetRef,
    endingVisible,
    endingResults,
    isLesson,
    endingExpected,
    endingHits,
    endingAccuracy,
    tutorialVisible,
    starting,
    pauseActionLoading,
    earlySwingWarningVisible,
    quickSettingsOpen,
    openQuickSettings,
    closeQuickSettings,
    bpmDraft,
    onBpmDraftChange,
    rewindBars,
    onRewindBarsChange,
    keyboardTapTokens,
    beatFlashToken,
    isScoreDisplay,
    isScoreFocusDisplay,
    scoreDisplayMode,
    scoreBarsRemaining,
    showNextPattern,
    changeCountdown,
    remainingLabel,
    resumeStartLabel,
    registerTap,
    updateSettings,
    stopExercise,
    handleKeyboardTap,
    openPauseMenu,
    beginExercise,
    navigateToResults,
    continueFromPause,
    restartFromPause,
    restartWithStraightFeel,
    dismissEarlySwingWarning,
    backHomeFromPause,
  } = usePracticeScreen();

  if (starting) {
    return (
      <ModeLoadingScreen
        testID="practice.preparing"
        title={t('Starting your practice…')}
        detail={t('Preparing the metronome')}
      />
    );
  }

  return (
    <View testID="practice.screen" style={practiceStyle1({ colors })}>
      {featureFlags.externalKeyboard ? <HardwareKeyboardInput onTap={handleKeyboardTap} /> : null}
      <BlurTargetView ref={blurTargetRef} collapsable={false} style={practiceStyle2()}>
        <View style={practiceStyle3()}>
          <View pointerEvents="box-none" style={practiceStyle4({ insets })}>
            <PracticeTapZones
              settings={activeSettings}
              snapshot={snapshot}
              compact={compact}
              tapFeedbackEnabled={tapFeedbackEnabled}
              scoreDisplay={isScoreDisplay && !isScoreFocusDisplay}
              layout={practiceLayout}
              beatFlashToken={beatFlashToken}
              keyboardTapTokens={keyboardTapTokens}
              onTap={registerTap}
            />
          </View>

          <PracticeRhythmDisplay
            snapshot={snapshot}
            settings={activeSettings}
            tutorialVisible={tutorialVisible}
            scoreDisplayMode={scoreDisplayMode}
            compact={compact}
            width={width}
            height={height}
            topInset={insets.top}
            bottomInset={insets.bottom}
            leftInset={insets.left}
            rightInset={insets.right}
            layout={practiceLayout}
          />

          <PracticeStatusBar
            snapshot={snapshot}
            compact={compact}
            width={width}
            topInset={insets.top}
            leftInset={insets.left}
            rightInset={insets.right}
            layout={practiceLayout}
            remainingLabel={remainingLabel}
            scoreBarsRemaining={scoreBarsRemaining}
            resumeStartLabel={resumeStartLabel}
            showNextPattern={showNextPattern}
            changeCountdown={changeCountdown}
            onPause={openPauseMenu}
          />

          {tutorialVisible ? (
            <PracticeIntroOverlay
              settings={activeSettings}
              compact={compact}
              leftInset={insets.left}
              rightInset={insets.right}
              layout={practiceLayout}
              width={width}
              bottomInset={insets.bottom}
              starting={starting}
              soundEnabled={activeSettings.soundEnabled}
              onStart={() => void beginExercise()}
            />
          ) : null}
        </View>
      </BlurTargetView>

      <PracticePauseOverlays
        snapshot={snapshot}
        settings={activeSettings}
        featureFlags={featureFlags}
        blurTarget={blurTargetRef}
        compact={compact}
        quickSettingsOpen={quickSettingsOpen}
        onOpenQuickSettings={openQuickSettings}
        onCloseQuickSettings={closeQuickSettings}
        earlySwingWarningVisible={earlySwingWarningVisible}
        pauseActionLoading={pauseActionLoading}
        bpmDraft={bpmDraft}
        onBpmChange={onBpmDraftChange}
        rewindBars={rewindBars}
        onRewindBarsChange={onRewindBarsChange}
        onSettingsChange={updateSettings}
        onResume={continueFromPause}
        onRestart={restartFromPause}
        onRestartStraight={restartWithStraightFeel}
        onDismissSwingWarning={dismissEarlySwingWarning}
        onStop={stopExercise}
        onBackHome={backHomeFromPause}
      />

      {endingVisible && endingResults ? (
        <SessionEndingOverlay
          accuracy={endingAccuracy}
          hits={endingHits}
          expected={endingExpected}
          isScore={endingResults.source === 'score'}
          isLesson={isLesson}
          onComplete={navigateToResults}
        />
      ) : null}
    </View>
  );
}

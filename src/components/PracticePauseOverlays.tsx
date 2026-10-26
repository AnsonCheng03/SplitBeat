import type { RefObject } from 'react';
import type { View as NativeView } from 'react-native';
import { LivePracticeSettings } from '@/components/LivePracticeSettings';
import { PracticeEarlySwingWarning } from '@/components/PracticeEarlySwingWarning';
import { PracticeChallengePause } from '@/components/PracticeChallengePause';
import { PausedPracticeMenu } from '@/components/PausedPracticeMenu';
import type { FeatureFlags } from '@/features/featureFlags';
import type { ExerciseSettings, SessionSnapshot } from '@/types/rhythm';

export function PracticePauseOverlays({
  snapshot,
  settings,
  featureFlags,
  blurTarget,
  compact,
  quickSettingsOpen,
  onOpenQuickSettings,
  onCloseQuickSettings,
  earlySwingWarningVisible,
  pauseActionLoading,
  bpmDraft,
  onBpmChange,
  rewindBars,
  onRewindBarsChange,
  onSettingsChange,
  onResume,
  onRestart,
  onRestartStraight,
  onDismissSwingWarning,
  onStop,
  onBackHome,
}: {
  snapshot: SessionSnapshot | null;
  settings: ExerciseSettings;
  featureFlags: FeatureFlags;
  blurTarget: RefObject<NativeView | null>;
  compact: boolean;
  quickSettingsOpen: boolean;
  onOpenQuickSettings: () => void;
  onCloseQuickSettings: () => void;
  earlySwingWarningVisible: boolean;
  pauseActionLoading: boolean;
  bpmDraft: number;
  onBpmChange: (bpm: number) => void;
  rewindBars: number;
  onRewindBarsChange: (bars: number) => void;
  onSettingsChange: (patch: Partial<ExerciseSettings>) => void;
  onResume: () => Promise<void>;
  onRestart: (barsBack: number) => Promise<void>;
  onRestartStraight: () => Promise<void>;
  onDismissSwingWarning: () => void;
  onStop: () => void;
  onBackHome: () => void;
}) {
  return (
    <>
      <PracticeEarlySwingWarning
        snapshot={snapshot}
        visible={earlySwingWarningVisible}
        actionLoading={pauseActionLoading}
        onRestartStraight={() => void onRestartStraight()}
        onDismiss={onDismissSwingWarning}
      />

      {snapshot?.phase === 'paused' && quickSettingsOpen ? (
        <LivePracticeSettings
          settings={settings}
          featureFlags={featureFlags}
          blurTarget={blurTarget}
          onSettingsChange={onSettingsChange}
          onBack={onCloseQuickSettings}
          compact={compact}
        />
      ) : null}

      <PracticeChallengePause
        snapshot={snapshot}
        quickSettingsOpen={quickSettingsOpen}
        blurTarget={blurTarget}
        compact={compact}
        onOpenQuickSettings={onOpenQuickSettings}
        onResume={() => void onResume()}
        onStop={onStop}
      />

      {!quickSettingsOpen ? (
        <PausedPracticeMenu
          snapshot={snapshot}
          blurTarget={blurTarget}
          compact={compact}
          pauseActionLoading={pauseActionLoading}
          bpmDraft={bpmDraft}
          onBpmChange={onBpmChange}
          rewindBars={rewindBars}
          onRewindBarsChange={onRewindBarsChange}
          onResume={onResume}
          onRestart={onRestart}
          onRestartStraight={onRestartStraight}
          onOpenQuickSettings={onOpenQuickSettings}
          onStop={onStop}
          onBackHome={onBackHome}
        />
      ) : null}
    </>
  );
}

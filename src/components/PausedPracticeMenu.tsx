import type { RefObject } from 'react';
import { View, type View as NativeView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PracticeOverlayBackdrop } from '@/components/PracticeOverlayBackdrop';
import { PracticePauseMenuActions } from '@/components/PracticePauseMenuActions';
import { PracticePauseMenuHeading } from '@/components/PracticePauseMenuHeading';
import { PracticeScoreRewindControl } from '@/components/PracticeScoreRewindControl';
import { PracticeSwingFeelNotice } from '@/components/PracticeSwingFeelNotice';
import { PracticeTempoControl } from '@/components/PracticeTempoControl';
import type { SessionSnapshot } from '@/types/rhythm';
import { PracticePauseOverlaysStyle18, PracticePauseOverlaysStyle64 } from '@/styles/practice';

export function PausedPracticeMenu({
  snapshot,
  blurTarget,
  compact,
  pauseActionLoading,
  bpmDraft,
  onBpmChange,
  rewindBars,
  onRewindBarsChange,
  onResume,
  onRestart,
  onRestartStraight,
  onOpenQuickSettings,
  onStop,
  onBackHome,
}: {
  snapshot: SessionSnapshot | null;
  blurTarget: RefObject<NativeView | null>;
  compact: boolean;
  pauseActionLoading: boolean;
  bpmDraft: number;
  onBpmChange: (bpm: number) => void;
  rewindBars: number;
  onRewindBarsChange: (bars: number) => void;
  onResume: () => Promise<void>;
  onRestart: (barsBack: number) => Promise<void>;
  onRestartStraight: () => Promise<void>;
  onOpenQuickSettings: () => void;
  onStop: () => void;
  onBackHome: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (snapshot?.phase !== 'paused' || snapshot.challengeMessage) return null;

  const maxRewindBars = Math.max(0, snapshot.scoreMeasure?.index ?? 0);

  return (
    <PracticeOverlayBackdrop
      testID="practice.pauseMenu"
      blurTarget={blurTarget}
      contentStyle={PracticePauseOverlaysStyle64({ insets })}
    >
      <View style={PracticePauseOverlaysStyle18({ compact })}>
        <PracticePauseMenuHeading bpm={bpmDraft} compact={compact} />
        <PracticeSwingFeelNotice
          snapshot={snapshot}
          actionLoading={pauseActionLoading}
          onRestartStraight={onRestartStraight}
        />
        <PracticeScoreRewindControl
          snapshot={snapshot}
          compact={compact}
          actionLoading={pauseActionLoading}
          rewindBars={rewindBars}
          maxRewindBars={maxRewindBars}
          onRewindBarsChange={onRewindBarsChange}
          onRestart={onRestart}
        />
        <PracticeTempoControl
          snapshot={snapshot}
          compact={compact}
          actionLoading={pauseActionLoading}
          bpm={bpmDraft}
          onBpmChange={onBpmChange}
          onApply={() => onRestart(0)}
        />
        <PracticePauseMenuActions
          compact={compact}
          actionLoading={pauseActionLoading}
          onResume={onResume}
          onOpenQuickSettings={onOpenQuickSettings}
          onStop={onStop}
          onBackHome={onBackHome}
        />
      </View>
    </PracticeOverlayBackdrop>
  );
}

import type { RefObject } from 'react';
import Slider from '@react-native-community/slider';
import { Pressable, View, type View as NativeView } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LivePracticeSettings } from '@/components/LivePracticeSettings';
import { PracticeOverlayBackdrop } from '@/components/PracticeOverlayBackdrop';
import type { FeatureFlags } from '@/features/featureFlags';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExerciseSettings, SessionSnapshot } from '@/types/rhythm';
import { PracticePauseOverlaysStyle1,
  PracticePauseOverlaysStyle2,
  PracticePauseOverlaysStyle3,
  PracticePauseOverlaysStyle4,
  PracticePauseOverlaysStyle5,
  PracticePauseOverlaysStyle6,
  PracticePauseOverlaysStyle7,
  PracticePauseOverlaysStyle8,
  PracticePauseOverlaysStyle9,
  PracticePauseOverlaysStyle10,
  PracticePauseOverlaysStyle11,
  PracticePauseOverlaysStyle12,
  PracticePauseOverlaysStyle13,
  PracticePauseOverlaysStyle14,
  PracticePauseOverlaysStyle15,
  PracticePauseOverlaysStyle16,
  PracticePauseOverlaysStyle17,
  PracticePauseOverlaysStyle18,
  PracticePauseOverlaysStyle19,
  PracticePauseOverlaysStyle20,
  PracticePauseOverlaysStyle21,
  PracticePauseOverlaysStyle22,
  PracticePauseOverlaysStyle23,
  PracticePauseOverlaysStyle24,
  PracticePauseOverlaysStyle25,
  PracticePauseOverlaysStyle26,
  PracticePauseOverlaysStyle27,
  PracticePauseOverlaysStyle28,
  PracticePauseOverlaysStyle29,
  PracticePauseOverlaysStyle30,
  PracticePauseOverlaysStyle31,
  PracticePauseOverlaysStyle32,
  PracticePauseOverlaysStyle33,
  PracticePauseOverlaysStyle34,
  PracticePauseOverlaysStyle35,
  PracticePauseOverlaysStyle36,
  PracticePauseOverlaysStyle37,
  PracticePauseOverlaysStyle38,
  PracticePauseOverlaysStyle39,
  PracticePauseOverlaysStyle40,
  PracticePauseOverlaysStyle41,
  PracticePauseOverlaysStyle42,
  PracticePauseOverlaysStyle43,
  PracticePauseOverlaysStyle44,
  PracticePauseOverlaysStyle45,
  PracticePauseOverlaysStyle46,
  PracticePauseOverlaysStyle47,
  PracticePauseOverlaysStyle48,
  PracticePauseOverlaysStyle49,
  PracticePauseOverlaysStyle50,
  PracticePauseOverlaysStyle51,
  PracticePauseOverlaysStyle52,
  PracticePauseOverlaysStyle53,
  PracticePauseOverlaysStyle54,
  PracticePauseOverlaysStyle55,
  PracticePauseOverlaysStyle56,
  PracticePauseOverlaysStyle57,
  PracticePauseOverlaysStyle58,
  PracticePauseOverlaysStyle59,
  PracticePauseOverlaysStyle60,
  PracticePauseOverlaysStyle61,
  PracticePauseOverlaysStyle62, PracticePauseOverlaysStyle63, PracticePauseOverlaysStyle64 } from '@/styles/practice';

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
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const maxRewindBars = Math.max(0, snapshot?.scoreMeasure?.index ?? 0);
  return <>
    {earlySwingWarningVisible && snapshot?.phase === 'running' && snapshot.swingFeelMismatch?.likelyStraight && snapshot.swingFeelMismatch.latestBarIndex <= 3 ? (
      <View pointerEvents="box-none" style={PracticePauseOverlaysStyle1({ insets })}>
        <View testID="practice.swingFeel.earlyWarning" style={PracticePauseOverlaysStyle2({ colors })}>
          <Text style={PracticePauseOverlaysStyle3({ colors })}>
        {t('Your taps are lining up with straight timing, while this exercise is set to swing.')}
          </Text>
          <View style={PracticePauseOverlaysStyle4()}>
        <Pressable testID="practice.swingFeel.restartStraight" accessibilityRole="button" disabled={pauseActionLoading} onPress={() => void onRestartStraight()} style={PracticePauseOverlaysStyle5({ colors, pauseActionLoading })}>
          <Text style={PracticePauseOverlaysStyle6({ colors })}>{t('RESTART AS STRAIGHT')}</Text>
        </Pressable>
        <Pressable testID="practice.swingFeel.keepSwing" accessibilityRole="button" onPress={onDismissSwingWarning} style={PracticePauseOverlaysStyle7()}>
          <Text style={PracticePauseOverlaysStyle8({ colors })}>{t('KEEP PLAYING SWING')}</Text>
        </Pressable>
          </View>
        </View>
      </View>
    ) : null}

    {snapshot?.phase === 'paused' && quickSettingsOpen ? (
      <LivePracticeSettings
        settings={settings}
        featureFlags={featureFlags}
        blurTarget={blurTarget}
        onSettingsChange={onSettingsChange}
        onBack={() => onCloseQuickSettings()}
        compact={compact}
      />
    ) : null}

    {snapshot?.phase === 'paused' && snapshot.challengeMessage && !quickSettingsOpen ? (
      <PracticeOverlayBackdrop
        testID="practice.challengePause"
        blurTarget={blurTarget}
        contentStyle={PracticePauseOverlaysStyle63({ insets })}
      >
        <View style={PracticePauseOverlaysStyle9({ compact })}>
          <Text style={PracticePauseOverlaysStyle10({ colors, compact })}>
        CHALLENGE PAUSE
          </Text>
          <Text style={PracticePauseOverlaysStyle11({ colors, compact })}>
        {snapshot.challengeMessage ?? 'Take a breath, then continue when you are ready.'}
          </Text>
          <Pressable
        testID="practice.challengeLiveSettings"
        accessibilityRole="button"
        onPress={() => onOpenQuickSettings()}
        style={PracticePauseOverlaysStyle12()}
          >
        <Text style={PracticePauseOverlaysStyle13({ colors })}>LIVE SETTINGS</Text>
          </Pressable>
          <Pressable testID="practice.challengeResume" accessibilityRole="button" onPress={() => void onResume()} style={PracticePauseOverlaysStyle14({ colors })}>
        <Text style={PracticePauseOverlaysStyle15({ colors })}>CONTINUE</Text>
          </Pressable>
          <Pressable testID="practice.challengeEnd" accessibilityRole="button" onPress={onStop} style={PracticePauseOverlaysStyle16()}>
        <Text style={PracticePauseOverlaysStyle17({ colors })}>END SESSION</Text>
          </Pressable>
        </View>
      </PracticeOverlayBackdrop>
    ) : null}

    {snapshot?.phase === 'paused' && !snapshot.challengeMessage && !quickSettingsOpen ? (
      <PracticeOverlayBackdrop
        testID="practice.pauseMenu"
        blurTarget={blurTarget}
        contentStyle={PracticePauseOverlaysStyle64({ insets })}
      >
        <View style={PracticePauseOverlaysStyle18({ compact })}>
          <View style={PracticePauseOverlaysStyle19({ compact })}>
        <Text style={PracticePauseOverlaysStyle20({ colors, compact })}>PAUSED</Text>
        <Text style={PracticePauseOverlaysStyle21({ colors, compact })}>{bpmDraft} BPM</Text>
          </View>

          {snapshot.swingFeelMismatch?.likelyStraight ? (
        <View testID="practice.pause.swingFeelWarning" style={PracticePauseOverlaysStyle22({ colors })}>
          <Text style={PracticePauseOverlaysStyle23({ colors })}>
            {t('Your taps are lining up with straight timing, while this exercise is set to swing.')}
          </Text>
          {snapshot.swingFeelMismatch.latestBarIndex <= 3 ? (
            <Pressable testID="practice.pause.restartStraight" accessibilityRole="button" disabled={pauseActionLoading} onPress={() => void onRestartStraight()} style={PracticePauseOverlaysStyle24({ colors, pauseActionLoading })}>
              <Text style={PracticePauseOverlaysStyle25({ colors })}>{t('RESTART AS STRAIGHT')}</Text>
            </Pressable>
          ) : (
            <Text style={PracticePauseOverlaysStyle26({ colors })}>{t('You can count this session as straight on the results page.')}</Text>
          )}
        </View>
          ) : null}

          {snapshot.scoreMeasureCount !== undefined ? (
        <View style={PracticePauseOverlaysStyle27({ compact })}>
          <View style={PracticePauseOverlaysStyle28()}>
            <Text style={PracticePauseOverlaysStyle29({ colors, compact })}>REWIND SCORE</Text>
            <Text style={PracticePauseOverlaysStyle30({ colors, compact })}>{maxRewindBars} {maxRewindBars === 1 ? 'BAR' : 'BARS'} AVAILABLE</Text>
          </View>
          <View style={PracticePauseOverlaysStyle31({ compact })}>
            <Pressable
              testID="practice.pause.rewindMinus"
              accessibilityRole="button"
              accessibilityLabel={t('Rewind one fewer bar')}
              disabled={maxRewindBars === 0 || rewindBars <= 1}
              onPress={() => onRewindBarsChange(Math.max(1, rewindBars - 1))}
              style={PracticePauseOverlaysStyle32({ compact, colors, maxRewindBars, rewindBars })}
            >
              <Text style={PracticePauseOverlaysStyle33({ colors })}>−</Text>
            </Pressable>
            <Text testID="practice.pause.rewindCount" style={PracticePauseOverlaysStyle34({ colors, compact })}>
              {rewindBars} {rewindBars === 1 ? 'BAR' : 'BARS'} BACK
            </Text>
            <Pressable
              testID="practice.pause.rewindPlus"
              accessibilityRole="button"
              accessibilityLabel={t('Rewind one more bar')}
              disabled={maxRewindBars === 0 || rewindBars >= maxRewindBars}
              onPress={() => onRewindBarsChange(Math.min(maxRewindBars, rewindBars + 1))}
              style={PracticePauseOverlaysStyle35({ compact, colors, maxRewindBars, rewindBars })}
            >
              <Text style={PracticePauseOverlaysStyle36({ colors })}>+</Text>
            </Pressable>
            <Pressable
              testID="practice.pause.rewind"
              accessibilityRole="button"
              disabled={maxRewindBars === 0 || pauseActionLoading}
              onPress={() => void onRestart(rewindBars)}
              style={PracticePauseOverlaysStyle37({ compact, colors, maxRewindBars, pauseActionLoading })}
            >
              <Text style={PracticePauseOverlaysStyle38({ colors, compact })}>REWIND</Text>
            </Pressable>
          </View>
          <Text style={PracticePauseOverlaysStyle39({ colors, compact })}>Rewind starts a fresh run from the selected bar.</Text>
        </View>
          ) : null}

          <View style={PracticePauseOverlaysStyle40({ compact })}>
        <View style={PracticePauseOverlaysStyle41()}>
          <Text style={PracticePauseOverlaysStyle42({ colors, compact })}>TEMPO</Text>
          <Text style={PracticePauseOverlaysStyle43({ colors, compact })}>{bpmDraft} BPM</Text>
        </View>
        <View style={PracticePauseOverlaysStyle44({ compact })}>
          <Pressable testID="practice.pause.bpmMinus" accessibilityRole="button" accessibilityLabel={t('Decrease tempo')} disabled={bpmDraft <= 40} onPress={() => onBpmChange(Math.max(40, bpmDraft - 1))} style={PracticePauseOverlaysStyle45({ colors, bpmDraft })}>
            <Text style={PracticePauseOverlaysStyle46({ colors })}>−</Text>
          </Pressable>
          <Slider
            testID="practice.pause.bpmSlider"
            accessibilityLabel={t('Practice tempo')}
            style={PracticePauseOverlaysStyle47()}
            minimumValue={40}
            maximumValue={200}
            step={1}
            value={bpmDraft}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.line}
            thumbTintColor={colors.text}
            onValueChange={onBpmChange}
          />
          <Pressable testID="practice.pause.bpmPlus" accessibilityRole="button" accessibilityLabel={t('Increase tempo')} disabled={bpmDraft >= 200} onPress={() => onBpmChange(Math.min(200, bpmDraft + 1))} style={PracticePauseOverlaysStyle48({ colors, bpmDraft })}>
            <Text style={PracticePauseOverlaysStyle49({ colors })}>+</Text>
          </Pressable>
        </View>
        <Text style={PracticePauseOverlaysStyle50({ colors, compact })}>
          Applying a tempo starts play over, or restarts a score from this bar.
        </Text>
        {bpmDraft !== snapshot.bpm ? (
          <Pressable
            testID="practice.pause.applyBpm"
            accessibilityRole="button"
            disabled={pauseActionLoading}
            onPress={() => void onRestart(0)}
            style={PracticePauseOverlaysStyle51({ compact, colors, pauseActionLoading })}
          >
            <Text style={PracticePauseOverlaysStyle52({ colors, compact })}>APPLY BPM</Text>
          </Pressable>
        ) : null}
          </View>

          <View style={PracticePauseOverlaysStyle53({ compact })}>
        <Pressable
          testID="practice.pause.continue"
          accessibilityRole="button"
          disabled={pauseActionLoading}
          onPress={() => void onResume()}
          style={PracticePauseOverlaysStyle54({ compact, colors, pauseActionLoading })}
        >
          <Text style={PracticePauseOverlaysStyle55({ colors, compact })}>CONTINUE</Text>
        </Pressable>
        <Pressable
          testID="practice.pause.liveSettings"
          accessibilityRole="button"
          onPress={() => onOpenQuickSettings()}
          style={PracticePauseOverlaysStyle56({ compact })}
        >
          <Text style={PracticePauseOverlaysStyle57({ colors, compact })}>LIVE SETTINGS</Text>
        </Pressable>
          </View>
          <View style={PracticePauseOverlaysStyle58({ compact })}>
        <Pressable testID="practice.pause.finish" accessibilityRole="button" onPress={onStop} style={PracticePauseOverlaysStyle59()}>
          <Text style={PracticePauseOverlaysStyle60({ colors, compact })}>END SESSION</Text>
        </Pressable>
        <Pressable testID="practice.pause.home" accessibilityRole="button" onPress={onBackHome} style={PracticePauseOverlaysStyle61()}>
          <Text style={PracticePauseOverlaysStyle62({ colors, compact })}>BACK HOME</Text>
        </Pressable>
          </View>
        </View>
      </PracticeOverlayBackdrop>
    ) : null}

  </>;
}

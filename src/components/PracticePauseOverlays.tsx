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
      <View pointerEvents="box-none" style={{ position: 'absolute', top: Math.max(insets.top + 52, 58), left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 }}>
        <View testID="practice.swingFeel.earlyWarning" style={{ width: '100%', maxWidth: 520, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent }}>
          <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'center' }}>
        {t('Your taps are lining up with straight timing, while this exercise is set to swing.')}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8 }}>
        <Pressable testID="practice.swingFeel.restartStraight" accessibilityRole="button" disabled={pauseActionLoading} onPress={() => void onRestartStraight()} style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.accent, opacity: pauseActionLoading ? 0.5 : 1 }}>
          <Text style={{ color: colors.background, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }}>{t('RESTART AS STRAIGHT')}</Text>
        </Pressable>
        <Pressable testID="practice.swingFeel.keepSwing" accessibilityRole="button" onPress={onDismissSwingWarning} style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: 12 }}>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }}>{t('KEEP PLAYING SWING')}</Text>
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
        contentStyle={{ paddingHorizontal: Math.max(24, insets.left + 24, insets.right + 24), paddingVertical: Math.max(12, insets.top + 8, insets.bottom + 8) }}
      >
        <View style={{ width: '100%', maxWidth: 460, alignItems: 'center', paddingHorizontal: compact ? 8 : 16 }}>
          <Text style={{ color: colors.accent, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.6 }}>
        CHALLENGE PAUSE
          </Text>
          <Text style={{ color: colors.text, fontSize: compact ? 17 : 22, lineHeight: compact ? 23 : 29, fontWeight: '800', textAlign: 'center', marginTop: 10 }}>
        {snapshot.challengeMessage ?? 'Take a breath, then continue when you are ready.'}
          </Text>
          <Pressable
        testID="practice.challengeLiveSettings"
        accessibilityRole="button"
        onPress={() => onOpenQuickSettings()}
        style={{ minHeight: 46, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginTop: 14 }}
          >
        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 }}>LIVE SETTINGS</Text>
          </Pressable>
          <Pressable testID="practice.challengeResume" accessibilityRole="button" onPress={() => void onResume()} style={{ minHeight: 54, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginTop: 20, borderRadius: 14, backgroundColor: colors.accent }}>
        <Text style={{ color: colors.background, fontSize: 14, fontWeight: '900', letterSpacing: 1.1 }}>CONTINUE</Text>
          </Pressable>
          <Pressable testID="practice.challengeEnd" accessibilityRole="button" onPress={onStop} style={{ minHeight: 44, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '900', letterSpacing: 1 }}>END SESSION</Text>
          </Pressable>
        </View>
      </PracticeOverlayBackdrop>
    ) : null}

    {snapshot?.phase === 'paused' && !snapshot.challengeMessage && !quickSettingsOpen ? (
      <PracticeOverlayBackdrop
        testID="practice.pauseMenu"
        blurTarget={blurTarget}
        contentStyle={{ paddingHorizontal: Math.max(16, insets.left + 16, insets.right + 16), paddingVertical: Math.max(10, insets.top + 8, insets.bottom + 8) }}
      >
        <View style={{ width: '100%', maxWidth: 700, paddingHorizontal: compact ? 8 : 20, paddingVertical: compact ? 4 : 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? 8 : 12 }}>
        <Text style={{ color: colors.text, fontSize: compact ? 18 : 22, fontWeight: '900', letterSpacing: 1 }}>PAUSED</Text>
        <Text style={{ color: colors.accent, fontSize: compact ? 13 : 16, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{bpmDraft} BPM</Text>
          </View>

          {snapshot.swingFeelMismatch?.likelyStraight ? (
        <View testID="practice.pause.swingFeelWarning" style={{ paddingHorizontal: 13, paddingVertical: 10, marginBottom: 7, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent }}>
          <Text style={{ color: colors.text, fontSize: 11, lineHeight: 16, fontWeight: '700' }}>
            {t('Your taps are lining up with straight timing, while this exercise is set to swing.')}
          </Text>
          {snapshot.swingFeelMismatch.latestBarIndex <= 3 ? (
            <Pressable testID="practice.pause.restartStraight" accessibilityRole="button" disabled={pauseActionLoading} onPress={() => void onRestartStraight()} style={{ minHeight: 36, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 5, paddingHorizontal: 10, borderRadius: 9, backgroundColor: colors.accent, opacity: pauseActionLoading ? 0.5 : 1 }}>
              <Text style={{ color: colors.background, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>{t('RESTART AS STRAIGHT')}</Text>
            </Pressable>
          ) : (
            <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 }}>{t('You can count this session as straight on the results page.')}</Text>
          )}
        </View>
          ) : null}

          {snapshot.scoreMeasureCount !== undefined ? (
        <View style={{ paddingVertical: compact ? 7 : 10, marginBottom: compact ? 8 : 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 1.2 }}>REWIND SCORE</Text>
            <Text style={{ color: colors.dim, fontSize: compact ? 9 : 10 }}>{maxRewindBars} {maxRewindBars === 1 ? 'BAR' : 'BARS'} AVAILABLE</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: compact ? 6 : 9 }}>
            <Pressable
              testID="practice.pause.rewindMinus"
              accessibilityRole="button"
              accessibilityLabel={t('Rewind one fewer bar')}
              disabled={maxRewindBars === 0 || rewindBars <= 1}
              onPress={() => onRewindBarsChange(Math.max(1, rewindBars - 1))}
              style={{ width: 40, height: compact ? 34 : 40, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: maxRewindBars === 0 || rewindBars <= 1 ? 0.4 : 1 }}
            >
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>−</Text>
            </Pressable>
            <Text testID="practice.pause.rewindCount" style={{ minWidth: 84, color: colors.text, fontSize: compact ? 12 : 14, fontWeight: '900', textAlign: 'center' }}>
              {rewindBars} {rewindBars === 1 ? 'BAR' : 'BARS'} BACK
            </Text>
            <Pressable
              testID="practice.pause.rewindPlus"
              accessibilityRole="button"
              accessibilityLabel={t('Rewind one more bar')}
              disabled={maxRewindBars === 0 || rewindBars >= maxRewindBars}
              onPress={() => onRewindBarsChange(Math.min(maxRewindBars, rewindBars + 1))}
              style={{ width: 40, height: compact ? 34 : 40, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: maxRewindBars === 0 || rewindBars >= maxRewindBars ? 0.4 : 1 }}
            >
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>+</Text>
            </Pressable>
            <Pressable
              testID="practice.pause.rewind"
              accessibilityRole="button"
              disabled={maxRewindBars === 0 || pauseActionLoading}
              onPress={() => void onRestart(rewindBars)}
              style={{ flex: 1, minHeight: compact ? 36 : 42, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: maxRewindBars === 0 || pauseActionLoading ? 0.4 : 1 }}
            >
              <Text style={{ color: colors.background, fontSize: compact ? 10 : 11, fontWeight: '900', letterSpacing: 0.8 }}>REWIND</Text>
            </Pressable>
          </View>
          <Text style={{ color: colors.dim, fontSize: compact ? 8 : 9, marginTop: 5 }}>Rewind starts a fresh run from the selected bar.</Text>
        </View>
          ) : null}

          <View style={{ paddingVertical: compact ? 7 : 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 1.2 }}>TEMPO</Text>
          <Text style={{ color: colors.text, fontSize: compact ? 15 : 18, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{bpmDraft} BPM</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: compact ? 2 : 5 }}>
          <Pressable testID="practice.pause.bpmMinus" accessibilityRole="button" accessibilityLabel={t('Decrease tempo')} disabled={bpmDraft <= 40} onPress={() => onBpmChange(Math.max(40, bpmDraft - 1))} style={{ width: 36, height: 34, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: bpmDraft <= 40 ? 0.4 : 1 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>−</Text>
          </Pressable>
          <Slider
            testID="practice.pause.bpmSlider"
            accessibilityLabel={t('Practice tempo')}
            style={{ flex: 1, height: 34 }}
            minimumValue={40}
            maximumValue={200}
            step={1}
            value={bpmDraft}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.line}
            thumbTintColor={colors.text}
            onValueChange={onBpmChange}
          />
          <Pressable testID="practice.pause.bpmPlus" accessibilityRole="button" accessibilityLabel={t('Increase tempo')} disabled={bpmDraft >= 200} onPress={() => onBpmChange(Math.min(200, bpmDraft + 1))} style={{ width: 36, height: 34, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: bpmDraft >= 200 ? 0.4 : 1 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>+</Text>
          </Pressable>
        </View>
        <Text style={{ color: colors.dim, fontSize: compact ? 8 : 9, marginTop: 2 }}>
          Applying a tempo starts play over, or restarts a score from this bar.
        </Text>
        {bpmDraft !== snapshot.bpm ? (
          <Pressable
            testID="practice.pause.applyBpm"
            accessibilityRole="button"
            disabled={pauseActionLoading}
            onPress={() => void onRestart(0)}
            style={{ alignSelf: 'flex-end', minHeight: compact ? 34 : 40, justifyContent: 'center', paddingHorizontal: 15, marginTop: 5, borderRadius: 10, backgroundColor: colors.accent, opacity: pauseActionLoading ? 0.5 : 1 }}
          >
            <Text style={{ color: colors.background, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.8 }}>APPLY BPM</Text>
          </Pressable>
        ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 9, marginTop: compact ? 8 : 12 }}>
        <Pressable
          testID="practice.pause.continue"
          accessibilityRole="button"
          disabled={pauseActionLoading}
          onPress={() => void onResume()}
          style={{ flex: 1, minHeight: compact ? 42 : 50, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: pauseActionLoading ? 0.5 : 1 }}
        >
          <Text style={{ color: colors.background, fontSize: compact ? 11 : 13, fontWeight: '900', letterSpacing: 1 }}>CONTINUE</Text>
        </Pressable>
        <Pressable
          testID="practice.pause.liveSettings"
          accessibilityRole="button"
          onPress={() => onOpenQuickSettings()}
          style={{ flex: 1, minHeight: compact ? 42 : 50, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: colors.text, fontSize: compact ? 10 : 12, fontWeight: '900', letterSpacing: 0.8 }}>LIVE SETTINGS</Text>
        </Pressable>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: compact ? 2 : 5 }}>
        <Pressable testID="practice.pause.finish" accessibilityRole="button" onPress={onStop} style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: 8 }}>
          <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.8 }}>END SESSION</Text>
        </Pressable>
        <Pressable testID="practice.pause.home" accessibilityRole="button" onPress={onBackHome} style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: 8 }}>
          <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.8 }}>BACK HOME</Text>
        </Pressable>
          </View>
        </View>
      </PracticeOverlayBackdrop>
    ) : null}

  </>;
}

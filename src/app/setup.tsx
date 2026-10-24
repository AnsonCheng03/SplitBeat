import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { AudioStartButton } from '@/components/AudioStartButton';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsPage } from '@/components/SettingsPage';
import { useRhythmSession } from '@/store/sessionStore';
import type { DurationOption } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';

const durations: { label: string; value: DurationOption }[] = [
  { label: '30 sec', value: 30 },
  { label: '60 sec', value: 60 },
  { label: '2 min', value: 120 },
  { label: 'Endless', value: 'endless' },
];

export default function SetupScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings, audioStatus, prepareExercise } = useRhythmSession();
  const { t } = useI18n();
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  const start = async () => {
    if (starting || audioStatus === 'loading') return;
    setStarting(true);
    try {
      await prepareExercise();
      router.replace('/practice');
    } catch {
      Alert.alert(t('Audio could not start'), t('Check your device audio settings and try again.'));
    } finally {
      setStarting(false);
    }
  };

  return (
    <SettingsPage
      testID="setup.screen"
      backTestID="setup.home"
      section="session"
      title="Set your pace"
      description="Choose a tempo and how long you want to play."
      footer={(
        <View style={{ paddingHorizontal: 28, paddingTop: 9, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.background }}>
          <AudioStartButton
            testID="setup.start"
            variant="wide"
            status={starting ? 'loading' : audioStatus}
            disabled={starting || audioStatus === 'loading'}
            onPress={() => void start()}
            accessibilityLabel={
              audioStatus === 'error'
                ? 'Retry audio setup before starting exercise'
                : audioStatus === 'ready'
                  ? 'Start exercise'
                  : 'Loading audio engine'
            }
            title={starting ? 'STARTING SESSION…' : audioStatus === 'ready' ? 'START PRACTICE' : audioStatus === 'error' ? 'RETRY AUDIO SETUP' : 'PREPARING AUDIO…'}
            subtitle={audioStatus === 'ready' ? 'Tap to begin your session' : audioStatus === 'error' ? 'Check audio setup and tap to retry' : 'Preparing the metronome and hand sounds'}
          />
        </View>
      )}
    >
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 18, marginTop: 22 }}>
        <View style={{ flex: 1.25, minWidth: 0, backgroundColor: colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 11, letterSpacing: 1.1 }}>TEMPO</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
              <Text style={{ color: colors.text, fontSize: 36, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{settings.bpm}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '800' }}>BPM</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <Pressable
              testID="setup.tempo.decrease"
              accessibilityRole="button"
              accessibilityLabel={t('Decrease tempo')}
              onPress={() => updateSettings({ bpm: Math.max(40, settings.bpm - 1) })}
              style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: colors.text, fontSize: 23 }}>−</Text>
            </Pressable>
            <Slider
              testID="setup.tempo.slider"
              style={{ flex: 1, height: 48 }}
              minimumValue={40}
              maximumValue={200}
              step={1}
              value={settings.bpm}
              onValueChange={(bpm) => updateSettings({ bpm })}
              minimumTrackTintColor={colors.left}
              maximumTrackTintColor={colors.line}
              thumbTintColor={colors.text}
            />
            <Pressable
              testID="setup.tempo.increase"
              accessibilityRole="button"
              accessibilityLabel={t('Increase tempo')}
              onPress={() => updateSettings({ bpm: Math.min(200, settings.bpm + 1) })}
              style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: colors.text, fontSize: 23 }}>+</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 52 }}>
            <Text style={{ color: colors.dim, fontSize: 10 }}>40 BPM</Text>
            <Text style={{ color: colors.dim, fontSize: 10 }}>200 BPM</Text>
          </View>
        </View>

        <View style={{ flex: 1, minWidth: 0, backgroundColor: colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.line }}>
          <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 11, letterSpacing: 1.1, marginBottom: 16 }}>SESSION LENGTH</Text>
          <SettingsChoiceRow
            options={durations}
            value={settings.durationSeconds}
            onChange={(durationSeconds) => updateSettings({ durationSeconds })}
            testIDPrefix="setup.duration"
          />
        </View>
      </View>
    </SettingsPage>
  );
}

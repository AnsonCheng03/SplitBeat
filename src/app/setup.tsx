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
import {
  setupStyle1,
  setupStyle2,
  setupStyle3,
  setupStyle4,
  setupStyle5,
  setupStyle6,
  setupStyle7,
  setupStyle8,
  setupStyle9,
  setupStyle10,
  setupStyle11,
  setupStyle12,
  setupStyle13,
  setupStyle14,
  setupStyle15,
  setupStyle16,
  setupStyle17,
  setupStyle18,
  setupStyle19
} from '@/styles/exercise';

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
        <View style={setupStyle1({ colors })}>
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
      <View style={setupStyle2()}>
        <View style={setupStyle3({ colors })}>
          <View style={setupStyle4()}>
            <Text style={setupStyle5({ colors })}>TEMPO</Text>
            <View style={setupStyle6()}>
              <Text style={setupStyle7({ colors })}>{settings.bpm}</Text>
              <Text style={setupStyle8({ colors })}>BPM</Text>
            </View>
          </View>
          <View style={setupStyle9()}>
            <Pressable
              testID="setup.tempo.decrease"
              accessibilityRole="button"
              accessibilityLabel={t('Decrease tempo')}
              onPress={() => updateSettings({ bpm: Math.max(40, settings.bpm - 1) })}
              style={setupStyle10({ colors })}
            >
              <Text style={setupStyle11({ colors })}>−</Text>
            </Pressable>
            <Slider
              testID="setup.tempo.slider"
              style={setupStyle12()}
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
              style={setupStyle13({ colors })}
            >
              <Text style={setupStyle14({ colors })}>+</Text>
            </Pressable>
          </View>
          <View style={setupStyle15()}>
            <Text style={setupStyle16({ colors })}>40 BPM</Text>
            <Text style={setupStyle17({ colors })}>200 BPM</Text>
          </View>
        </View>

        <View style={setupStyle18({ colors })}>
          <Text style={setupStyle19({ colors })}>SESSION LENGTH</Text>
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

import Slider from '@react-native-community/slider';
import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { AudioStartButton } from '@/components/AudioStartButton';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsPage } from '@/components/SettingsPage';
import { ResetAllSettingsButton } from '@/components/ResetAllSettingsButton';
import { TutorialReplayCard } from '@/components/TutorialReplayCard';
import { TapTempoCounter } from '@/components/TapTempoCounter';
import { useSetupScreen } from '@/features/setup/useSetupScreen';
import {
  setupStyle1,
  setupStyle2,
  setupStyle3,
  setupStyle4,
  setupStyle5,
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
  setupStyle19,
} from '@/styles/exercise';
import { tapTempoHintStyle } from '@/styles/tempo';

export default function SetupScreen() {
  const {
    colors,
    t,
    settings,
    audioStatus,
    starting,
    durations,
    onStartPractice,
    onDecreaseTempo,
    onIncreaseTempo,
    onTempoChange,
    onTempoTap,
    onDurationChange,
    startAccessibilityLabel,
    startTitle,
    startSubtitle,
  } = useSetupScreen();

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
            onPress={() => void onStartPractice()}
            accessibilityLabel={startAccessibilityLabel}
            title={startTitle}
            subtitle={startSubtitle}
          />
        </View>
      )}
    >
      <View style={setupStyle2()}>
        <View style={setupStyle3({ colors })}>
          <View style={setupStyle4()}>
            <Text style={setupStyle5({ colors })}>TEMPO</Text>
            <TapTempoCounter bpm={settings.bpm} onTap={onTempoTap} testID="setup.tempo.tap" />
          </View>
          <Text style={tapTempoHintStyle({ colors, compact: false })}>
            {t('Tap the BPM number in time with the beat to set tempo. The last five seconds are averaged.')}
          </Text>
          <View style={setupStyle9()}>
            <Pressable
              testID="setup.tempo.decrease"
              accessibilityRole="button"
              accessibilityLabel={t('Decrease tempo')}
              onPress={onDecreaseTempo}
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
              onValueChange={onTempoChange}
              minimumTrackTintColor={colors.left}
              maximumTrackTintColor={colors.line}
              thumbTintColor={colors.text}
            />
            <Pressable
              testID="setup.tempo.increase"
              accessibilityRole="button"
              accessibilityLabel={t('Increase tempo')}
              onPress={onIncreaseTempo}
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
            onChange={onDurationChange}
            testIDPrefix="setup.duration"
          />
        </View>
      </View>
      <TutorialReplayCard />
      <ResetAllSettingsButton />
    </SettingsPage>
  );
}

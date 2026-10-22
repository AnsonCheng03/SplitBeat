import Slider from '@react-native-community/slider';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioStartButton } from '@/components/AudioStartButton';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { useRhythmSession } from '@/store/sessionStore';
import type { DurationOption } from '@/types/rhythm';
import { colors } from '@/theme';

const durations: { label: string; value: DurationOption }[] = [
  { label: '30 sec', value: 30 },
  { label: '60 sec', value: 60 },
  { label: '2 min', value: 120 },
  { label: 'Endless', value: 'endless' },
];

export default function SetupScreen() {
  const { settings, updateSettings, audioStatus, prepareAudio, startExercise } = useRhythmSession();
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  const start = async () => {
    if (starting || audioStatus === 'loading') return;
    setStarting(true);
    try {
      if (audioStatus === 'error') await prepareAudio();
      await startExercise();
      router.replace('/practice');
    } catch {
      Alert.alert('Audio could not start', 'Check your device audio settings and try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <SafeAreaView testID="setup.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingTop: 10,
            paddingBottom: 112,
            maxWidth: 720,
            width: '100%',
            alignSelf: 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Link href="/" asChild>
              <Pressable hitSlop={12}>
                <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.6 }}>
                  ‹  HOME
                </Text>
              </Pressable>
            </Link>
            <Text style={{ color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }}>
              SESSION SETTINGS
            </Text>
          </View>

          <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 }}>
            Set your pace.
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 5, marginBottom: 20 }}>
            Start with the basics. Fine-tune the rest only if you need it.
          </Text>

          <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.line }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 11, letterSpacing: 1.1 }}>TEMPO</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                <Text style={{ color: colors.text, fontSize: 34, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                  {settings.bpm}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '800' }}>BPM</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 }}>
              <Pressable
                testID="setup.tempo.decrease"
                accessibilityLabel="Decrease tempo"
                onPress={() => updateSettings({ bpm: Math.max(40, settings.bpm - 1) })}
                style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: colors.text, fontSize: 23 }}>−</Text>
              </Pressable>
              <Slider
                testID="setup.tempo.slider"
                style={{ flex: 1, height: 40 }}
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
                accessibilityLabel="Increase tempo"
                onPress={() => updateSettings({ bpm: Math.min(200, settings.bpm + 1) })}
                style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: colors.text, fontSize: 23 }}>+</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 48 }}>
              <Text style={{ color: colors.dim, fontSize: 10 }}>40 BPM</Text>
              <Text style={{ color: colors.dim, fontSize: 10 }}>200 BPM</Text>
            </View>
          </View>

          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 20, marginBottom: 9 }}>
            SESSION LENGTH
          </Text>
          <SettingsChoiceRow
            options={durations}
            value={settings.durationSeconds}
            onChange={(durationSeconds) => updateSettings({ durationSeconds })}
            testIDPrefix="setup.duration"
          />

          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 22, marginBottom: 9 }}>
            PERSONALIZE
          </Text>
          <SettingsLink
            testID="setup.card.rhythm"
            href="/settings/rhythm"
            title="Rhythm & meter"
            detail={`${settings.timeSignature} · ${settings.feel} · every ${settings.changeIntervalBeats} beats${settings.restBetweenChanges ? ' · rest before change' : ''}`}
          />
          <SettingsLink
            testID="setup.card.audio"
            href="/settings/audio"
            title="Sounds & feedback"
            detail={`${settings.soundEnabled ? 'Sound on' : 'Sound off'} · ${settings.hapticsEnabled ? 'haptics on' : 'haptics off'}`}
          />
          <SettingsLink
            testID="setup.card.timing"
            href="/settings/timing"
            title="Timing calibration"
            detail={`±${settings.goodWindowMs} ms range · ${settings.leftTapOffsetMs >= 0 ? '+' : ''}${settings.leftTapOffsetMs}/${settings.rightTapOffsetMs >= 0 ? '+' : ''}${settings.rightTapOffsetMs} ms offsets`}
          />
          <SettingsLink
            testID="setup.card.display"
            href="/settings/display"
            title="Practice display"
            detail={settings.practiceDisplay === 'piano-staff' ? 'Piano grand staff' : 'Separate hand lanes'}
          />
        </ScrollView>

        <View style={{ paddingHorizontal: 22, paddingTop: 9, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.background }}>
          <View style={{ width: '100%', maxWidth: 680, alignSelf: 'center' }}>
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
        </View>
      </View>
    </SafeAreaView>
  );
}

function SettingsLink({
  testID,
  href,
  title,
  detail,
}: {
  testID: string;
  href: '/settings/rhythm' | '/settings/audio' | '/settings/timing' | '/settings/display';
  title: string;
  detail: string;
}) {
  const router = useRouter();

  return (
    <Pressable
      testID={testID}
      onPress={() => router.push(href)}
      style={({ pressed }) => ({
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        marginBottom: 8,
      })}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{title}</Text>
        <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 11, fontWeight: '600' }}>{detail}</Text>
      </View>
      <Text style={{ color: colors.muted, fontSize: 23, marginLeft: 10 }}>›</Text>
    </Pressable>
  );
}

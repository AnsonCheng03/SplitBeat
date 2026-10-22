import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioStartButton } from '@/components/AudioStartButton';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';

export default function HomeScreen() {
  const { settings, updateSettings, audioStatus, prepareAudio, startExercise } = useRhythmSession();
  const [starting, setStarting] = useState(false);
  const router = useRouter();
  const buttonStatus = starting ? 'loading' : audioStatus;

  const startPractice = async () => {
    if (starting || audioStatus === 'loading') return;
    setStarting(true);
    try {
      if (audioStatus === 'error') {
        await prepareAudio();
        return;
      }
      await startExercise();
      router.replace('/practice');
    } catch {
      Alert.alert('Audio could not start', 'Check your device audio settings and try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <SafeAreaView testID="home.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 10 }}>
        <View style={{ minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: colors.left }} />
            <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: colors.right }} />
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginLeft: 4 }}>
              SPLIT BEAT
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <Text
              testID="home.audioStatus"
              style={{
                color: audioStatus === 'error' ? colors.danger : audioStatus === 'ready' ? colors.left : colors.accent,
                fontSize: 9,
                fontWeight: '900',
                letterSpacing: 1,
              }}
            >
              {audioStatus === 'ready' ? 'AUDIO READY' : audioStatus === 'error' ? 'AUDIO NEEDS SETUP' : 'LOADING AUDIO…'}
            </Text>
            <Pressable testID="home.setup" onPress={() => router.push('/setup')} hitSlop={12}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>
                SETTINGS  ›
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 28, paddingVertical: 10 }}>
          <View style={{ flex: 0.82, justifyContent: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1 }}>
              Find your rhythm.
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 9, maxWidth: 330 }}>
              One steady pulse. Practice one hand or bring them together.
            </Text>
          </View>

          <View style={{ flex: 1.18, gap: 9 }}>
            <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }}>
              CHOOSE A MODE
            </Text>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <ModeChoice
                testID="home.mode.twoHand"
                selected={settings.trainingMode === 'two-hand'}
                title="TWO HANDS"
                detail="Build independence"
                onPress={() => updateSettings({ trainingMode: 'two-hand' })}
              />
              <ModeChoice
                testID="home.mode.singleHand"
                selected={settings.trainingMode === 'single-hand'}
                title="ONE HAND"
                detail="Focus on one side"
                onPress={() => updateSettings({ trainingMode: 'single-hand' })}
              />
            </View>

            {settings.trainingMode === 'single-hand' ? (
              <View testID="home.handPicker" style={{ flexDirection: 'row', gap: 8, alignSelf: 'flex-start' }}>
                <HandChoice
                  testID="home.hand.left"
                  hand="left"
                  selected={settings.singleHand === 'left'}
                  onPress={() => updateSettings({ singleHand: 'left' })}
                />
                <HandChoice
                  testID="home.hand.right"
                  hand="right"
                  selected={settings.singleHand === 'right'}
                  onPress={() => updateSettings({ singleHand: 'right' })}
                />
              </View>
            ) : null}

            <Pressable testID="home.importScore" onPress={() => router.push('/import-score')} hitSlop={8} style={{ alignSelf: 'flex-start', paddingTop: 4 }}>
              <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>
                TRAIN FROM A SCORE  ↗
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingBottom: 2 }}>
          <AudioStartButton
            testID="home.start"
            variant="wide"
            status={buttonStatus}
            disabled={starting || audioStatus === 'loading'}
            onPress={() => void startPractice()}
            accessibilityLabel={
              audioStatus === 'ready'
                ? `Start ${settings.trainingMode === 'single-hand' ? settings.singleHand + ' hand' : 'two hand'} practice`
                : audioStatus === 'error'
                  ? 'Retry audio setup'
                  : 'Loading audio engine'
            }
            title={
              starting
                ? 'STARTING…'
                : audioStatus === 'ready'
                  ? 'START PRACTICE'
                  : audioStatus === 'error'
                    ? 'RETRY AUDIO SETUP'
                    : 'PREPARING AUDIO…'
            }
            subtitle={
              audioStatus === 'ready'
                ? `${settings.bpm} BPM · ${settings.trainingMode === 'single-hand' ? settings.singleHand.toUpperCase() + ' HAND' : 'TWO HANDS'} · tap to begin`
                : audioStatus === 'error'
                  ? 'Tap to prepare the audio engine again'
                  : 'Getting the metronome ready'
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ModeChoice({
  testID,
  selected,
  title,
  detail,
  onPress,
}: {
  testID: string;
  selected: boolean;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 72,
        paddingHorizontal: 12,
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: selected ? colors.leftSurface : colors.surface,
        borderWidth: 1.5,
        borderColor: selected ? colors.left : colors.line,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <Text style={{ color: selected ? colors.left : colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }}>
        {title}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{detail}</Text>
    </Pressable>
  );
}

function HandChoice({
  testID,
  hand,
  selected,
  onPress,
}: {
  testID: string;
  hand: 'left' | 'right';
  selected: boolean;
  onPress: () => void;
}) {
  const accent = hand === 'left' ? colors.left : colors.right;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ paddingHorizontal: 13, minHeight: 32, justifyContent: 'center', borderRadius: 10, backgroundColor: selected ? accent : colors.surface, borderWidth: 1, borderColor: selected ? accent : colors.line }}
    >
      <Text style={{ color: selected ? colors.background : colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }}>
        {hand.toUpperCase()}
      </Text>
    </Pressable>
  );
}

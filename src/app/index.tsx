import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioStartButton } from '@/components/AudioStartButton';
import { PracticeDisplayPicker } from '@/components/PracticeDisplayPicker';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';

export default function HomeScreen() {
  const { settings, featureFlags, updateSettings, audioStatus, prepareAudio, prepareExercise } = useRhythmSession();
  const { t } = useI18n();
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
      await prepareExercise();
      router.replace('/practice');
    } catch {
      Alert.alert(t('Audio could not start'), t('Check your device audio settings and try again.'));
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
              BEEP BEEP BEAT - RHYTHM COACH
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {featureFlags.sessionRecords ? <Pressable
              testID="home.records"
              accessibilityRole="button"
              accessibilityLabel={t('View training records')}
              onPress={() => router.push('/records')}
              hitSlop={10}
              style={({ pressed }) => ({
                minHeight: 38,
                paddingHorizontal: 14,
                justifyContent: 'center',
                borderRadius: 11,
                backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
              })}
            >
              <Text style={{ color: colors.left, fontSize: 12, fontWeight: '900', letterSpacing: 0.8 }}>
                MY RECORDS
              </Text>
            </Pressable> : null}
            <Pressable
              testID="home.setup"
              accessibilityRole="button"
              accessibilityLabel={t('Settings')}
              onPress={() => router.push('/setup')}
              hitSlop={10}
              style={({ pressed }) => ({
                minHeight: 34,
                paddingHorizontal: 12,
                justifyContent: 'center',
                borderRadius: 11,
                backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
              })}
            >
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>
                SETTINGS
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flex: 1, width: '100%', maxWidth: 960, alignSelf: 'center', justifyContent: 'center', paddingVertical: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
            <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>
              Choose a mode
            </Text>
            {featureFlags.learnCourse ? <Pressable
              testID="home.learn"
              accessibilityRole="button"
              accessibilityLabel={t('Open the guided rhythm course')}
              onPress={() => router.push('/learn')}
              hitSlop={8}
              style={({ pressed }) => ({ minHeight: 40, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 12, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}
            >
              <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 }}>
                LEARN RHYTHM · 3 FREE  ›
              </Text>
            </Pressable> : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ModeChoice
              testID="home.mode.twoHand"
              mode="two-hand"
              selected={!featureFlags.oneHandMode || settings.trainingMode === 'two-hand'}
              title="Two hands"
              onPress={() => updateSettings({ trainingMode: 'two-hand' })}
            />
            {featureFlags.oneHandMode ? <ModeChoice
              testID="home.mode.singleHand"
              mode="single-hand"
              selected={settings.trainingMode === 'single-hand'}
              title="One hand"
              onPress={() => updateSettings({ trainingMode: 'single-hand', singleHand: 'left' })}
            /> : null}
          </View>
          {featureFlags.scoreNotation ? <PracticeDisplayPicker
            value={settings.practiceDisplayMode}
            onChange={(practiceDisplayMode) => updateSettings({ practiceDisplayMode })}
            testIDPrefix="home.display"
          /> : null}

        </View>

        <View style={{ width: '100%', maxWidth: 960, alignSelf: 'center', gap: 10, paddingBottom: 2 }}>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            {featureFlags.focusPractice ? <Pressable
              testID="home.exercise"
              accessibilityRole="button"
              accessibilityLabel={t('Review combinations and create a rhythm to practise')}
              onPress={() => router.push('/exercise')}
              hitSlop={8}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 46,
                paddingHorizontal: 15,
                justifyContent: 'center',
                borderRadius: 13,
                backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
              })}
            >
              <Text style={{ color: colors.left, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 }}>
                FOCUS PRACTICE  ›
              </Text>
            </Pressable> : null}
            {featureFlags.scoreImport ? <Pressable
              testID="home.importScore"
              accessibilityRole="button"
              accessibilityLabel={t('Train from a score')}
              onPress={() => router.push('/import-score')}
              hitSlop={8}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 46,
                paddingHorizontal: 15,
                justifyContent: 'center',
                borderRadius: 13,
                backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
              })}
            >
              <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 }}>
                TRAIN FROM A SCORE  ›
              </Text>
            </Pressable> : null}
          </View>
          <AudioStartButton
            testID="home.start"
            variant="wide"
            status={buttonStatus}
            disabled={starting || audioStatus === 'loading'}
            onPress={() => void startPractice()}
            subtitleTestID="home.audioStatus"
            accessibilityLabel={
              audioStatus === 'ready'
                ? t('Start {mode} practice', { mode: t(settings.trainingMode === 'single-hand' ? 'one hand' : 'two hand') })
                : audioStatus === 'error'
                  ? t('Retry audio setup')
                  : t('Loading audio engine')
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
                ? t('AUDIO READY · {bpm} BPM · {mode}', {
                  bpm: settings.bpm,
                  mode: t(featureFlags.oneHandMode && settings.trainingMode === 'single-hand' ? 'ONE HAND' : 'TWO HANDS'),
                })
                : audioStatus === 'error'
                  ? 'TAP TO PREPARE THE METRONOME AGAIN'
                  : 'PREPARING THE METRONOME'
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ModeChoice({
  testID,
  mode,
  selected,
  title,
  onPress,
}: {
  testID: string;
  mode: 'two-hand' | 'single-hand';
  selected: boolean;
  title: string;
  onPress: () => void;
}) {
  const selectedColor = mode === 'single-hand' ? colors.accent : colors.left;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 82,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 16,
        backgroundColor: selected ? colors.surfaceRaised : colors.surface,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? selectedColor : colors.line,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <ModeMark mode={mode} />
      <Text style={{ color: selected ? selectedColor : colors.text, fontSize: 17, fontWeight: '900', letterSpacing: -0.2 }}>
        {title}
      </Text>
    </Pressable>
  );
}

function ModeMark({ mode }: { mode: 'two-hand' | 'single-hand' }) {
  if (mode === 'single-hand') {
    return (
      <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: colors.accent }} />
      </View>
    );
  }

  return (
    <View style={{ width: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: colors.left }} />
      <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: colors.right }} />
    </View>
  );
}

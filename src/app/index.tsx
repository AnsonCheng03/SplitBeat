import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioStartButton } from '@/components/AudioStartButton';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';

type HomeActivity = 'practice' | 'focus' | 'score' | 'learn';

interface ActivityOption {
  id: HomeActivity;
  title: string;
  description: string;
  testID: string;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { settings, featureFlags, updateSettings, audioStatus, prepareAudio, prepareExercise } = useRhythmSession();
  const { t } = useI18n();
  const [starting, setStarting] = useState(false);
  const [activityPickerVisible, setActivityPickerVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<HomeActivity>('practice');
  const router = useRouter();

  const activityOptions: ActivityOption[] = [
    {
      id: 'practice',
      title: 'Free practice',
      description: 'Play a rhythm at your own pace.',
      testID: 'home.activity.practice',
    },
    ...(featureFlags.focusPractice
      ? [{
        id: 'focus' as const,
        title: 'Focus practice',
        description: 'Review rhythm combinations you want to improve.',
        testID: 'home.exercise',
      }]
      : []),
    ...(featureFlags.scoreImport
      ? [{
        id: 'score' as const,
        title: 'Train from a score',
        description: 'Import a score or continue one you saved.',
        testID: 'home.importScore',
      }]
      : []),
    ...(featureFlags.learnCourse
      ? [{
        id: 'learn' as const,
        title: 'Learn rhythm',
        description: 'Follow the guided course, one lesson at a time.',
        testID: 'home.learn',
      }]
      : []),
  ];
  const currentActivity = activityOptions.find((option) => option.id === selectedActivity) ?? activityOptions[0];
  const isFreePractice = currentActivity.id === 'practice';
  const buttonStatus = isFreePractice ? (starting ? 'loading' : audioStatus) : 'ready';
  const startPractice = async () => {
    if (!isFreePractice) {
      switch (currentActivity.id) {
        case 'focus':
          router.push('/exercise');
          return;
        case 'score':
          router.push('/import-score');
          return;
        case 'learn':
          router.push('/learn');
          return;
      }
    }

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

  const startTitle = starting
    ? 'STARTING…'
    : isFreePractice
      ? audioStatus === 'ready'
        ? 'START PRACTICE'
        : audioStatus === 'error'
          ? 'RETRY AUDIO SETUP'
          : 'PREPARING AUDIO…'
      : currentActivity.id === 'focus'
        ? 'START FOCUS PRACTICE'
        : currentActivity.id === 'score'
          ? 'CHOOSE A SCORE'
          : 'OPEN LEARN RHYTHM';

  const startSubtitle = isFreePractice
    ? audioStatus === 'ready'
      ? 'Audio ready · tap to begin'
      : audioStatus === 'error'
        ? 'TAP TO PREPARE THE METRONOME AGAIN'
        : 'PREPARING THE METRONOME'
    : currentActivity.description;

  const startAccessibilityLabel = isFreePractice
    ? audioStatus === 'ready'
      ? t('Start practice')
      : audioStatus === 'error'
        ? t('Retry audio setup')
        : t('Loading audio engine')
    : currentActivity.id === 'focus'
      ? t('Open focus practice')
      : currentActivity.id === 'score'
        ? t('Choose a score')
        : t('Open learn rhythm');

  return (
    <SafeAreaView testID="home.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 10 }}>
        <View style={{ minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 0, flexShrink: 1 }}>
            <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: colors.left }} />
            <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: colors.right }} />
            <Text numberOfLines={1} style={{ color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginLeft: 4 }}>
              BEEP BEEP BEAT - RHYTHM COACH
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {featureFlags.sessionRecords ? <HeaderAction
              testID="home.records"
              label="MY RECORDS"
              color={colors.left}
              onPress={() => router.push('/records')}
              accessibilityLabel={t('View training records')}
            /> : null}
            <HeaderAction
              testID="home.setup"
              label="SETTINGS"
              color={colors.muted}
              onPress={() => router.push('/setup')}
              accessibilityLabel={t('Settings')}
            />
          </View>
        </View>

        <View style={{ flex: 1, width: '100%', maxWidth: 820, alignSelf: 'center', justifyContent: 'center', paddingVertical: 16 }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.6 }}>
            Ready to practise?
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 5 }}>
            Choose one or two hands, then start.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, maxWidth: 520 }}>
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
        </View>

        <View style={{ width: '100%', maxWidth: 960, alignSelf: 'center', flexDirection: 'row', alignItems: 'stretch', gap: 10, paddingBottom: 2 }}>
          <Pressable
            testID="home.activityPicker"
            accessibilityRole="button"
            accessibilityLabel={t('Change practice mode: {mode}', { mode: t(currentActivity.title) })}
            accessibilityHint={t('Choose what to practice today.')}
            onPress={() => setActivityPickerVisible(true)}
            style={({ pressed }) => ({
              width: 220,
              minHeight: 82,
              paddingHorizontal: 15,
              paddingVertical: 12,
              justifyContent: 'center',
              borderRadius: 17,
              backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              opacity: pressed ? 0.86 : 1,
            })}
          >
            <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }}>
              PRACTICE MODE
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 5 }}>
              <Text numberOfLines={1} style={{ flex: 1, color: colors.accent, fontSize: 13, fontWeight: '900' }}>
                {currentActivity.title}
              </Text>
              <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '700' }}>⌄</Text>
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <AudioStartButton
              testID="home.start"
              variant="wide"
              status={buttonStatus}
              disabled={isFreePractice && (starting || audioStatus === 'loading')}
              onPress={() => void startPractice()}
              subtitleTestID="home.audioStatus"
              accessibilityLabel={startAccessibilityLabel}
              title={startTitle}
              subtitle={startSubtitle}
            />
          </View>
        </View>
      </View>

      <Modal
        visible={activityPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActivityPickerVisible(false)}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.68)' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Close mode selection')}
            onPress={() => setActivityPickerVisible(false)}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          />
          <View style={{ width: '100%', maxWidth: 560, padding: 22, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>Select a practice mode</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 5, marginBottom: 16 }}>
              Choose what to practice today.
            </Text>
            <View style={{ gap: 8 }}>
              {activityOptions.map((option) => {
                const selected = currentActivity.id === option.id;
                return (
                  <Pressable
                    key={option.id}
                    testID={option.testID}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setSelectedActivity(option.id);
                      setActivityPickerVisible(false);
                    }}
                    style={({ pressed }) => ({
                      minHeight: 58,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 13,
                      backgroundColor: selected ? colors.surfaceRaised : colors.background,
                      borderWidth: 1,
                      borderColor: selected ? colors.accent : colors.line,
                      opacity: pressed ? 0.82 : 1,
                    })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: selected ? colors.accent : colors.text, fontSize: 14, fontWeight: '800' }}>
                        {option.title}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                        {option.description}
                      </Text>
                    </View>
                    <Text style={{ color: selected ? colors.accent : colors.dim, fontSize: 16, fontWeight: '900' }}>
                      {selected ? '✓' : '›'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function HeaderAction({
  testID,
  label,
  color,
  onPress,
  accessibilityLabel,
}: {
  testID: string;
  label: string;
  color: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        minHeight: 36,
        paddingHorizontal: 13,
        justifyContent: 'center',
        borderRadius: 11,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
      })}
    >
      <Text style={{ color, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>{label}</Text>
    </Pressable>
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
  const { colors } = useTheme();
  const selectedColor = mode === 'single-hand' ? colors.accent : colors.left;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 58,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 14,
        backgroundColor: selected ? colors.surfaceRaised : colors.surface,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? selectedColor : colors.line,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <ModeMark mode={mode} />
      <Text style={{ color: selected ? selectedColor : colors.text, fontSize: 15, fontWeight: '900', letterSpacing: -0.2 }}>
        {title}
      </Text>
    </Pressable>
  );
}

function ModeMark({ mode }: { mode: 'two-hand' | 'single-hand' }) {
  const { colors } = useTheme();
  if (mode === 'single-hand') {
    return (
      <View style={{ width: 25, height: 25, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 12, height: 12, borderRadius: 7, backgroundColor: colors.accent }} />
      </View>
    );
  }

  return (
    <View style={{ width: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: colors.left }} />
      <View style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: colors.right }} />
    </View>
  );
}

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioStartButton } from '@/components/AudioStartButton';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import { HomeHeaderAction, HomeModeChoice } from '@/components/HomeSelection';
import { HomeActivityPicker, HomeActivityLoading } from '@/components/HomeActivityPicker';
import type { HomeActivity, HomeActivityOption } from '@/components/HomeActivityPicker';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { settings, featureFlags, updateSettings, audioStatus, prepareAudio, prepareExercise } = useRhythmSession();
  const { t } = useI18n();
  const [starting, setStarting] = useState(false);
  const [openingActivity, setOpeningActivity] = useState<HomeActivity | null>(null);
  const openingActivityRef = useRef(false);
  const [activityPickerVisible, setActivityPickerVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<HomeActivity>('practice');
  const router = useRouter();

  const activityOptions: HomeActivityOption[] = [
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
  const loadingActivityTitle = activityOptions.find((option) => option.id === openingActivity)?.title ?? 'Focus practice';
  const loadingMessage = openingActivity
    ? t('Loading {activity}…', { activity: t(loadingActivityTitle) })
    : '';

  useFocusEffect(useCallback(() => {
    setStarting(false);
    setOpeningActivity(null);
    openingActivityRef.current = false;
  }, []));

  const buttonStatus = openingActivity || starting ? 'loading' : isFreePractice ? audioStatus : 'ready';
  const startPractice = async () => {
    if (!isFreePractice) {
      if (openingActivityRef.current) return;
      openingActivityRef.current = true;
      setOpeningActivity(currentActivity.id);

      // Let the loading screen render before navigation starts.
      await new Promise<void>((resolve) => setTimeout(resolve, 350));
      try {
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
      } catch {
        openingActivityRef.current = false;
        setOpeningActivity(null);
        Alert.alert(t('Could not open practice'), t('Please try again.'));
      }
      return;
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

  const startTitle = openingActivity
    ? 'OPENING…'
    : starting
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

  const startSubtitle = openingActivity
    ? loadingMessage
    : isFreePractice
    ? audioStatus === 'ready'
      ? 'Audio ready · tap to begin'
      : audioStatus === 'error'
        ? 'TAP TO PREPARE THE METRONOME AGAIN'
        : 'PREPARING THE METRONOME'
    : currentActivity.description;

  const startAccessibilityLabel = openingActivity
    ? t('Loading {activity}', { activity: t(loadingActivityTitle) })
    : isFreePractice
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
            {featureFlags.sessionRecords ? <HomeHeaderAction
              testID="home.records"
              label="MY RECORDS"
              color={colors.left}
              onPress={() => router.push('/records')}
              accessibilityLabel={t('View training records')}
            /> : null}
            <HomeHeaderAction
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
            <HomeModeChoice
              testID="home.mode.twoHand"
              mode="two-hand"
              selected={!featureFlags.oneHandMode || settings.trainingMode === 'two-hand'}
              title="Two hands"
              onPress={() => updateSettings({ trainingMode: 'two-hand' })}
            />
            {featureFlags.oneHandMode ? <HomeModeChoice
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
              disabled={Boolean(openingActivity) || (isFreePractice && (starting || audioStatus === 'loading'))}
              onPress={() => void startPractice()}
              subtitleTestID="home.audioStatus"
              accessibilityLabel={startAccessibilityLabel}
              title={startTitle}
              subtitle={startSubtitle}
            />
          </View>
        </View>
      </View>

      <HomeActivityPicker
        visible={activityPickerVisible}
        options={activityOptions}
        selected={currentActivity.id}
        onClose={() => setActivityPickerVisible(false)}
        onSelect={(activity) => {
          setSelectedActivity(activity);
          setActivityPickerVisible(false);
        }}
      />

      {openingActivity ? <HomeActivityLoading message={loadingMessage} /> : null}
    </SafeAreaView>
  );
}

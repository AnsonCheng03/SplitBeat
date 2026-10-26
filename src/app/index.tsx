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
import {
  indexStyle1,
  indexStyle2,
  indexStyle3,
  indexStyle4,
  indexStyle5,
  indexStyle6,
  indexStyle7,
  indexStyle8,
  indexStyle9,
  indexStyle10,
  indexStyle11,
  indexStyle12,
  indexStyle13,
  indexStyle14,
  indexStyle15,
  indexStyle16,
  indexStyle17,
  indexStyle18,
  indexStyle19
} from '@/styles/home';

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
  const startFreePractice = async () => {
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

  const navigateToActivity = (activity: HomeActivity) => {
    switch (activity) {
      case 'practice':
        router.replace('/practice');
        return;
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
  };

  const openSelectedActivity = async () => {
    if (openingActivityRef.current) return;
    openingActivityRef.current = true;
    setOpeningActivity(currentActivity.id);

    // Let the loading screen render before navigation starts.
    await new Promise<void>((resolve) => setTimeout(resolve, 350));
    try {
      navigateToActivity(currentActivity.id);
    } catch {
      openingActivityRef.current = false;
      setOpeningActivity(null);
      Alert.alert(t('Could not open practice'), t('Please try again.'));
    }
  };

  const startPractice = async () => {
    if (isFreePractice) await startFreePractice();
    else await openSelectedActivity();
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
    <SafeAreaView testID="home.screen" style={indexStyle1({ colors })}>
      <View style={indexStyle2()}>
        <View style={indexStyle3()}>
          <View style={indexStyle4()}>
            <View style={indexStyle5({ colors })} />
            <View style={indexStyle6({ colors })} />
            <Text numberOfLines={1} style={indexStyle7({ colors })}>
              BEEP BEEP BEAT - RHYTHM COACH
            </Text>
          </View>
          <View style={indexStyle8()}>
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

        <View style={indexStyle9()}>
          <Text style={indexStyle10({ colors })}>
            Ready to practise?
          </Text>
          <Text style={indexStyle11({ colors })}>
            Choose one or two hands, then start.
          </Text>
          <View style={indexStyle12()}>
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

        <View style={indexStyle13()}>
          <Pressable
            testID="home.activityPicker"
            accessibilityRole="button"
            accessibilityLabel={t('Change practice mode: {mode}', { mode: t(currentActivity.title) })}
            accessibilityHint={t('Choose what to practice today.')}
            onPress={() => setActivityPickerVisible(true)}
            style={({ pressed }) => (indexStyle14({ pressed, colors }))}
          >
            <Text style={indexStyle15({ colors })}>
              PRACTICE MODE
            </Text>
            <View style={indexStyle16()}>
              <Text numberOfLines={1} style={indexStyle17({ colors })}>
                {currentActivity.title}
              </Text>
              <Text style={indexStyle18({ colors })}>⌄</Text>
            </View>
          </Pressable>
          <View style={indexStyle19()}>
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

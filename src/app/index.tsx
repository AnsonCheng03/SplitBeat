import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioStartButton } from '@/components/AudioStartButton';
import { HomeHeaderAction, HomeModeChoice } from '@/components/HomeSelection';
import { HomeActivityPicker, HomeActivityLoading } from '@/components/HomeActivityPicker';
import { PracticeDisplayPicker } from '@/components/PracticeDisplayPicker';
import { useHomeScreen } from '@/features/home/useHomeScreen';
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
  indexStyle19,
} from '@/styles/home';

export default function HomeScreen() {
  const {
    colors,
    settings,
    featureFlags,
    updateSettings,
    t,
    openingActivity,
    modeLoading,
    activityPickerVisible,
    activityOptions,
    currentActivity,
    loadingMessage,
    isFreePractice,
    buttonStatus,
    startTitle,
    startSubtitle,
    startAccessibilityLabel,
    startPractice,
    onSelectTwoHand,
    onSelectSingleHand,
    onOpenActivityPicker,
    onCloseActivityPicker,
    onSelectActivity,
    onOpenRecords,
    onOpenSettings,
  } = useHomeScreen();

  return (
    <SafeAreaView testID="home.screen" style={indexStyle1({ colors })}>
      <View
        pointerEvents={modeLoading ? 'none' : 'auto'}
        accessibilityElementsHidden={modeLoading}
        importantForAccessibility={modeLoading ? 'no-hide-descendants' : 'auto'}
        style={indexStyle2()}
      >
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
              onPress={onOpenRecords}
              accessibilityLabel={t('View training records')}
            /> : null}
            <HomeHeaderAction
              testID="home.setup"
              label="SETTINGS"
              color={colors.muted}
              onPress={onOpenSettings}
              accessibilityLabel={t('Settings')}
            />
          </View>
        </View>

        <View style={indexStyle9()}>
          <Text style={indexStyle10({ colors })}>Ready to practise?</Text>
          <Text style={indexStyle11({ colors })}>Choose your hands and notation, then start.</Text>
          <View style={indexStyle12()}>
            <HomeModeChoice
              testID="home.mode.twoHand"
              mode="two-hand"
              selected={!featureFlags.oneHandMode || settings.trainingMode === 'two-hand'}
              title="Two hands"
              onPress={onSelectTwoHand}
            />
            {featureFlags.oneHandMode ? <HomeModeChoice
              testID="home.mode.singleHand"
              mode="single-hand"
              selected={settings.trainingMode === 'single-hand'}
              title="One hand"
              onPress={onSelectSingleHand}
            /> : null}
          </View>
          {featureFlags.scoreNotation ? (
            <PracticeDisplayPicker
              value={settings.practiceDisplayMode}
              onChange={(practiceDisplayMode) => updateSettings({ practiceDisplayMode })}
              testIDPrefix="home.display"
              label="DISPLAY"
            />
          ) : null}
        </View>

        <View style={indexStyle13()}>
          <Pressable
            testID="home.activityPicker"
            accessibilityRole="button"
            accessibilityLabel={t('Change practice mode: {mode}', { mode: t(currentActivity.title) })}
            accessibilityHint={t('Choose what to practice today.')}
            onPress={onOpenActivityPicker}
            style={({ pressed }) => (indexStyle14({ pressed, colors }))}
          >
            <Text style={indexStyle15({ colors })}>PRACTICE MODE</Text>
            <View style={indexStyle16()}>
              <Text numberOfLines={1} style={indexStyle17({ colors })}>{currentActivity.title}</Text>
              <Text style={indexStyle18({ colors })}>⌄</Text>
            </View>
          </Pressable>
          <View style={indexStyle19()}>
            <AudioStartButton
              testID="home.start"
              variant="wide"
              status={buttonStatus}
              disabled={Boolean(openingActivity) || (isFreePractice && buttonStatus === 'loading')}
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
        visible={activityPickerVisible && !modeLoading}
        options={activityOptions}
        selected={currentActivity.id}
        onClose={onCloseActivityPicker}
        onSelect={onSelectActivity}
      />

      {modeLoading ? <HomeActivityLoading message={loadingMessage} /> : null}
    </SafeAreaView>
  );
}

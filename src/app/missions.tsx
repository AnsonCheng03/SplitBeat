import { Pressable, ScrollView, View } from 'react-native';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/i18n/LocalizedText';
import { ExerciseComposer } from '@/components/ExerciseComposer';
import { ModeLoadingScreen } from '@/components/ModeLoadingScreen';
import { RhythmMissionPath } from '@/components/RhythmMissionPath';
import { RhythmMissionTapPad } from '@/components/RhythmMissionTapPad';
import { ChoiceChip, PrimaryButton } from '@/components/ExercisePatternPicker';
import { useRhythmMissionsScreen } from '@/features/missions/useRhythmMissionsScreen';
import { useI18n } from '@/i18n/I18nProvider';
import { isRhythmMissionUnlocked } from '@/rhythm/rhythmMissions';
import {
  RhythmMissionsStyle1,
  RhythmMissionsStyle2,
  RhythmMissionsStyle3,
  RhythmMissionsStyle4,
  RhythmMissionsStyle5,
  RhythmMissionsStyle6,
  RhythmMissionsStyle7,
  RhythmMissionsStyle8,
  RhythmMissionsStyle9,
  RhythmMissionsStyle10,
  RhythmMissionsStyle11,
  RhythmMissionsStyle12,
} from '@/styles/rhythmMissions';

export default function RhythmMissionsScreen() {
  const { t } = useI18n();
  const screen = useRhythmMissionsScreen();
  const rhythmMissionsEnabled = screen.featureFlags.rhythmMissions;
  const returnHome = screen.returnHome;

  useEffect(() => {
    if (!rhythmMissionsEnabled) returnHome();
  }, [rhythmMissionsEnabled, returnHome]);

  if (!screen.progressLoaded) {
    return <ModeLoadingScreen testID="mission.loading" title={t('Loading rhythm missions…')} detail={t('Loading your mission progress.')} />;
  }

  return (
    <SafeAreaView testID="mission.screen" style={RhythmMissionsStyle1({ colors: screen.colors })}>
      <ScrollView contentContainerStyle={RhythmMissionsStyle2()} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={RhythmMissionsStyle3()}>
          <Pressable testID="mission.home" accessibilityRole="button" accessibilityLabel={t('Back to home')} onPress={screen.returnHome}>
            <TextLabel text={`‹  ${t('HOME')}`} color={screen.colors.muted} />
          </Pressable>
          <TextLabel text={t('RHYTHM MISSIONS')} color={screen.colors.accent} />
        </View>
        <TextLabel text={t('Hear it. Feel it. Play it back.')} color={screen.colors.text} large />
        <TextLabel text={t('Train your rhythm by listening or feeling a pattern, then echo it on screen or rebuild it with notes.')} color={screen.colors.muted} />

        <RhythmMissionPath
          missions={screen.missions}
          completedMissionIds={screen.completedMissionIds}
          selectedMissionId={screen.mission.id}
          onSelect={screen.selectMission}
        />

        <View style={RhythmMissionsStyle4({ colors: screen.colors })}>
          <TextLabel text={t('MISSION {number}', { number: screen.mission.number })} color={screen.colors.accent} />
          <TextLabel text={t(screen.mission.title)} color={screen.colors.text} large />
          <TextLabel text={t(screen.mission.description)} color={screen.colors.muted} />
          {screen.missionCompleted ? <TextLabel text={t('Mission complete · replay any time.')} color={screen.colors.left} /> : null}
        </View>

        <View style={RhythmMissionsStyle5()}>
          <View style={RhythmMissionsStyle6()}>
            <TextLabel text={t('HOW DO YOU WANT TO ANSWER?')} color={screen.colors.dim} />
            <View style={RhythmMissionsStyle7()}>
              <ChoiceChip testID="mission.answer.tap" label={t('Tap it back')} selected={screen.answerMode === 'tap'} selectedColor={screen.colors.accent} onPress={() => screen.setAnswerStyle('tap')} />
              <ChoiceChip testID="mission.answer.compose" label={t('Write the notes')} selected={screen.answerMode === 'compose'} selectedColor={screen.colors.accent} onPress={() => screen.setAnswerStyle('compose')} />
            </View>
          </View>
          <View style={RhythmMissionsStyle6()}>
            <TextLabel text={t('PLAY THE PROMPT BY')} color={screen.colors.dim} />
            <View style={RhythmMissionsStyle7()}>
              <ChoiceChip testID="mission.cue.sound" label={t('Sound')} selected={screen.cueMode === 'sound'} selectedColor={screen.colors.left} onPress={() => screen.setPromptStyle('sound')} />
              <ChoiceChip testID="mission.cue.vibration" label={t('Vibration')} selected={screen.cueMode === 'vibration'} selectedColor={screen.colors.left} onPress={() => screen.setPromptStyle('vibration')} />
            </View>
          </View>
        </View>

        <View style={RhythmMissionsStyle8({ colors: screen.colors })}>
          <View style={RhythmMissionsStyle3()}>
            <View>
              <TextLabel text={t('YOUR RHYTHM PROMPT')} color={screen.colors.dim} />
              <TextLabel text={t('{timeSignature} · {bpm} BPM', { timeSignature: '4/4', bpm: screen.missionBpm })} color={screen.colors.muted} />
            </View>
            <PrimaryButton
              testID="mission.prompt.play"
              title={screen.playingPrompt ? t('PLAYING…') : screen.cueMode === 'sound' ? t('PLAY SOUND PROMPT') : t('FEEL VIBRATION PROMPT')}
              onPress={() => void screen.playPrompt()}
              disabled={screen.playingPrompt || screen.answerActive}
            />
          </View>
          <TextLabel text={screen.settings.bpm > screen.missionBpm ? t('Mission tempo is capped at 120 BPM so each tap stays clear.') : screen.cueMode === 'sound' ? t('Listen for the spaces between the notes.') : t('Feel each vibration; the gaps between them are part of the rhythm.')} color={screen.colors.muted} />
        </View>

        {screen.answerMode === 'tap' ? (
          <RhythmMissionTapPad
            answerActive={screen.answerActive}
            promptPlayed={screen.promptPlayed}
            tapCount={screen.tapCount}
            bpm={screen.missionBpm}
            score={screen.tapScore}
            onStart={screen.beginTapAnswer}
            onTap={screen.registerAnswerTap}
            onRetry={screen.beginTapAnswer}
          />
        ) : (
          <View style={RhythmMissionsStyle9()}>
            <View style={RhythmMissionsStyle10()}>
              <TextLabel text={t('REBUILD THE RHYTHM')} color={screen.colors.accent} />
              <TextLabel text={t('Compose one 4/4 bar with the note creator below. Add rests wherever you heard silence, then check your answer.')} color={screen.colors.muted} />
            </View>
            <ExerciseComposer
              settings={screen.missionSettings}
              featureFlags={screen.featureFlags}
              hand="right"
              mode={screen.composerMode}
              leftNotes={[]}
              rightNotes={screen.compositionNotes}
              result={screen.compositionResult}
              score={screen.compositionResult.ok ? screen.compositionResult.score : null}
              barLengthQuarterNotes={4}
              compositionAlreadySaved={false}
              savedCompositions={[]}
              starting={false}
              saving={screen.savingCompletion}
              onHandChange={() => undefined}
              onModeChange={screen.setComposerMode}
              onAppendSymbol={screen.appendComposerSymbol}
              onUndo={screen.undoComposerSymbol}
              onClear={screen.clearComposer}
              onPractice={() => undefined}
              onSave={() => undefined}
              onPracticeSaved={() => undefined}
              onRemoveSaved={() => undefined}
              missionAction={{
                title: t(screen.savingCompletion ? 'SAVING…' : 'CHECK RHYTHM'),
                disabled: screen.compositionCheckDisabled,
                feedback: screen.compositionFeedback,
                onPress: screen.checkComposition,
              }}
            />
          </View>
        )}

        {screen.missionCompleted && screen.nextMission && isRhythmMissionUnlocked(screen.nextMission.id, screen.completedMissionIds) ? (
          <Pressable testID="mission.next" accessibilityRole="button" onPress={() => screen.selectMission(screen.nextMission!.id)} style={RhythmMissionsStyle11({ colors: screen.colors })}>
            <TextLabel text={t('NEXT MISSION')} color={screen.colors.background} />
            <TextLabel text={t(screen.nextMission.title)} color={screen.colors.background} />
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function TextLabel({ text, color, large = false }: { text: string; color: string; large?: boolean }) {
  return <Text style={RhythmMissionsStyle12({ color, large })}>{text}</Text>;
}

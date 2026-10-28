import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { startRhythmMissionCue } from '@/audio/rhythmMissionCue';
import type { RhythmMissionCueMode } from '@/audio/rhythmMissionCue';
import { useI18n } from '@/i18n/I18nProvider';
import { isMissionCompositionCorrect, isRhythmMissionUnlocked, RHYTHM_MISSIONS, RHYTHM_MISSION_BAR_QUARTERS, scoreRhythmMissionTaps } from '@/rhythm/rhythmMissions';
import { composeRhythmScore, noteValuesForSymbol } from '@/rhythm/scoreComposer';
import type { ComposerSymbolId, ComposedNoteValue } from '@/rhythm/scoreComposer';
import { completeRhythmMission, readCompletedRhythmMissionIds } from '@/store/rhythmMissionProgress';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';

export type RhythmMissionAnswerMode = 'tap' | 'compose';

export function useRhythmMissionsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { settings, featureFlags } = useRhythmSession();
  const router = useRouter();
  const returnHome = useCallback(() => router.replace('/'), [router]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState(RHYTHM_MISSIONS[0]!.id);
  const [answerMode, setAnswerMode] = useState<RhythmMissionAnswerMode>('tap');
  const [cueMode, setCueMode] = useState<RhythmMissionCueMode>('sound');
  const [playingPrompt, setPlayingPrompt] = useState(false);
  const [promptPlayed, setPromptPlayed] = useState(false);
  const [answerActive, setAnswerActive] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapScore, setTapScore] = useState<ReturnType<typeof scoreRhythmMissionTaps> | null>(null);
  const [compositionNoteGroups, setCompositionNoteGroups] = useState<ComposedNoteValue[][]>([]);
  const [composerMode, setComposerMode] = useState<'note' | 'rest'>('note');
  const [composerFeedback, setComposerFeedback] = useState<string | null>(null);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const responseStartRef = useRef<number | null>(null);
  const responseTapsRef = useRef<number[]>([]);
  const playbackStopRef = useRef<(() => void) | null>(null);
  const promptRequestIdRef = useRef(0);
  const promptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    void readCompletedRhythmMissionIds().then((ids) => {
      if (!active) return;
      setCompletedMissionIds(ids);
      const nextMission = RHYTHM_MISSIONS.find((mission) => !ids.includes(mission.id));
      setSelectedMissionId(nextMission?.id ?? RHYTHM_MISSIONS.at(-1)!.id);
      setProgressLoaded(true);
    });
    return () => {
      active = false;
      promptRequestIdRef.current += 1;
      if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
      if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
      playbackStopRef.current?.();
    };
  }, []);

  const mission = useMemo(
    () => RHYTHM_MISSIONS.find((item) => item.id === selectedMissionId) ?? RHYTHM_MISSIONS[0]!,
    [selectedMissionId],
  );
  const compositionNotes = useMemo(() => compositionNoteGroups.flat(), [compositionNoteGroups]);
  const missionSettings = useMemo(() => ({
    ...settings,
    timeSignature: '4/4' as const,
    trainingMode: 'single-hand' as const,
    singleHand: 'right' as const,
  }), [settings]);
  const compositionResult = useMemo(() => composeRhythmScore({
    title: mission.title,
    timeSignature: '4/4',
    trainingMode: 'single-hand',
    singleHand: 'right',
    left: [],
    right: compositionNotes,
  }), [compositionNotes, mission.title]);
  const compositionDuration = useMemo(
    () => compositionNotes.reduce((total, note) => total + note.durationQuarter, 0),
    [compositionNotes],
  );
  const missionCompleted = completedMissionIds.includes(mission.id);
  const canCheckComposition = Math.abs(compositionDuration - RHYTHM_MISSION_BAR_QUARTERS) < 0.00001;
  const missionBpm = Math.min(settings.bpm, 120);
  const promptDurationMs = RHYTHM_MISSION_BAR_QUARTERS * (60_000 / missionBpm);

  const resetAttempt = useCallback(() => {
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    responseTimerRef.current = null;
    responseStartRef.current = null;
    responseTapsRef.current = [];
    setAnswerActive(false);
    setPromptPlayed(false);
    setTapCount(0);
    setTapScore(null);
    setCompositionNoteGroups([]);
    setComposerMode('note');
    setComposerFeedback(null);
  }, []);

  const selectMission = useCallback((missionId: string) => {
    if (!isRhythmMissionUnlocked(missionId, completedMissionIds)) return;
    promptRequestIdRef.current += 1;
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    promptTimerRef.current = null;
    playbackStopRef.current?.();
    playbackStopRef.current = null;
    setPlayingPrompt(false);
    setSelectedMissionId(missionId);
    resetAttempt();
  }, [completedMissionIds, resetAttempt]);

  const stopPrompt = useCallback(() => {
    promptRequestIdRef.current += 1;
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    promptTimerRef.current = null;
    playbackStopRef.current?.();
    playbackStopRef.current = null;
    setPlayingPrompt(false);
  }, []);

  const playPrompt = useCallback(async () => {
    if (playingPrompt) return;
    stopPrompt();
    const requestId = promptRequestIdRef.current;
    setPlayingPrompt(true);
    try {
      const stopPlayback = await startRhythmMissionCue({
        mission,
        bpm: missionBpm,
        mode: cueMode,
        sounds: {
          metronome: settings.metronomeSound,
          leftHand: settings.leftHandSound,
          rightHand: settings.rightHandSound,
        },
      });
      if (requestId !== promptRequestIdRef.current) {
        stopPlayback();
        return;
      }
      playbackStopRef.current = stopPlayback;
      promptTimerRef.current = setTimeout(() => {
        if (requestId !== promptRequestIdRef.current) return;
        stopPlayback();
        playbackStopRef.current = null;
        promptTimerRef.current = null;
        setPlayingPrompt(false);
        setPromptPlayed(true);
      }, promptDurationMs + 80);
    } catch {
      if (requestId !== promptRequestIdRef.current) return;
      setPlayingPrompt(false);
      Alert.alert(t('Could not play the mission prompt'), t('Check your audio or vibration settings and try again.'));
    }
  }, [cueMode, mission, missionBpm, playingPrompt, promptDurationMs, settings.leftHandSound, settings.metronomeSound, settings.rightHandSound, stopPrompt, t]);

  const saveMissionCompletion = useCallback(async () => {
    if (savingCompletion || missionCompleted) return;
    setSavingCompletion(true);
    try {
      setCompletedMissionIds(await completeRhythmMission(mission.id));
    } catch {
      Alert.alert(t('Could not save mission progress'), t('Try again to save this mission.'));
    } finally {
      setSavingCompletion(false);
    }
  }, [mission.id, missionCompleted, savingCompletion, t]);

  const finishTapAnswer = useCallback(() => {
    const score = scoreRhythmMissionTaps(responseTapsRef.current, mission.notes, missionBpm);
    setAnswerActive(false);
    responseStartRef.current = null;
    responseTimerRef.current = null;
    setTapScore(score);
    if (score.passed) void saveMissionCompletion();
  }, [mission.notes, missionBpm, saveMissionCompletion]);

  const beginTapAnswer = useCallback(() => {
    if (playingPrompt || answerActive || !promptPlayed) return;
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    const startTime = globalThis.performance.now();
    responseStartRef.current = startTime;
    responseTapsRef.current = [0];
    setTapCount(1);
    setTapScore(null);
    setAnswerActive(true);
    responseTimerRef.current = setTimeout(finishTapAnswer, promptDurationMs + 40);
  }, [answerActive, finishTapAnswer, playingPrompt, promptDurationMs, promptPlayed]);

  const registerAnswerTap = useCallback(() => {
    const startTime = responseStartRef.current;
    if (!answerActive || startTime === null) return;
    const offsetMs = globalThis.performance.now() - startTime;
    if (offsetMs < promptDurationMs) {
      responseTapsRef.current = [...responseTapsRef.current, offsetMs];
      setTapCount(responseTapsRef.current.length);
    }
  }, [answerActive, promptDurationMs]);

  const checkComposition = useCallback(() => {
    if (!isMissionCompositionCorrect(compositionNotes, mission.notes)) {
      setComposerFeedback('Not quite. Replay the prompt, then adjust the note values or rests.');
      return;
    }
    setComposerFeedback('Correct! Mission complete.');
    void saveMissionCompletion();
  }, [compositionNotes, mission.notes, saveMissionCompletion]);

  const appendComposerSymbol = useCallback((symbolId: ComposerSymbolId) => {
    const additions = noteValuesForSymbol(symbolId, '4/4', composerMode === 'rest');
    if (additions.length > 0) setCompositionNoteGroups((current) => [...current, additions]);
    setComposerFeedback(null);
  }, [composerMode]);

  const undoComposerSymbol = useCallback(() => {
    setCompositionNoteGroups((current) => current.slice(0, -1));
    setComposerFeedback(null);
  }, []);

  const clearComposer = useCallback(() => {
    setCompositionNoteGroups([]);
    setComposerFeedback(null);
  }, []);

  const setAnswerStyle = useCallback((nextMode: RhythmMissionAnswerMode) => {
    setAnswerMode(nextMode);
    resetAttempt();
  }, [resetAttempt]);

  const setPromptStyle = useCallback((nextMode: RhythmMissionCueMode) => {
    stopPrompt();
    setPromptPlayed(false);
    setCueMode(nextMode);
  }, [stopPrompt]);

  const nextMission = RHYTHM_MISSIONS.find((item) => item.number === mission.number + 1);

  return {
    colors,
    t,
    settings,
    featureFlags,
    progressLoaded,
    completedMissionIds,
    mission,
    missions: RHYTHM_MISSIONS,
    missionCompleted,
    nextMission,
    answerMode,
    cueMode,
    playingPrompt,
    promptPlayed,
    answerActive,
    tapCount,
    tapScore,
    composerMode,
    compositionNotes,
    compositionResult,
    compositionDuration,
    compositionFeedback: composerFeedback ?? (compositionDuration > RHYTHM_MISSION_BAR_QUARTERS ? 'This answer is longer than one 4/4 bar. Undo a symbol to shorten it.' : null),
    compositionCheckDisabled: !promptPlayed || !canCheckComposition || savingCompletion,
    savingCompletion,
    promptDurationMs,
    missionBpm,
    missionSettings,
    returnHome,
    selectMission,
    setAnswerStyle,
    setPromptStyle,
    playPrompt,
    beginTapAnswer,
    registerAnswerTap,
    setComposerMode,
    appendComposerSymbol,
    undoComposerSymbol,
    clearComposer,
    checkComposition,
    resetAttempt,
  };
}

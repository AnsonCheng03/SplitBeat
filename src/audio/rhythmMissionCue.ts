import * as Haptics from 'expo-haptics';
import { MetronomeAudio } from '@/audio/metronome';
import type { RhythmMission } from '@/rhythm/rhythmMissions';
import { missionNoteOnsets, RHYTHM_MISSION_BAR_QUARTERS } from '@/rhythm/rhythmMissions';
import type { SoundPreset } from '@/types/rhythm';

export type RhythmMissionCueMode = 'sound' | 'vibration';

export async function startRhythmMissionCue({
  mission,
  bpm,
  mode,
  sounds,
}: {
  mission: RhythmMission;
  bpm: number;
  mode: RhythmMissionCueMode;
  sounds: { metronome: SoundPreset; leftHand: SoundPreset; rightHand: SoundPreset };
}): Promise<() => void> {
  if (mode === 'vibration') return scheduleMissionVibrations(mission, bpm);

  const audio = new MetronomeAudio();
  try {
    await audio.prepare();
    await audio.resume();
    audio.playReplayEvents(
      missionNoteOnsets(mission.notes).map((onset) => ({
        offsetMs: onset * (60_000 / bpm),
        hand: 'right' as const,
        source: 'expected' as const,
      })),
      sounds,
      RHYTHM_MISSION_BAR_QUARTERS * (60_000 / bpm),
    );
  } catch (error) {
    void audio.stop().catch(() => undefined);
    throw error;
  }

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    void audio.stop().catch(() => undefined);
  };
}

function scheduleMissionVibrations(mission: RhythmMission, bpm: number): () => void {
  const timers = missionNoteOnsets(mission.notes).map((onset) => setTimeout(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  }, onset * (60_000 / bpm)));
  let stopped = false;

  return () => {
    if (stopped) return;
    stopped = true;
    timers.forEach(clearTimeout);
  };
}

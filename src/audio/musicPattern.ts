export interface MusicNote {
  midiPitch: number;
  level: number;
}

export interface StartCueNote extends MusicNote {
  /** Offset from the first exercise beat, measured in metronome beats. */
  offsetBeats: number;
}

const BAR_ROOTS = [48, 53, 55, 57] as const;
const CHORD_TONES = [0, 7, 4, 7] as const;

export const SESSION_START_CUE: readonly StartCueNote[] = [
  { midiPitch: 76, level: 0.2, offsetBeats: -0.5 },
  { midiPitch: 84, level: 0.22, offsetBeats: 0 },
];

export const PATTERN_CHANGE_CUE: MusicNote = { midiPitch: 79, level: 0.24 };
export const RESUME_COUNT_IN_LEAD_IN_MS = 80;

export interface ResumeCountInPlan {
  beatDurationMs: number;
  firstBeatOffsetMs: number;
  countInBeats: number;
  durationMs: number;
  nextBeatIndex: number;
}

export function getAccompanimentNotesAtBeat(beatIndex: number, beatsPerBar: number): MusicNote[] {
  if (!Number.isInteger(beatIndex) || !Number.isInteger(beatsPerBar) || beatsPerBar < 1) return [];

  const beatInBar = ((beatIndex % beatsPerBar) + beatsPerBar) % beatsPerBar;
  const barIndex = Math.floor(beatIndex / beatsPerBar);
  const chordRoot = BAR_ROOTS[((barIndex % BAR_ROOTS.length) + BAR_ROOTS.length) % BAR_ROOTS.length];
  const chordTone = CHORD_TONES[beatInBar % CHORD_TONES.length];
  const note: MusicNote = {
    midiPitch: chordRoot + chordTone,
    level: beatInBar === 0 ? 0.27 : 0.2,
  };

  if (beatInBar !== 0) return [note];

  return [
    { midiPitch: chordRoot, level: 0.27 },
    { ...note, midiPitch: chordRoot + 12, level: 0.13 },
  ];
}

export function getBeatAudioTime(sessionStartAudioTime: number, bpm: number, beatIndex: number): number {
  return sessionStartAudioTime + beatIndex * (60 / bpm);
}

export function getResumeCountInPlan(
  currentAudioTime: number,
  sessionStartAudioTime: number,
  bpm: number,
  beatsPerBar: number,
): ResumeCountInPlan {
  const beatDurationMs = 60_000 / bpm;
  const elapsedBeats = (currentAudioTime - sessionStartAudioTime) / (beatDurationMs / 1_000);
  const nextBeatIndex = Math.floor(elapsedBeats) + 1;
  const timeToNextBeatMs = (nextBeatIndex - elapsedBeats) * beatDurationMs;
  const countInBeats = Math.max(1, Math.ceil(beatsPerBar / 2));
  const firstBeatOffsetMs = RESUME_COUNT_IN_LEAD_IN_MS + timeToNextBeatMs;

  return {
    beatDurationMs,
    firstBeatOffsetMs,
    countInBeats,
    durationMs: firstBeatOffsetMs + countInBeats * beatDurationMs,
    nextBeatIndex,
  };
}

export function isPatternChangeBeat(beatIndex: number, changeIntervalBeats: number): boolean {
  return Number.isInteger(beatIndex)
    && beatIndex > 0
    && Number.isInteger(changeIntervalBeats)
    && changeIntervalBeats > 0
    && beatIndex % changeIntervalBeats === 0;
}

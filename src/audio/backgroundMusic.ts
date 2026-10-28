export type BackgroundMusicVoice = 'pad' | 'bass' | 'melody';

export interface BackgroundMusicNote {
  midiPitch: number;
  level: number;
  voice: BackgroundMusicVoice;
  offsetBeats: number;
  durationBeats: number;
}

export interface BackgroundMusicArrangement {
  keyOffset: number;
  chordDegrees: readonly number[];
  melodyMotif: readonly number[];
}

const MAJOR_SCALE_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const;
const KEY_OFFSETS = [0, 2, 5, 7, 9] as const;
const KEY_ROOT_MIDI = 55;
const MELODY_MIN_PITCH = 67;
const MELODY_MAX_PITCH = 84;
const CHORD_PROGRESSIONS = [
  [0, 4, 5, 3], // I - V - vi - IV
  [0, 5, 3, 4], // I - vi - IV - V
  [5, 3, 0, 4], // vi - IV - I - V
] as const;
const MELODY_MOTIFS = [
  [2, 1, 0, 1, 2, 1, 0, 2],
  [0, 1, 2, 1, 0, 1, 2, 1],
  [2, 2, 1, 0, 1, 2, 1, 0],
] as const;

export function createBackgroundMusicArrangement(seed: number): BackgroundMusicArrangement {
  return {
    keyOffset: KEY_OFFSETS[seededIndex(seed, 1, KEY_OFFSETS.length)],
    chordDegrees: CHORD_PROGRESSIONS[seededIndex(seed, 2, CHORD_PROGRESSIONS.length)],
    melodyMotif: MELODY_MOTIFS[seededIndex(seed, 3, MELODY_MOTIFS.length)],
  };
}

export function getBackgroundMusicNotesAtBeat(
  beatIndex: number,
  beatsPerBar: number,
  subdivisionsPerBeat: number,
  arrangement: BackgroundMusicArrangement,
): BackgroundMusicNote[] {
  if (beatIndex < 0 || !Number.isInteger(beatIndex) || !Number.isInteger(beatsPerBar) || beatsPerBar < 1) return [];

  const normalizedSubdivisions = subdivisionsPerBeat === 3 ? 3 : 2;
  const beatInBar = beatIndex % beatsPerBar;
  const barIndex = Math.floor(beatIndex / beatsPerBar);
  const chord = getChordPitches(barIndex, arrangement);
  const notes: BackgroundMusicNote[] = [];

  if (beatInBar === 0) {
    for (const midiPitch of chord) {
      notes.push({
        midiPitch,
        level: 0.16,
        voice: 'pad',
        offsetBeats: 0,
        durationBeats: beatsPerBar,
      });
    }
  }

  if (beatInBar % 2 === 0) {
    notes.push({
      midiPitch: chord[beatInBar === 0 ? 0 : 2] - 12,
      level: beatInBar === 0 ? 0.3 : 0.22,
      voice: 'bass',
      offsetBeats: 0,
      durationBeats: 0.9,
    });
  }

  const melodyBeatInterval = normalizedSubdivisions === 3 ? 1 : beatsPerBar <= 2 ? 1 : 2;
  if (beatInBar % melodyBeatInterval === 0) {
    const motifIndex = getMotifIndex(beatIndex, beatsPerBar, melodyBeatInterval, arrangement.melodyMotif.length);
    const chordToneIndex = arrangement.melodyMotif[motifIndex] % chord.length;
    const offsetBeats = normalizedSubdivisions === 3
      ? (beatInBar % 2 === 0 ? 1 / 3 : 2 / 3)
      : 0.5;
    notes.push({
      midiPitch: moveMelodyPitchIntoRange(chord[chordToneIndex]),
      level: 0.22,
      voice: 'melody',
      offsetBeats,
      durationBeats: normalizedSubdivisions === 3 ? 0.48 : 0.78,
    });
  }

  return notes;
}

function getMotifIndex(
  beatIndex: number,
  beatsPerBar: number,
  melodyBeatInterval: number,
  motifLength: number,
): number {
  const barIndex = Math.floor(beatIndex / beatsPerBar);
  const beatInBar = beatIndex % beatsPerBar;
  const melodyStep = Math.floor(beatInBar / melodyBeatInterval);
  const stepsPerBar = Math.ceil(beatsPerBar / melodyBeatInterval);
  return (barIndex * stepsPerBar + melodyStep) % motifLength;
}

function getChordPitches(barIndex: number, arrangement: BackgroundMusicArrangement): number[] {
  const targetChordIndex = barIndex % arrangement.chordDegrees.length;
  let previousVoicing = getRootVoicing(arrangement.chordDegrees[0], arrangement.keyOffset);

  for (let chordIndex = 1; chordIndex <= targetChordIndex; chordIndex += 1) {
    const chordDegree = arrangement.chordDegrees[chordIndex];
    previousVoicing = closestVoicing(
      previousVoicing,
      getChordVoicings(chordDegree, arrangement.keyOffset),
    );
  }

  return previousVoicing;
}

function getRootVoicing(chordDegree: number, keyOffset: number): number[] {
  const rootPitch = KEY_ROOT_MIDI + keyOffset + MAJOR_SCALE_SEMITONES[chordDegree];
  const chordTones = getChordTones(rootPitch, chordDegree);
  return chordTones;
}

function getChordVoicings(chordDegree: number, keyOffset: number): number[][] {
  const rootPitch = KEY_ROOT_MIDI + keyOffset + MAJOR_SCALE_SEMITONES[chordDegree];
  const [root, third, fifth] = getChordTones(rootPitch, chordDegree);
  const inversions = [
    [root, third, fifth],
    [third, fifth, root + 12],
    [fifth, root + 12, third + 12],
  ];
  const voicings = inversions.flatMap((inversion) => [-12, 0, 12]
    .map((octaveOffset) => inversion.map((pitch) => pitch + octaveOffset))
    .filter((voicing) => voicing[0] >= 55 && voicing[2] <= 84));
  return voicings.length > 0 ? voicings : [[root, third, fifth]];
}

function getChordTones(rootPitch: number, chordDegree: number): number[] {
  const thirdDegree = chordDegree + 2;
  const fifthDegree = chordDegree + 4;
  return [
    rootPitch,
    rootPitch + scaleInterval(chordDegree, thirdDegree),
    rootPitch + scaleInterval(chordDegree, fifthDegree),
  ];
}

function closestVoicing(previous: readonly number[], candidates: readonly number[][]): number[] {
  return [...candidates].sort((left, right) =>
    voicingDistance(previous, left) - voicingDistance(previous, right))[0];
}

function voicingDistance(left: readonly number[], right: readonly number[]): number {
  return left.reduce((total, pitch, index) => total + Math.abs(pitch - right[index]), 0);
}

function moveMelodyPitchIntoRange(midiPitch: number): number {
  let pitch = midiPitch;
  while (pitch < MELODY_MIN_PITCH) pitch += 12;
  while (pitch > MELODY_MAX_PITCH) pitch -= 12;
  return pitch;
}

function scaleInterval(rootDegree: number, noteDegree: number): number {
  const octaveOffset = Math.floor(noteDegree / MAJOR_SCALE_SEMITONES.length);
  const noteScaleDegree = noteDegree % MAJOR_SCALE_SEMITONES.length;
  return MAJOR_SCALE_SEMITONES[noteScaleDegree]
    + octaveOffset * 12
    - MAJOR_SCALE_SEMITONES[rootDegree];
}

function seededIndex(seed: number, salt: number, length: number): number {
  let value = (Math.floor(seed) + salt * 0x9e3779b9) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return value % length;
}

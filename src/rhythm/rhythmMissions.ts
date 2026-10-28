import type { ComposedNoteValue } from '@/rhythm/scoreComposer';

export interface RhythmMission {
  id: string;
  number: number;
  title: string;
  description: string;
  notes: readonly ComposedNoteValue[];
}

export interface RhythmMissionTapScore {
  accuracyPercent: number;
  correctTaps: number;
  expectedTaps: number;
  extraTaps: number;
  missedTaps: number;
  passed: boolean;
}

const quarter = { durationQuarter: 1 } as const;
const eighth = { durationQuarter: 0.5 } as const;

export const RHYTHM_MISSIONS: readonly RhythmMission[] = [
  {
    id: 'steady-beats',
    number: 1,
    title: 'Four steady beats',
    description: 'Listen for four evenly spaced notes. Echo them, or write the rhythm.',
    notes: [quarter, quarter, quarter, quarter],
  },
  {
    id: 'even-eighths',
    number: 2,
    title: 'Even eighth notes',
    description: 'Hear or feel two notes in every beat. Keep the spaces even.',
    notes: Array.from({ length: 8 }, () => eighth),
  },
  {
    id: 'fill-the-gap',
    number: 3,
    title: 'Fill the gap',
    description: 'Listen for a steady note, two quicker notes, then two steady notes.',
    notes: [quarter, eighth, eighth, quarter, quarter],
  },
  {
    id: 'triplet-flow',
    number: 4,
    title: 'Three even notes',
    description: 'Each beat contains three evenly spaced notes. Count the triplets calmly.',
    notes: Array.from({ length: 12 }, () => ({ durationQuarter: 1 / 3, tupletNumber: 3 })),
  },
  {
    id: 'hear-the-rest',
    number: 5,
    title: 'Hear the rest',
    description: 'Notice the silent eighth-note space, then continue the rhythm.',
    notes: [eighth, { ...eighth, isRest: true }, eighth, eighth, quarter, quarter],
  },
];

export const RHYTHM_MISSION_BAR_QUARTERS = 4;
const DURATION_EPSILON = 0.00001;

export function missionNoteOnsets(notes: readonly ComposedNoteValue[]): number[] {
  let cursor = 0;
  const onsets: number[] = [];
  for (const note of notes) {
    if (!note.isRest) onsets.push(cursor);
    cursor += note.durationQuarter;
  }
  return onsets;
}

export function isMissionCompositionCorrect(
  actual: readonly ComposedNoteValue[],
  expected: readonly ComposedNoteValue[],
): boolean {
  if (actual.length !== expected.length) return false;
  const totalDuration = actual.reduce((total, note) => total + note.durationQuarter, 0);
  if (Math.abs(totalDuration - RHYTHM_MISSION_BAR_QUARTERS) > DURATION_EPSILON) return false;

  return actual.every((note, index) => {
    const expectedNote = expected[index];
    return Boolean(expectedNote)
      && Math.abs(note.durationQuarter - expectedNote.durationQuarter) <= DURATION_EPSILON
      && Boolean(note.isRest) === Boolean(expectedNote.isRest);
  });
}

export function scoreRhythmMissionTaps(
  tapsMs: readonly number[],
  notes: readonly ComposedNoteValue[],
  bpm: number,
): RhythmMissionTapScore {
  const beatMs = 60_000 / bpm;
  const expectedMs = missionNoteOnsets(notes).map((onset) => onset * beatMs);
  const minimumSpacingMs = expectedMs.reduce((minimum, expected, index) => {
    if (index === 0) return minimum;
    return Math.min(minimum, expected - expectedMs[index - 1]!);
  }, beatMs);
  const toleranceMs = Math.min(Math.max(60, beatMs * 0.18), minimumSpacingMs * 0.42);
  const matchedExpected = new Set<number>();
  let extraTaps = 0;

  for (const tapMs of [...tapsMs].sort((first, second) => first - second)) {
    let closestIndex = -1;
    let closestDistance = Number.POSITIVE_INFINITY;
    expectedMs.forEach((expected, index) => {
      if (matchedExpected.has(index)) return;
      const distance = Math.abs(tapMs - expected);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex >= 0 && closestDistance <= toleranceMs) matchedExpected.add(closestIndex);
    else extraTaps += 1;
  }

  const correctTaps = matchedExpected.size;
  const missedTaps = expectedMs.length - correctTaps;
  const accuracyPercent = expectedMs.length + extraTaps === 0
    ? 0
    : Math.round((correctTaps / (expectedMs.length + extraTaps)) * 100);

  return {
    accuracyPercent,
    correctTaps,
    expectedTaps: expectedMs.length,
    extraTaps,
    missedTaps,
    passed: missedTaps === 0 && extraTaps === 0,
  };
}

export function isRhythmMissionUnlocked(missionId: string, completedMissionIds: readonly string[]): boolean {
  const missionIndex = RHYTHM_MISSIONS.findIndex((mission) => mission.id === missionId);
  if (missionIndex < 0) return false;
  if (missionIndex === 0) return true;
  return completedMissionIds.includes(RHYTHM_MISSIONS[missionIndex - 1]!.id);
}

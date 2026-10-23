import type {
  ExerciseSettings,
  RhythmPatternPair,
  Subdivision,
  TimeSignature,
  TrainingMode,
} from '@/types/rhythm';

export interface LearnLesson {
  id: string;
  number: number;
  title: string;
  level: 'START' | 'BUILD' | 'EXPLORE' | 'FINISH';
  skill: string;
  instruction: string;
  timeSignature: TimeSignature;
  bpm: number;
  feel: ExerciseSettings['feel'];
  trainingMode: TrainingMode;
  singleHand?: ExerciseSettings['singleHand'];
  patternPairs: readonly RhythmPatternPair[];
  changeIntervalBeats: ExerciseSettings['changeIntervalBeats'];
  restBetweenChanges?: boolean;
}

function pair(leftSubdivision: Subdivision, rightSubdivision: Subdivision): RhythmPatternPair {
  return { leftSubdivision, rightSubdivision };
}

export const LEARN_COURSE: readonly LearnLesson[] = [
  {
    id: 'steady-pulse',
    number: 1,
    title: 'Find the pulse',
    level: 'START',
    skill: 'One steady hand',
    instruction: 'Tap one comfortable hand on each beat. Let the click set an easy, even pace.',
    timeSignature: '4/4',
    bpm: 60,
    feel: 'straight',
    trainingMode: 'single-hand',
    patternPairs: [pair('quarter', 'quarter')],
    changeIntervalBeats: 4,
  },
  {
    id: 'together-pulse',
    number: 2,
    title: 'Two steady hands',
    level: 'START',
    skill: 'Match the pulse',
    instruction: 'Keep both hands together on every beat. Aim for one shared, relaxed pulse.',
    timeSignature: '4/4',
    bpm: 60,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('quarter', 'quarter')],
    changeIntervalBeats: 4,
  },
  {
    id: 'eighth-notes',
    number: 3,
    title: 'Fill the spaces',
    level: 'BUILD',
    skill: 'Quarter + eighth notes',
    instruction: 'Keep the left hand on the beat while the right hand plays two even notes per beat.',
    timeSignature: '4/4',
    bpm: 65,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('quarter', 'eighth')],
    changeIntervalBeats: 4,
  },
  {
    id: 'swap-hands',
    number: 4,
    title: 'Swap the roles',
    level: 'BUILD',
    skill: 'Eighth + quarter notes',
    instruction: 'Now the left hand fills the spaces. Keep the right hand anchored to the beat.',
    timeSignature: '4/4',
    bpm: 65,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('eighth', 'quarter')],
    changeIntervalBeats: 4,
  },
  {
    id: 'triplet-spacing',
    number: 5,
    title: 'Space three evenly',
    level: 'BUILD',
    skill: 'Quarter + triplets',
    instruction: 'Hold the quarter-note pulse while the other hand places three equal taps inside each beat.',
    timeSignature: '4/4',
    bpm: 65,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('quarter', 'triplet')],
    changeIntervalBeats: 4,
  },
  {
    id: 'two-against-three',
    number: 6,
    title: 'Two against three',
    level: 'BUILD',
    skill: 'Eighths + triplets',
    instruction: 'Keep two even notes flowing against three. Listen for where the hands meet again.',
    timeSignature: '4/4',
    bpm: 68,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('eighth', 'triplet'), pair('triplet', 'eighth')],
    changeIntervalBeats: 4,
  },
  {
    id: 'sixteenth-notes',
    number: 7,
    title: 'Add four-way motion',
    level: 'EXPLORE',
    skill: 'Quarter + sixteenths',
    instruction: 'Keep the pulse calm while one hand divides every beat into four equal notes.',
    timeSignature: '4/4',
    bpm: 68,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('quarter', 'sixteenth'), pair('sixteenth', 'quarter')],
    changeIntervalBeats: 4,
  },
  {
    id: 'compound-meter',
    number: 8,
    title: 'Feel compound time',
    level: 'EXPLORE',
    skill: '6/8 · groups of three',
    instruction: 'Feel two broad dotted-quarter pulses in each bar. Keep the eighth-note flow even.',
    timeSignature: '6/8',
    bpm: 64,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('eighth', 'triplet'), pair('triplet', 'eighth')],
    changeIntervalBeats: 2,
  },
  {
    id: 'swing-feel',
    number: 9,
    title: 'Lean into swing',
    level: 'EXPLORE',
    skill: 'Long–short eighths',
    instruction: 'Let each pair of eighth notes lean long–short. Keep the quarter-note hand steady.',
    timeSignature: '4/4',
    bpm: 70,
    feel: 'swing',
    trainingMode: 'two-hand',
    patternPairs: [pair('quarter', 'eighth'), pair('eighth', 'quarter')],
    changeIntervalBeats: 4,
  },
  {
    id: 'different-tuplets',
    number: 10,
    title: 'Compare tuplets',
    level: 'EXPLORE',
    skill: 'Duplets + quintuplets',
    instruction: 'Compare two and five evenly spaced notes per beat. Stay with the click through each switch.',
    timeSignature: '3/4',
    bpm: 62,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('duplet', 'quintuplet'), pair('quintuplet', 'duplet')],
    changeIntervalBeats: 2,
  },
  {
    id: 'fast-subdivisions',
    number: 11,
    title: 'Build fine control',
    level: 'FINISH',
    skill: '32nd + 64th notes',
    instruction: 'Use small, relaxed motions for the fast notes. Keep the slower hand clear and grounded.',
    timeSignature: '4/4',
    bpm: 60,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('sixteenth', 'thirtySecond'), pair('thirtySecond', 'sixtyFourth')],
    changeIntervalBeats: 4,
  },
  {
    id: 'rhythm-finale',
    number: 12,
    title: 'Put it together',
    level: 'FINISH',
    skill: 'Mixed meter + mixed groupings',
    instruction: 'Stay balanced through changing note groups, a longer bar, and a brief rest before each change.',
    timeSignature: '5/4',
    bpm: 66,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [
      pair('eighth', 'triplet'),
      pair('sixteenth', 'duplet'),
      pair('quintuplet', 'eighth'),
      pair('triplet', 'sixteenth'),
    ],
    changeIntervalBeats: 4,
    restBetweenChanges: true,
  },
];

export type LessonAvailability = 'complete' | 'available' | 'locked';

export function getLessonAvailability(
  lessonId: string,
  completedLessonIds: readonly string[],
): LessonAvailability {
  const index = LEARN_COURSE.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return 'locked';
  if (completedLessonIds.includes(lessonId)) return 'complete';
  if (index === 0 || completedLessonIds.includes(LEARN_COURSE[index - 1].id)) return 'available';
  return 'locked';
}

export function markLessonCompleted(
  completedLessonIds: readonly string[],
  lessonId: string,
): string[] {
  if (getLessonAvailability(lessonId, completedLessonIds) === 'locked') {
    return [...completedLessonIds];
  }
  return completedLessonIds.includes(lessonId)
    ? [...completedLessonIds]
    : [...completedLessonIds, lessonId];
}

export function parseCompletedLessonIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return LEARN_COURSE
      .filter((lesson) => parsed.includes(lesson.id))
      .map((lesson) => lesson.id);
  } catch {
    return [];
  }
}

export function lessonSettings(
  lesson: LearnLesson,
  preferences: ExerciseSettings,
): ExerciseSettings {
  const lessonSubdivisions = Array.from(new Set(
    lesson.patternPairs.flatMap((pattern) => [pattern.leftSubdivision, pattern.rightSubdivision]),
  ));
  return {
    ...preferences,
    bpm: lesson.bpm,
    timeSignature: lesson.timeSignature,
    durationSeconds: 30,
    changeIntervalBeats: lesson.changeIntervalBeats,
    restBetweenChanges: lesson.restBetweenChanges ?? false,
    enabledSubdivisions: lessonSubdivisions,
    feel: lesson.feel,
    graceNotesEnabled: false,
    trainingMode: lesson.trainingMode,
    ...(lesson.singleHand ? { singleHand: lesson.singleHand } : {}),
  };
}

export function lessonProgressPercent(completedLessonIds: readonly string[]): number {
  return Math.round((completedLessonIds.length / LEARN_COURSE.length) * 100);
}

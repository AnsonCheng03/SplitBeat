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
  handSubdivisionWeights?: Partial<Record<Subdivision, number>>;
  patternPairWeights?: readonly number[];
  changeIntervalBeats: ExerciseSettings['changeIntervalBeats'];
  restBetweenChanges?: boolean;
}

function pair(leftSubdivision: Subdivision, rightSubdivision: Subdivision): RhythmPatternPair {
  return { leftSubdivision, rightSubdivision };
}

const AUTHORED_LEARN_COURSE: readonly LearnLesson[] = [
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
    instruction: 'Keep quarter notes against even eighths. At the pattern changes, let the hands trade roles.',
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
    instruction: 'Trade the quarter and eighth roles every couple of beats. Keep both rhythms relaxed and even.',
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
    instruction: 'Hold the quarter pulse against three even taps, then let the hands trade rhythms at the changes.',
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
    instruction: 'Each hand can take the two-note or three-note flow. Keep both even as the combination changes.',
    timeSignature: '4/4',
    bpm: 68,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('eighth', 'triplet')],
    handSubdivisionWeights: { eighth: 60, triplet: 40 },
    changeIntervalBeats: 4,
  },
  {
    id: 'sixteenth-notes',
    number: 7,
    title: 'Add four-way motion',
    level: 'EXPLORE',
    skill: 'Crotchets, quavers, triplets + semiquavers',
    instruction: 'Each hand draws from the displayed mix. Keep the pulse calm as the note groups change.',
    timeSignature: '4/4',
    bpm: 68,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('quarter', 'quarter')],
    handSubdivisionWeights: { quarter: 50, eighth: 30, triplet: 10, sixteenth: 10 },
    changeIntervalBeats: 4,
  },
  {
    id: 'compound-meter',
    number: 8,
    title: 'Feel compound time',
    level: 'EXPLORE',
    skill: '6/8 · groups of three',
    instruction: 'Feel two broad dotted-quarter pulses. Either hand may carry the eighth or triplet flow.',
    timeSignature: '6/8',
    bpm: 64,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('eighth', 'eighth')],
    handSubdivisionWeights: { eighth: 50, triplet: 50 },
    changeIntervalBeats: 2,
  },
  {
    id: 'swing-feel',
    number: 9,
    title: 'Lean into swing',
    level: 'EXPLORE',
    skill: 'Long–short eighths',
    instruction: 'Let the eighth notes lean long–short. Each hand can move between the quarter pulse and swing.',
    timeSignature: '4/4',
    bpm: 70,
    feel: 'swing',
    trainingMode: 'two-hand',
    patternPairs: [pair('quarter', 'quarter')],
    handSubdivisionWeights: { quarter: 50, eighth: 50 },
    changeIntervalBeats: 4,
  },
  {
    id: 'different-tuplets',
    number: 10,
    title: 'Compare tuplets',
    level: 'EXPLORE',
    skill: 'Duplets + quintuplets',
    instruction: 'Each hand chooses duplets or quintuplets. Listen for where the two- and five-note groups meet.',
    timeSignature: '3/4',
    bpm: 62,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('duplet', 'duplet')],
    handSubdivisionWeights: { duplet: 50, quintuplet: 50 },
    changeIntervalBeats: 2,
  },
  {
    id: 'fast-subdivisions',
    number: 11,
    title: 'Build fine control',
    level: 'EXPLORE',
    skill: '32nd + 64th notes',
    instruction: 'Use small, relaxed motions as either hand moves from the pulse to very fast notes.',
    timeSignature: '4/4',
    bpm: 60,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('quarter', 'quarter')],
    handSubdivisionWeights: { quarter: 50, eighth: 20, sixteenth: 15, thirtySecond: 10, sixtyFourth: 5 },
    changeIntervalBeats: 4,
  },
  {
    id: 'switch-the-lead',
    number: 12,
    title: 'Switch the lead',
    level: 'EXPLORE',
    skill: 'Quarter + eighths · changing hands',
    instruction: 'Both hands draw from quarter and eighth patterns, so either can take the pulse or fill its spaces.',
    timeSignature: '4/4',
    bpm: 62,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('quarter', 'quarter')],
    handSubdivisionWeights: { quarter: 50, eighth: 50 },
    changeIntervalBeats: 2,
  },
  {
    id: 'trade-the-triplets',
    number: 13,
    title: 'Trade the triplets',
    level: 'EXPLORE',
    skill: 'Quarter + triplets · changing hands',
    instruction: 'Either hand may keep the quarter pulse or play three even notes. Stay relaxed as their roles change.',
    timeSignature: '4/4',
    bpm: 60,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('quarter', 'quarter')],
    handSubdivisionWeights: { quarter: 50, triplet: 50 },
    changeIntervalBeats: 2,
  },
  {
    id: 'trade-sixteenths',
    number: 14,
    title: 'Pass the fast rhythm',
    level: 'EXPLORE',
    skill: 'Eighths + sixteenths · changing hands',
    instruction: 'Both hands move between eighths and sixteenths. Keep the faster notes light and evenly spaced.',
    timeSignature: '4/4',
    bpm: 58,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('eighth', 'eighth')],
    handSubdivisionWeights: { eighth: 60, sixteenth: 40 },
    changeIntervalBeats: 2,
  },
  {
    id: 'share-the-rest',
    number: 15,
    title: 'Share the rest',
    level: 'EXPLORE',
    skill: 'One hand rests · then switch',
    instruction: 'One hand rests while the other keeps time. When the pattern changes, the resting hand takes over.',
    timeSignature: '4/4',
    bpm: 58,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [
      { leftSubdivision: 'quarter', rightSubdivision: 'eighth', leftRest: true },
      { leftSubdivision: 'quarter', rightSubdivision: 'eighth', rightRest: true },
    ],
    changeIntervalBeats: 4,
  },
  {
    id: 'three-against-five',
    number: 16,
    title: 'Three against five',
    level: 'EXPLORE',
    skill: 'Triplets + quintuplets · changing hands',
    instruction: 'Listen for the different points where three and five notes meet. Switch which hand plays each group.',
    timeSignature: '4/4',
    bpm: 56,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('triplet', 'triplet')],
    handSubdivisionWeights: { triplet: 50, quintuplet: 50 },
    changeIntervalBeats: 2,
  },
  {
    id: 'compound-handoff',
    number: 17,
    title: 'Trade in compound time',
    level: 'EXPLORE',
    skill: '9/8 · eighths + triplets',
    instruction: 'Feel three broad pulses in the bar. Either hand can carry the eighth or triplet flow.',
    timeSignature: '9/8',
    bpm: 56,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('eighth', 'eighth')],
    handSubdivisionWeights: { eighth: 50, triplet: 50 },
    changeIntervalBeats: 2,
  },
  {
    id: 'swing-handoff',
    number: 18,
    title: 'Swing both ways',
    level: 'EXPLORE',
    skill: 'Swing eighths · changing hands',
    instruction: 'Keep the long–short swing feel as either hand moves between the quarter pulse and eighths.',
    timeSignature: '4/4',
    bpm: 60,
    feel: 'swing',
    trainingMode: 'two-hand',
    patternPairs: [pair('quarter', 'quarter')],
    handSubdivisionWeights: { quarter: 50, eighth: 50 },
    changeIntervalBeats: 2,
  },
  {
    id: 'quick-handoffs',
    number: 19,
    title: 'Quick handoffs',
    level: 'FINISH',
    skill: 'Fast notes · rests before changes',
    instruction: 'Either hand may take the fast groups. Stay relaxed through the short breath and changing combinations.',
    timeSignature: '4/4',
    bpm: 54,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('sixteenth', 'sixteenth')],
    handSubdivisionWeights: { sixteenth: 50, thirtySecond: 30, sixtyFourth: 20 },
    changeIntervalBeats: 2,
    restBetweenChanges: true,
  },
  {
    id: 'rhythm-finale',
    number: 20,
    title: 'Put it together',
    level: 'FINISH',
    skill: 'Mixed meter + mixed groupings',
    instruction: 'Both hands draw from the full mix. Stay balanced through the longer bar and brief rest before each change.',
    timeSignature: '5/4',
    bpm: 66,
    feel: 'straight',
    trainingMode: 'two-hand',
    patternPairs: [pair('quarter', 'quarter')],
    handSubdivisionWeights: {
      quarter: 10,
      eighth: 30,
      triplet: 25,
      sixteenth: 20,
      quintuplet: 15,
    },
    changeIntervalBeats: 4,
    restBetweenChanges: true,
  },
];

function patternKey(pattern: RhythmPatternPair): string {
  return [
    pattern.leftSubdivision,
    pattern.rightSubdivision,
    pattern.leftRest === true,
    pattern.rightRest === true,
  ].join(':');
}

function swapPatternHands(pattern: RhythmPatternPair): RhythmPatternPair {
  return {
    leftSubdivision: pattern.rightSubdivision,
    rightSubdivision: pattern.leftSubdivision,
    ...(pattern.rightRest === undefined ? {} : { leftRest: pattern.rightRest }),
    ...(pattern.leftRest === undefined ? {} : { rightRest: pattern.leftRest }),
  };
}

interface PatternSet {
  patternPairs: RhythmPatternPair[];
  patternPairWeights?: number[];
}

function createWeightedHandPatterns(
  weights: Partial<Record<Subdivision, number>>,
): PatternSet {
  const divisions = Object.entries(weights)
    .filter((entry): entry is [Subdivision, number] => typeof entry[1] === 'number' && entry[1] > 0);
  const patternPairs = divisions.flatMap(([leftSubdivision]) =>
    divisions.map(([rightSubdivision]) => ({ leftSubdivision, rightSubdivision })),
  );
  const patternPairWeights = divisions.flatMap(([, leftWeight]) =>
    divisions.map(([, rightWeight]) => leftWeight * rightWeight),
  );
  return { patternPairs, patternPairWeights };
}

function addHandSwappedPatterns(
  patterns: readonly RhythmPatternPair[],
  weights?: readonly number[],
): PatternSet {
  const uniquePatterns = new Map<string, { pattern: RhythmPatternPair; weight: number }>();
  const addPattern = (pattern: RhythmPatternPair, weight: number) => {
    const key = patternKey(pattern);
    const current = uniquePatterns.get(key);
    uniquePatterns.set(key, { pattern, weight: (current?.weight ?? 0) + weight });
  };

  for (const [index, pattern] of patterns.entries()) {
    const weight = weights?.[index] ?? 1;
    addPattern(pattern, weight);
    addPattern(swapPatternHands(pattern), weight);
  }

  const values = [...uniquePatterns.values()];
  return {
    patternPairs: values.map(({ pattern }) => pattern),
    ...(weights ? { patternPairWeights: values.map(({ weight }) => weight) } : {}),
  };
}

export const LEARN_COURSE: readonly LearnLesson[] = AUTHORED_LEARN_COURSE.map((lesson) => {
  const authoredPatterns = lesson.handSubdivisionWeights
    ? createWeightedHandPatterns(lesson.handSubdivisionWeights)
    : { patternPairs: lesson.patternPairs, patternPairWeights: lesson.patternPairWeights };
  const patternSet = lesson.trainingMode === 'two-hand'
    ? addHandSwappedPatterns(authoredPatterns.patternPairs, authoredPatterns.patternPairWeights)
    : authoredPatterns;
  return {
    ...lesson,
    ...patternSet,
  };
});

export function lessonOffersHandSwaps(
  lesson: Pick<LearnLesson, 'trainingMode' | 'patternPairs'>,
): boolean {
  if (lesson.trainingMode !== 'two-hand') return false;
  const availablePatterns = new Set(lesson.patternPairs.map(patternKey));
  return lesson.patternPairs.some((pattern) => {
    const swapped = swapPatternHands(pattern);
    return patternKey(swapped) !== patternKey(pattern) && availablePatterns.has(patternKey(swapped));
  });
}

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

import type { ExerciseSettings, RhythmPatternPair, Subdivision } from '@/types/rhythm';

export interface FeatureFlagDefinition {
  id: string;
  label: string;
  description: string;
}

export const FEATURE_GROUPS = [
  {
    title: 'Practice modes',
    features: [
      { id: 'oneHandMode', label: 'One-hand practice', description: 'Practice with a full-screen tap area.' },
      { id: 'scoreNotation', label: 'Score notes', description: 'Show the rhythm as moving notes across bars.' },
      { id: 'focusPractice', label: 'Focus practice', description: 'Review pairs, choose patterns, and type a bar.' },
      { id: 'timingCalibration', label: 'Timing calibration', description: 'Adjust each hand for your device and touch response.' },
    ],
  },
  {
    title: 'Scores and learning',
    features: [
      { id: 'scoreImport', label: 'MIDI and MusicXML import', description: 'Train from one- or two-track score files.' },
      { id: 'savedScoreLibrary', label: 'Templates and saved scores', description: 'Keep imported scores and use built-in songs.' },
      { id: 'learnCourse', label: 'Learn course and purchase', description: 'Guided lessons, progress, and the course unlock.' },
    ],
  },
  {
    title: 'Rhythm features',
    features: [
      { id: 'rhythmExtensions', label: 'Tuplets, swing, and compound meter', description: 'Use tuplets, swung feel, and compound time signatures.' },
      { id: 'mixtures', label: 'Mixed-note patterns', description: 'Combine different note values and rests in a beat.' },
      { id: 'restsAndGrace', label: 'Rests and grace pickups', description: 'Add rests between changes or for one hand.' },
    ],
  },
  {
    title: 'Sound and feedback',
    features: [
      { id: 'soundEffects', label: 'Sound effects', description: 'Metronome, hand taps, and score-note sounds.' },
      { id: 'backgroundMusic', label: 'Beat-synced accompaniment', description: 'Play the generated chord backing during practice.' },
      { id: 'sessionCues', label: 'Start and change cues', description: 'Hear a start pickup and pattern-change cue.' },
      { id: 'shownRhythmPlayback', label: 'Play the shown rhythm', description: 'Hear each expected note for the left and right hands.' },
      { id: 'tapHaptics', label: 'Tap haptics', description: 'Add a light vibration when tapping.' },
      { id: 'tapFeedback', label: 'Correct and missed tap colors', description: 'Flash teal for a hit and red for an error.' },
    ],
  },
  {
    title: 'Challenges and progress',
    features: [
      { id: 'challengeMode', label: 'Mistake challenge', description: 'Pause or end a session after errors.' },
      { id: 'gameCenter', label: 'Game Center leaderboard', description: 'Submit and view your best clean streak on iOS.' },
      { id: 'sessionRecords', label: 'My Records', description: 'Save and review practice session summaries.' },
      { id: 'missedNoteReplay', label: 'Missed-note visual replay', description: 'Compare expected notes with your recorded taps.' },
      { id: 'externalKeyboard', label: 'External keyboard input', description: 'Play either hand with a connected keyboard.' },
    ],
  },
] as const satisfies readonly { title: string; features: readonly FeatureFlagDefinition[] }[];

export type FeatureFlagId = (typeof FEATURE_GROUPS)[number]['features'][number]['id'];
export type FeatureFlags = Record<FeatureFlagId, boolean>;

const FEATURE_FLAG_IDS = FEATURE_GROUPS.flatMap(({ features }) => features.map(({ id }) => id)) as FeatureFlagId[];

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = Object.fromEntries(
  FEATURE_FLAG_IDS.map((id) => [id, true]),
) as FeatureFlags;

const SIMPLE_TIME_SIGNATURES = ['2/4', '3/4', '4/4', '5/4', '7/4', '2/2', '3/8'] as const;
export const BASIC_SUBDIVISIONS = ['quarter', 'eighth', 'sixteenth'] as const satisfies readonly Subdivision[];

export function parseFeatureFlags(raw: string | null): FeatureFlags {
  if (!raw) return { ...DEFAULT_FEATURE_FLAGS };
  try {
    const parsed = JSON.parse(raw) as Partial<Record<FeatureFlagId, unknown>>;
    return Object.fromEntries(
      FEATURE_FLAG_IDS.map((id) => [id, typeof parsed[id] === 'boolean' ? parsed[id] : true]),
    ) as FeatureFlags;
  } catch {
    return { ...DEFAULT_FEATURE_FLAGS };
  }
}

export function applyFeatureFlagsToSettings(
  settings: ExerciseSettings,
  flags: FeatureFlags,
): ExerciseSettings {
  const enabledSubdivisions = flags.rhythmExtensions
    ? settings.enabledSubdivisions
    : settings.enabledSubdivisions.filter((subdivision) => BASIC_SUBDIVISIONS.includes(subdivision as (typeof BASIC_SUBDIVISIONS)[number]));
  const safeSubdivisions = enabledSubdivisions.length >= 2
    ? enabledSubdivisions
    : [...BASIC_SUBDIVISIONS];
  const timeSignature = flags.rhythmExtensions || SIMPLE_TIME_SIGNATURES.includes(settings.timeSignature as (typeof SIMPLE_TIME_SIGNATURES)[number])
    ? settings.timeSignature
    : '4/4';

  return {
    ...settings,
    trainingMode: flags.oneHandMode ? settings.trainingMode : 'two-hand',
    practiceDisplayMode: flags.scoreNotation ? settings.practiceDisplayMode : 'rhythm',
    timeSignature,
    feel: flags.rhythmExtensions ? settings.feel : 'straight',
    enabledSubdivisions: safeSubdivisions,
    enabledMixtures: flags.mixtures ? settings.enabledMixtures : [],
    mixtureNoteValues: flags.mixtures ? settings.mixtureNoteValues ?? [] : [],
    mixtureRestsEnabled: flags.mixtures && settings.mixtureRestsEnabled === true,
    graceNotesEnabled: flags.restsAndGrace && settings.graceNotesEnabled,
    restBetweenChanges: flags.restsAndGrace && settings.restBetweenChanges,
    handRestsEnabled: flags.restsAndGrace && settings.handRestsEnabled,
    soundEnabled: flags.soundEffects && settings.soundEnabled,
    backgroundMusicEnabled: flags.backgroundMusic && settings.backgroundMusicEnabled,
    sessionCuesEnabled: flags.sessionCues && settings.sessionCuesEnabled,
    referenceRhythmEnabled: flags.shownRhythmPlayback && settings.referenceRhythmEnabled,
    tapResultFlashEnabled: flags.tapFeedback && settings.tapResultFlashEnabled,
    hapticsEnabled: flags.tapHaptics && settings.hapticsEnabled,
    challengeAction: flags.challengeMode ? settings.challengeAction : 'off',
  };
}

export function applyFeatureFlagsToPatternPairs(
  pairs: readonly RhythmPatternPair[] | undefined,
  flags: FeatureFlags,
  enabledSubdivisions: readonly ExerciseSettings['enabledSubdivisions'][number][],
): readonly RhythmPatternPair[] | undefined {
  if (!pairs) return pairs;
  const fallback = enabledSubdivisions[0] ?? 'quarter';
  const subdivisionIsAvailable = (subdivision: RhythmPatternPair['leftSubdivision']) =>
    flags.rhythmExtensions || BASIC_SUBDIVISIONS.includes(subdivision as (typeof BASIC_SUBDIVISIONS)[number]);
  const applySubdivision = (subdivision: RhythmPatternPair['leftSubdivision']) =>
    subdivisionIsAvailable(subdivision) ? subdivision : fallback;

  return pairs.map((pair) => ({
    ...pair,
    leftSubdivision: applySubdivision(pair.leftSubdivision),
    rightSubdivision: applySubdivision(pair.rightSubdivision),
    leftMixture: flags.mixtures ? pair.leftMixture : undefined,
    rightMixture: flags.mixtures ? pair.rightMixture : undefined,
    leftRest: flags.restsAndGrace ? pair.leftRest : false,
    rightRest: flags.restsAndGrace ? pair.rightRest : false,
  }));
}

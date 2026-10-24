import type { ExerciseSettings, RhythmPatternPair, Subdivision } from '@/types/rhythm';

export const FEATURE_FLAG_IDS = [
  'oneHandMode',
  'scoreNotation',
  'focusPractice',
  'timingCalibration',
  'scoreImport',
  'savedScoreLibrary',
  'learnCourse',
  'rhythmExtensions',
  'mixtures',
  'restsAndGrace',
  'soundEffects',
  'backgroundMusic',
  'sessionCues',
  'shownRhythmPlayback',
  'tapHaptics',
  'tapFeedback',
  'challengeMode',
  'gameCenter',
  'sessionRecords',
  'missedNoteReplay',
  'externalKeyboard',
] as const;

export type FeatureFlagId = (typeof FEATURE_FLAG_IDS)[number];
export type FeatureFlags = Record<FeatureFlagId, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = Object.fromEntries(
  FEATURE_FLAG_IDS.map((id) => [id, true]),
) as FeatureFlags;

const SIMPLE_TIME_SIGNATURES = ['2/4', '3/4', '4/4', '5/4', '7/4', '2/2', '3/8'] as const;
export const BASIC_SUBDIVISIONS = ['quarter', 'eighth', 'sixteenth'] as const satisfies readonly Subdivision[];

export function parseFeatureFlags(raw: string | null | undefined): FeatureFlags {
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

/** Feature availability is embedded in the JS bundle at build time. */
export const BUILD_FEATURE_FLAGS = parseFeatureFlags(process.env.EXPO_PUBLIC_FEATURE_FLAGS);

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

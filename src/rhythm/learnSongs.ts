import { filterScoreTemplates, SCORE_TEMPLATES } from '@/rhythm/scoreTemplates';
import type { ScoreTemplate } from '@/rhythm/scoreTemplates';

/** Original, app-authored songs that can be practised from the Learn area. */
export const LEARN_SONGS: readonly ScoreTemplate[] = filterScoreTemplates(SCORE_TEMPLATES, {
  tags: ['Original'],
});

const LESSON_SONG_IDS: Readonly<Record<string, string>> = {
  'steady-pulse': 'pocket-parade-easy-duet',
  'together-pulse': 'pocket-parade-easy-duet',
  'eighth-notes': 'neon-skyline-easy-duet',
  'swap-hands': 'neon-skyline-easy-duet',
  'triplet-spacing': 'triple-trail-medium-duet',
  'two-against-three': 'triple-trail-medium-duet',
  'sixteenth-notes': 'midnight-lights-difficult-one-hand',
  'compound-meter': 'three-lanterns-easy-duet',
  'swing-feel': 'pop-groove-difficult-duet',
  'different-tuplets': 'roundabout-waltz-easy-duet',
  'fast-subdivisions': 'midnight-lights-difficult-one-hand',
  'switch-the-lead': 'neon-skyline-easy-duet',
  'trade-the-triplets': 'triple-trail-medium-duet',
  'trade-sixteenths': 'midnight-lights-difficult-one-hand',
  'share-the-rest': 'room-to-breathe-easy-duet',
  'three-against-five': 'pop-groove-difficult-duet',
  'compound-handoff': 'nine-bright-notes-medium-duet',
  'swing-handoff': 'pop-groove-difficult-duet',
  'quick-handoffs': 'midnight-lights-difficult-one-hand',
  'rhythm-finale': 'five-steps-home-medium-duet',
};

export function findLearnSong(songId: string | undefined): ScoreTemplate | undefined {
  return songId ? LEARN_SONGS.find((song) => song.id === songId) : undefined;
}

export function learnSongsForLesson(lessonId: string): ScoreTemplate[] {
  const songId = LESSON_SONG_IDS[lessonId];
  const song = findLearnSong(songId);
  return song ? [song] : [];
}

export function isLearnSong(song: ScoreTemplate): boolean {
  return LEARN_SONGS.some(({ id }) => id === song.id);
}

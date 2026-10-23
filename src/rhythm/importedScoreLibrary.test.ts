import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createImportedScoreEntry,
  parseImportedScoreLibrary,
  placeSingleTrackOnHand,
  rememberImportedScore,
  setImportedScoreSaved,
} from '@/rhythm/importedScoreLibrary';
import { SCORE_TEMPLATES } from '@/rhythm/scoreTemplates';

const templateScore = SCORE_TEMPLATES[0]!.score;

test('remembers imported scores locally and deduplicates the same file', () => {
  const first = createImportedScoreEntry('midi', 'piano.mid', templateScore, 10);
  const repeated = createImportedScoreEntry('midi', 'piano.mid', templateScore, 20);
  const once = rememberImportedScore([], first);
  const twice = rememberImportedScore(once, repeated);
  assert.equal(twice.length, 1);
  assert.equal(twice[0]!.lastUsedAt, 20);
});

test('saved scores stay saved when the file is imported again', () => {
  const entry = createImportedScoreEntry('musicxml', 'etude.musicxml', templateScore, 1);
  const saved = setImportedScoreSaved([entry], entry.id, true);
  const reopened = createImportedScoreEntry('musicxml', 'etude.musicxml', templateScore, 2);
  const updated = rememberImportedScore(saved, reopened);
  assert.equal(updated[0]!.saved, true);
  assert.equal(updated[0]!.lastUsedAt, 2);
});

test('parses saved score entries and discards malformed persisted values', () => {
  const entry = createImportedScoreEntry('template', 'Ode to Joy', SCORE_TEMPLATES[1]!.score, 3);
  const valid = parseImportedScoreLibrary(JSON.stringify({ version: 1, entries: [entry, null, { ...entry, score: {} }] }));
  assert.deepEqual(valid.map(({ id }) => id), [entry.id]);
  assert.deepEqual(parseImportedScoreLibrary('{corrupt'), []);
});

test('keeps only the latest twenty unsaved score imports', () => {
  const entries = Array.from({ length: 22 }, (_, index) => createImportedScoreEntry(
    'midi',
    `score-${index}.mid`,
    { ...templateScore, title: `Score ${index}` },
    index,
  ));
  const recent = entries.reduce((current, entry) => rememberImportedScore(current, entry), [] as typeof entries);
  assert.equal(recent.length, 20);
  assert.equal(recent[0]!.fileName, 'score-21.mid');
});

test('assigns a one-track score to the hand chosen for one-hand training', () => {
  const oneHandScore = SCORE_TEMPLATES[1]!.score;
  const leftHandScore = placeSingleTrackOnHand(oneHandScore, 'left');
  assert.ok(leftHandScore.measures.some((measure) => measure.leftEvents.length > 0));
  assert.ok(leftHandScore.measures.every((measure) => measure.rightEvents.length === 0));
  assert.equal(leftHandScore.trackCount, 1);
});

test('provides built-in public-domain song templates with only one or two tracks', () => {
  assert.equal(SCORE_TEMPLATES.length >= 3, true);
  assert.equal(SCORE_TEMPLATES[0]!.title, 'Jingle Bells');
  assert.equal(SCORE_TEMPLATES[0]!.score.trackCount, 2);
  assert.equal(SCORE_TEMPLATES[1]!.score.trackCount, 1);
  assert.ok(SCORE_TEMPLATES.every((template) => template.score.trackCount === 1 || template.score.trackCount === 2));
});

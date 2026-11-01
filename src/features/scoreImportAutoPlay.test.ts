import assert from 'node:assert/strict';
import test from 'node:test';
import { importedScoreAutoPlayEnabled } from '@/features/scoreImport/scoreAutoPlay';

test('MIDI auto-play follows the choice made on the score start screen', () => {
  assert.equal(importedScoreAutoPlayEnabled({ source: 'midi', midiAutoPlay: true, savedAutoPlay: false, featureEnabled: true }), true);
  assert.equal(importedScoreAutoPlayEnabled({ source: 'midi', midiAutoPlay: false, savedAutoPlay: true, featureEnabled: true }), false);
});

test('other score sources keep the saved auto-play preference', () => {
  assert.equal(importedScoreAutoPlayEnabled({ source: 'musicxml', midiAutoPlay: true, savedAutoPlay: false, featureEnabled: true }), false);
  assert.equal(importedScoreAutoPlayEnabled({ source: 'template', midiAutoPlay: false, savedAutoPlay: true, featureEnabled: true }), true);
});

test('a disabled auto-play feature flag always mutes reference note playback', () => {
  assert.equal(importedScoreAutoPlayEnabled({ source: 'midi', midiAutoPlay: true, savedAutoPlay: true, featureEnabled: false }), false);
});

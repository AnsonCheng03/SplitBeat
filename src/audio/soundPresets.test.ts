import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createClickSamples,
  createPitchedNoteSamples,
  midiPitchToFrequency,
  SOUND_OPTIONS,
} from './soundPresets';

test('sound choices are unique and each choice produces its own offline click', () => {
  const soundIds = SOUND_OPTIONS.map(({ value }) => value);
  assert.equal(new Set(soundIds).size, soundIds.length);

  const samples = soundIds.map((sound) => createClickSamples(sound, 44_100));
  for (const click of samples) {
    assert.ok(click.length > 0);
    assert.ok([...click].every(Number.isFinite));
    assert.ok([...click].every((sample) => Math.abs(sample) <= 1));
  }

  for (let first = 0; first < samples.length; first += 1) {
    for (let second = first + 1; second < samples.length; second += 1) {
      const differs = samples[first].some((sample, index) => sample !== samples[second][index]);
      assert.ok(differs, `${soundIds[first]} and ${soundIds[second]} should sound different`);
    }
  }
});

test('MusicXML MIDI pitches map to equal-tempered frequencies and playable offline samples', () => {
  assert.equal(midiPitchToFrequency(69), 440);
  assert.ok(Math.abs(midiPitchToFrequency(60) - 261.625565) < 0.001);

  const note = createPitchedNoteSamples(60, 44_100);
  assert.equal(note.length, Math.ceil(44_100 * 0.22));
  assert.ok([...note].every(Number.isFinite));
  assert.ok([...note].every((sample) => Math.abs(sample) <= 1));
});

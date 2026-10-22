import assert from 'node:assert/strict';
import test from 'node:test';
import { createClickSamples, SOUND_OPTIONS } from './soundPresets';

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

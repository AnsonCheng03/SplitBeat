import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeBase64Bytes, parseMidiRhythm } from '@/rhythm/midiParser';

function variableLength(value: number): number[] {
  const bytes = [value & 0x7f];
  let remaining = value >>> 7;
  while (remaining > 0) {
    bytes.unshift((remaining & 0x7f) | 0x80);
    remaining >>>= 7;
  }
  return bytes;
}

function chunk(name: string, data: readonly number[]): number[] {
  const length = data.length;
  return [
    ...name.split('').map((character) => character.charCodeAt(0)),
    (length >>> 24) & 0xff,
    (length >>> 16) & 0xff,
    (length >>> 8) & 0xff,
    length & 0xff,
    ...data,
  ];
}

function track(events: readonly number[]): number[] {
  return chunk('MTrk', [...events, 0, 0xff, 0x2f, 0]);
}

function midiFile(tracks: readonly (readonly number[])[], format = tracks.length > 1 ? 1 : 0, division = 480): Uint8Array {
  return new Uint8Array([
    ...chunk('MThd', [0, format, 0, tracks.length, (division >>> 8) & 0xff, division & 0xff]),
    ...tracks.flatMap((events) => track(events)),
  ]);
}

function noteTrack(pitch: number, lengthTicks = 480): number[] {
  return [
    0, 0x90, pitch, 100,
    ...variableLength(lengthTicks), 0x80, pitch, 0,
  ];
}

const conductorTrack = [
  0, 0xff, 0x51, 3, 0x07, 0xa1, 0x20,
  0, 0xff, 0x58, 4, 4, 2, 24, 8,
];

test('parses a single musical MIDI track as a one-hand score', () => {
  const score = parseMidiRhythm(midiFile([[...conductorTrack, ...noteTrack(60)]]), 'melody.mid');
  assert.equal(score.title, 'melody.mid');
  assert.equal(score.trackCount, 1);
  assert.equal(score.timeSignature, '4/4');
  assert.equal(score.bpm, 120);
  assert.deepEqual(score.measures[0]!.rightEvents, [
    { startQuarter: 0, durationQuarter: 1, midiPitches: [60] },
  ]);
  assert.deepEqual(score.measures[0]!.leftEvents, []);
});

test('maps two synchronized MIDI tracks to independent right- and left-hand parts', () => {
  const score = parseMidiRhythm(
    midiFile([conductorTrack, noteTrack(72), noteTrack(48)]),
    'piano.midi',
  );
  assert.equal(score.trackCount, 2);
  assert.deepEqual(score.measures[0]!.rightEvents[0]!.midiPitches, [72]);
  assert.deepEqual(score.measures[0]!.leftEvents[0]!.midiPitches, [48]);
});

test('ignores conductor-only tracks when enforcing the one-or-two musical-track limit', () => {
  const score = parseMidiRhythm(
    midiFile([conductorTrack, noteTrack(60), noteTrack(64), [0, 0xff, 0x2f, 0]]),
  );
  assert.equal(score.trackCount, 2);
});

test('rejects MIDI files with more than two note-bearing tracks', () => {
  assert.throws(
    () => parseMidiRhythm(midiFile([noteTrack(60), noteTrack(64), noteTrack(67)])),
    /one or two tracks/,
  );
});

test('rejects asynchronous type 2 MIDI and changing tempo or meter', () => {
  assert.throws(() => parseMidiRhythm(midiFile([noteTrack(60)], 2)), /Type 2 MIDI/);
  const changingTempo = [
    ...conductorTrack,
    0, 0xff, 0x51, 3, 0x06, 0x1a, 0x80,
    ...noteTrack(60),
  ];
  assert.throws(
    () => parseMidiRhythm(midiFile([changingTempo])),
    /Tempo changes/,
  );
  const changingMeter = [
    ...conductorTrack,
    0, 0xff, 0x58, 4, 3, 2, 24, 8,
    ...noteTrack(60),
  ];
  assert.throws(
    () => parseMidiRhythm(midiFile([changingMeter])),
    /Time signature changes/,
  );
});

test('rejects invalid MIDI bytes and unsupported SMPTE timing', () => {
  assert.throws(() => parseMidiRhythm(new Uint8Array([0, 1, 2])), /valid Standard MIDI/);
  assert.throws(() => parseMidiRhythm(midiFile([noteTrack(60)], 0, 0xe728)), /SMPTE-timed/);
  const excessivelyLongNote = [0, 0x90, 60, 100, ...variableLength(0x0fffffff), 0x80, 60, 0];
  assert.throws(() => parseMidiRhythm(midiFile([excessivelyLongNote], 0, 1)), /too long to preview/);
});

test('decodes the Base64 file content returned by the system picker', () => {
  assert.deepEqual([...decodeBase64Bytes('TVRoZA==')], [0x4d, 0x54, 0x68, 0x64]);
  assert.throws(() => decodeBase64Bytes('bad?'), /could not be read/);
});

import { TIME_SIGNATURES } from '@/types/rhythm';
import type { TimeSignature } from '@/types/rhythm';
import type { ImportedRhythmScore, ScoreRhythmEvent } from '@/types/importedScore';

interface MidiNote {
  pitch: number;
  startTick: number;
  endTick: number;
}

interface MidiTrack {
  name: string;
  notes: MidiNote[];
  endTick: number;
  tempos: number[];
  timeSignatures: TimeSignature[];
}

interface Cursor {
  offset: number;
}

const MAX_MIDI_BYTES = 5_000_000;
const MAX_MIDI_NOTES = 50_000;
const MAX_MIDI_MEASURES = 2_000;

function readUint16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset]! << 8) | bytes[offset + 1]!;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset]! * 0x1000000)
    + (bytes[offset + 1]! << 16)
    + (bytes[offset + 2]! << 8)
    + bytes[offset + 3]!;
}

function hasChunkName(bytes: Uint8Array, offset: number, expected: string): boolean {
  return expected.split('').every((character, index) => bytes[offset + index] === character.charCodeAt(0));
}

function ensureAvailable(bytes: Uint8Array, offset: number, count: number, end: number): void {
  if (!Number.isInteger(count) || count < 0 || offset + count > end || offset + count > bytes.length) {
    throw new Error('The MIDI file is incomplete or malformed.');
  }
}

function readVariableLength(bytes: Uint8Array, cursor: Cursor, end: number): number {
  let value = 0;
  for (let index = 0; index < 4; index += 1) {
    ensureAvailable(bytes, cursor.offset, 1, end);
    const byte = bytes[cursor.offset]!;
    cursor.offset += 1;
    value = value * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) return value;
  }
  throw new Error('The MIDI file contains an invalid variable-length value.');
}

function readTrackName(bytes: Uint8Array, start: number, length: number): string {
  const textBytes = bytes.subarray(start, start + Math.min(length, 256));
  let text = '';
  for (const byte of textBytes) text += String.fromCharCode(byte);
  return text.trim();
}

function readTrack(bytes: Uint8Array, start: number, length: number): MidiTrack {
  const end = start + length;
  const cursor = { offset: start };
  const activeNotes = new Map<string, MidiNote[]>();
  const notes: MidiNote[] = [];
  const tempos: number[] = [];
  const timeSignatures: TimeSignature[] = [];
  let name = '';
  let absoluteTick = 0;
  let runningStatus = 0;

  while (cursor.offset < end) {
    absoluteTick += readVariableLength(bytes, cursor, end);
    ensureAvailable(bytes, cursor.offset, 1, end);
    let status = bytes[cursor.offset]!;
    if (status >= 0x80) {
      cursor.offset += 1;
      if (status < 0xf0) runningStatus = status;
    } else {
      if (runningStatus === 0) throw new Error('The MIDI file contains a data event without a status.');
      status = runningStatus;
    }

    if (status === 0xff) {
      ensureAvailable(bytes, cursor.offset, 1, end);
      const metaType = bytes[cursor.offset]!;
      cursor.offset += 1;
      const metaLength = readVariableLength(bytes, cursor, end);
      ensureAvailable(bytes, cursor.offset, metaLength, end);
      if (metaType === 0x03 && !name) name = readTrackName(bytes, cursor.offset, metaLength);
      if (metaType === 0x51 && metaLength === 3) {
        const microsecondsPerQuarter = (bytes[cursor.offset]! << 16)
          | (bytes[cursor.offset + 1]! << 8)
          | bytes[cursor.offset + 2]!;
        if (microsecondsPerQuarter > 0) tempos.push(microsecondsPerQuarter);
      }
      if (metaType === 0x58 && metaLength >= 2) {
        const numerator = bytes[cursor.offset]!;
        const denominatorExponent = bytes[cursor.offset + 1]!;
        if (denominatorExponent > 7) {
          throw new Error('This MIDI file uses a time signature that is not supported.');
        }
        const signature = `${numerator}/${2 ** denominatorExponent}`;
        if (!TIME_SIGNATURES.includes(signature as TimeSignature)) {
          throw new Error(`The ${signature} time signature is not supported for score training yet.`);
        }
        timeSignatures.push(signature as TimeSignature);
      }
      cursor.offset += metaLength;
      if (metaType === 0x2f) break;
      continue;
    }

    if (status === 0xf0 || status === 0xf7) {
      const sysexLength = readVariableLength(bytes, cursor, end);
      ensureAvailable(bytes, cursor.offset, sysexLength, end);
      cursor.offset += sysexLength;
      continue;
    }

    if (status >= 0xf0) {
      const systemDataLength = status === 0xf1 || status === 0xf3 ? 1 : status === 0xf2 ? 2 : 0;
      ensureAvailable(bytes, cursor.offset, systemDataLength, end);
      cursor.offset += systemDataLength;
      continue;
    }

    const command = status & 0xf0;
    const channel = status & 0x0f;
    const dataLength = command === 0xc0 || command === 0xd0 ? 1 : 2;
    ensureAvailable(bytes, cursor.offset, dataLength, end);
    const firstData = bytes[cursor.offset]!;
    const secondData = dataLength === 2 ? bytes[cursor.offset + 1]! : 0;
    if (firstData >= 0x80 || secondData >= 0x80) {
      throw new Error('The MIDI file contains an invalid channel event.');
    }
    cursor.offset += dataLength;

    const noteKey = `${channel}:${firstData}`;
    if (command === 0x90 && secondData > 0) {
      const activeForPitch = activeNotes.get(noteKey) ?? [];
      activeForPitch.push({ pitch: firstData, startTick: absoluteTick, endTick: absoluteTick });
      activeNotes.set(noteKey, activeForPitch);
    } else if (command === 0x80 || (command === 0x90 && secondData === 0)) {
      const activeForPitch = activeNotes.get(noteKey);
      const note = activeForPitch?.shift();
      if (note) {
        note.endTick = absoluteTick;
        if (note.endTick > note.startTick) notes.push(note);
        if (activeForPitch?.length === 0) activeNotes.delete(noteKey);
      }
    }
  }

  for (const activeForPitch of activeNotes.values()) {
    for (const note of activeForPitch) {
      note.endTick = Math.max(absoluteTick, note.startTick + 1);
      notes.push(note);
    }
  }
  return { name, notes, endTick: absoluteTick, tempos, timeSignatures };
}

function makeMeasureEvents(
  notes: readonly MidiNote[],
  ticksPerQuarter: number,
  measureLengthQuarter: number,
  measureCount: number,
): ScoreRhythmEvent[][] {
  const measures = Array.from({ length: measureCount }, () => new Map<number, ScoreRhythmEvent>());
  for (const note of notes) {
    const absoluteStartQuarter = note.startTick / ticksPerQuarter;
    let absoluteSegmentStart = absoluteStartQuarter;
    let remainingQuarter = (note.endTick - note.startTick) / ticksPerQuarter;
    let isInitialSegment = true;

    while (remainingQuarter > 1e-7) {
      const measureIndex = Math.floor(absoluteSegmentStart / measureLengthQuarter + 1e-9);
      if (measureIndex >= measureCount) break;
      const measureStartQuarter = measureIndex * measureLengthQuarter;
      const measureOffset = absoluteSegmentStart - measureStartQuarter;
      const segmentDuration = Math.min(remainingQuarter, measureLengthQuarter - measureOffset);
      if (segmentDuration <= 0) break;

      const startsFollowingSegment = remainingQuarter > segmentDuration + 1e-7;
      const key = Number(measureOffset.toFixed(7));
      const events = measures[measureIndex]!;
      const existing = events.get(key);
      if (existing) {
        const pitches = existing.midiPitches ?? (existing.midiPitches = []);
        if (!pitches.includes(note.pitch)) pitches.push(note.pitch);
        existing.durationQuarter = Math.max(existing.durationQuarter, isInitialSegment ? remainingQuarter : segmentDuration);
        if (!isInitialSegment || startsFollowingSegment) {
          existing.notationDurationQuarter = Math.max(existing.notationDurationQuarter ?? 0, segmentDuration);
        }
        if (!isInitialSegment) {
          existing.tieFromPrevious = true;
          if (existing.isTieContinuation === undefined) {
            existing.isTieContinuation = false;
            existing.isCrossBarTieContinuation = false;
          }
        }
        if (startsFollowingSegment) existing.tieToNext = true;
        if (isInitialSegment) {
          existing.isTieContinuation = false;
          existing.isCrossBarTieContinuation = false;
        }
      } else {
        events.set(key, {
          startQuarter: key,
          durationQuarter: isInitialSegment ? remainingQuarter : segmentDuration,
          ...(!isInitialSegment || startsFollowingSegment ? { notationDurationQuarter: segmentDuration } : {}),
          midiPitches: [note.pitch],
          ...(startsFollowingSegment ? { tieToNext: true } : {}),
          ...(!isInitialSegment ? {
            tieFromPrevious: true,
            isTieContinuation: true,
            isCrossBarTieContinuation: true,
          } : {}),
        });
      }

      remainingQuarter -= segmentDuration;
      absoluteSegmentStart += segmentDuration;
      isInitialSegment = false;
    }
  }
  return measures.map((events) => [...events.values()].sort((first, second) => first.startQuarter - second.startQuarter));
}

/** Converts a synchronized Standard MIDI file to one- or two-hand rhythm tracks. */
export function parseMidiRhythm(bytes: Uint8Array, title = 'Imported MIDI'): ImportedRhythmScore {
  if (bytes.length > MAX_MIDI_BYTES) {
    throw new Error('This MIDI file is too large to import (maximum 5 MB).');
  }
  if (!hasChunkName(bytes, 0, 'MThd') || bytes.length < 14) {
    throw new Error('Please select a valid Standard MIDI file (.mid or .midi).');
  }

  const headerLength = readUint32(bytes, 4);
  if (headerLength < 6 || 8 + headerLength > bytes.length) {
    throw new Error('The MIDI file has an invalid header.');
  }
  const format = readUint16(bytes, 8);
  const declaredTrackCount = readUint16(bytes, 10);
  const division = readUint16(bytes, 12);
  if (format === 2) throw new Error('Type 2 MIDI files are not synchronized; use a type 0 or type 1 file.');
  if (format !== 0 && format !== 1) throw new Error('This MIDI file format is not supported.');
  if (format === 0 && declaredTrackCount !== 1) throw new Error('A type 0 MIDI file must contain exactly one track.');
  if (format === 1 && declaredTrackCount < 1) throw new Error('The MIDI file does not contain any tracks.');
  if ((division & 0x8000) !== 0 || division === 0) {
    throw new Error('SMPTE-timed MIDI files are not supported; use a MIDI file with quarter-note timing.');
  }

  const tracks: MidiTrack[] = [];
  let offset = 8 + headerLength;
  for (let trackIndex = 0; trackIndex < declaredTrackCount; trackIndex += 1) {
    if (!hasChunkName(bytes, offset, 'MTrk')) throw new Error('The MIDI file is missing a track chunk.');
    ensureAvailable(bytes, offset, 8, bytes.length);
    const trackLength = readUint32(bytes, offset + 4);
    const trackStart = offset + 8;
    ensureAvailable(bytes, trackStart, trackLength, bytes.length);
    tracks.push(readTrack(bytes, trackStart, trackLength));
    offset = trackStart + trackLength;
  }

  const musicalTracks = tracks.filter((track) => track.notes.length > 0);
  if (musicalTracks.length === 0) throw new Error('No playable notes were found in the MIDI file.');
  if (musicalTracks.length > 2) {
    throw new Error(`This MIDI file has ${musicalTracks.length} musical tracks; import a file with one or two tracks.`);
  }
  if (musicalTracks.reduce((count, track) => count + track.notes.length, 0) > MAX_MIDI_NOTES) {
    throw new Error('This MIDI file contains too many notes to preview (maximum 50,000).');
  }

  const tempos = new Set(tracks.flatMap((track) => track.tempos));
  if (tempos.size > 1) throw new Error('Tempo changes within a MIDI file are not supported yet.');
  const signatures = new Set(tracks.flatMap((track) => track.timeSignatures));
  if (signatures.size > 1) throw new Error('Time signature changes within a MIDI file are not supported yet.');
  const timeSignature = Array.from(signatures)[0] ?? '4/4';
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  const measureLengthQuarter = (numerator! * 4) / denominator!;
  const allNotes = musicalTracks.flatMap((track) => track.notes);
  const totalQuarterNotes = Math.max(...allNotes.map((note) => note.endTick / division));
  const measureCount = Math.max(1, Math.ceil((totalQuarterNotes - 1e-9) / measureLengthQuarter));
  if (measureCount > MAX_MIDI_MEASURES) {
    throw new Error(`This MIDI file is too long to preview (maximum ${MAX_MIDI_MEASURES} bars).`);
  }
  const mappedTracks = musicalTracks.map((track) => makeMeasureEvents(
    track.notes,
    division,
    measureLengthQuarter,
    measureCount,
  ));
  const tempoMicroseconds = Array.from(tempos)[0];
  const pulseQuarterNotes = denominator === 8 && numerator! >= 6 ? 1.5 : 4 / denominator!;
  const quarterBpm = tempoMicroseconds ? 60_000_000 / tempoMicroseconds : null;
  const bpm = quarterBpm === null
    ? null
    : Math.max(40, Math.min(200, Math.round(quarterBpm / pulseQuarterNotes)));
  const measures = Array.from({ length: measureCount }, (_, index) => ({
    index,
    startQuarter: index * measureLengthQuarter,
    durationQuarter: measureLengthQuarter,
    leftEvents: mappedTracks[1]?.[index] ?? [],
    rightEvents: mappedTracks[0]?.[index] ?? [],
  }));

  return {
    formatVersion: 1,
    title: title.trim() || musicalTracks[0]!.name || 'Imported MIDI',
    timeSignature,
    trackCount: musicalTracks.length as 1 | 2,
    bpm,
    measures,
    totalQuarterNotes: measureCount * measureLengthQuarter,
    warnings: [],
  };
}

/** Decodes the Base64 string returned by Expo DocumentPicker's copied file. */
export function decodeBase64Bytes(base64: string): Uint8Array {
  const normalized = base64.replace(/\s/g, '').replace(/=+$/, '');
  if (normalized.length % 4 === 1) throw new Error('The selected MIDI file could not be read.');
  const output = new Uint8Array(Math.floor((normalized.length * 6) / 8));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let buffer = 0;
  let bits = 0;
  let outputIndex = 0;
  for (const character of normalized) {
    const value = alphabet.indexOf(character);
    if (value < 0) throw new Error('The selected MIDI file could not be read.');
    buffer = ((buffer << 6) | value) & 0xffffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output[outputIndex] = (buffer >> bits) & 0xff;
      outputIndex += 1;
    }
  }
  return output;
}

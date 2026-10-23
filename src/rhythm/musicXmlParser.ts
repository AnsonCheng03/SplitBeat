import { parser as createXmlParser } from 'sax';
import { TIME_SIGNATURES } from '@/types/rhythm';
import type { TimeSignature } from '@/types/rhythm';
import type {
  ImportedRhythmScore,
  ScoreRhythmEvent,
  ScoreRhythmMeasure,
} from '@/types/importedScore';

interface XmlNode {
  name: string;
  attributes: Record<string, string>;
  text: string;
  children: XmlNode[];
}

interface ScorePart {
  id: string;
  measures: XmlNode[];
  staffCount: number;
}

interface MutableScoreEvent extends ScoreRhythmEvent {
  absoluteStartQuarter: number;
  pitchKey: string;
}

interface StaffSelection {
  partIndex: number;
  staff: number;
}

const MAX_MUSICXML_LENGTH = 5_000_000;
const MAX_MUSICXML_MEASURES = 2_000;
const MUSICXML_NOTE_UNITS: Record<string, number> = {
  maxima: 32,
  long: 16,
  breve: 8,
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  '16th': 0.25,
  '32nd': 0.125,
  '64th': 0.0625,
  '128th': 0.03125,
  '256th': 0.015625,
};

function localName(name: string): string {
  return name.split(':').at(-1) ?? name;
}

function parseXml(xml: string): XmlNode {
  if (xml.length > MAX_MUSICXML_LENGTH) {
    throw new Error('This MusicXML file is too large to import (maximum 5 MB).');
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) {
    throw new Error('MusicXML files with document type declarations are not supported.');
  }

  const stack: XmlNode[] = [];
  let root: XmlNode | null = null;
  const parseFailure: { error?: Error } = {};
  const parser = createXmlParser(true, { trim: false });
  parser.onopentag = (tag) => {
    const node: XmlNode = {
      name: localName(tag.name),
      attributes: tag.attributes,
      text: '',
      children: [],
    };
    stack.at(-1)?.children.push(node);
    if (!root) root = node;
    stack.push(node);
  };
  parser.ontext = (text) => {
    const current = stack.at(-1);
    if (current) current.text += text;
  };
  parser.onclosetag = () => {
    stack.pop();
  };
  parser.onerror = (error) => {
    parseFailure.error = error;
    parser.resume();
  };

  parser.write(xml).close();
  if (parseFailure.error) throw new Error(`Invalid MusicXML: ${parseFailure.error.message}`);
  if (!root) throw new Error('The selected file does not contain a MusicXML score.');
  return root;
}

function children(node: XmlNode | undefined, name: string): XmlNode[] {
  return node?.children.filter((child) => child.name === name) ?? [];
}

function first(node: XmlNode | undefined, name: string): XmlNode | undefined {
  return children(node, name)[0];
}

function value(node: XmlNode | undefined): string {
  return node?.text.trim() ?? '';
}

function numberValue(node: XmlNode | undefined, label: string): number {
  const parsed = Number(value(node));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`MusicXML is missing a valid ${label}.`);
  }
  return parsed;
}

function readParts(root: XmlNode): ScorePart[] {
  const parts = children(root, 'part');
  return parts.map((part, partIndex) => {
    const measures = children(part, 'measure');
    let staffCount = 1;
    for (const measure of measures) {
      for (const attributes of children(measure, 'attributes')) {
        const declaredStaves = Number(value(first(attributes, 'staves')));
        if (Number.isInteger(declaredStaves) && declaredStaves > staffCount) {
          staffCount = declaredStaves;
        }
      }
      for (const note of children(measure, 'note')) {
        const staff = Number(value(first(note, 'staff')) || '1');
        if (Number.isInteger(staff) && staff > staffCount) staffCount = staff;
      }
    }
    return {
      id: part.attributes.id || `part-${partIndex + 1}`,
      measures,
      staffCount,
    };
  });
}

function readTimeSignature(parts: ScorePart[]): TimeSignature {
  const signatures = new Set<TimeSignature>();
  for (const part of parts) {
    for (const measure of part.measures) {
      for (const time of children(first(measure, 'attributes'), 'time')) {
        const beatGroups = children(time, 'beats');
        const beatTypes = children(time, 'beat-type');
        if (beatGroups.length !== 1 || beatTypes.length !== 1) {
          throw new Error('This score uses a composite time signature that is not supported yet.');
        }
        const beats = value(beatGroups[0])
          .split('+')
          .map(Number)
          .reduce((sum, beat) => sum + beat, 0);
        const beatType = Number(value(beatTypes[0]));
        if (!Number.isInteger(beats) || beats < 1 || !Number.isInteger(beatType)) {
          throw new Error('This score uses a time signature that is not supported yet.');
        }
        const signature = `${beats}/${beatType}`;
        if (!TIME_SIGNATURES.includes(signature as TimeSignature)) {
          throw new Error(`The ${signature} time signature is not supported for score training yet.`);
        }
        signatures.add(signature as TimeSignature);
      }
    }
  }
  if (signatures.size > 1) {
    throw new Error('Time signature changes within a score are not supported yet.');
  }
  return Array.from(signatures)[0] ?? '4/4';
}

function readQuarterNoteTempo(root: XmlNode): number | null {
  const directions: XmlNode[] = [];
  const quarterTempi: number[] = [];
  const collect = (node: XmlNode) => {
    if (node.name === 'sound' && node.attributes.tempo) directions.push(node);
    if (node.name === 'metronome') directions.push(node);
    node.children.forEach(collect);
  };
  collect(root);

  for (const direction of directions) {
    if (direction.name === 'sound') {
      const tempo = Number(direction.attributes.tempo);
      if (Number.isFinite(tempo) && tempo > 0) quarterTempi.push(tempo);
      continue;
    }
    const unit = value(first(direction, 'beat-unit'));
    const quarterUnits = MUSICXML_NOTE_UNITS[unit];
    const perMinute = Number(value(first(direction, 'per-minute')));
    if (!quarterUnits || !Number.isFinite(perMinute) || perMinute <= 0) continue;
    const dots = children(direction, 'beat-unit-dot').length;
    const dotMultiplier = dots === 0 ? 1 : dots === 1 ? 1.5 : dots === 2 ? 1.75 : 1.875;
    quarterTempi.push(perMinute * quarterUnits * dotMultiplier);
  }
  if (quarterTempi.length === 0) return null;
  const firstTempo = quarterTempi[0];
  if (quarterTempi.some((tempo) => Math.abs(tempo - firstTempo) > 0.5)) {
    throw new Error('Tempo changes within a score are not supported yet.');
  }
  return firstTempo;
}

function selectMusicalStaves(parts: ScorePart[]): StaffSelection[] {
  const selections = parts.flatMap((part, partIndex) =>
    Array.from({ length: part.staffCount }, (_, staffIndex) => ({
      partIndex,
      staff: staffIndex + 1,
    })),
  );
  if (selections.length === 0) {
    throw new Error('This score does not contain a playable staff.');
  }
  if (selections.length > 2) {
    throw new Error(`This score has ${selections.length} staves; import a score with one or two tracks.`);
  }
  return selections;
}

function tieTypes(note: XmlNode): { starts: boolean; stops: boolean } {
  const tieNodes = [
    ...children(note, 'tie'),
    ...children(first(note, 'notations'), 'tied'),
  ];
  return {
    starts: tieNodes.some((tie) => tie.attributes.type === 'start'),
    stops: tieNodes.some((tie) => tie.attributes.type === 'stop'),
  };
}

function tupletNumber(note: XmlNode): number | undefined {
  const timeModification = first(note, 'time-modification');
  const actualNotes = Number(value(first(timeModification, 'actual-notes')));
  return Number.isInteger(actualNotes) && actualNotes >= 2 && actualNotes <= 16
    ? actualNotes
    : undefined;
}

function pitchKey(note: XmlNode): string {
  const pitch = first(note, 'pitch');
  if (!pitch) return '';
  return [
    value(first(pitch, 'step')),
    value(first(pitch, 'alter')),
    value(first(pitch, 'octave')),
    value(first(note, 'voice')),
    value(first(note, 'staff')) || '1',
  ].join(':');
}

function midiPitch(note: XmlNode): number | undefined {
  const pitch = first(note, 'pitch');
  if (!pitch) return undefined;

  const step = value(first(pitch, 'step'));
  const octave = Number(value(first(pitch, 'octave')));
  const stepSemitones: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  if (!Object.hasOwn(stepSemitones, step) || !Number.isInteger(octave)) return undefined;

  const alterText = value(first(pitch, 'alter'));
  const alter = alterText === '' ? 0 : Number(alterText);
  if (!Number.isFinite(alter)) return undefined;
  return (octave + 1) * 12 + stepSemitones[step]! + alter;
}

function addMidiPitch(event: ScoreRhythmEvent, pitch: number | undefined): void {
  if (pitch === undefined) return;
  const pitches = event.midiPitches ?? (event.midiPitches = []);
  if (!pitches.includes(pitch)) pitches.push(pitch);
}

function noteEventMap(events: ScoreRhythmEvent[]): Map<number, ScoreRhythmEvent> {
  return new Map(events.map((event) => [Number(event.startQuarter.toFixed(7)), event]));
}

function scanStaff(
  parts: ScorePart[],
  selection: StaffSelection,
  hand: 'left' | 'right',
  measureCount: number,
  quarterNotesPerMeasure: number,
  warnings: Set<string>,
): ScoreRhythmMeasure[] {
  const selectedPart = parts[selection.partIndex];
  const activeTies = new Map<string, MutableScoreEvent>();
  let divisions = 1;
  let scoreMeasureStart = 0;
  const measures: ScoreRhythmMeasure[] = [];

  for (let measureIndex = 0; measureIndex < measureCount; measureIndex += 1) {
    const measure = selectedPart.measures[measureIndex];
    const events: ScoreRhythmEvent[] = [];
    const byOnset = noteEventMap(events);
    let cursorQuarter = 0;
    let previousChordStartQuarter = 0;
    let maxQuarterPosition = 0;
    let graceCount = 0;

    for (const element of measure?.children ?? []) {
      if (element.name === 'attributes') {
        const nextDivisions = Number(value(first(element, 'divisions')));
        if (Number.isInteger(nextDivisions) && nextDivisions > 0) divisions = nextDivisions;
        continue;
      }
      if (element.name === 'backup' || element.name === 'forward') {
        const amount = numberValue(first(element, 'duration'), 'duration');
        cursorQuarter += (element.name === 'backup' ? -amount : amount) / divisions;
        if (cursorQuarter < -1e-7) {
          throw new Error('This MusicXML score contains an invalid voice backup.');
        }
        cursorQuarter = Math.max(0, cursorQuarter);
        previousChordStartQuarter = cursorQuarter;
        maxQuarterPosition = Math.max(maxQuarterPosition, cursorQuarter);
        continue;
      }
      if (element.name !== 'note') continue;

      const staff = Number(value(first(element, 'staff')) || '1');
      const isChordTone = children(element, 'chord').length > 0;
      const isGraceNote = children(element, 'grace').length > 0;
      const durationNode = first(element, 'duration');
      const durationDivisions = durationNode ? Number(value(durationNode)) : 0;
      if (!isGraceNote && (!Number.isFinite(durationDivisions) || durationDivisions < 0)) {
        throw new Error('This MusicXML score contains an invalid note duration.');
      }
      const startQuarter = isChordTone ? previousChordStartQuarter : cursorQuarter;
      const durationQuarter = durationDivisions / divisions;
      const noteTupletNumber = tupletNumber(element);
      const isRest = Boolean(first(element, 'rest'));

      if (!isChordTone) previousChordStartQuarter = cursorQuarter;

      if (staff === selection.staff && !isRest) {
        if (isGraceNote) {
          graceCount += 1;
        } else {
          const ties = tieTypes(element);
          const key = pitchKey(element);
          const noteMidiPitch = midiPitch(element);
          const tiedEvent = ties.stops ? activeTies.get(key) : undefined;
          if (tiedEvent) {
            const endQuarter = scoreMeasureStart + startQuarter + durationQuarter;
            tiedEvent.durationQuarter = endQuarter - tiedEvent.absoluteStartQuarter;
            addMidiPitch(tiedEvent, noteMidiPitch);
            if (!ties.starts) activeTies.delete(key);
          } else {
            const eventKey = Number(startQuarter.toFixed(7));
            const existing = byOnset.get(eventKey);
            if (existing) {
              existing.durationQuarter = Math.max(existing.durationQuarter, durationQuarter);
              existing.tupletNumber ??= noteTupletNumber;
              addMidiPitch(existing, noteMidiPitch);
            } else {
              const event: MutableScoreEvent = {
                startQuarter,
                durationQuarter,
                ...(noteTupletNumber === undefined ? {} : { tupletNumber: noteTupletNumber }),
                absoluteStartQuarter: scoreMeasureStart + startQuarter,
                pitchKey: key,
              };
              addMidiPitch(event, noteMidiPitch);
              events.push(event);
              byOnset.set(eventKey, event);
              if (ties.starts && key) activeTies.set(key, event);
            }
          }
        }
      }

      if (!isChordTone) {
        cursorQuarter += durationQuarter;
        maxQuarterPosition = Math.max(maxQuarterPosition, cursorQuarter);
      }
    }

    if (graceCount > 0) {
      warnings.add('Grace notes were skipped because they have no fixed MusicXML duration.');
    }

    const actualMeasureDuration = maxQuarterPosition;
    const measureDuration = measure?.attributes.implicit === 'yes' && actualMeasureDuration > 0
      ? actualMeasureDuration
      : actualMeasureDuration > quarterNotesPerMeasure + 1e-6
        ? actualMeasureDuration
        : quarterNotesPerMeasure;
    measures.push({
      index: measureIndex,
      startQuarter: scoreMeasureStart,
      durationQuarter: measureDuration,
      leftEvents: hand === 'left' ? events : [],
      rightEvents: hand === 'right' ? events : [],
    });
    scoreMeasureStart += measureDuration;
  }
  return measures;
}

function titleOf(root: XmlNode): string {
  return value(first(first(root, 'work'), 'work-title')) ||
    value(first(root, 'movement-title')) ||
    'Imported score';
}

/** Converts HOMR (or other partwise MusicXML) output to hand rhythms and hidden playback pitches. */
export function parseMusicXmlRhythm(xml: string): ImportedRhythmScore {
  const root = parseXml(xml);
  if (root.name !== 'score-partwise') {
    throw new Error('Please use a partwise MusicXML file (.musicxml or .xml).');
  }

  const parts = readParts(root);
  if (parts.length === 0 || parts.some((part) => part.measures.length === 0)) {
    throw new Error('The MusicXML file does not contain any score measures.');
  }
  const timeSignature = readTimeSignature(parts);
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  const quarterNotesPerMeasure = (numerator * 4) / denominator;
  const selections = selectMusicalStaves(parts);
  const measureCount = Math.max(...parts.map((part) => part.measures.length));
  if (measureCount > MAX_MUSICXML_MEASURES) {
    throw new Error(`This MusicXML score is too long to preview (maximum ${MAX_MUSICXML_MEASURES} bars).`);
  }
  const warnings = new Set<string>();
  if (!parts.some((part) => part.measures.some((measure) => first(first(measure, 'attributes'), 'time')))) {
    warnings.add('The score has no time signature; 4/4 was assumed.');
  }
  const right = scanStaff(parts, selections[0]!, 'right', measureCount, quarterNotesPerMeasure, warnings);
  const left = selections[1]
    ? scanStaff(parts, selections[1], 'left', measureCount, quarterNotesPerMeasure, warnings)
    : right.map((measure) => ({ ...measure, leftEvents: [] }));
  const measures = left.map((leftMeasure, index) => {
    const rightMeasure = right[index];
    return {
      index,
      startQuarter: leftMeasure.startQuarter,
      durationQuarter: leftMeasure.durationQuarter,
      leftEvents: leftMeasure.leftEvents.map(({ startQuarter, durationQuarter, midiPitches, tupletNumber }) => ({
        startQuarter,
        durationQuarter,
        ...(midiPitches === undefined ? {} : { midiPitches: [...midiPitches] }),
        ...(tupletNumber === undefined ? {} : { tupletNumber }),
      })),
      rightEvents: rightMeasure.rightEvents.map(({ startQuarter, durationQuarter, midiPitches, tupletNumber }) => ({
        startQuarter,
        durationQuarter,
        ...(midiPitches === undefined ? {} : { midiPitches: [...midiPitches] }),
        ...(tupletNumber === undefined ? {} : { tupletNumber }),
      })),
    };
  });
  const totalQuarterNotes = measures.reduce((total, measure) => total + measure.durationQuarter, 0);
  if (measures.every((measure) => measure.leftEvents.length + measure.rightEvents.length === 0)) {
    throw new Error('No playable notes were found in the selected staves.');
  }
  const quarterTempo = readQuarterNoteTempo(root);
  const pulseQuarterNotes = denominator === 8 && numerator >= 6 ? 1.5 : 4 / denominator;

  return {
    formatVersion: 1,
    title: titleOf(root),
    timeSignature,
    trackCount: selections.length as 1 | 2,
    bpm: quarterTempo === null ? null : Math.max(40, Math.min(200, Math.round(quarterTempo / pulseQuarterNotes))),
    measures,
    totalQuarterNotes,
    warnings: Array.from(warnings),
  };
}

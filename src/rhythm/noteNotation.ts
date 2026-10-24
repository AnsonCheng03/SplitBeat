import {
  isTupletSubdivision,
  pulseQuarterNotes,
  SUBDIVISION_COUNTS,
  tupletCount,
} from '@/rhythm/subdivisions';
import type { Subdivision, TimeSignature } from '@/types/rhythm';

export type NoteNotationSize = 'full' | 'compact' | 'mini';

export interface NoteNotationEvent {
  /** Note attack, measured in quarter notes from the start of the bar. */
  startQuarter: number;
  /** Written duration, measured in quarter notes. */
  durationQuarter: number;
  /** Override beam count when the written value is not a binary note value. */
  beamCount?: number;
  /** Number to print above a tuplet group containing this event. */
  tupletNumber?: number;
  /** Draw a VexFlow rest glyph instead of a pitched notehead. */
  isRest?: boolean;
  /** Draw a tie from this note to the next written segment. */
  tieToNext?: boolean;
  /** Draw a tie into this note from the preceding written segment. */
  tieFromPrevious?: boolean;
}

export interface NoteGlyphShape {
  key: string;
  left: number;
  headTop: number;
  headWidth: number;
  headHeight: number;
  stemLeft: number;
  stemTop: number;
  stemHeight: number;
  stemWidth: number;
}

export interface NoteBeamShape {
  key: string;
  kind: 'beam' | 'flag';
  level: number;
  startIndex: number;
  endIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
  rotationDegrees: number;
}

export interface NoteDotShape {
  key: string;
  left: number;
  top: number;
  size: number;
}

export interface NoteNotationPlan {
  width: number;
  height: number;
  /** Horizontal note-anchor range used to align overlays with rendered noteheads. */
  anchorStartX: number;
  anchorWidth: number;
  durationQuarter: number;
  beamGroupQuarterNotes: number;
  events: NoteNotationEvent[];
  notes: NoteGlyphShape[];
  beams: NoteBeamShape[];
  dots: NoteDotShape[];
  tupletLabels: { key: string; text: string; left: number; width: number; top: number; fontSize: number }[];
  noteBaselineY: number | null;
}

export interface BarNoteNotationOptions {
  /** Full measure length in quarter notes. */
  durationQuarter: number;
  /** Available width for the bar, including its left and right margins. */
  width: number;
  size?: NoteNotationSize;
  /** Beam groups stop at this many quarter notes (normally one beat). */
  beamGroupQuarterNotes?: number;
}

interface NoteNotationMetrics {
  width: number;
  height: number;
  anchorStartX: number;
  anchorWidth: number;
  durationQuarter: number;
  noteAnchors: number[];
  headWidth: number;
  headHeight: number;
  stemWidth: number;
  beamTop: number;
  beamHeight: number;
  beamGap: number;
  flagWidth: number;
  beamGroupQuarterNotes: number;
  maxBeamNotesByLevel?: number[];
  tupletLabelFontSize: number;
  noteBaselineY: number | null;
};

interface PositionedNote extends NoteNotationEvent {
  sourceIndex: number;
  beamCount: number;
  anchorX: number;
  beamGroupIndex: number;
}

const EPSILON = 0.000001;
const BEAM_SLOPE = -Math.tan((3 * Math.PI) / 180);
const MINI_SLOT_WIDTHS: Record<number, number> = { 1: 15, 2: 15, 3: 12, 4: 11, 8: 8, 16: 6 };

function beamGroupSize(count: number, beamIndex: number): number {
  if (beamIndex === 0 || count === 4 || count === 2) return count;
  return Math.max(2, Math.ceil(count / 2 ** beamIndex));
}

function inferredBeamCount(durationQuarter: number): number {
  if (durationQuarter >= 1 - EPSILON) return 0;

  const dottedBase = durationQuarter / 1.5;
  const dottedBeamCount = Math.round(Math.log2(1 / dottedBase));
  if (dottedBeamCount >= 0 && dottedBeamCount <= 4 &&
    Math.abs(dottedBase - 1 / 2 ** dottedBeamCount) < EPSILON) {
    return dottedBeamCount;
  }

  const tripletBeamCount = Math.log2(1 / (durationQuarter * 3)) + 1;
  const roundedTripletBeamCount = Math.round(tripletBeamCount);
  if (
    roundedTripletBeamCount >= 0 &&
    roundedTripletBeamCount <= 4 &&
    Math.abs(tripletBeamCount - roundedTripletBeamCount) < EPSILON
  ) {
    return roundedTripletBeamCount;
  }

  return Math.max(0, Math.min(4, Math.round(Math.log2(1 / durationQuarter))));
}

function isDottedValue(durationQuarter: number): boolean {
  if (!Number.isFinite(durationQuarter) || durationQuarter <= 0) return false;
  const base = durationQuarter / 1.5;
  const exponent = Math.round(Math.log2(1 / base));
  return exponent >= 0 && exponent <= 4 && Math.abs(base - 1 / 2 ** exponent) < EPSILON;
}

function slotWidthFor(count: number, size: NoteNotationSize): number {
  if (size === 'mini') {
    return MINI_SLOT_WIDTHS[count] ?? (count >= 8 ? 8 : count >= 4 ? 11 : 15);
  }
  if (count >= 16) return size === 'compact' ? 8 : 10;
  if (count >= 8) return size === 'compact' ? 11 : 13;
  return size === 'compact' ? 19 : 24;
}

function beamCountForSubdivision(subdivision: Subdivision): number {
  const count = SUBDIVISION_COUNTS[subdivision];
  return Math.log2(count);
}

function groupIndexAt(startQuarter: number, groupDuration: number): number {
  return Math.floor((startQuarter + EPSILON) / groupDuration);
}

function isContiguous(previous: PositionedNote, current: PositionedNote): boolean {
  return Math.abs(previous.startQuarter + previous.durationQuarter - current.startQuarter) < EPSILON;
}

function createBeamRuns(notes: PositionedNote[], level: number, maximumNotes?: number): number[][] {
  const runs: number[][] = [];
  let run: number[] = [];

  const finishRun = () => {
    if (run.length > 0) runs.push(run);
    run = [];
  };

  notes.forEach((note, index) => {
    const previousIndex = run.at(-1);
    const previous = previousIndex === undefined ? undefined : notes[previousIndex];
    const atGroupLimit = maximumNotes !== undefined && run.length >= maximumNotes;
    const connectsToPrevious = previous && previous.beamGroupIndex === note.beamGroupIndex && isContiguous(previous, note);

    if (note.beamCount < level) {
      finishRun();
      return;
    }
    if (previous && (!connectsToPrevious || atGroupLimit)) finishRun();
    run.push(index);
  });

  finishRun();
  return runs;
}

function flagDirection(notes: PositionedNote[], noteIndex: number): 'left' | 'right' {
  const note = notes[noteIndex];
  const next = notes[noteIndex + 1];
  if (next && next.beamGroupIndex === note.beamGroupIndex) return 'right';
  const previous = notes[noteIndex - 1];
  if (previous && previous.beamGroupIndex === note.beamGroupIndex) return 'left';
  return 'right';
}

function buildNotationPlan(
  events: NoteNotationEvent[],
  metrics: NoteNotationMetrics,
): NoteNotationPlan {
  const notes: PositionedNote[] = events
    .map((event, sourceIndex) => {
      if (!Number.isFinite(event.startQuarter) || event.startQuarter < -EPSILON) {
        throw new RangeError(`Note ${sourceIndex + 1} must start at a non-negative quarter-note position.`);
      }
      if (!Number.isFinite(event.durationQuarter) || event.durationQuarter <= 0) {
        throw new RangeError(`Note ${sourceIndex + 1} must have a positive duration.`);
      }
      if (event.beamCount !== undefined && (!Number.isInteger(event.beamCount) || event.beamCount < 0 || event.beamCount > 4)) {
        throw new RangeError(`Note ${sourceIndex + 1} must use between zero and four beams.`);
      }
      if (event.tupletNumber !== undefined && (!Number.isInteger(event.tupletNumber) || event.tupletNumber < 2 || event.tupletNumber > 16)) {
        throw new RangeError(`Note ${sourceIndex + 1} must use a tuplet group size between two and sixteen.`);
      }

      return { ...event, sourceIndex, beamCount: event.beamCount ?? inferredBeamCount(event.durationQuarter), anchorX: 0, beamGroupIndex: 0 };
    })
    .sort((left, right) => left.startQuarter - right.startQuarter || left.sourceIndex - right.sourceIndex);

  if (metrics.noteAnchors.length !== notes.length) {
    throw new Error('Every note must have a matching horizontal position.');
  }
  notes.forEach((note, index) => {
    const anchorX = metrics.noteAnchors[index];
    if (anchorX === undefined || !Number.isFinite(anchorX)) {
      throw new Error(`Note ${note.sourceIndex + 1} is missing a finite horizontal position.`);
    }
    note.anchorX = anchorX;
    note.beamGroupIndex = groupIndexAt(note.startQuarter, metrics.beamGroupQuarterNotes);
  });

  const beamCount = notes.reduce((maximum, note) => Math.max(maximum, note.beamCount), 0);
  const beamHeight = metrics.beamHeight;
  const beams: NoteBeamShape[] = [];
  const primaryBeamStartX = notes.map((note) => note.anchorX);

  for (let beamLevel = 1; beamLevel <= beamCount; beamLevel += 1) {
    const maximumNotes = metrics.maxBeamNotesByLevel?.[beamLevel - 1];
    const runs = createBeamRuns(notes, beamLevel, maximumNotes);
    for (const run of runs) {
      const firstIndex = run[0];
      const lastIndex = run.at(-1);
      if (firstIndex === undefined || lastIndex === undefined) continue;

      const firstAnchorX = notes[firstIndex]?.anchorX ?? 0;
      const lastAnchorX = notes[lastIndex]?.anchorX ?? firstAnchorX;
      const isFlag = firstIndex === lastIndex;
      const direction = isFlag ? flagDirection(notes, firstIndex) : 'right';
      const left = isFlag
        ? direction === 'right' ? firstAnchorX - beamHeight * 0.2 : firstAnchorX - metrics.flagWidth
        : firstAnchorX - beamHeight * 0.25;
      const right = isFlag
        ? direction === 'right' ? firstAnchorX + metrics.flagWidth : firstAnchorX + beamHeight * 0.2
        : lastAnchorX + beamHeight * 0.25;
      const middleX = (left + right) / 2;
      const rowTop = metrics.beamTop + (beamLevel - 1) * metrics.beamGap;
      const middleY = rowTop + beamHeight / 2 + BEAM_SLOPE * (middleX - firstAnchorX);

      if (beamLevel === 1) {
        for (const noteIndex of run) primaryBeamStartX[noteIndex] = firstAnchorX;
      }

      beams.push({
        key: `${isFlag ? 'flag' : 'beam'}-${beamLevel - 1}-${firstIndex}-${lastIndex}`,
        kind: isFlag ? 'flag' : 'beam',
        level: beamLevel - 1,
        startIndex: firstIndex,
        endIndex: lastIndex,
        left,
        top: middleY - beamHeight / 2,
        width: Math.max(beamHeight, right - left),
        height: beamHeight,
        rotationDegrees: -3,
      });
    }
  }

  const headWidth = metrics.headWidth;
  const headHeight = metrics.headHeight;
  const headTop = metrics.height - 5 - headHeight / 2;
  const glyphs: NoteGlyphShape[] = notes.map((note, index) => {
    const stemCenterX = note.anchorX + headWidth * 0.3;
    const referenceX = primaryBeamStartX[index] ?? stemCenterX;
    const stemTop = metrics.beamTop + beamHeight + BEAM_SLOPE * (stemCenterX - referenceX);
    const stemBottom = headTop + headHeight * 0.48;

    return {
      key: `note-${note.sourceIndex}`,
      left: note.anchorX - headWidth / 2,
      headTop,
      headWidth,
      headHeight,
      stemLeft: headWidth * 0.8 - metrics.stemWidth / 2,
      stemTop,
      stemHeight: Math.max(0, stemBottom - stemTop),
      stemWidth: metrics.stemWidth,
    };
  });
  const dots: NoteDotShape[] = notes.flatMap((note, index) => {
    if (!isDottedValue(note.durationQuarter)) return [];
    const glyph = glyphs[index];
    if (!glyph) return [];
    const dotSize = Math.max(2, metrics.headHeight * 0.24);
    return [{
      key: `dot-${note.sourceIndex}`,
      left: glyph.left + glyph.headWidth + dotSize * 0.7,
      top: glyph.headTop + glyph.headHeight * 0.38,
      size: dotSize,
    }];
  });

  const tupletLabels: NoteNotationPlan['tupletLabels'] = [];
  let tupletGroupIndex = 0;
  while (tupletGroupIndex < notes.length) {
    const firstNote = notes[tupletGroupIndex];
    const tupletNumber = firstNote?.tupletNumber;
    if (!firstNote || tupletNumber === undefined) {
      tupletGroupIndex += 1;
      continue;
    }

    const group: PositionedNote[] = [firstNote];
    let nextIndex = tupletGroupIndex + 1;
    while (nextIndex < notes.length && group.length < tupletNumber) {
      const previous = group.at(-1);
      const next = notes[nextIndex];
      if (
        !previous ||
        !next ||
        next.tupletNumber !== tupletNumber ||
        next.beamGroupIndex !== firstNote.beamGroupIndex ||
        !isContiguous(previous, next)
      ) break;
      group.push(next);
      nextIndex += 1;
    }

    const lastNote = group.at(-1) ?? firstNote;
    const left = firstNote.anchorX - headWidth / 2;
    const right = lastNote.anchorX + headWidth / 2;
    tupletLabels.push({
      key: `tuplet-${tupletGroupIndex}-${tupletNumber}`,
      text: String(tupletNumber),
      left,
      width: Math.max(headWidth, right - left),
      top: 0,
      fontSize: metrics.tupletLabelFontSize,
    });
    tupletGroupIndex += group.length;
  }

  return {
    width: metrics.width,
    height: metrics.height,
    anchorStartX: metrics.anchorStartX,
    anchorWidth: metrics.anchorWidth,
    durationQuarter: metrics.durationQuarter,
    beamGroupQuarterNotes: metrics.beamGroupQuarterNotes,
    events: notes.map(({ startQuarter, durationQuarter, beamCount, tupletNumber, tieToNext, tieFromPrevious }) => ({
      startQuarter,
      durationQuarter,
      beamCount,
      ...(tupletNumber === undefined ? {} : { tupletNumber }),
      ...(tieToNext ? { tieToNext: true } : {}),
      ...(tieFromPrevious ? { tieFromPrevious: true } : {}),
    })),
    notes: glyphs,
    beams,
    dots,
    tupletLabels,
    noteBaselineY: metrics.noteBaselineY,
  };
}


/**
 * Calculate note positions, beam groups, and overlay geometry for one bar.
 * VexFlow renders the engraved noteheads, stems, flags, beams, and dots from this plan.
 * Notes with different values share a beam only where their values permit it.
 */
export function createBarNoteNotationPlan(
  events: readonly NoteNotationEvent[],
  options: BarNoteNotationOptions,
): NoteNotationPlan {
  if (!Number.isFinite(options.durationQuarter) || options.durationQuarter <= 0) {
    throw new RangeError('A bar must have a positive duration.');
  }
  if (!Number.isFinite(options.width) || options.width <= 0) {
    throw new RangeError('A bar must have a positive layout width.');
  }
  const size = options.size ?? 'full';
  const beamGroupQuarterNotes = options.beamGroupQuarterNotes ?? 1;
  if (!Number.isFinite(beamGroupQuarterNotes) || beamGroupQuarterNotes <= 0) {
    throw new RangeError('Beam groups must have a positive duration.');
  }
  events.forEach((event, index) => {
    if (!Number.isFinite(event.startQuarter) || event.startQuarter < -EPSILON || event.startQuarter >= options.durationQuarter - EPSILON) {
      throw new RangeError(`Note ${index + 1} must start inside the bar.`);
    }
    if (!Number.isFinite(event.durationQuarter) || event.durationQuarter <= 0) {
      throw new RangeError(`Note ${index + 1} must have a positive duration.`);
    }
  });

  const shortestNote = events.length > 0
    ? Math.min(...events.map((event) => event.durationQuarter))
    : options.durationQuarter;
  const noteSpacing = options.width * shortestNote / options.durationQuarter;
  const sizeMaximum = size === 'mini' ? 6.4 : size === 'compact' ? 10.5 : 16;
  const headWidth = Math.max(size === 'mini' ? 3.5 : 5, Math.min(sizeMaximum, noteSpacing * 0.62));
  const headHeight = headWidth * 0.66;
  const containsTuplets = events.some((event) => event.tupletNumber !== undefined);
  const tupletPadding = containsTuplets ? (size === 'mini' ? 10 : size === 'compact' ? 12 : 14) : 0;
  const height = (size === 'mini' ? 28 : size === 'compact' ? 32 : 44) + tupletPadding;
  const beamHeight = size === 'mini' ? 1.6 : size === 'compact' ? 1.8 : 2.6;
  const beamGap = beamHeight + (size === 'mini' ? 1 : size === 'compact' ? 1.2 : 1.8);
  const beamTop = size === 'mini' ? 3 : size === 'compact' ? 4 : 5;
  const flagWidth = Math.max(size === 'mini' ? 5 : 7, headWidth * 0.9);
  const leftInset = Math.min(options.width / 2, headWidth / 2 + 2);
  const hasFlags = events.some((event) => (event.beamCount ?? inferredBeamCount(event.durationQuarter)) > 0);
  const dotSize = Math.max(2, headHeight * 0.24);
  const flagOverhang = hasFlags ? headWidth / 2 + Math.max(12, flagWidth * 1.5) + 4 : 0;
  const dotOverhang = events.some((event) => isDottedValue(event.durationQuarter))
    ? headWidth / 2 + dotSize * 1.7 + 3
    : 0;
  const rightInset = Math.min(options.width / 2, Math.max(headWidth / 2 + 2, flagOverhang, dotOverhang));
  const usableWidth = Math.max(0, options.width - leftInset - rightInset);
  const orderedEvents = Array.from(events)
    .map((event, originalIndex) => ({ event, originalIndex }))
    .sort((left, right) => left.event.startQuarter - right.event.startQuarter || left.originalIndex - right.originalIndex)
    .map(({ event }) => event);
  const noteAnchors = orderedEvents.map(
    (event) => leftInset + (event.startQuarter / options.durationQuarter) * usableWidth,
  );

  return buildNotationPlan(orderedEvents, {
    width: options.width,
    height,
    anchorStartX: leftInset,
    anchorWidth: usableWidth,
    durationQuarter: options.durationQuarter,
    noteAnchors,
    headWidth,
    headHeight,
    stemWidth: size === 'mini' ? 1.2 : size === 'compact' ? 1.4 : 1.8,
    beamTop: beamTop + tupletPadding,
    beamHeight,
    beamGap,
    flagWidth,
    beamGroupQuarterNotes,
    tupletLabelFontSize: size === 'mini' ? 8 : size === 'compact' ? 10 : 12,
    noteBaselineY: height - 5,
  });
}

/** Make the repeated subdivision symbol used by the live practice screen. */
export function createNoteNotationPlan(
  subdivision: Subdivision,
  size: NoteNotationSize = 'full',
  timeSignature: TimeSignature = '4/4',
): NoteNotationPlan {
  const isTuplet = isTupletSubdivision(subdivision);
  const count = isTuplet ? tupletCount(subdivision) : SUBDIVISION_COUNTS[subdivision];
  const noteDurationQuarter = isTuplet ? pulseQuarterNotes(timeSignature) / count : 1 / count;
  const compact = size === 'compact';
  const mini = size === 'mini';
  const slotWidth = slotWidthFor(count, size);
  const headWidth = mini
    ? count >= 8 ? 4.2 : 6.4
    : count >= 8
      ? compact ? 5.5 : 6.5
      : count >= 4
        ? compact ? 10.5 : 13
        : compact ? 12.5 : 16;
  const headHeight = mini
    ? count >= 8 ? 3 : 5.5
    : count >= 8
      ? compact ? 4 : 4.7
      : count >= 4
        ? compact ? 7.3 : 9
        : compact ? 8 : 10.5;
  const beamCount = isTuplet ? inferredBeamCount(noteDurationQuarter) : beamCountForSubdivision(subdivision);
  const events = Array.from({ length: count }, (_, index) => ({
    startQuarter: index * noteDurationQuarter,
    durationQuarter: noteDurationQuarter,
    beamCount,
    ...(isTuplet ? { tupletNumber: count } : {}),
  }));

  return buildNotationPlan(events, {
    width: count * slotWidth,
    height: mini ? 34 : compact ? 56 : 68,
    anchorStartX: 0,
    anchorWidth: count * slotWidth,
    durationQuarter: count * noteDurationQuarter,
    noteAnchors: Array.from({ length: count }, (_, index) => (index + 0.5) * slotWidth),
    headWidth,
    headHeight,
    stemWidth: count >= 8 ? mini ? 1 : 1.5 : mini ? 1.2 : 2,
    beamTop: isTuplet ? mini ? 10 : compact ? 15 : 17 : mini ? 3 : compact ? 4 : 5,
    beamHeight: mini ? 1.6 : count >= 8 ? compact ? 2 : 2.5 : compact ? 4 : 5,
    beamGap: (mini ? 1.6 : count >= 8 ? compact ? 2 : 2.5 : compact ? 4 : 5) + (mini ? 1 : compact ? 2 : 3),
    flagWidth: Math.max(slotWidth * 0.7, headWidth),
    beamGroupQuarterNotes: isTuplet ? pulseQuarterNotes(timeSignature) : 1,
    maxBeamNotesByLevel: Array.from({ length: beamCount }, (_, beamIndex) => beamGroupSize(count, beamIndex)),
    tupletLabelFontSize: mini ? 8 : compact ? 12 : 14,
    noteBaselineY: null,
  });
}

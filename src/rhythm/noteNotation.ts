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
  /** Engraving line weights shared by the VexFlow renderer. */
  stemWidth: number;
  beamThickness: number;
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

/** Offset that centers a complete symbol's visible geometry inside its fixed-height canvas. */
export function notationVisualCenterOffsetY(plan: NoteNotationPlan): number {
  const bounds = [
    ...plan.notes.flatMap((note) => [
      [note.headTop, note.headTop + note.headHeight],
      [note.stemTop, note.stemTop + note.stemHeight],
    ]),
    ...plan.beams.map((beam) => [beam.top, beam.top + beam.height]),
    ...plan.dots.map((dot) => [dot.top, dot.top + dot.size]),
    ...plan.tupletLabels.map((label) => [label.top, label.top + label.fontSize + 2]),
  ];
  if (bounds.length === 0) return 0;

  const top = Math.min(...bounds.map(([start]) => start));
  const bottom = Math.max(...bounds.map(([, end]) => end));
  return (plan.height - (bottom - top)) / 2 - top;
}

export function fitNotationScale(planWidth: number, planHeight: number, preferredScale: number, maxWidth?: number, maxHeight?: number): number {
  if (!Number.isFinite(planWidth) || planWidth <= 0) throw new RangeError('Notation width must be positive.');
  if (!Number.isFinite(planHeight) || planHeight <= 0) throw new RangeError('Notation height must be positive.');
  if (!Number.isFinite(preferredScale) || preferredScale <= 0) throw new RangeError('Notation scale must be positive.');
  const widthScale = maxWidth !== undefined && Number.isFinite(maxWidth) && maxWidth > 0
    ? maxWidth / planWidth
    : preferredScale;
  const heightScale = maxHeight !== undefined && Number.isFinite(maxHeight) && maxHeight > 0
    ? maxHeight / planHeight
    : preferredScale;
  return Math.min(preferredScale, widthScale, heightScale);
}

export interface BarNoteNotationOptions {
  /** Full measure length in quarter notes. */
  durationQuarter: number;
  /** Available width for the bar, including its left and right margins. */
  width: number;
  size?: NoteNotationSize;
  /** Beam groups stop at this many quarter notes (normally one beat). */
  beamGroupQuarterNotes?: number;
  /** Shared horizontal padding keeps both hands' beat positions aligned. */
  anchorInsets?: NoteNotationAnchorInsets;
  /** Optional fixed notehead width for symbols that should keep the same engraving scale. */
  noteHeadWidth?: number;
  /** Optional fixed canvas height for symbols that should align across rhythm values. */
  notationHeight?: number;
  /** Optional beam or flag top position for a fixed-height symbol canvas. */
  beamTop?: number;
  /** Optional explicit note centers, used by repeated beat symbols. */
  noteAnchors?: number[];
  /** Optional beam grouping limits used by repeated subdivision symbols. */
  maxBeamNotesByLevel?: number[];
  /** Optional tuplet number size for repeated rhythm symbols. */
  tupletLabelFontSize?: number;
}

export interface NoteNotationAnchorInsets {
  left: number;
  right: number;
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

interface OrderedNotationEntry {
  event: NoteNotationEvent;
  originalIndex: number;
}

const EPSILON = 0.000001;
const BEAM_SLOPE = 0;
const MINI_SLOT_WIDTHS: Record<number, number> = { 1: 15, 2: 15, 3: 12, 4: 11, 8: 8, 16: 6 };

function calculateBarNoteAnchorInsets(
  events: readonly NoteNotationEvent[],
  { durationQuarter, width, size = 'full', noteHeadWidth }: Pick<BarNoteNotationOptions, 'durationQuarter' | 'width' | 'size' | 'noteHeadWidth'>,
): NoteNotationAnchorInsets {
  const shortestNote = events.length > 0
    ? Math.min(...events.map((event) => event.durationQuarter))
    : durationQuarter;
  const noteSpacing = width * shortestNote / durationQuarter;
  const sizeMaximum = size === 'mini' ? 6.4 : size === 'compact' ? 10.5 : 16;
  const headWidth = noteHeadWidth ?? Math.max(size === 'mini' ? 3.5 : 5, Math.min(sizeMaximum, noteSpacing * 0.62));
  const left = Math.min(width / 2, headWidth / 2 + 4);
  const hasFlags = events.some((event) => (event.beamCount ?? inferredBeamCount(event.durationQuarter)) > 0);
  const dotSize = Math.max(2, headWidth * 0.66 * 0.24);
  const flagWidth = Math.max(size === 'mini' ? 5 : 7, headWidth * 0.9);
  const flagOverhang = hasFlags ? headWidth / 2 + Math.max(12, flagWidth * 1.5) + 4 : 0;
  const dotOverhang = events.some((event) => isDottedValue(event.durationQuarter))
    ? headWidth / 2 + dotSize * 1.7 + 3
    : 0;

  return {
    left,
    right: Math.min(width / 2, Math.max(headWidth / 2 + 2, flagOverhang, dotOverhang) + 3),
  };
}

/**
 * Find a common note-anchor range for multiple hand lanes in one bar.
 * Each lane keeps enough room for its own largest head, flag, or dot while
 * shared anchors make matching beat positions land at the same x coordinate.
 */
export function createSharedBarNoteAnchorInsets(
  eventGroups: readonly (readonly NoteNotationEvent[])[],
  options: Pick<BarNoteNotationOptions, 'durationQuarter' | 'width' | 'size'>,
): NoteNotationAnchorInsets {
  if (!Number.isFinite(options.durationQuarter) || options.durationQuarter <= 0) {
    throw new RangeError('A bar must have a positive duration.');
  }
  if (!Number.isFinite(options.width) || options.width <= 0) {
    throw new RangeError('A bar must have a positive layout width.');
  }

  const insets = eventGroups.map((events) => {
    events.forEach((event, index) => {
      if (!Number.isFinite(event.durationQuarter) || event.durationQuarter <= 0) {
        throw new RangeError(`Note ${index + 1} must have a positive duration.`);
      }
    });
    return calculateBarNoteAnchorInsets(events, options);
  });

  return {
    left: Math.max(0, ...insets.map(({ left }) => left)),
    right: Math.max(0, ...insets.map(({ right }) => right)),
  };
}

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

/** Width needed to show the densest supported subdivision without overlapping noteheads. */
export function maxRhythmSymbolWidth(size: NoteNotationSize = 'full'): number {
  return 16 * slotWidthFor(16, size);
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

function validateNotationEvents(events: readonly NoteNotationEvent[]): void {
  events.forEach((event, sourceIndex) => {
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
  });
}

function orderPositionedNotes(events: readonly NoteNotationEvent[]): PositionedNote[] {
  return events
    .map((event, sourceIndex) => ({
      ...event,
      sourceIndex,
      beamCount: event.beamCount ?? inferredBeamCount(event.durationQuarter),
      anchorX: 0,
      beamGroupIndex: 0,
    }))
    .sort((left, right) => left.startQuarter - right.startQuarter || left.sourceIndex - right.sourceIndex);
}

function assignNotePositions(notes: PositionedNote[], metrics: NoteNotationMetrics): void {
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
}

function createPositionedNotes(
  events: NoteNotationEvent[],
  metrics: NoteNotationMetrics,
): PositionedNote[] {
  validateNotationEvents(events);
  const notes = orderPositionedNotes(events);
  assignNotePositions(notes, metrics);
  return notes;
}

function createBeamShapes(
  notes: PositionedNote[],
  metrics: NoteNotationMetrics,
): { beams: NoteBeamShape[]; primaryBeamStartX: number[] } {
  const beamCount = notes.reduce((maximum, note) => Math.max(maximum, note.beamCount), 0);
  const primaryBeamStartX = notes.map((note) => note.anchorX);
  const beams: NoteBeamShape[] = [];

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
        ? direction === 'right' ? firstAnchorX - metrics.beamHeight * 0.2 : firstAnchorX - metrics.flagWidth
        : firstAnchorX - metrics.beamHeight * 0.25;
      const right = isFlag
        ? direction === 'right' ? firstAnchorX + metrics.flagWidth : firstAnchorX + metrics.beamHeight * 0.2
        : lastAnchorX + metrics.beamHeight * 0.25;
      const middleX = (left + right) / 2;
      const rowTop = metrics.beamTop + (beamLevel - 1) * metrics.beamGap;
      const middleY = rowTop + metrics.beamHeight / 2 + BEAM_SLOPE * (middleX - firstAnchorX);

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
        top: Math.max(0, Math.min(metrics.height - metrics.beamHeight, middleY - metrics.beamHeight / 2)),
        width: Math.max(metrics.beamHeight, right - left),
        height: metrics.beamHeight,
        rotationDegrees: 0,
      });
    }
  }

  return { beams, primaryBeamStartX };
}

function createNoteGlyphs(
  notes: PositionedNote[],
  primaryBeamStartX: number[],
  metrics: NoteNotationMetrics,
): { glyphs: NoteGlyphShape[]; noteCenterY: number } {
  const noteCenterY = Math.max(
    metrics.headHeight / 2,
    Math.min(metrics.height - metrics.headHeight / 2, metrics.noteBaselineY ?? metrics.height - 5),
  );
  const headTop = noteCenterY - metrics.headHeight / 2;
  const glyphs = notes.map((note, index) => {
    const stemCenterX = note.anchorX + metrics.headWidth * 0.3;
    const referenceX = primaryBeamStartX[index] ?? stemCenterX;
    const stemBottom = headTop + metrics.headHeight * 0.48;
    const stemTop = Math.max(0, Math.min(
      stemBottom,
      metrics.beamTop + metrics.beamHeight + BEAM_SLOPE * (stemCenterX - referenceX),
    ));

    return {
      key: `note-${note.sourceIndex}`,
      left: note.anchorX - metrics.headWidth / 2,
      headTop,
      headWidth: metrics.headWidth,
      headHeight: metrics.headHeight,
      stemLeft: metrics.headWidth * 0.8 - metrics.stemWidth / 2,
      stemTop,
      stemHeight: Math.max(0, stemBottom - stemTop),
      stemWidth: metrics.stemWidth,
    };
  });

  return { glyphs, noteCenterY };
}

function createDottedNoteShapes(
  notes: PositionedNote[],
  glyphs: NoteGlyphShape[],
  metrics: NoteNotationMetrics,
): NoteDotShape[] {
  return notes.flatMap((note, index) => {
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
}

function createTupletLabels(
  notes: PositionedNote[],
  metrics: NoteNotationMetrics,
): NoteNotationPlan['tupletLabels'] {
  const labels: NoteNotationPlan['tupletLabels'] = [];
  let groupStartIndex = 0;

  while (groupStartIndex < notes.length) {
    const firstNote = notes[groupStartIndex];
    const tupletNumber = firstNote?.tupletNumber;
    if (!firstNote || tupletNumber === undefined) {
      groupStartIndex += 1;
      continue;
    }

    const group: PositionedNote[] = [firstNote];
    let nextIndex = groupStartIndex + 1;
    while (nextIndex < notes.length && group.length < tupletNumber) {
      const previous = group.at(-1);
      const next = notes[nextIndex];
      if (!previous || !next || next.tupletNumber !== tupletNumber || !isContiguous(previous, next)) break;
      group.push(next);
      nextIndex += 1;
    }

    const lastNote = group.at(-1) ?? firstNote;
    const left = firstNote.anchorX - metrics.headWidth / 2;
    const right = lastNote.anchorX + metrics.headWidth / 2;
    const groupCenter = (firstNote.anchorX + lastNote.anchorX) / 2;
    const labelWidth = Math.min(metrics.width, Math.max(metrics.tupletLabelFontSize + 8, right - left + 8));
    labels.push({
      key: `tuplet-${groupStartIndex}-${tupletNumber}`,
      text: String(tupletNumber),
      left: Math.max(0, Math.min(metrics.width - labelWidth, groupCenter - labelWidth / 2)),
      width: labelWidth,
      top: 1,
      fontSize: metrics.tupletLabelFontSize,
    });
    groupStartIndex += group.length;
  }

  return labels;
}

function buildNotationPlan(
  events: NoteNotationEvent[],
  metrics: NoteNotationMetrics,
): NoteNotationPlan {
  const notes = createPositionedNotes(events, metrics);
  const { beams, primaryBeamStartX } = createBeamShapes(notes, metrics);
  const { glyphs, noteCenterY } = createNoteGlyphs(notes, primaryBeamStartX, metrics);
  const dots = createDottedNoteShapes(notes, glyphs, metrics);
  const tupletLabels = createTupletLabels(notes, metrics);

  return {
    width: metrics.width,
    height: metrics.height,
    stemWidth: metrics.stemWidth,
    beamThickness: metrics.beamHeight,
    anchorStartX: metrics.anchorStartX,
    anchorWidth: metrics.anchorWidth,
    durationQuarter: metrics.durationQuarter,
    beamGroupQuarterNotes: metrics.beamGroupQuarterNotes,
    events: notes.map(({ startQuarter, durationQuarter, beamCount, isRest, tupletNumber, tieToNext, tieFromPrevious }) => ({
      startQuarter,
      durationQuarter,
      beamCount,
      ...(isRest ? { isRest: true } : {}),
      ...(tupletNumber === undefined ? {} : { tupletNumber }),
      ...(tieToNext ? { tieToNext: true } : {}),
      ...(tieFromPrevious ? { tieFromPrevious: true } : {}),
    })),
    notes: glyphs,
    beams,
    dots,
    tupletLabels,
    noteBaselineY: metrics.noteBaselineY === null ? null : noteCenterY,
  };
}

function validateBarNotationInputs(
  events: readonly NoteNotationEvent[],
  options: BarNoteNotationOptions,
): void {
  if (!Number.isFinite(options.durationQuarter) || options.durationQuarter <= 0) {
    throw new RangeError('A bar must have a positive duration.');
  }
  if (!Number.isFinite(options.width) || options.width <= 0) {
    throw new RangeError('A bar must have a positive layout width.');
  }
  const beamGroupQuarterNotes = options.beamGroupQuarterNotes ?? 1;
  if (!Number.isFinite(beamGroupQuarterNotes) || beamGroupQuarterNotes <= 0) {
    throw new RangeError('Beam groups must have a positive duration.');
  }
  if (options.noteHeadWidth !== undefined && (!Number.isFinite(options.noteHeadWidth) || options.noteHeadWidth <= 0)) {
    throw new RangeError('A fixed notehead width must be positive.');
  }
  if (options.notationHeight !== undefined && (!Number.isFinite(options.notationHeight) || options.notationHeight <= 0)) {
    throw new RangeError('A fixed notation height must be positive.');
  }
  if (options.beamTop !== undefined && (!Number.isFinite(options.beamTop) || options.beamTop < 0)) {
    throw new RangeError('A beam top position must be non-negative.');
  }
  if (options.noteAnchors && options.noteAnchors.length !== events.length) {
    throw new RangeError('Every note must have a matching explicit anchor.');
  }

  options.noteAnchors?.forEach((anchor, index) => {
    if (!Number.isFinite(anchor) || anchor < 0 || anchor > options.width) {
      throw new RangeError(`Note ${index + 1} must have an anchor inside the notation viewport.`);
    }
  });
  events.forEach((event, index) => {
    if (!Number.isFinite(event.startQuarter) || event.startQuarter < -EPSILON || event.startQuarter >= options.durationQuarter) {
      throw new RangeError(`Note ${index + 1} must start inside the bar.`);
    }
    if (!Number.isFinite(event.durationQuarter) || event.durationQuarter <= 0) {
      throw new RangeError(`Note ${index + 1} must have a positive duration.`);
    }
  });
  if (options.anchorInsets && (
    !Number.isFinite(options.anchorInsets.left) || options.anchorInsets.left < 0 ||
    !Number.isFinite(options.anchorInsets.right) || options.anchorInsets.right < 0
  )) {
    throw new RangeError('Shared note-anchor insets must be finite and non-negative.');
  }
}

function orderNotationEvents(events: readonly NoteNotationEvent[]): OrderedNotationEntry[] {
  return Array.from(events)
    .map((event, originalIndex) => ({ event, originalIndex }))
    .sort((left, right) => left.event.startQuarter - right.event.startQuarter || left.originalIndex - right.originalIndex);
}

function calculateNoteAnchors(
  orderedEntries: OrderedNotationEntry[],
  options: BarNoteNotationOptions,
  leftInset: number,
  rightInset: number,
): { events: NoteNotationEvent[]; noteAnchors: number[]; usableWidth: number } {
  const usableWidth = Math.max(0, options.width - leftInset - rightInset);
  const events = orderedEntries.map(({ event }) => event);
  const noteAnchors = orderedEntries.map(
    ({ event, originalIndex }) => options.noteAnchors?.[originalIndex]
      ?? leftInset + (event.startQuarter / options.durationQuarter) * usableWidth,
  );

  return { events, noteAnchors, usableWidth };
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
  validateBarNotationInputs(events, options);
  const size = options.size ?? 'full';
  const beamGroupQuarterNotes = options.beamGroupQuarterNotes ?? 1;

  const shortestNote = events.length > 0
    ? Math.min(...events.map((event) => event.durationQuarter))
    : options.durationQuarter;
  const noteSpacing = options.width * shortestNote / options.durationQuarter;
  const sizeMaximum = size === 'mini' ? 6.4 : size === 'compact' ? 10.5 : 16;
  const headWidth = options.noteHeadWidth ?? Math.max(size === 'mini' ? 3.5 : 5, Math.min(sizeMaximum, noteSpacing * 0.62));
  const headHeight = headWidth * 0.66;
  const containsTuplets = events.some((event) => event.tupletNumber !== undefined);
  const tupletPadding = containsTuplets && options.notationHeight === undefined
    ? (size === 'mini' ? 10 : size === 'compact' ? 12 : 14)
    : 0;
  const height = options.notationHeight ?? (size === 'mini' ? 28 : size === 'compact' ? 32 : 44) + tupletPadding;
  const beamHeight = size === 'mini' ? 1.2 : size === 'compact' ? 1.5 : 2.2;
  const beamGap = beamHeight + (size === 'mini' ? 1 : size === 'compact' ? 1.2 : 1.8);
  const beamTop = options.beamTop ?? (size === 'mini' ? 3 : size === 'compact' ? 4 : 5);
  const flagWidth = Math.max(size === 'mini' ? 5 : 7, headWidth * 0.9);
  const ownInsets = calculateBarNoteAnchorInsets(events, options);
  const leftInset = options.noteAnchors ? 0 : Math.max(ownInsets.left, options.anchorInsets?.left ?? 0);
  const rightInset = options.noteAnchors ? 0 : Math.max(ownInsets.right, options.anchorInsets?.right ?? 0);
  const orderedEntries = orderNotationEvents(events);
  const { events: orderedEvents, noteAnchors, usableWidth } = calculateNoteAnchors(
    orderedEntries,
    options,
    leftInset,
    rightInset,
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
    stemWidth: size === 'mini' ? 0.9 : size === 'compact' ? 1.05 : 1.45,
    beamTop: beamTop + tupletPadding,
    beamHeight,
    beamGap,
    flagWidth,
    beamGroupQuarterNotes,
    maxBeamNotesByLevel: options.maxBeamNotesByLevel,
    tupletLabelFontSize: options.tupletLabelFontSize ?? (size === 'mini' ? 6 : size === 'compact' ? 8 : 11),
    noteBaselineY: height - 5,
  });
}

/** Shared engraving plan for standalone rhythms and mixed patterns. */
export function createRhythmSymbolNotationPlan(
  events: readonly NoteNotationEvent[],
  options: BarNoteNotationOptions,
): NoteNotationPlan {
  const size = options.size ?? 'full';
  const noteHeadWidth = options.noteHeadWidth ?? (size === 'mini' ? 4.2 : size === 'compact' ? 7 : 9.2);
  const notationHeight = size === 'mini' ? 28 : size === 'compact' ? 32 : 44;

  return createBarNoteNotationPlan(events, {
    ...options,
    noteHeadWidth,
    notationHeight,
    beamTop: options.beamTop ?? (size === 'mini' ? 9 : size === 'compact' ? 11 : 15),
    tupletLabelFontSize: options.tupletLabelFontSize ?? (size === 'mini' ? 6 : size === 'compact' ? 8 : 11),
  });
}

/** Make the repeated subdivision symbol used by the live practice screen. */
export function createNoteNotationPlan(
  subdivision: Subdivision,
  size: NoteNotationSize = 'full',
  timeSignature: TimeSignature = '4/4',
  groupWidth?: number,
): NoteNotationPlan {
  const isTuplet = isTupletSubdivision(subdivision);
  const count = isTuplet ? tupletCount(subdivision) : SUBDIVISION_COUNTS[subdivision];
  const noteDurationQuarter = isTuplet ? pulseQuarterNotes(timeSignature) / count : 1 / count;
  const slotWidth = slotWidthFor(count, size);
  const notationWidth = groupWidth ?? count * slotWidth;
  const noteSlotWidth = Math.min(slotWidth, notationWidth / count);
  const noteGroupOffset = (notationWidth - noteSlotWidth * count) / 2;
  const baseHeadWidth = size === 'mini' ? 4.2 : size === 'compact' ? 7 : 9.2;
  const minimumHeadWidth = size === 'full' ? 3.4 : 2.4;
  const noteHeadWidth = groupWidth === undefined
    ? baseHeadWidth
    : Math.max(minimumHeadWidth, Math.min(baseHeadWidth, noteSlotWidth * 0.72));
  const beamCount = isTuplet ? inferredBeamCount(noteDurationQuarter) : beamCountForSubdivision(subdivision);
  const events = Array.from({ length: count }, (_, index) => ({
    startQuarter: index * noteDurationQuarter,
    durationQuarter: noteDurationQuarter,
    beamCount,
    ...(isTuplet ? { tupletNumber: count } : {}),
  }));

  return createRhythmSymbolNotationPlan(events, {
    durationQuarter: count * noteDurationQuarter,
    width: notationWidth,
    size,
    noteHeadWidth,
    beamGroupQuarterNotes: isTuplet ? pulseQuarterNotes(timeSignature) : 1,
    noteAnchors: Array.from({ length: count }, (_, index) => noteGroupOffset + (index + 0.5) * noteSlotWidth),
    maxBeamNotesByLevel: Array.from({ length: beamCount }, (_, beamIndex) => beamGroupSize(count, beamIndex)),
    tupletLabelFontSize: size === 'mini' ? 6 : size === 'compact' ? 8 : 11,
  });
}

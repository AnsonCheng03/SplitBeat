import { SUBDIVISION_COUNTS } from '@/rhythm/subdivisions';
import type { Subdivision } from '@/types/rhythm';

export type NoteNotationSize = 'full' | 'compact' | 'mini';

export interface NoteNotationEvent {
  /** Note attack, measured in quarter notes from the start of the bar. */
  startQuarter: number;
  /** Written duration, measured in quarter notes. */
  durationQuarter: number;
  /** Override beam count when the written value is not a binary note value. */
  beamCount?: number;
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

export interface NoteNotationPlan {
  width: number;
  height: number;
  notes: NoteGlyphShape[];
  beams: NoteBeamShape[];
  tripletLabel: { top: number; fontSize: number } | null;
  staffLineY: number | null;
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
  tripletLabel: NoteNotationPlan['tripletLabel'];
  staffLineY: number | null;
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
  return Math.max(2, count / 2 ** beamIndex);
}

function inferredBeamCount(durationQuarter: number): number {
  if (durationQuarter >= 1 - EPSILON) return 0;

  const tripletBeamCount = Math.log2(1 / (durationQuarter * 3)) + 1;
  const roundedTripletBeamCount = Math.round(tripletBeamCount);
  if (
    roundedTripletBeamCount >= 0 &&
    roundedTripletBeamCount <= 4 &&
    Math.abs(tripletBeamCount - roundedTripletBeamCount) < EPSILON
  ) {
    return roundedTripletBeamCount;
  }

  return Math.max(0, Math.min(4, Math.ceil(Math.log2(1 / durationQuarter) - EPSILON)));
}

function slotWidthFor(count: number, size: NoteNotationSize): number {
  if (size === 'mini') return MINI_SLOT_WIDTHS[count];
  if (count >= 16) return size === 'compact' ? 8 : 10;
  if (count >= 8) return size === 'compact' ? 11 : 13;
  return size === 'compact' ? 19 : 24;
}

function beamCountForSubdivision(subdivision: Subdivision): number {
  const count = SUBDIVISION_COUNTS[subdivision];
  return subdivision === 'triplet' ? 1 : Math.log2(count);
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

  return {
    width: metrics.width,
    height: metrics.height,
    notes: glyphs,
    beams,
    tripletLabel: metrics.tripletLabel,
    staffLineY: metrics.staffLineY,
  };
}


/**
 * Make noteheads, stems, flags, and beams for the rhythm events in one bar.
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
  const height = size === 'mini' ? 28 : size === 'compact' ? 32 : 44;
  const beamHeight = size === 'mini' ? 1.6 : size === 'compact' ? 1.8 : 2.6;
  const beamGap = beamHeight + (size === 'mini' ? 1 : size === 'compact' ? 1.2 : 1.8);
  const beamTop = size === 'mini' ? 3 : size === 'compact' ? 4 : 5;
  const horizontalInset = Math.min(options.width / 2, headWidth / 2 + 2);
  const usableWidth = Math.max(0, options.width - horizontalInset * 2);
  const orderedEvents = Array.from(events)
    .map((event, originalIndex) => ({ event, originalIndex }))
    .sort((left, right) => left.event.startQuarter - right.event.startQuarter || left.originalIndex - right.originalIndex)
    .map(({ event }) => event);
  const noteAnchors = orderedEvents.map(
    (event) => horizontalInset + (event.startQuarter / options.durationQuarter) * usableWidth,
  );

  return buildNotationPlan(orderedEvents, {
    width: options.width,
    height,
    noteAnchors,
    headWidth,
    headHeight,
    stemWidth: size === 'mini' ? 1.2 : size === 'compact' ? 1.4 : 1.8,
    beamTop,
    beamHeight,
    beamGap,
    flagWidth: Math.max(size === 'mini' ? 5 : 7, headWidth * 0.9),
    beamGroupQuarterNotes,
    tripletLabel: null,
    staffLineY: height - 5,
  });
}

/** Make the repeated subdivision symbol used by the live practice screen. */
export function createNoteNotationPlan(
  subdivision: Subdivision,
  size: NoteNotationSize = 'full',
): NoteNotationPlan {
  const count = SUBDIVISION_COUNTS[subdivision];
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
  const beamCount = beamCountForSubdivision(subdivision);
  const events = Array.from({ length: count }, (_, index) => ({
    startQuarter: index / count,
    durationQuarter: 1 / count,
    beamCount,
  }));

  return buildNotationPlan(events, {
    width: count * slotWidth,
    height: mini ? 34 : compact ? 56 : 68,
    noteAnchors: Array.from({ length: count }, (_, index) => (index + 0.5) * slotWidth),
    headWidth,
    headHeight,
    stemWidth: count >= 8 ? mini ? 1 : 1.5 : mini ? 1.2 : 2,
    beamTop: subdivision === 'triplet' ? mini ? 10 : compact ? 15 : 17 : mini ? 3 : compact ? 4 : 5,
    beamHeight: mini ? 1.6 : count >= 8 ? compact ? 2 : 2.5 : compact ? 4 : 5,
    beamGap: (mini ? 1.6 : count >= 8 ? compact ? 2 : 2.5 : compact ? 4 : 5) + (mini ? 1 : compact ? 2 : 3),
    flagWidth: Math.max(slotWidth * 0.7, headWidth),
    beamGroupQuarterNotes: 1,
    maxBeamNotesByLevel: Array.from({ length: beamCount }, (_, beamIndex) => beamGroupSize(count, beamIndex)),
    tripletLabel: subdivision === 'triplet' ? { top: 0, fontSize: mini ? 8 : compact ? 12 : 14 } : null,
    staffLineY: null,
  });
}

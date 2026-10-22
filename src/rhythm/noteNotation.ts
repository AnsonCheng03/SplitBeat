import { SUBDIVISION_COUNTS } from '@/rhythm/subdivisions';
import type { Subdivision } from '@/types/rhythm';

export type NoteNotationSize = 'full' | 'compact' | 'mini';

export interface NoteGlyphShape {
  key: string;
  left: number;
  headLeft: number;
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
}

const MINI_SLOT_WIDTHS: Record<number, number> = { 1: 15, 2: 15, 3: 12, 4: 11, 8: 8, 16: 6 };
const BEAM_SLOPE = -Math.tan((3 * Math.PI) / 180);

function beamGroupSize(count: number, beamIndex: number): number {
  if (beamIndex === 0 || count === 4 || count === 2) return count;
  return Math.max(2, count / 2 ** beamIndex);
}

function slotWidthFor(count: number, size: NoteNotationSize): number {
  if (size === 'mini') return MINI_SLOT_WIDTHS[count];
  if (count >= 16) return size === 'compact' ? 8 : 10;
  if (count >= 8) return size === 'compact' ? 11 : 13;
  return size === 'compact' ? 19 : 24;
}

function beamCountFor(subdivision: Subdivision, count: number): number {
  return subdivision === 'triplet' ? 1 : Math.log2(count);
}

/**
 * Build connected note glyphs and their shared beams for one beat. Each note
 * owns its head and stem geometry; beam groups deliberately join those stems.
 */
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
  const stemWidth = mini ? 1.2 : compact ? 1.6 : 2;
  const beamHeight = mini ? 1.6 : compact ? 2.3 : 3;
  const beamGap = beamHeight + (mini ? 1.1 : compact ? 1.8 : 2.5);
  const height = mini ? 34 : compact ? 56 : 68;
  const baseline = mini ? 29 : compact ? 49 : 61;
  const beamTop = subdivision === 'triplet'
    ? mini ? 10 : compact ? 15 : 17
    : mini ? 3 : compact ? 4 : 5;
  const beamCount = beamCountFor(subdivision, count);
  const notes: NoteGlyphShape[] = Array.from({ length: count }, (_, index) => {
    const headLeft = slotWidth / 2 - headWidth / 2;
    const headTop = baseline - headHeight;
    const stemCenterX = index * slotWidth + headLeft + headWidth * 0.8;
    const stemBottom = headTop + headHeight * 0.48;
    const stemTop = beamTop + beamHeight + BEAM_SLOPE * (stemCenterX - notesFirstStemX(slotWidth, headWidth));

    return {
      key: `note-${index}`,
      left: index * slotWidth,
      headLeft,
      headTop,
      headWidth,
      headHeight,
      stemLeft: headLeft + headWidth * 0.8 - stemWidth / 2,
      stemTop,
      stemHeight: Math.max(0, stemBottom - stemTop),
      stemWidth,
    };
  });

  const beams: NoteBeamShape[] = [];
  for (let beamIndex = 0; beamIndex < beamCount; beamIndex += 1) {
    const groupSize = beamGroupSize(count, beamIndex);
    for (let firstNote = 0; firstNote < count; firstNote += groupSize) {
      const lastNote = Math.min(count, firstNote + groupSize) - 1;
      if (lastNote === firstNote) continue;

      const firstStemCenterX = firstNote * slotWidth + slotWidth / 2 + headWidth * 0.3;
      const lastStemCenterX = lastNote * slotWidth + slotWidth / 2 + headWidth * 0.3;
      const left = firstStemCenterX - beamHeight * 0.25;
      const right = lastStemCenterX + beamHeight * 0.25;
      const middleX = (left + right) / 2;
      const middleY = beamTop + beamIndex * beamGap + beamHeight / 2 + BEAM_SLOPE * (middleX - firstStemCenterX);

      beams.push({
        key: `beam-${beamIndex}-${firstNote}`,
        left,
        top: middleY - beamHeight / 2,
        width: right - left,
        height: beamHeight,
        rotationDegrees: -3,
      });
    }
  }

  return {
    width: count * slotWidth,
    height,
    notes,
    beams,
    tripletLabel: subdivision === 'triplet'
      ? { top: 0, fontSize: mini ? 8 : compact ? 12 : 14 }
      : null,
  };
}

function notesFirstStemX(slotWidth: number, headWidth: number): number {
  return slotWidth / 2 + headWidth * 0.3;
}

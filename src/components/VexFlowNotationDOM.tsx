'use dom';

import { useEffect, useRef } from 'react';
import { Beam, Renderer, Stave, StaveNote, Stem } from 'vexflow';
import type { NoteNotationPlan } from '@/rhythm/noteNotation';
import { positionVexFlowNote } from '@/rhythm/vexFlowNotePlacement';

interface VexFlowNotationDOMProps {
  plan: NoteNotationPlan;
  color: string;
  dom?: import('expo/dom').DOMProps;
}

function durationForNote(beamCount: number, durationQuarter: number): { duration: string; dots: number } {
  const candidates = [
    { duration: 'w', quarterNotes: 4, dots: 0 },
    { duration: 'h', quarterNotes: 2, dots: 0 },
    { duration: 'q', quarterNotes: 1, dots: 0 },
    { duration: '8', quarterNotes: 0.5, dots: 0 },
    { duration: '16', quarterNotes: 0.25, dots: 0 },
    { duration: '32', quarterNotes: 0.125, dots: 0 },
    { duration: '64', quarterNotes: 0.0625, dots: 0 },
    { duration: 'h', quarterNotes: 3, dots: 1 },
    { duration: 'q', quarterNotes: 1.5, dots: 1 },
    { duration: '8', quarterNotes: 0.75, dots: 1 },
    { duration: '16', quarterNotes: 0.375, dots: 1 },
    { duration: '32', quarterNotes: 0.1875, dots: 1 },
    { duration: '64', quarterNotes: 0.09375, dots: 1 },
  ];
  const exact = candidates.find((candidate) => Math.abs(candidate.quarterNotes - durationQuarter) < 0.00001);
  if (exact) return { duration: exact.duration, dots: exact.dots };

  return {
    duration: beamCount === 0 ? 'q' : beamCount === 1 ? '8' : beamCount === 2 ? '16' : beamCount === 3 ? '32' : '64',
    dots: 0,
  };
}

function drawNotation(container: HTMLDivElement, plan: NoteNotationPlan, color: string) {
  container.replaceChildren();
  if (plan.events.length === 0) return;
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(plan.width, plan.height);
  const context = renderer.getContext();
  const lineSpacing = plan.noteBaselineY === null ? 3 : 6;
  const baseline = plan.noteBaselineY ?? plan.height - 7;
  const stave = new Stave(0, baseline - lineSpacing * 8, plan.width, {
    spacing_between_lines_px: lineSpacing,
    line_config: Array.from({ length: 5 }, () => ({ visible: false })),
  });
  const pitch = 'e/4';
  const targetHeadWidth = plan.notes[0]?.headWidth ?? 8;
  const glyphScale = Math.max(12, Math.min(56, targetHeadWidth / 0.306));
  const stemLength = plan.height <= 36 ? 13 : plan.height <= 48 ? 17 : plan.height <= 58 ? 21 : 25;

  const notes = plan.events.map((event, index) => {
    const shape = plan.notes[index];
    if (!shape) throw new Error(`Missing engraved note geometry for event ${index + 1}.`);

    const value = durationForNote(event.beamCount ?? 0, event.durationQuarter);
    const note = new StaveNote({
      keys: [pitch],
      duration: value.duration,
      dots: value.dots,
      clef: 'treble',
      stem_direction: Stem.UP,
      glyph_font_scale: glyphScale,
    });
    note.setStave(stave);
    note.setStyle({ fillStyle: color, strokeStyle: color });
    note.setStemStyle({ fillStyle: color, strokeStyle: color });
    const centerX = shape.left + shape.headWidth / 2;
    positionVexFlowNote(note, centerX);
    if (note.hasStem()) note.setStemLength(stemLength);
    note.setContext(context);
    return note;
  });

  const beams = plan.beams
    .filter((beam) => beam.kind === 'beam' && beam.level === 0)
    .map((beamShape) => {
      const group = notes.slice(beamShape.startIndex, beamShape.endIndex + 1);
      if (group.length < 2) return null;
      const beam = new Beam(group, false);
      beam.setStyle({ fillStyle: color, strokeStyle: color });
      beam.setContext(context);
      return beam;
    });

  notes.forEach((note) => note.draw());
  beams.forEach((beam) => beam?.draw());
}

export default function VexFlowNotationDOM({ plan, color }: VexFlowNotationDOMProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) drawNotation(containerRef.current, plan, color);
  }, [color, plan]);

  return (
    <div
      ref={containerRef}
      style={{
        width: plan.width,
        height: plan.height,
        overflow: 'hidden',
        background: 'transparent',
      }}
    />
  );
}

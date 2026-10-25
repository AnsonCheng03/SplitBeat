'use dom';

import { useLayoutEffect, useRef } from 'react';
import { Beam, Renderer, Stave } from 'vexflow';
import type { StaveNote } from 'vexflow';
import type { NoteNotationPlan } from '@/rhythm/noteNotation';
import { positionVexFlowNote } from '@/rhythm/vexFlowNotePlacement';
import { createVexFlowRhythmNote, createVexFlowRhythmTies } from '@/rhythm/vexFlowRhythmNote';

interface VexFlowNotationDOMProps {
  plan: NoteNotationPlan;
  color: string;
  noteCenterY: number;
  restSymbol?: boolean;
  onReady?: () => void;
  dom?: import('expo/dom').DOMProps;
}

function drawNotation(container: HTMLDivElement, plan: NoteNotationPlan, color: string, noteCenterY: number, restSymbol: boolean) {
  container.replaceChildren();
  if (plan.events.length === 0) return;
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(plan.width, plan.height);
  const context = renderer.getContext();
  const lineSpacing = plan.noteBaselineY === null ? 3 : 6;
  const stave = new Stave(0, noteCenterY - lineSpacing * (restSymbol ? 2 : 4), plan.width, {
    spacing_between_lines_px: lineSpacing,
    space_above_staff_ln: 0,
    space_below_staff_ln: 0,
    line_config: Array.from({ length: 5 }, () => ({ visible: false })),
  });
  const targetHeadWidth = plan.notes[0]?.headWidth ?? 8;
  const glyphScale = Math.max(12, Math.min(56, targetHeadWidth / 0.306));
  const beamTop = plan.beams
    .filter((beam) => beam.kind === 'beam' && beam.level === 0)
    .reduce((top, beam) => Math.min(top, beam.top), plan.height * 0.28);
  const stemLength = Math.max(12, Math.min(60, noteCenterY - beamTop));

  const notes = plan.events.map((event, index) => {
    const shape = plan.notes[index];
    if (!shape) throw new Error(`Missing engraved note geometry for event ${index + 1}.`);

    const note = createVexFlowRhythmNote(event, { color, glyphScale, stemLength, rest: restSymbol });
    note.setStave(stave);
    const centerX = shape.left + shape.headWidth / 2;
    positionVexFlowNote(note, centerX);
    note.setContext(context);
    return note;
  });

  const beams = (restSymbol ? [] : plan.beams)
    .filter((beam) => beam.kind === 'beam' && beam.level === 0)
    .flatMap((beamShape) => {
      const groups: StaveNote[][] = [];
      let group: StaveNote[] = [];
      for (let index = beamShape.startIndex; index <= beamShape.endIndex; index += 1) {
        const note = notes[index];
        const event = plan.events[index];
        if (!note || event?.isRest) {
          if (group.length > 1) groups.push(group);
          group = [];
          continue;
        }
        group.push(note);
      }
      if (group.length > 1) groups.push(group);
      return groups.map((beamNotes) => {
        const beam = new Beam(beamNotes, false);
        beam.setStyle({ fillStyle: color, strokeStyle: color });
        beam.setContext(context);
        return beam;
      });
    });

  const ties = restSymbol ? [] : createVexFlowRhythmTies(notes, plan.events);

  notes.forEach((note) => note.draw());
  beams.forEach((beam) => beam?.draw());
  ties.forEach((tie) => {
    tie.setContext(context);
    tie.draw();
  });
}

export default function VexFlowNotationDOM({ plan, color, noteCenterY, restSymbol = false, onReady }: VexFlowNotationDOMProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    drawNotation(containerRef.current, plan, color, noteCenterY, restSymbol);
    onReady?.();
  }, [color, noteCenterY, onReady, plan, restSymbol]);

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

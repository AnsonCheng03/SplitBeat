import assert from 'node:assert/strict';
import test from 'node:test';
import { getMixturePattern } from '@/rhythm/mixtures';
import { mixtureNotationEvents } from '@/rhythm/mixtureNotation';
import { createRhythmSymbolNotationPlan } from '@/rhythm/noteNotation';

test('mixed-pattern rests become engraved rest events at their written positions', () => {
  const pattern = getMixturePattern('semiquaverDemisemiquaverRestDemisemiquaver');
  const events = mixtureNotationEvents(pattern);
  const restEvent = events.find((event) => event.isRest);

  assert.deepEqual(events.map(({ startQuarter, durationQuarter, isRest }) => [startQuarter, durationQuarter, isRest]), [
    [0, 0.25, undefined],
    [0.25, 0.125, true],
    [0.375, 0.125, undefined],
  ]);

  const plan = createRhythmSymbolNotationPlan(events, {
    durationQuarter: pattern.durationQuarter,
    width: 80,
    size: 'mini',
    beamGroupQuarterNotes: pattern.durationQuarter,
  });
  assert.equal(plan.events.length, 3);
  assert.equal(plan.events[1]?.isRest, true);
  assert.equal(restEvent?.startQuarter, 0.25);

  const noteheadGaps = plan.notes.slice(1).map((note, index) => {
    const previous = plan.notes[index]!;
    const centerGap = note.left + note.headWidth / 2 - (previous.left + previous.headWidth / 2);
    const visibleGap = centerGap - (previous.headWidth + note.headWidth) / 2;
    return visibleGap >= Math.min(3, centerGap * 0.4) - 0.00001;
  });
  assert.ok(noteheadGaps.every(Boolean), 'mixed note groups leave padding around every notehead');
});

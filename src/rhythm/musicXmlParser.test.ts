import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseMusicXmlRhythm } from '@/rhythm/musicXmlParser';

function scoreWithTwoStaves(measures: string, signature = '4/4', divisions = 4) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <score-partwise version="4.0">
      <work><work-title>Practice Etude</work-title></work>
      <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
      <part id="P1">${measures}</part>
    </score-partwise>`;
}

function attributes(signature: string, divisions = 4) {
  const [beats, beatType] = signature.split('/');
  return `<attributes><divisions>${divisions}</divisions><staves>2</staves><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time></attributes>`;
}

function note(duration: number, staff: number, pitch: string, tie = '') {
  return `<note>${tie ? `<tie type="${tie}"/>` : ''}<pitch><step>${pitch}</step><octave>4</octave></pitch><duration>${duration}</duration><voice>1</voice><staff>${staff}</staff>${tie ? `<notations><tied type="${tie}"/></notations>` : ''}</note>`;
}

test('converts both staves, rests, compound meter, and metronome tempo', () => {
  const triplets = Array.from({ length: 9 }, () => note(4, 1, 'C')).join('');
  const leftPulse = Array.from({ length: 3 }, () => note(12, 2, 'C')).join('');
  const xml = scoreWithTwoStaves(
    `<measure number="1">${attributes('6/8', 12)}<direction><sound tempo="120"/></direction>${triplets}<backup><duration>36</duration></backup>${leftPulse}</measure>`,
    '6/8',
  );

  const score = parseMusicXmlRhythm(xml);
  assert.equal(score.title, 'Practice Etude');
  assert.equal(score.timeSignature, '6/8');
  assert.equal(score.bpm, 80);
  assert.equal(score.trackCount, 2);
  assert.equal(score.totalQuarterNotes, 3);
  const rightOnsets = score.measures[0].rightEvents.map((event) => event.startQuarter);
  const expectedRightOnsets = [0, 1 / 3, 2 / 3, 1, 4 / 3, 5 / 3, 2, 7 / 3, 8 / 3];
  assert.equal(rightOnsets.length, expectedRightOnsets.length);
  expectedRightOnsets.forEach((onset, index) => {
    assert.ok(Math.abs((rightOnsets[index] ?? Number.NaN) - onset) < 1e-9);
  });
  assert.deepEqual(
    score.measures[0].leftEvents.map((event) => event.startQuarter),
    [0, 1, 2],
  );
});

test('preserves MusicXML tuplet counts for the score rhythm preview', () => {
  const triplets = Array.from(
    { length: 3 },
    () => `<note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification><staff>1</staff></note>`,
  ).join('');
  const xml = scoreWithTwoStaves(
    `<measure>${attributes('4/4', 12)}${triplets}<backup><duration>12</duration></backup>${note(48, 2, 'C')}</measure>`,
  );

  const score = parseMusicXmlRhythm(xml);
  assert.deepEqual(
    score.measures[0]!.rightEvents.map((event) => event.tupletNumber),
    [3, 3, 3],
  );
  assert.equal(score.measures[0]!.leftEvents[0]!.tupletNumber, undefined);
});

test('normalizes marked note values to the app pulse in compound and half-note meters', () => {
  const compound = scoreWithTwoStaves(
    `<measure>${attributes('6/8')}<direction><direction-type><metronome><beat-unit>quarter</beat-unit><beat-unit-dot/><per-minute>60</per-minute></metronome></direction-type></direction>${note(4, 1, 'C')}<backup><duration>4</duration></backup>${note(4, 2, 'C')}</measure>`,
    '6/8',
  );
  const halfNotePulse = scoreWithTwoStaves(
    `<measure>${attributes('2/2')}<direction><direction-type><metronome><beat-unit>half</beat-unit><per-minute>60</per-minute></metronome></direction-type></direction>${note(8, 1, 'C')}<backup><duration>8</duration></backup>${note(8, 2, 'C')}</measure>`,
    '2/2',
  );

  assert.equal(parseMusicXmlRhythm(compound).bpm, 60);
  assert.equal(parseMusicXmlRhythm(halfNotePulse).bpm, 60);
});

test('keeps note positions stable when MusicXML divisions change inside a measure', () => {
  const xml = scoreWithTwoStaves(
    `<measure>${attributes('2/4')}<note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><staff>1</staff></note><attributes><divisions>8</divisions></attributes><note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><staff>1</staff></note><backup><duration>12</duration></backup><note><pitch><step>C</step><octave>3</octave></pitch><duration>16</duration><staff>2</staff></note></measure>`,
    '2/4',
  );
  const score = parseMusicXmlRhythm(xml);

  assert.deepEqual(score.measures[0].rightEvents, [
    { startQuarter: 0, durationQuarter: 1, midiPitches: [60] },
    { startQuarter: 1, durationQuarter: 0.5, midiPitches: [62] },
  ]);
  assert.equal(score.measures[0].durationQuarter, 2);
});

test('merges tied note durations without expecting a second tap', () => {
  const xml = scoreWithTwoStaves(
    `<measure number="1">${attributes('4/4')}<note><rest/><duration>12</duration><voice>1</voice><staff>1</staff></note>${note(4, 1, 'C', 'start')}<backup><duration>16</duration></backup>${note(16, 2, 'C')}</measure>
     <measure number="2">${note(4, 1, 'C', 'stop')}${note(4, 1, 'D')}<backup><duration>8</duration></backup>${note(16, 2, 'C')}</measure>`,
  );

  const score = parseMusicXmlRhythm(xml);
  assert.equal(score.measures[0].rightEvents.length, 1);
  assert.equal(score.measures[0].rightEvents[0].durationQuarter, 2);
  assert.equal(score.measures[0].rightEvents[0].notationDurationQuarter, 1);
  assert.equal(score.measures[0].rightEvents[0].tieToNext, true);
  assert.deepEqual(score.measures[0].rightEvents[0].midiPitches, [60]);
  assert.deepEqual(score.measures[1].rightEvents[0], {
    startQuarter: 0,
    durationQuarter: 1,
    notationDurationQuarter: 1,
    midiPitches: [60],
    tieFromPrevious: true,
    isTieContinuation: true,
    isCrossBarTieContinuation: true,
  });
  assert.equal(score.measures[1].rightEvents[1]!.startQuarter, 1);
  assert.equal(score.measures[1].rightEvents[1]!.midiPitches?.[0], 62);
});

test('preserves MusicXML pitch alterations and chord pitches for score playback', () => {
  const xml = scoreWithTwoStaves(
    `<measure>${attributes('2/4')}<note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><staff>1</staff></note><note><chord/><pitch><step>F</step><alter>-1</alter><octave>4</octave></pitch><duration>4</duration><staff>1</staff></note><backup><duration>4</duration></backup>${note(8, 2, 'C')}</measure>`,
    '2/4',
  );
  const score = parseMusicXmlRhythm(xml);

  assert.equal(score.measures[0].rightEvents.length, 1);
  assert.equal(score.measures[0].rightEvents[0].startQuarter, 0);
  assert.deepEqual(score.measures[0].rightEvents[0].midiPitches, [60, 64]);
});

test('accepts a single-staff MusicXML file as one hand', () => {
  const xml = `<score-partwise><work><work-title>Solo</work-title></work><part-list><score-part id="P1"><part-name>Flute</part-name></score-part></part-list><part id="P1"><measure><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note></measure></part></score-partwise>`;
  const score = parseMusicXmlRhythm(xml);
  assert.equal(score.trackCount, 1);
  assert.equal(score.measures[0]!.rightEvents.length, 1);
  assert.equal(score.measures[0]!.leftEvents.length, 0);
});

test('rejects malformed, unsupported, and more-than-two-staff scores with useful errors', () => {
  assert.throws(() => parseMusicXmlRhythm('<score-partwise>'), /Invalid MusicXML/);
  assert.throws(() => parseMusicXmlRhythm('<score-timewise/>'), /partwise MusicXML/);
  assert.throws(
    () => parseMusicXmlRhythm(scoreWithTwoStaves(`<measure>${attributes('11/16')}</measure>`)),
    /11\/16 time signature is not supported/,
  );
  assert.throws(
    () => parseMusicXmlRhythm(scoreWithTwoStaves(`<measure><attributes><divisions>1</divisions><staves>3</staves><time><beats>4</beats><beat-type>4</beat-type></time></attributes></measure>`)),
    /one or two tracks/,
  );
  assert.throws(
    () => parseMusicXmlRhythm(scoreWithTwoStaves(`<measure>${attributes('4/4')}</measure><measure><attributes><time><beats>3</beats><beat-type>4</beat-type></time></attributes></measure>`)),
    /Time signature changes/,
  );
});

test('omits grace notes and reports that the score included them', () => {
  const xml = scoreWithTwoStaves(
    `<measure>${attributes('4/4')}<note><grace/><pitch><step>D</step><octave>4</octave></pitch><voice>1</voice><staff>1</staff></note>${note(16, 2, 'C')}</measure>`,
  );
  const score = parseMusicXmlRhythm(xml);
  assert.deepEqual(score.measures[0].rightEvents, []);
  assert.match(score.warnings[0] ?? '', /Grace notes were skipped/);
});

test('rejects tempo changes instead of flattening them into one pulse', () => {
  const xml = scoreWithTwoStaves(
    `<measure>${attributes('4/4')}<direction><sound tempo="100"/></direction>${note(16, 1, 'C')}<backup><duration>16</duration></backup>${note(16, 2, 'C')}</measure>
     <measure><direction><sound tempo="110"/></direction>${note(16, 1, 'C')}<backup><duration>16</duration></backup>${note(16, 2, 'C')}</measure>`,
  );
  assert.throws(() => parseMusicXmlRhythm(xml), /Tempo changes/);
});

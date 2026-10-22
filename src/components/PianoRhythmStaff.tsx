import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { NoteNotation } from '@/components/NoteNotation';
import { createBarNoteNotationPlan, createStaffNotationLayout, type NoteNotationSize } from '@/rhythm/noteNotation';
import { createExerciseBarEvents, durationOfSubdivisionBar } from '@/rhythm/patternNotation';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import type { ExerciseStep, Hand, RhythmicFeel, TimeSignature } from '@/types/rhythm';
import { colors } from '@/theme';

export function PianoRhythmStaff({
  steps,
  barStartBeat,
  timeSignature,
  feel,
  restBetweenChanges,
  activeHand,
  compact = false,
}: {
  steps: ExerciseStep[];
  barStartBeat: number;
  timeSignature: TimeSignature;
  feel: RhythmicFeel;
  restBetweenChanges: boolean;
  activeHand?: Hand;
  compact?: boolean;
}) {
  const size: NoteNotationSize = compact ? 'compact' : 'full';
  return (
    <View
      testID="practice.grandStaff"
      accessibilityLabel="Piano grand staff. Treble clef for right hand, bass clef for left hand."
      style={{ paddingHorizontal: compact ? 4 : 10, gap: compact ? 2 : 4 }}
    >
      <StaffTrack
        testID="practice.grandStaff.treble"
        clef="𝄞"
        label="TREBLE"
        hand="right"
        steps={steps}
        barStartBeat={barStartBeat}
        timeSignature={timeSignature}
        feel={feel}
        restBetweenChanges={restBetweenChanges}
        active={activeHand === undefined || activeHand === 'right'}
        size={size}
      />
      <StaffTrack
        testID="practice.grandStaff.bass"
        clef="𝄢"
        label="BASS"
        hand="left"
        steps={steps}
        barStartBeat={barStartBeat}
        timeSignature={timeSignature}
        feel={feel}
        restBetweenChanges={restBetweenChanges}
        active={activeHand === undefined || activeHand === 'left'}
        size={size}
      />
    </View>
  );
}

function StaffTrack({
  testID,
  clef,
  label,
  hand,
  steps,
  barStartBeat,
  timeSignature,
  feel,
  restBetweenChanges,
  active,
  size,
}: {
  testID: string;
  clef: string;
  label: string;
  hand: Hand;
  steps: ExerciseStep[];
  barStartBeat: number;
  timeSignature: TimeSignature;
  feel: RhythmicFeel;
  restBetweenChanges: boolean;
  active: boolean;
  size: NoteNotationSize;
}) {
  const [width, setWidth] = useState(0);
  const color = hand === 'left' ? colors.left : colors.right;
  const durationQuarter = durationOfSubdivisionBar(timeSignature);
  const events = useMemo(
    () => active ? createExerciseBarEvents({ steps, hand, barStartBeat, timeSignature, feel, restBetweenChanges }) : [],
    [active, barStartBeat, feel, hand, restBetweenChanges, steps, timeSignature],
  );
  const plan = useMemo(() => width > 0
    ? createBarNoteNotationPlan(events, {
      durationQuarter,
      width,
      size,
      beamGroupQuarterNotes: pulseQuarterNotes(timeSignature),
    })
    : null, [durationQuarter, events, size, timeSignature, width]);
  const rowHeight = size === 'compact' ? 50 : 60;
  const staffLayout = createStaffNotationLayout(rowHeight, plan?.height ?? rowHeight);

  return (
    <View testID={testID} style={{ minHeight: rowHeight, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: active ? 1 : 0.4 }}>
      <View style={{ width: 34, alignItems: 'center', justifyContent: 'center' }}>
        <Text accessibilityLabel={`${label.toLowerCase()} clef`} style={{ color, fontSize: size === 'compact' ? 24 : 31, lineHeight: size === 'compact' ? 27 : 35 }}>{clef}</Text>
        <Text style={{ color: colors.dim, fontSize: 6, fontWeight: '900', letterSpacing: 0.3 }}>{label}</Text>
      </View>
      <View
        onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
        style={{ flex: 1, height: rowHeight, overflow: 'hidden' }}
      >
        {[0, 1, 2, 3, 4].map((line) => (
          <View
            key={line}
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, top: staffLayout.staffLineBottom - line * 6, height: 1, backgroundColor: colors.line }}
          />
        ))}
        {plan ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: staffLayout.notationTop, left: 0, right: 0, height: plan.height, alignItems: 'center', justifyContent: 'center' }}
          >
            <NoteNotation
              plan={plan}
              color={active ? color : colors.dim}
              testID={`${testID}.notes`}
              accessibilityLabel={`${label.toLowerCase()} clef ${active ? `${events.length} notes` : 'rest'}`}
            />
          </View>
        ) : null}
        {!active ? (
          <Text style={{ position: 'absolute', left: 6, top: rowHeight / 2 - 6, color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 }}>
            REST
          </Text>
        ) : null}
      </View>
    </View>
  );
}

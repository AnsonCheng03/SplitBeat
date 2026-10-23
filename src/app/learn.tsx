import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import {
  getLessonAvailability,
  LEARN_COURSE,
  lessonProgressPercent,
  lessonSettings,
} from '@/rhythm/learnCourse';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { readLearnProgress } from '@/store/learnProgress';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';
import type { LearnLesson } from '@/rhythm/learnCourse';

function LessonTile({
  lesson,
  selected,
  completed,
  locked,
  onPress,
}: {
  lesson: LearnLesson;
  selected: boolean;
  completed: boolean;
  locked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={`learn.lesson.${lesson.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Lesson ${lesson.number}, ${lesson.title}${completed ? ', complete' : locked ? ', locked' : ''}`}
      accessibilityState={{ selected, disabled: locked }}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => ({
        flexGrow: 1,
        flexBasis: '30%',
        minWidth: 145,
        minHeight: 76,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: selected ? colors.surfaceRaised : colors.surface,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? colors.accent : colors.line,
        opacity: locked ? 0.42 : pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }}>
          {String(lesson.number).padStart(2, '0')} · {lesson.level}
        </Text>
        <Text style={{ color: completed ? colors.left : locked ? colors.dim : colors.accent, fontSize: 11, fontWeight: '900' }}>
          {completed ? '✓' : locked ? 'LOCKED' : '›'}
        </Text>
      </View>
      <Text numberOfLines={1} style={{ color: locked ? colors.muted : colors.text, fontSize: 14, fontWeight: '800', marginTop: 8 }}>
        {lesson.title}
      </Text>
      <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 10, marginTop: 3 }}>
        {lesson.skill}
      </Text>
    </Pressable>
  );
}

function PatternPreview({ lesson }: { lesson: LearnLesson }) {
  const pair = lesson.patternPairs[0];
  const oneHand = lesson.trainingMode === 'single-hand';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
      <PatternNote label={oneHand ? 'ONE HAND' : 'LEFT'} subdivision={pair.leftSubdivision} color={oneHand ? colors.accent : colors.left} timeSignature={lesson.timeSignature} />
      {oneHand ? null : <PatternNote label="RIGHT" subdivision={pair.rightSubdivision} color={colors.right} timeSignature={lesson.timeSignature} />}
    </View>
  );
}

function PatternNote({
  label,
  subdivision,
  color,
  timeSignature,
}: {
  label: string;
  subdivision: LearnLesson['patternPairs'][number]['leftSubdivision'];
  color: string;
  timeSignature: LearnLesson['timeSignature'];
}) {
  return (
    <View style={{ flex: 1, minWidth: 0, minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
      <RhythmSymbol subdivision={subdivision} color={color} mini timeSignature={timeSignature} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }}>{label}</Text>
        <Text numberOfLines={1} style={{ color: colors.text, fontSize: 10, fontWeight: '700', marginTop: 2 }}>{SUBDIVISION_LABELS[subdivision]}</Text>
      </View>
    </View>
  );
}

export default function LearnScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { lessonId: routeLessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const { settings, audioStatus, prepareExercise } = useRhythmSession();
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState(LEARN_COURSE[0].id);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [starting, setStarting] = useState(false);
  const compact = width < 950;

  useFocusEffect(useCallback(() => {
    let active = true;
    void readLearnProgress().then((completed) => {
      if (!active) return;
      setCompletedLessonIds(completed);
      const requested = LEARN_COURSE.find((lesson) => lesson.id === routeLessonId);
      const nextLesson = LEARN_COURSE.find((lesson) => !completed.includes(lesson.id));
      const selection = requested && !completed.includes(requested.id)
        ? requested
        : nextLesson ?? requested ?? LEARN_COURSE.at(-1)!;
      setSelectedLessonId(selection.id);
      setProgressLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [routeLessonId]));

  const selectedLesson = useMemo(
    () => LEARN_COURSE.find((lesson) => lesson.id === selectedLessonId) ?? LEARN_COURSE[0],
    [selectedLessonId],
  );
  const completedCount = completedLessonIds.length;

  const startLesson = async () => {
    if (starting || !progressLoaded || audioStatus === 'loading') return;
    setStarting(true);
    try {
      await prepareExercise(undefined, {
        settings: lessonSettings(selectedLesson, settings),
        patternPairs: selectedLesson.patternPairs,
      });
      router.replace({ pathname: '/practice', params: { lessonId: selectedLesson.id } });
    } catch {
      Alert.alert('Audio could not start', 'Check your device audio settings and try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <SafeAreaView testID="learn.screen" style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      <ScrollView
        style={{ width: compact ? '40%' : 350, flexGrow: 0, borderRightWidth: 1, borderRightColor: colors.line, backgroundColor: colors.surface }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: compact ? 16 : 24, paddingVertical: compact ? 10 : 18 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable testID="learn.home" onPress={() => router.replace('/')} hitSlop={10} style={{ minHeight: 32, justifyContent: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.9 }}>‹  HOME</Text>
        </Pressable>
        <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: compact ? 7 : 15 }}>
          GUIDED COURSE
        </Text>
        <Text style={{ color: colors.text, fontSize: compact ? 24 : 30, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 }}>
          Learn rhythm.
        </Text>
        <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>
          A simple path from steady pulse to independent rhythms.
        </Text>

        <View style={{ marginTop: compact ? 13 : 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>YOUR PROGRESS</Text>
            <Text testID="learn.progress.count" style={{ color: colors.accent, fontSize: 11, fontWeight: '900' }}>
              {completedCount} / {LEARN_COURSE.length}
            </Text>
          </View>
          <View style={{ height: 5, borderRadius: 4, backgroundColor: colors.line, marginTop: 8, overflow: 'hidden' }}>
            <View style={{ width: `${lessonProgressPercent(completedLessonIds)}%`, height: 5, borderRadius: 4, backgroundColor: colors.left }} />
          </View>
        </View>

        <View style={{ marginTop: compact ? 14 : 23 }}>
          <Text style={{ color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }}>
            LESSON {String(selectedLesson.number).padStart(2, '0')} · {selectedLesson.level}
          </Text>
          <Text testID="learn.selected.title" style={{ color: colors.text, fontSize: compact ? 18 : 22, fontWeight: '900', marginTop: 5 }}>
            {selectedLesson.title}
          </Text>
          <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800', marginTop: 3 }}>
            {selectedLesson.skill} · {selectedLesson.timeSignature}
          </Text>
          <Text numberOfLines={compact ? 2 : 3} style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 7 }}>
            {selectedLesson.instruction}
          </Text>
          <PatternPreview lesson={selectedLesson} />
        </View>

        <View style={{ flex: 1, minHeight: compact ? 8 : 18 }} />
        <Pressable
          testID="learn.start"
          accessibilityRole="button"
          accessibilityLabel={`Start lesson ${selectedLesson.number}: ${selectedLesson.title}`}
          accessibilityState={{ disabled: starting || !progressLoaded || audioStatus === 'loading' }}
          disabled={starting || !progressLoaded || audioStatus === 'loading'}
          onPress={() => void startLesson()}
          style={({ pressed }) => ({ minHeight: compact ? 50 : 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderRadius: 15, backgroundColor: colors.left, opacity: starting || !progressLoaded || audioStatus === 'loading' ? 0.65 : pressed ? 0.84 : 1 })}
        >
          <View>
            <Text style={{ color: colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }}>
              {starting ? 'PREPARING…' : !progressLoaded ? 'LOADING COURSE…' : audioStatus === 'loading' ? 'PREPARING AUDIO…' : audioStatus === 'error' ? 'RETRY AUDIO & START' : 'START LESSON'}
            </Text>
            <Text style={{ color: '#18352C', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
              {selectedLesson.bpm} BPM · about 30 seconds
            </Text>
          </View>
          <Text style={{ color: colors.background, fontSize: 22, fontWeight: '700' }}>›</Text>
        </Pressable>
      </ScrollView>

      <View style={{ flex: 1, minWidth: 0, paddingHorizontal: compact ? 14 : 25, paddingTop: compact ? 13 : 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: compact ? 9 : 14 }}>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }}>COURSE PATH</Text>
          <Text style={{ color: colors.dim, fontSize: 10, fontWeight: '700' }}>Finish a lesson to open the next</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 14 }}>
          {LEARN_COURSE.map((lesson) => {
            const availability = getLessonAvailability(lesson.id, completedLessonIds);
            return (
              <LessonTile
                key={lesson.id}
                lesson={lesson}
                selected={selectedLesson.id === lesson.id}
                completed={availability === 'complete'}
                locked={availability === 'locked'}
                onPress={() => setSelectedLessonId(lesson.id)}
              />
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

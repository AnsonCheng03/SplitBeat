import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { starsForAccuracy } from '@/rhythm/learnRating';
import { useTheme } from '@/theme/ThemeProvider';
import type { LearnLesson } from '@/rhythm/learnCourse';
import {
  LearnLessonTileStyle1,
  LearnLessonTileStyle2,
  LearnLessonTileStyle3,
  LearnLessonTileStyle4,
  LearnLessonTileStyle5,
  LearnLessonTileStyle6,
  LearnLessonTileStyle7,
  LearnLessonTileStyle8,
  LearnLessonTileStyle9
} from '@/styles/learn';

export function LearnLessonTile({
  lesson,
  selected,
  completed,
  skipped,
  locked,
  paywalled,
  hasFullCourseUnlock,
  rating,
  onPress,
}: {
  lesson: LearnLesson;
  selected: boolean;
  completed: boolean;
  skipped: boolean;
  locked: boolean;
  paywalled: boolean;
  hasFullCourseUnlock: boolean;
  rating?: { bestAccuracy: number; attempts: number };
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const disabled = locked && !paywalled && !hasFullCourseUnlock;
  const stars = rating ? starsForAccuracy(rating.bestAccuracy) : 0;
  const lessonStatus = skipped
    ? t(', skipped, can be replayed')
    : completed
      ? t(', complete')
    : paywalled
      ? t(', paid course, tap to unlock')
      : locked
        ? t(', locked')
        : '';
  const lessonRating = rating
    ? t(', best {accuracy} percent, {stars} of 5 stars', { accuracy: Math.round(rating.bestAccuracy), stars })
    : '';
  return (
    <Pressable
      testID={`learn.lesson.${lesson.id}`}
      accessibilityRole="button"
      accessibilityLabel={t('Lesson {number}, {title}{status}{rating}', {
        number: lesson.number,
        title: t(lesson.title),
        status: lessonStatus,
        rating: lessonRating,
      })}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => (LearnLessonTileStyle1({ selected, colors, disabled, pressed }))}
    >
      <View style={LearnLessonTileStyle2()}>
        <Text style={LearnLessonTileStyle3({ colors })}>
          {String(lesson.number).padStart(2, '0')} · {t(lesson.level)}
        </Text>
        <Text style={LearnLessonTileStyle4({ completed, skipped, colors, disabled })}>
          {skipped ? '↪' : completed ? '✓' : paywalled ? 'PRO' : locked ? 'LOCKED' : '›'}
        </Text>
      </View>
      <Text numberOfLines={1} style={LearnLessonTileStyle5({ disabled, colors })}>
        {lesson.title}
      </Text>
      <View style={LearnLessonTileStyle6()}>
        <Text numberOfLines={1} style={LearnLessonTileStyle7({ colors })}>
          {lesson.skill}
        </Text>
        {rating ? (
          <Text testID={`learn.rating.${lesson.id}`} style={LearnLessonTileStyle8({ colors })}>
            {Math.round(rating.bestAccuracy)}% · {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          </Text>
        ) : skipped ? (
          <Text style={LearnLessonTileStyle9({ colors })}>{t('SKIPPED · NO STARS')}</Text>
        ) : completed ? (
          <Text style={LearnLessonTileStyle9({ colors })}>REPLAY FOR RATING</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

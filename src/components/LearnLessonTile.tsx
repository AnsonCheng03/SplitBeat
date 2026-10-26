import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { starsForAccuracy } from '@/rhythm/learnRating';
import { useTheme } from '@/theme/ThemeProvider';
import type { LearnLesson } from '@/rhythm/learnCourse';

export function LearnLessonTile({
  lesson,
  selected,
  completed,
  locked,
  paywalled,
  rating,
  onPress,
}: {
  lesson: LearnLesson;
  selected: boolean;
  completed: boolean;
  locked: boolean;
  paywalled: boolean;
  rating?: { bestAccuracy: number; attempts: number };
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const disabled = locked && !paywalled;
  const stars = rating ? starsForAccuracy(rating.bestAccuracy) : 0;
  const lessonStatus = completed
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
      style={({ pressed }) => ({
        flexGrow: 0,
        flexBasis: 'auto',
        width: '100%',
        minWidth: 0,
        minHeight: 82,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: selected ? colors.surfaceRaised : colors.surface,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? colors.accent : colors.line,
        opacity: disabled ? 0.42 : pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }}>
          {String(lesson.number).padStart(2, '0')} · {t(lesson.level)}
        </Text>
        <Text style={{ color: completed ? colors.left : disabled ? colors.dim : colors.accent, fontSize: 11, fontWeight: '900' }}>
          {completed ? '✓' : paywalled ? 'PRO' : locked ? 'LOCKED' : '›'}
        </Text>
      </View>
      <Text numberOfLines={1} style={{ color: disabled ? colors.muted : colors.text, fontSize: 14, fontWeight: '800', marginTop: 8 }}>
        {lesson.title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 3 }}>
        <Text numberOfLines={1} style={{ flex: 1, color: colors.muted, fontSize: 10 }}>
          {lesson.skill}
        </Text>
        {rating ? (
          <Text testID={`learn.rating.${lesson.id}`} style={{ color: colors.accent, fontSize: 9, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
            {Math.round(rating.bestAccuracy)}% · {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          </Text>
        ) : completed ? (
          <Text style={{ color: colors.dim, fontSize: 8, fontWeight: '800' }}>REPLAY FOR RATING</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

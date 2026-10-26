import { ScrollView, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { LearnLessonTile } from '@/components/LearnLessonTile';
import { getLessonAvailability, LEARN_COURSE } from '@/rhythm/learnCourse';
import { requiresLearnCourseUnlock } from '@/rhythm/learnCourseAccess';
import type { readLearnRatings } from '@/store/learnProgress';
import { useTheme } from '@/theme/ThemeProvider';

type LessonRating = Awaited<ReturnType<typeof readLearnRatings>>[number];

export function LearnCoursePath({
  compact,
  completedLessonIds,
  hasFullCourseUnlock,
  lessonRatings,
  selectedLessonId,
  onSelectLesson,
}: {
  compact: boolean;
  completedLessonIds: readonly string[];
  hasFullCourseUnlock: boolean;
  lessonRatings: readonly LessonRating[];
  selectedLessonId: string;
  onSelectLesson: (lessonId: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={{ flex: 1, minWidth: 0, paddingHorizontal: compact ? 10 : 18, paddingTop: compact ? 13 : 20, paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: compact ? 9 : 14 }}>
        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }}>{t('COURSE PATH')}</Text>
        <Text numberOfLines={1} style={{ color: colors.dim, fontSize: compact ? 9 : 10, fontWeight: '700' }}>{t('First 3 free · finish each to progress')}</Text>
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
        {LEARN_COURSE.map((lesson) => {
          const availability = getLessonAvailability(lesson.id, completedLessonIds);
          const paywalled = requiresLearnCourseUnlock(lesson, hasFullCourseUnlock);
          return (
            <LearnLessonTile
              key={lesson.id}
              lesson={lesson}
              selected={selectedLessonId === lesson.id}
              completed={availability === 'complete'}
              locked={availability === 'locked'}
              paywalled={paywalled}
              rating={lessonRatings.find((rating) => rating.lessonId === lesson.id)}
              onPress={() => onSelectLesson(lesson.id)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

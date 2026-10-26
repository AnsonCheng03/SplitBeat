import { ScrollView, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { LearnLessonTile } from '@/components/LearnLessonTile';
import { getLessonAvailability, LEARN_COURSE } from '@/rhythm/learnCourse';
import { requiresLearnCourseUnlock } from '@/rhythm/learnCourseAccess';
import type { readLearnRatings } from '@/store/learnProgress';
import { useTheme } from '@/theme/ThemeProvider';
import { LearnCoursePathStyle1, LearnCoursePathStyle2, LearnCoursePathStyle3, LearnCoursePathStyle4, LearnCoursePathStyle5, LearnCoursePathStyle6 } from '@/styles/learn';

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
    <View style={LearnCoursePathStyle1({ compact })}>
      <View style={LearnCoursePathStyle2({ compact })}>
        <Text style={LearnCoursePathStyle3({ colors })}>{t('COURSE PATH')}</Text>
        <Text numberOfLines={1} style={LearnCoursePathStyle4({ colors, compact })}>{t('First 3 free · finish each to progress')}</Text>
      </View>
      <ScrollView style={LearnCoursePathStyle5()} showsVerticalScrollIndicator={false} contentContainerStyle={LearnCoursePathStyle6()}>
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

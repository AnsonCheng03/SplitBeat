import { useEffect, useRef, useState } from 'react';
import type { LearnLesson } from '@/rhythm/learnCourse';
import { sessionAccuracy } from '@/features/results/resultPresentation';
import { completeLearnLesson, recordLearnLessonResult, syncLearnProgressIfEnabled } from '@/store/learnProgress';
import type { SessionResults } from '@/types/rhythm';
import type { LearnLessonRating } from '@/rhythm/learnRating';

export function useLessonCompletion(results: SessionResults | null, courseLesson?: LearnLesson) {
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [lessonRating, setLessonRating] = useState<LearnLessonRating | null>(null);
  const completionAttemptedFor = useRef<string | null>(null);
  const accuracy = results ? sessionAccuracy(results) : 0;

  useEffect(() => {
    if (!results || !courseLesson || completionAttemptedFor.current === courseLesson.id) return;
    completionAttemptedFor.current = courseLesson.id;

    let active = true;
    void Promise.all([
      completeLearnLesson(courseLesson.id),
      recordLearnLessonResult(courseLesson.id, accuracy),
    ]).then(([completedIds, rating]) => {
      if (!active) return;
      setLessonCompleted(completedIds.includes(courseLesson.id));
      setLessonRating(rating);
      void syncLearnProgressIfEnabled().catch(() => {});
    });

    return () => {
      active = false;
    };
  }, [accuracy, courseLesson, results]);

  return { lessonCompleted, lessonRating };
}

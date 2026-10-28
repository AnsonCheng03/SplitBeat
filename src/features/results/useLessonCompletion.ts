import { useEffect, useRef, useState } from 'react';
import type { LearnLesson } from '@/rhythm/learnCourse';
import { sessionAccuracy } from '@/features/results/resultPresentation';
import { recordLearnLessonOutcome, syncLearnProgressIfEnabled } from '@/store/learnProgress';
import type { SessionResults } from '@/types/rhythm';
import type { LearnLessonRating } from '@/rhythm/learnRating';

export function useLessonCompletion(results: SessionResults | null, courseLesson?: LearnLesson) {
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [lessonRating, setLessonRating] = useState<LearnLessonRating | null>(null);
  const [checkpointChallenge, setCheckpointChallenge] = useState(false);
  const [checkpointPassed, setCheckpointPassed] = useState(false);
  const completionAttemptedFor = useRef<string | null>(null);
  const accuracy = results ? sessionAccuracy(results) : 0;

  useEffect(() => {
    if (!results || !courseLesson || completionAttemptedFor.current === courseLesson.id) return;
    completionAttemptedFor.current = courseLesson.id;

    let active = true;
    void recordLearnLessonOutcome(courseLesson.id, accuracy).then((outcome) => {
      if (!active) return;
      if (!outcome) return;
      setLessonCompleted(outcome.lessonCompleted);
      setLessonRating(outcome.lessonRating);
      setCheckpointChallenge(outcome.isCheckpointChallenge);
      setCheckpointPassed(outcome.checkpointPassed);
      void syncLearnProgressIfEnabled().catch(() => {});
    });

    return () => {
      active = false;
    };
  }, [accuracy, courseLesson, results]);

  return { lessonCompleted, lessonRating, checkpointChallenge, checkpointPassed };
}

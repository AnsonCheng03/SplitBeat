import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LEARN_COURSE,
  LEARN_COURSE_REVISION,
  learnCourseContentRevision,
} from './learnCourse';
import {
  createLearnCourseProgressSnapshot,
  mergeLearnCourseProgressSnapshots,
  parseLearnCourseProgressSnapshot,
} from './learnProgressSync';

test('course revision is stable and changes when rhythm content changes', () => {
  assert.equal(learnCourseContentRevision(LEARN_COURSE), LEARN_COURSE_REVISION);
  assert.match(LEARN_COURSE_REVISION, /^r-[0-9a-f]{16}$/);

  const changedCourse = LEARN_COURSE.map((lesson, index) => (
    index === 0 ? { ...lesson, bpm: lesson.bpm + 1 } : lesson
  ));
  assert.notEqual(learnCourseContentRevision(changedCourse), LEARN_COURSE_REVISION);

  const reorderedCourse = [...LEARN_COURSE].reverse();
  assert.notEqual(learnCourseContentRevision(reorderedCourse), LEARN_COURSE_REVISION);

  const renamedCourse = LEARN_COURSE.map((lesson, index) => (
    index === 0 ? { ...lesson, title: `${lesson.title} updated` } : lesson
  ));
  assert.notEqual(learnCourseContentRevision(renamedCourse), LEARN_COURSE_REVISION);
});

test('progress snapshots reject a different course-content revision', () => {
  const snapshot = createLearnCourseProgressSnapshot([LEARN_COURSE[0].id], [], 100);
  const otherRevision = { ...snapshot, courseRevision: 'r-0000000000000000' };

  assert.equal(parseLearnCourseProgressSnapshot(JSON.stringify(snapshot))?.courseRevision, LEARN_COURSE_REVISION);
  assert.equal(parseLearnCourseProgressSnapshot(JSON.stringify(otherRevision)), null);
});

test('progress snapshots preserve skipped lessons and read older saves without that field', () => {
  const completedIds = LEARN_COURSE.slice(0, 3).map((lesson) => lesson.id);
  const skippedIds = LEARN_COURSE.slice(3, 5).map((lesson) => lesson.id);
  const snapshot = createLearnCourseProgressSnapshot(completedIds.concat(skippedIds), [], 100, skippedIds);
  const parsed = parseLearnCourseProgressSnapshot(JSON.stringify(snapshot));
  const oldSnapshot = { ...snapshot } as Partial<typeof snapshot>;
  delete oldSnapshot.skippedLessonIds;

  assert.deepEqual(parsed?.skippedLessonIds, skippedIds);
  assert.deepEqual(parseLearnCourseProgressSnapshot(JSON.stringify(oldSnapshot))?.skippedLessonIds, []);
});

test('matching progress snapshots merge completions and keep each lesson best rating', () => {
  const firstLesson = LEARN_COURSE[0].id;
  const secondLesson = LEARN_COURSE[1].id;
  const local = createLearnCourseProgressSnapshot(
    [firstLesson],
    [{ lessonId: firstLesson, lastAccuracy: 74, bestAccuracy: 88, attempts: 3 }],
    100,
  );
  const cloud = createLearnCourseProgressSnapshot(
    [firstLesson, secondLesson],
    [
      { lessonId: firstLesson, lastAccuracy: 92, bestAccuracy: 92, attempts: 2 },
      { lessonId: secondLesson, lastAccuracy: 81, bestAccuracy: 81, attempts: 1 },
    ],
    200,
  );
  const merged = mergeLearnCourseProgressSnapshots([local, cloud]);

  assert.deepEqual(merged.completedLessonIds, [firstLesson, secondLesson]);
  assert.deepEqual(merged.ratings, [
    { lessonId: firstLesson, lastAccuracy: 92, bestAccuracy: 92, attempts: 3 },
    { lessonId: secondLesson, lastAccuracy: 81, bestAccuracy: 81, attempts: 1 },
  ]);
  assert.equal(merged.updatedAt, 200);
});

test('progress sync merges skipped lessons but clears a skip when another device records a rating', () => {
  const firstLesson = LEARN_COURSE[0].id;
  const secondLesson = LEARN_COURSE[1].id;
  const local = createLearnCourseProgressSnapshot(
    [firstLesson, secondLesson],
    [],
    100,
    [firstLesson, secondLesson],
  );
  const remote = createLearnCourseProgressSnapshot(
    [firstLesson, secondLesson],
    [{ lessonId: firstLesson, lastAccuracy: 86, bestAccuracy: 86, attempts: 1 }],
    200,
    [secondLesson],
  );
  const merged = mergeLearnCourseProgressSnapshots([local, remote]);

  assert.deepEqual(merged.skippedLessonIds, [secondLesson]);
  assert.deepEqual(merged.ratings.map((rating) => rating.lessonId), [firstLesson]);
});

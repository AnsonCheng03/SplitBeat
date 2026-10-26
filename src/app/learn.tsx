import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { FullBleedSafeArea } from '@/components/FullBleedSafeArea';
import { GameCenterCourseProgressButton } from '@/components/GameCenterCourseProgressButton';
import { LearnPatternPreview } from '@/components/LearnPatternPreview';
import { LearnCoursePath } from '@/components/LearnCoursePath';
import { useLearnScreen } from '@/features/learn/useLearnScreen';
import { learnStyle1,
  learnStyle2,
  learnStyle3,
  learnStyle4,
  learnStyle5,
  learnStyle6,
  learnStyle7,
  learnStyle8,
  learnStyle9,
  learnStyle10,
  learnStyle11,
  learnStyle12,
  learnStyle13,
  learnStyle14,
  learnStyle15,
  learnStyle16,
  learnStyle17,
  learnStyle18,
  learnStyle19,
  learnStyle20,
  learnStyle21,
  learnStyle22,
  learnStyle23,
  learnStyle24,
  learnStyle25,
  learnStyle26,
  learnStyle27,
  learnStyle28,
  learnStyle29,
  learnStyle30,
  learnStyle31,
  learnStyle32,
  learnStyle33,
  learnStyle34,
  learnStyle35,
  learnStyle36,
  learnStyle37,
  learnStyle38,
  learnStyle39,
  learnStyle40,
  learnStyle41,
  learnStyle42, learnStyle43, learnStyle44 } from '@/styles/learn';

export default function LearnScreen() {
  const {
    colors,
    t,
    featureFlags,
    audioStatus,
    purchase,
    completedLessonIds,
    lessonRatings,
    selectedLesson,
    progressLoaded,
    starting,
    compact,
    detailWidth,
    insets,
    completedCount,
    starsEarned,
    lessonNumber,
    previousLessonNumber,
    lessonSequenceLocked,
    requiresPurchase,
    lessonStartDisabled,
    lessonStartLabel,
    lessonStartAccessibilityLabel,
    purchaseStatusMessage,
    purchaseStatusKind,
    showPurchaseRetry,
    purchaseRetryLabel,
    purchaseRetryAccessibilityLabel,
    restorePurchaseLabel,
    restorePurchaseDisabled,
    unlockCourseDisabled,
    purchaseButtonTitle,
    lessonProgressPercent,
    totalLessons,
    startLesson,
    handleProgressSynced,
    returnHome,
    restorePurchase,
    buyCourse,
    retryStore,
    onSelectLesson,
  } = useLearnScreen();

  return (
    <FullBleedSafeArea
      testID="learn.screen"
      backgroundColor={colors.background}
      contentStyle={learnStyle43()}
      underlay={(
        <View
          pointerEvents="none"
          style={learnStyle1({ detailWidth, insets, colors })}
        />
      )}
    >
      <ScrollView
        style={learnStyle2({ detailWidth })}
        contentContainerStyle={learnStyle44({ compact })}
        showsVerticalScrollIndicator={false}
      >
        <Pressable testID="learn.home" onPress={returnHome} hitSlop={8} style={learnStyle3()}>
          <Text style={learnStyle4({ colors })}>‹  HOME</Text>
        </Pressable>
        <Text style={learnStyle5({ colors, compact })}>
          GUIDED COURSE
        </Text>
        <Text style={learnStyle6({ colors, compact })}>
          Learn rhythm.
        </Text>
        <Text style={learnStyle7({ colors })}>
          A simple path from steady pulse to independent rhythms.
        </Text>

        <View style={learnStyle8({ compact })}>
          <View style={learnStyle9()}>
            <Text style={learnStyle10({ colors })}>YOUR PROGRESS</Text>
            <Text testID="learn.progress.count" style={learnStyle11({ colors })}>
              {completedCount} / {totalLessons}
            </Text>
          </View>
          <View style={learnStyle12({ colors })}>
            <View style={learnStyle13({ lessonProgressPercent, completedLessonIds, colors })} />
          </View>
          <Text testID="learn.progress.stars" style={learnStyle14({ colors })}>
              {starsEarned} / {totalLessons * 5} {t('course stars earned')}
          </Text>
          {purchase.isTestFlightFreeAccess ? (
            <View testID="learn.testflight-free" style={learnStyle15({ compact, colors })}>
              <Text style={learnStyle16({ colors })}>{t('TESTFLIGHT · FULL COURSE FREE')}</Text>
            </View>
          ) : (
            <Pressable
              testID="learn.restore"
              accessibilityRole="button"
              accessibilityLabel={t('Restore Learn course purchase')}
              accessibilityState={{ disabled: restorePurchaseDisabled }}
              disabled={restorePurchaseDisabled}
              onPress={() => void restorePurchase()}
              style={({ pressed }) => (learnStyle17({ compact, colors, purchase, pressed }))}
            >
              <Text style={learnStyle18({ colors })}>
                {t(restorePurchaseLabel)}
              </Text>
            </Pressable>
          )}
          {featureFlags.gameCenter ? (
            <GameCenterCourseProgressButton onProgressSynced={handleProgressSynced} />
          ) : null}
        </View>

        <View style={learnStyle19({ compact })}>
          <Text style={learnStyle20({ colors })}>
            {t('LESSON {number} · {level}', { number: lessonNumber, level: t(selectedLesson.level) })}
          </Text>
          <Text testID="learn.selected.title" style={learnStyle21({ colors, compact })}>
            {selectedLesson.title}
          </Text>
          <Text style={learnStyle22({ colors })}>
            {t(selectedLesson.skill)} · {selectedLesson.timeSignature}
          </Text>
          <Text numberOfLines={compact ? 2 : 3} style={learnStyle23({ colors })}>
            {selectedLesson.instruction}
          </Text>
          <LearnPatternPreview lesson={selectedLesson} />
        </View>

        {requiresPurchase ? (
          <View testID="learn.purchase.offer" style={learnStyle24({ colors })}>
            <Text style={learnStyle25({ colors })}>{t('FULL COURSE · ONE-TIME UNLOCK')}</Text>
            <Text style={learnStyle26({ colors })}>{t('Try the first 3 lessons free, then unlock all {count} lessons with one purchase.', { count: totalLessons })}</Text>
          </View>
        ) : lessonSequenceLocked ? (
          <Text style={learnStyle27({ colors })}>
            {t('Complete Lesson {number} first to open this lesson.', { number: previousLessonNumber })}
          </Text>
        ) : null}

        <View style={learnStyle28({ compact })} />
        {requiresPurchase ? (
          <Pressable
            testID="learn.purchase"
            accessibilityRole="button"
            accessibilityLabel={t('Unlock the full Learn course')}
            accessibilityState={{ disabled: unlockCourseDisabled }}
            disabled={unlockCourseDisabled}
            onPress={() => void buyCourse()}
            style={({ pressed }) => (learnStyle29({ compact, colors, purchase, pressed }))}
          >
            <View>
              <Text style={learnStyle30({ colors })}>{purchaseButtonTitle}</Text>
              <Text style={learnStyle31({ colors })}>
                {t('One-time purchase · 3 lessons free')}
              </Text>
            </View>
            <Text style={learnStyle32({ colors })}>›</Text>
          </Pressable>
        ) : (
          <Pressable
            testID="learn.start"
            accessibilityRole="button"
            accessibilityLabel={lessonStartAccessibilityLabel}
            accessibilityState={{ disabled: lessonStartDisabled }}
            disabled={lessonStartDisabled}
            onPress={() => void startLesson()}
            style={({ pressed }) => (learnStyle33({ compact, colors, starting, progressLoaded, lessonSequenceLocked, audioStatus, pressed }))}
          >
            <View>
              <Text style={learnStyle34({ colors })}>
                {t(lessonStartLabel)}
              </Text>
              <Text style={learnStyle35()}>
                {t('{bpm} BPM · about 30 seconds', { bpm: selectedLesson.bpm })}
              </Text>
            </View>
            <Text style={learnStyle36({ colors })}>›</Text>
          </Pressable>
        )}

        {purchaseStatusMessage ? (
          <Text
            accessibilityLiveRegion="polite"
            numberOfLines={2}
            style={purchaseStatusKind === 'store-error' ? learnStyle38({ colors }) : purchaseStatusKind === 'notice' ? learnStyle39({ colors }) : purchaseStatusKind === 'unavailable' ? learnStyle40({ colors }) : learnStyle37({ colors })}
          >
            {t(purchaseStatusMessage)}
          </Text>
        ) : null}
        {showPurchaseRetry ? (
          <Pressable
            testID="learn.purchase.retry"
            accessibilityRole="button"
            accessibilityLabel={t(purchaseRetryAccessibilityLabel)}
            disabled={purchase.isRetryingStore}
            onPress={() => void retryStore()}
            style={({ pressed }) => (learnStyle41({ purchase, pressed }))}
          >
            <Text style={learnStyle42({ colors })}>{t(purchaseRetryLabel)}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <LearnCoursePath
        compact={compact}
        completedLessonIds={completedLessonIds}
        hasFullCourseUnlock={purchase.hasFullCourseUnlock}
        lessonRatings={lessonRatings}
        selectedLessonId={selectedLesson.id}
        onSelectLesson={onSelectLesson}
      />
    </FullBleedSafeArea>
  );
}

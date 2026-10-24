import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme';

const ENDING_DURATION_MS = 2400;

interface SessionEndingOverlayProps {
  accuracy: number;
  hits: number;
  expected: number;
  isScore: boolean;
  isLesson: boolean;
  onComplete: () => void;
}

export function SessionEndingOverlay({
  accuracy,
  hits,
  expected,
  isScore,
  isLesson,
  onComplete,
}: SessionEndingOverlayProps) {
  const { t } = useI18n();
  const [entrance] = useState(() => new Animated.Value(0));
  const [progress] = useState(() => new Animated.Value(0));
  const [haloScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const entranceAnimation = Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const progressAnimation = Animated.timing(progress, {
      toValue: 1,
      duration: ENDING_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    const haloAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(haloScale, { toValue: 1.12, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(haloScale, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );

    haloAnimation.start();
    Animated.parallel([entranceAnimation, progressAnimation]).start(({ finished }) => {
      if (finished) onComplete();
    });

    return () => {
      entranceAnimation.stop();
      progressAnimation.stop();
      haloAnimation.stop();
    };
  }, [entrance, haloScale, onComplete, progress]);

  const opacity = entrance;
  const translateY = entrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const scale = entrance.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const hasScoredNotes = expected > 0;
  const title = isLesson
    ? 'LESSON COMPLETE'
    : isScore
      ? 'SCORE SESSION COMPLETE'
      : 'SESSION COMPLETE';

  return (
    <View
      testID="practice.ending"
      accessibilityLabel={t('Session complete. Results are opening.')}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}
    >
      <Animated.View style={{ alignItems: 'center', opacity, transform: [{ translateY }, { scale }] }}>
        <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
          <Animated.View
            style={{ position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: colors.accent, opacity: 0.35, transform: [{ scale: haloScale }] }}
          />
          <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
            <Text style={{ color: colors.background, fontSize: 34, lineHeight: 40, fontWeight: '900' }}>✓</Text>
          </View>
        </View>

        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 2.2, textAlign: 'center' }}>
          {t(title)}
        </Text>
        <Text testID="practice.ending.summary" style={{ color: colors.text, fontSize: 48, lineHeight: 58, fontWeight: '900', fontVariant: ['tabular-nums'], marginTop: 7 }}>
          {hasScoredNotes ? `${Math.round(accuracy)}%` : '—'}
        </Text>
        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.3, marginTop: 3 }}>
          {t(hasScoredNotes ? 'ACCURACY' : 'NO NOTES SCORED')}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 12 }}>
          {hasScoredNotes
            ? t('{hits} / {expected} NOTES ON TIME', { hits, expected })
            : t('Your session ended before any notes were due.')}
        </Text>
      </Animated.View>

      <View style={{ position: 'absolute', bottom: 30, width: 170, height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.line }}>
        <Animated.View style={{ width: progressWidth, height: '100%', backgroundColor: colors.accent }} />
      </View>
    </View>
  );
}

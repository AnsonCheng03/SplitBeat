import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import {
  SessionEndingOverlayStyle1,
  SessionEndingOverlayStyle2,
  SessionEndingOverlayStyle3,
  SessionEndingOverlayStyle4,
  SessionEndingOverlayStyle5,
  SessionEndingOverlayStyle6,
  SessionEndingOverlayStyle7,
  SessionEndingOverlayStyle8,
  SessionEndingOverlayStyle9,
  SessionEndingOverlayStyle10,
  SessionEndingOverlayStyle11,
  SessionEndingOverlayStyle12
} from '@/styles/shared';

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
  const { colors } = useTheme();
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
      style={SessionEndingOverlayStyle1({ colors })}
    >
      <Animated.View style={SessionEndingOverlayStyle2({ opacity, translateY, scale })}>
        <View style={SessionEndingOverlayStyle3()}>
          <Animated.View
            style={SessionEndingOverlayStyle4({ colors, haloScale })}
          />
          <View style={SessionEndingOverlayStyle5({ colors })}>
            <Text style={SessionEndingOverlayStyle6({ colors })}>✓</Text>
          </View>
        </View>

        <Text style={SessionEndingOverlayStyle7({ colors })}>
          {t(title)}
        </Text>
        <Text testID="practice.ending.summary" style={SessionEndingOverlayStyle8({ colors })}>
          {hasScoredNotes ? `${Math.round(accuracy)}%` : '—'}
        </Text>
        <Text style={SessionEndingOverlayStyle9({ colors })}>
          {t(hasScoredNotes ? 'ACCURACY' : 'NO NOTES SCORED')}
        </Text>
        <Text style={SessionEndingOverlayStyle10({ colors })}>
          {hasScoredNotes
            ? t('{hits} / {expected} NOTES ON TIME', { hits, expected })
            : t('Your session ended before any notes were due.')}
        </Text>
      </Animated.View>

      <View style={SessionEndingOverlayStyle11({ colors })}>
        <Animated.View style={SessionEndingOverlayStyle12({ progressWidth, colors })} />
      </View>
    </View>
  );
}

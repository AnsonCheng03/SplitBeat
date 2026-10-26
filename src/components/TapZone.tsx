import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import type { StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getTapResultFlash, shouldFlashOnTap } from '@/rhythm/flashSource';
import type { FlashSource, Hand, TapFeedback } from '@/types/rhythm';
import type { TapResultFlash } from '@/rhythm/flashSource';
import { useTheme } from '@/theme/ThemeProvider';
import {
  TapZoneStyle1,
  TapZoneStyle2,
  TapZoneStyle3,
  TapZoneStyle4,
  TapZoneStyle5,
  TapZoneStyle6,
  TapZoneStyle7,
  TapZoneStyle8,
  TapZoneStyle9
} from '@/styles/practice';

interface TapZoneProps {
  hand: Hand;
  testID?: string;
  onTap: (hand: Hand, timestamp: number) => TapFeedback | null;
  hapticsEnabled: boolean;
  tapResultFlashEnabled?: boolean;
  flashSource?: FlashSource;
  beatFlashToken?: number;
  keyboardTapToken?: number;
  keyboardTapFeedback?: TapFeedback | null;
  enabled?: boolean;
  resting?: boolean;
  compact?: boolean;
  minimal?: boolean;
  showMinimalLabel?: boolean;
  singleHand?: boolean;
  accessibilityLabelOverride?: string;
  style?: StyleProp<ViewStyle>;
}

const KEYBOARD_KEYS_BY_HAND = {
  left: 'Q W E R T · A S D F G · Z X C V B · 1–5',
  right: 'Y U I O P · H J K L · N M · 6–0',
} as const;

export function TapZone({
  hand,
  testID,
  onTap,
  hapticsEnabled,
  tapResultFlashEnabled = true,
  flashSource = 'tap',
  beatFlashToken = 0,
  keyboardTapToken = 0,
  keyboardTapFeedback = null,
  enabled = true,
  resting = false,
  compact = false,
  minimal = false,
  showMinimalLabel = false,
  singleHand = false,
  accessibilityLabelOverride,
  style,
}: TapZoneProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [pressed, setPressed] = useState(false);
  const [missed, setMissed] = useState(false);
  const [tapResultColor, setTapResultColor] = useState<TapResultFlash | null>(null);
  const [tapResultOpacity] = useState(() => new Animated.Value(0));
  const [beatFlashOpacity] = useState(() => new Animated.Value(0));
  const pressResetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resultResetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousKeyboardTapToken = useRef(keyboardTapToken);
  const previousBeatFlashToken = useRef(beatFlashToken);
  const isLeft = hand === 'left';
  const accent = singleHand ? colors.accent : isLeft ? colors.left : colors.right;
  const restingBackground = singleHand ? colors.singleHandSurface : isLeft ? colors.leftSurface : colors.rightSurface;
  const pressedBackground = singleHand ? colors.singleHandPressed : isLeft ? colors.leftPressed : colors.rightPressed;
  const restingBorder = singleHand ? colors.singleHandBorder : isLeft ? colors.leftBorder : colors.rightBorder;

  const clearTapResult = useCallback(() => {
    if (resultResetTimer.current) clearTimeout(resultResetTimer.current);
    setMissed(false);
    setTapResultColor(null);
    tapResultOpacity.stopAnimation();
    tapResultOpacity.setValue(0);
  }, [tapResultOpacity]);

  const flashTapResult = useCallback((color: TapResultFlash) => {
    setTapResultColor(color);
    tapResultOpacity.stopAnimation();
    tapResultOpacity.setValue(color === 'incorrect' ? 0.5 : 0.38);
    Animated.timing(tapResultOpacity, {
      toValue: 0,
      duration: 280,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    if (resultResetTimer.current) clearTimeout(resultResetTimer.current);
    setMissed(color === 'incorrect');
    if (color === 'incorrect') {
      resultResetTimer.current = setTimeout(() => setMissed(false), 320);
    }
  }, [tapResultOpacity]);

  const showFeedback = useCallback((feedback: TapFeedback | null) => {
    if (!feedback || feedback === 'ignored') return;
    const resultFlash = getTapResultFlash(tapResultFlashEnabled, feedback);
    if (pressResetTimer.current) clearTimeout(pressResetTimer.current);
    if (resultFlash) {
      setPressed(false);
      flashTapResult(resultFlash);
    } else {
      clearTapResult();
      if (feedback === 'hit' && shouldFlashOnTap(flashSource, feedback)) {
        setPressed(true);
        pressResetTimer.current = setTimeout(() => setPressed(false), 110);
      } else {
        setPressed(false);
      }
    }
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  }, [clearTapResult, flashSource, flashTapResult, hapticsEnabled, tapResultFlashEnabled]);

  useEffect(
    () => () => {
      if (pressResetTimer.current !== undefined) clearTimeout(pressResetTimer.current);
      if (resultResetTimer.current !== undefined) clearTimeout(resultResetTimer.current);
      tapResultOpacity.stopAnimation();
      beatFlashOpacity.stopAnimation();
    },
    [beatFlashOpacity, tapResultOpacity],
  );

  useEffect(() => {
    if (beatFlashToken === previousBeatFlashToken.current) return;
    previousBeatFlashToken.current = beatFlashToken;
    if (flashSource !== 'beat' || beatFlashToken === 0) return;
    beatFlashOpacity.stopAnimation();
    beatFlashOpacity.setValue(0.34);
    Animated.timing(beatFlashOpacity, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [beatFlashOpacity, beatFlashToken, flashSource]);

  useEffect(() => {
    if (keyboardTapToken === previousKeyboardTapToken.current) return;
    previousKeyboardTapToken.current = keyboardTapToken;
    showFeedback(keyboardTapFeedback);
  }, [keyboardTapFeedback, keyboardTapToken, showFeedback]);

  const handleTouch = () => {
    if (!enabled) {
      showFeedback('miss');
      return;
    }
    const timestamp = globalThis.performance.now();
    const feedback = onTap(hand, timestamp);
    showFeedback(feedback);
  };
  const accessibleHand = t(hand);
  const accessibleLabel = accessibilityLabelOverride
    ? t(accessibilityLabelOverride)
    : missed && !minimal
      ? t('OFF BEAT')
      : !enabled
        ? t('{hand} hand tap zone, inactive in single hand mode', { hand: accessibleHand })
        : minimal
          ? t('{hand} hand tap zone', { hand: accessibleHand })
          : t('{hand} hand tap zone, keyboard keys {keys}', { hand: accessibleHand, keys: KEYBOARD_KEYS_BY_HAND[hand] });

  return (
    <View
      testID={testID ?? `practice.tap.${hand}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      accessibilityLabel={accessibleLabel}
      onTouchStart={handleTouch}
      collapsable={false}
      style={[
        TapZoneStyle1({ minimal, compact, pressed, pressedBackground, restingBackground, accent, restingBorder, enabled, missed }),
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={TapZoneStyle2({ minimal, accent, beatFlashOpacity })}
      />
      <Animated.View
        pointerEvents="none"
        style={TapZoneStyle3({ minimal, tapResultColor, colors, tapResultOpacity })}
      />
      {!minimal ? (
        <>
          <Text style={TapZoneStyle4({ accent, compact })}>
            {!enabled || resting ? 'REST' : isLeft ? 'LEFT' : 'RIGHT'}
          </Text>
          <Text style={TapZoneStyle5({ colors, compact })}>
            {!enabled ? 'OFF' : resting ? 'WAIT' : 'TAP'}
          </Text>
          <Text
            testID={`practice.keyboard.${hand}Keys`}
            numberOfLines={1}
            style={TapZoneStyle6({ colors, compact })}
          >
            {KEYBOARD_KEYS_BY_HAND[hand]}
          </Text>
        </>
      ) : null}
      {minimal && showMinimalLabel ? (
        <Text
          testID={`practice.tap.${hand}.label`}
          pointerEvents="none"
          style={TapZoneStyle7({ accent, compact })}
        >
          {hand.toUpperCase()}
        </Text>
      ) : null}
      {missed && !minimal ? (
        <Animated.Text
          testID={`practice.tap.${hand}.miss`}
          style={TapZoneStyle8({ compact, colors, tapResultOpacity })}
        >
          OFF BEAT
        </Animated.Text>
      ) : null}
      {!minimal ? (
        <View
          style={TapZoneStyle9({ compact, accent, pressed })}
        />
      ) : null}
    </View>
  );
}

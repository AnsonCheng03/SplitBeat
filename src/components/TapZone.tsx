import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getTapResultFlash, shouldFlashOnTap } from '@/rhythm/flashSource';
import type { FlashSource, Hand, TapFeedback } from '@/types/rhythm';
import type { TapResultFlash } from '@/rhythm/flashSource';
import { colors } from '@/theme';

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
  const restingBackground = singleHand ? '#0E201F' : isLeft ? colors.leftSurface : colors.rightSurface;
  const pressedBackground = singleHand ? '#183A35' : isLeft ? '#1D483D' : '#382B56';
  const restingBorder = singleHand ? '#183D38' : isLeft ? '#1A4037' : '#302747';

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

  return (
    <View
      testID={testID ?? `practice.tap.${hand}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      accessibilityLabel={accessibilityLabelOverride ?? (minimal
        ? `${hand} hand tap zone${enabled ? '' : ', inactive in single hand mode'}`
        : missed
          ? 'OFF BEAT'
          : `${hand} hand tap zone${enabled ? `, keyboard keys ${KEYBOARD_KEYS_BY_HAND[hand]}` : ', inactive in single hand mode'}`)}
      onTouchStart={handleTouch}
      collapsable={false}
      style={[
        {
          flex: 1,
          minHeight: minimal ? 0 : compact ? 90 : 180,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? pressedBackground : restingBackground,
          borderColor: pressed ? accent : restingBorder,
          borderWidth: minimal ? 0 : 1,
          borderRadius: minimal ? 0 : 18,
          marginHorizontal: minimal ? 0 : 4,
          transform: minimal ? undefined : [{ scale: pressed ? 0.985 : 1 }],
          opacity: enabled ? 1 : missed ? 0.82 : 0.44,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: minimal ? 0 : 18, backgroundColor: accent, opacity: beatFlashOpacity }}
      />
      <Animated.View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: minimal ? 0 : 18, backgroundColor: tapResultColor === 'correct' ? colors.left : colors.danger, opacity: tapResultOpacity }}
      />
      {!minimal ? (
        <>
          <Text style={{ color: accent, fontSize: compact ? 11 : 12, fontWeight: '800', letterSpacing: 2 }}>
            {!enabled || resting ? 'REST' : isLeft ? 'LEFT' : 'RIGHT'}
          </Text>
          <Text style={{ color: colors.text, fontSize: compact ? 18 : 21, fontWeight: '700', marginTop: 6 }}>
            {!enabled ? 'OFF' : resting ? 'WAIT' : 'TAP'}
          </Text>
          <Text
            testID={`practice.keyboard.${hand}Keys`}
            numberOfLines={1}
            style={{
              color: colors.muted,
              fontSize: compact ? 7 : 8,
              fontWeight: '700',
              letterSpacing: 0.1,
              marginTop: 4,
            }}
          >
            {KEYBOARD_KEYS_BY_HAND[hand]}
          </Text>
        </>
      ) : null}
      {minimal && showMinimalLabel ? (
        <Text
          testID={`practice.tap.${hand}.label`}
          pointerEvents="none"
          style={{ position: 'absolute', top: '58%', left: 0, right: 0, color: accent, fontSize: compact ? 11 : 13, fontWeight: '900', letterSpacing: 2, opacity: 0.7, textAlign: 'center' }}
        >
          {hand.toUpperCase()}
        </Text>
      ) : null}
      {missed && !minimal ? (
        <Animated.Text
          testID={`practice.tap.${hand}.miss`}
          style={{
            position: 'absolute',
            top: compact ? 8 : 11,
            right: 10,
            color: colors.danger,
            fontSize: 8,
            fontWeight: '900',
            letterSpacing: 0.7,
            opacity: tapResultOpacity.interpolate({ inputRange: [0, 0.5], outputRange: [0, 1] }),
          }}
        >
          OFF BEAT
        </Animated.Text>
      ) : null}
      {!minimal ? (
        <View
          style={{
            position: 'absolute',
            bottom: compact ? 12 : 16,
            width: 30,
            height: 3,
            borderRadius: 4,
            backgroundColor: accent,
            opacity: pressed ? 1 : 0.5,
          }}
        />
      ) : null}
    </View>
  );
}

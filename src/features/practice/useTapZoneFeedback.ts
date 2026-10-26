import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getTapResultFlash, shouldFlashOnTap } from '@/rhythm/flashSource';
import type { TapResultFlash } from '@/rhythm/flashSource';
import type { FlashSource, Hand, TapFeedback } from '@/types/rhythm';

interface TapZoneFeedbackOptions {
  hand: Hand;
  onTap: (hand: Hand, timestamp: number) => TapFeedback | null;
  hapticsEnabled: boolean;
  tapResultFlashEnabled: boolean;
  flashSource: FlashSource;
  beatFlashToken: number;
  keyboardTapToken: number;
  keyboardTapFeedback: TapFeedback | null;
  enabled: boolean;
}

export function useTapZoneFeedback({
  hand,
  onTap,
  hapticsEnabled,
  tapResultFlashEnabled,
  flashSource,
  beatFlashToken,
  keyboardTapToken,
  keyboardTapFeedback,
  enabled,
}: TapZoneFeedbackOptions) {
  const [pressed, setPressed] = useState(false);
  const [missed, setMissed] = useState(false);
  const [tapResultColor, setTapResultColor] = useState<TapResultFlash | null>(null);
  const [tapResultOpacity] = useState(() => new Animated.Value(0));
  const [beatFlashOpacity] = useState(() => new Animated.Value(0));
  const pressResetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resultResetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousKeyboardTapToken = useRef(keyboardTapToken);
  const previousBeatFlashToken = useRef(beatFlashToken);

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
    if (color === 'incorrect') resultResetTimer.current = setTimeout(() => setMissed(false), 320);
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
    if (hapticsEnabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, [clearTapResult, flashSource, flashTapResult, hapticsEnabled, tapResultFlashEnabled]);

  useEffect(() => () => {
    if (pressResetTimer.current !== undefined) clearTimeout(pressResetTimer.current);
    if (resultResetTimer.current !== undefined) clearTimeout(resultResetTimer.current);
    tapResultOpacity.stopAnimation();
    beatFlashOpacity.stopAnimation();
  }, [beatFlashOpacity, tapResultOpacity]);

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
    const feedback = onTap(hand, globalThis.performance.now());
    showFeedback(feedback);
  };

  return {
    pressed,
    missed,
    tapResultColor,
    tapResultOpacity,
    beatFlashOpacity,
    handleTouch,
  };
}

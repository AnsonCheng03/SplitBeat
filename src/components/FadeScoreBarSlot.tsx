import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, View } from 'react-native';
import {
  FadeScoreBarSlotStyle1,
  FadeScoreBarSlotStyle2,
  FadeScoreBarSlotStyle3,
} from '@/styles/notation';

/** Crossfades a replacement bar inside one stationary score slot. */
export function FadeScoreBarSlot({
  sequence,
  width,
  animate,
  outgoing,
  children,
}: {
  sequence: number;
  width: number;
  animate: boolean;
  outgoing?: ReactNode;
  children: ReactNode;
}) {
  const [fadeProgress] = useState(() => new Animated.Value(1));
  const previousSequence = useRef(sequence);

  useLayoutEffect(() => {
    const sequenceChanged = sequence !== previousSequence.current;
    previousSequence.current = sequence;

    if (!animate || !sequenceChanged) {
      fadeProgress.setValue(1);
      return;
    }

    fadeProgress.setValue(0);
    const animation = Animated.timing(fadeProgress, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [animate, fadeProgress, sequence]);

  return (
    <View style={FadeScoreBarSlotStyle1({ width })}>
      {outgoing ? (
        <Animated.View style={FadeScoreBarSlotStyle3({ fadeProgress })}>
          {outgoing}
        </Animated.View>
      ) : null}
      <Animated.View style={FadeScoreBarSlotStyle2({ fadeProgress })}>
        {children}
      </Animated.View>
    </View>
  );
}

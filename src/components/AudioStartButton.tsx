import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import type { AudioPreparationStatus } from '@/store/sessionStore';
import { colors } from '@/theme';

interface AudioStartButtonProps {
  status: AudioPreparationStatus;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  testID: string;
}

export function AudioStartButton({
  status,
  disabled = false,
  onPress,
  accessibilityLabel,
  testID,
}: AudioStartButtonProps) {
  const [rotation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (status !== 'loading') {
      rotation.stopAnimation();
      rotation.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [rotation, status]);

  const turn = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringColor = status === 'error' ? colors.danger : colors.left;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 94,
        height: 94,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.78 : pressed ? 0.82 : 1,
      })}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 92,
          height: 92,
          borderRadius: 46,
          borderWidth: 3,
          borderColor: status === 'loading' ? colors.surfaceRaised : ringColor,
          borderTopColor: status === 'loading' ? ringColor : undefined,
          borderRightColor: status === 'loading' ? ringColor : undefined,
          transform: status === 'loading' ? [{ rotate: turn }] : undefined,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: disabled ? colors.surfaceRaised : colors.left,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            marginLeft: 5,
            width: 0,
            height: 0,
            borderTopWidth: 12,
            borderBottomWidth: 12,
            borderLeftWidth: 18,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: colors.background,
          }}
        />
      </View>
    </Pressable>
  );
}

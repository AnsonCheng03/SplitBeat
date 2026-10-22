import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import type { AudioPreparationStatus } from '@/store/sessionStore';
import { colors } from '@/theme';

interface AudioStartButtonProps {
  status: AudioPreparationStatus;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  testID: string;
  subtitleTestID?: string;
  variant?: 'circle' | 'wide';
  title?: string;
  subtitle?: string;
}

export function AudioStartButton({
  status,
  disabled = false,
  onPress,
  accessibilityLabel,
  testID,
  subtitleTestID,
  variant = 'circle',
  title,
  subtitle,
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

  if (variant === 'wide') {
    const buttonBackground = status === 'ready' ? colors.left : colors.surface;
    const foreground = status === 'ready' ? colors.background : colors.text;

    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({
          width: '100%',
          minHeight: 82,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: status === 'ready' ? colors.left : status === 'error' ? colors.danger : colors.line,
          backgroundColor: buttonBackground,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 13,
          gap: 14,
          opacity: disabled ? 0.82 : pressed ? 0.84 : 1,
        })}
      >
        <View style={{ width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 56,
              height: 56,
              borderRadius: 28,
              borderWidth: 2.5,
              borderColor: status === 'loading' ? colors.surfaceRaised : foreground,
              borderTopColor: status === 'loading' ? ringColor : undefined,
              borderRightColor: status === 'loading' ? ringColor : undefined,
              transform: status === 'loading' ? [{ rotate: turn }] : undefined,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: status === 'ready' ? colors.background : colors.surfaceRaised,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                marginLeft: 3,
                width: 0,
                height: 0,
                borderTopWidth: 8,
                borderBottomWidth: 8,
                borderLeftWidth: 12,
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                borderLeftColor: status === 'ready' ? colors.left : colors.text,
              }}
            />
          </View>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: foreground, fontSize: 16, fontWeight: '900', letterSpacing: 0.6 }}>
            {title ?? (status === 'ready' ? 'START PRACTICE' : status === 'error' ? 'RETRY AUDIO' : 'GETTING READY')}
          </Text>
          <Text testID={subtitleTestID} style={{ color: status === 'ready' ? '#18352C' : colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 }}>
            {subtitle ?? (status === 'ready' ? 'Audio ready · tap to begin' : status === 'error' ? 'Audio setup needs another try' : 'Preparing the metronome')}
          </Text>
        </View>
        <Text style={{ color: foreground, fontSize: 24, fontWeight: '500' }}>›</Text>
      </Pressable>
    );
  }

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

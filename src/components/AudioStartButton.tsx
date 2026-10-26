import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import type { AudioPreparationStatus } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import {
  AudioStartButtonStyle1,
  AudioStartButtonStyle2,
  AudioStartButtonStyle3,
  AudioStartButtonStyle4,
  AudioStartButtonStyle5,
  AudioStartButtonStyle6,
  AudioStartButtonStyle7,
  AudioStartButtonStyle8,
  AudioStartButtonStyle9,
  AudioStartButtonStyle10,
  AudioStartButtonStyle11,
  AudioStartButtonStyle12,
  AudioStartButtonStyle13
} from '@/styles/audio';

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
  const { colors } = useTheme();
  const { t } = useI18n();
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
        accessibilityLabel={t(accessibilityLabel)}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => (AudioStartButtonStyle1({ status, colors, buttonBackground, disabled, pressed }))}
      >
        <View style={AudioStartButtonStyle2()}>
          <Animated.View
            pointerEvents="none"
            style={AudioStartButtonStyle3({ status, colors, foreground, ringColor, turn })}
          />
          <View
            pointerEvents="none"
            style={AudioStartButtonStyle4({ status, colors })}
          >
            <View
              style={AudioStartButtonStyle5({ status, colors })}
            />
          </View>
        </View>
        <View style={AudioStartButtonStyle6()}>
          <Text style={AudioStartButtonStyle7({ foreground })}>
            {title ?? (status === 'ready' ? 'START PRACTICE' : status === 'error' ? 'RETRY AUDIO' : 'GETTING READY')}
          </Text>
          <Text testID={subtitleTestID} style={AudioStartButtonStyle8({ status, colors })}>
            {subtitle ?? (status === 'ready' ? 'Audio ready · tap to begin' : status === 'error' ? 'Audio setup needs another try' : 'Preparing the metronome')}
          </Text>
        </View>
        <Text style={AudioStartButtonStyle9({ foreground })}>›</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t(accessibilityLabel)}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => (AudioStartButtonStyle10({ disabled, pressed }))}
    >
      <Animated.View
        pointerEvents="none"
        style={AudioStartButtonStyle11({ status, colors, ringColor, turn })}
      />
      <View
        pointerEvents="none"
        style={AudioStartButtonStyle12({ disabled, colors })}
      >
        <View
          style={AudioStartButtonStyle13({ colors })}
        />
      </View>
    </Pressable>
  );
}

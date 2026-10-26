import { useTapZoneFeedback } from '@/features/practice/useTapZoneFeedback';
import { Animated, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import type { StyleProp, ViewStyle } from 'react-native';
import type { FlashSource, Hand, TapFeedback } from '@/types/rhythm';
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
  const {
    pressed,
    missed,
    tapResultColor,
    tapResultOpacity,
    beatFlashOpacity,
    handleTouch,
  } = useTapZoneFeedback({
    hand,
    onTap,
    hapticsEnabled,
    tapResultFlashEnabled,
    flashSource,
    beatFlashToken,
    keyboardTapToken,
    keyboardTapFeedback,
    enabled,
  });
  const isLeft = hand === 'left';
  const accent = singleHand ? colors.accent : isLeft ? colors.left : colors.right;
  const restingBackground = singleHand ? colors.singleHandSurface : isLeft ? colors.leftSurface : colors.rightSurface;
  const pressedBackground = singleHand ? colors.singleHandPressed : isLeft ? colors.leftPressed : colors.rightPressed;
  const restingBorder = singleHand ? colors.singleHandBorder : isLeft ? colors.leftBorder : colors.rightBorder;

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

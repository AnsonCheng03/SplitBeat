import Slider from '@react-native-community/slider';
import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { SessionSnapshot } from '@/types/rhythm';
import {
  PracticePauseOverlaysStyle40,
  PracticePauseOverlaysStyle41,
  PracticePauseOverlaysStyle42,
  PracticePauseOverlaysStyle43,
  PracticePauseOverlaysStyle44,
  PracticePauseOverlaysStyle45,
  PracticePauseOverlaysStyle46,
  PracticePauseOverlaysStyle47,
  PracticePauseOverlaysStyle48,
  PracticePauseOverlaysStyle49,
  PracticePauseOverlaysStyle50,
  PracticePauseOverlaysStyle51,
  PracticePauseOverlaysStyle52,
} from '@/styles/practice';

export function PracticeTempoControl({
  snapshot,
  compact,
  actionLoading,
  bpm,
  onBpmChange,
  onApply,
}: {
  snapshot: SessionSnapshot;
  compact: boolean;
  actionLoading: boolean;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onApply: () => Promise<void>;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={PracticePauseOverlaysStyle40({ compact })}>
      <View style={PracticePauseOverlaysStyle41()}>
        <Text style={PracticePauseOverlaysStyle42({ colors, compact })}>{t('TEMPO')}</Text>
        <Text style={PracticePauseOverlaysStyle43({ colors, compact })}>{bpm} BPM</Text>
      </View>
      <View style={PracticePauseOverlaysStyle44({ compact })}>
        <Pressable
          testID="practice.pause.bpmMinus"
          accessibilityRole="button"
          accessibilityLabel={t('Decrease tempo')}
          disabled={bpm <= 40}
          onPress={() => onBpmChange(Math.max(40, bpm - 1))}
          style={PracticePauseOverlaysStyle45({ colors, bpmDraft: bpm })}
        >
          <Text style={PracticePauseOverlaysStyle46({ colors })}>−</Text>
        </Pressable>
        <Slider
          testID="practice.pause.bpmSlider"
          accessibilityLabel={t('Practice tempo')}
          style={PracticePauseOverlaysStyle47()}
          minimumValue={40}
          maximumValue={200}
          step={1}
          value={bpm}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.line}
          thumbTintColor={colors.text}
          onValueChange={onBpmChange}
        />
        <Pressable
          testID="practice.pause.bpmPlus"
          accessibilityRole="button"
          accessibilityLabel={t('Increase tempo')}
          disabled={bpm >= 200}
          onPress={() => onBpmChange(Math.min(200, bpm + 1))}
          style={PracticePauseOverlaysStyle48({ colors, bpmDraft: bpm })}
        >
          <Text style={PracticePauseOverlaysStyle49({ colors })}>+</Text>
        </Pressable>
      </View>
      <Text style={PracticePauseOverlaysStyle50({ colors, compact })}>
        {t('Applying a tempo starts play over, or restarts a score from this bar.')}
      </Text>
      {bpm !== snapshot.bpm ? (
        <Pressable
          testID="practice.pause.applyBpm"
          accessibilityRole="button"
          disabled={actionLoading}
          onPress={() => void onApply()}
          style={PracticePauseOverlaysStyle51({ compact, colors, pauseActionLoading: actionLoading })}
        >
          <Text style={PracticePauseOverlaysStyle52({ colors, compact })}>{t('APPLY BPM')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

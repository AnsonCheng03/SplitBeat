import { View } from 'react-native';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { SESSION_BAR_COUNT_OPTIONS, SESSION_DURATION_OPTIONS, SESSION_END_MODES } from '@/features/sessionEndOptions';
import type { DurationOption, SessionEndBarCount, SessionEndMode } from '@/types/rhythm';
import { SessionEndSettingsStyle1, SessionEndSettingsStyle2, SessionEndSettingsStyle3 } from '@/styles/sessionEnd';

export function SessionEndSettings({
  mode,
  duration,
  bars,
  onModeChange,
  onDurationChange,
  onBarsChange,
  testIDPrefix,
}: {
  mode: SessionEndMode;
  duration: DurationOption;
  bars: SessionEndBarCount;
  onModeChange: (mode: SessionEndMode) => void;
  onDurationChange: (duration: DurationOption) => void;
  onBarsChange: (bars: SessionEndBarCount) => void;
  testIDPrefix: string;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const timeOptions = SESSION_DURATION_OPTIONS.map((option) => ({ label: t(option.label), value: option.value }));
  const barOptions = SESSION_BAR_COUNT_OPTIONS.map((option) => ({
    label: option.value === 1 ? t(option.label) : t(option.label, { count: option.value }),
    value: option.value,
  }));

  return (
    <View style={SessionEndSettingsStyle1()}>
      <View style={SessionEndSettingsStyle2()}>
        <Text style={SessionEndSettingsStyle3({ colors })}>{t('END SESSION BY')}</Text>
        <SettingsChoiceRow
          options={SESSION_END_MODES.map((option) => ({ label: t(option.label), value: option.value }))}
          value={mode}
          onChange={onModeChange}
          testIDPrefix={`${testIDPrefix}.mode`}
        />
      </View>
      <View style={SessionEndSettingsStyle2()}>
        <Text style={SessionEndSettingsStyle3({ colors })}>{t(mode === 'time' ? 'SESSION LENGTH' : 'NUMBER OF BARS')}</Text>
        {mode === 'time' ? (
          <SettingsChoiceRow
            options={timeOptions}
            value={duration}
            onChange={onDurationChange}
            testIDPrefix={`${testIDPrefix}.time`}
          />
        ) : (
          <SettingsChoiceRow
            options={barOptions}
            value={bars}
            onChange={onBarsChange}
            testIDPrefix={`${testIDPrefix}.bars`}
          />
        )}
      </View>
    </View>
  );
}

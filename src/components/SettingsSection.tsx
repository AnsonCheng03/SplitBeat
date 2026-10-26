import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';
import { SettingsSectionStyle1, SettingsSectionStyle2 } from '@/styles/settings';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={SettingsSectionStyle1()}>
      <Text style={SettingsSectionStyle2({ colors })}>{title}</Text>
      {children}
    </View>
  );
}

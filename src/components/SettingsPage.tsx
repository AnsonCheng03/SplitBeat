import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullBleedSafeArea } from '@/components/FullBleedSafeArea';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';

export type SettingsSection = 'session' | 'rhythm' | 'audio' | 'appearance' | 'timing' | 'language';

const sections: { id: SettingsSection; label: string; href: '/setup' | '/settings/rhythm' | '/settings/audio' | '/settings/appearance' | '/settings/timing' | '/settings/language'; testID?: string }[] = [
  { id: 'session', label: 'Pace & length', href: '/setup' },
  { id: 'rhythm', label: 'Rhythm & meter', href: '/settings/rhythm', testID: 'setup.card.rhythm' },
  { id: 'audio', label: 'Sounds', href: '/settings/audio', testID: 'setup.card.audio' },
  { id: 'appearance', label: 'Appearance', href: '/settings/appearance', testID: 'setup.card.appearance' },
  { id: 'timing', label: 'Timing', href: '/settings/timing', testID: 'setup.card.timing' },
  { id: 'language', label: 'Language', href: '/settings/language', testID: 'setup.card.language' },
];

export function SettingsPage({
  testID,
  backTestID,
  section,
  title,
  description,
  children,
  footer,
}: {
  testID: string;
  backTestID: string;
  section: SettingsSection;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = width < 760 || height < 500;
  const sidebarWidth = compact ? 176 : 224;
  const { featureFlags } = useRhythmSession();
  const { t } = useI18n();

  return (
    <FullBleedSafeArea
      testID={testID}
      backgroundColor={colors.background}
      contentStyle={{ flexDirection: 'row' }}
      underlay={(
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: sidebarWidth + insets.left,
            borderRightWidth: 1,
            borderRightColor: colors.line,
            backgroundColor: colors.surface,
          }}
        />
      )}
    >
      <View
        style={{
          width: sidebarWidth,
          paddingHorizontal: compact ? 10 : 14,
          paddingTop: compact ? 8 : 14,
          paddingBottom: compact ? 8 : 12,
          backgroundColor: 'transparent',
        }}
      >
        <Link href={section === 'session' ? '/' : '/setup'} asChild>
          <Pressable testID={backTestID} accessibilityRole="button" hitSlop={6} style={{ minHeight: 48, justifyContent: 'center', marginBottom: compact ? 10 : 20, paddingHorizontal: 8 }}>
            <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.6 }}>
              ‹  {t(section === 'session' ? 'HOME' : 'SETUP')}
            </Text>
          </Pressable>
        </Link>

        <Text style={{ color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, paddingHorizontal: 8 }}>
          {t('SETTINGS')}
        </Text>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 10, paddingBottom: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {sections.filter((item) => item.id !== 'timing' || featureFlags.timingCalibration).map((item) => {
            const selected = item.id === section;
            return (
              <Link key={item.id} href={item.href} asChild>
                <Pressable
                  testID={item.testID}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => ({
                    minHeight: 50,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: selected || pressed ? colors.surfaceRaised : 'transparent',
                    borderWidth: 1,
                    borderColor: selected ? colors.line : 'transparent',
                  })}
                >
                  <Text style={{ color: selected ? colors.text : colors.muted, fontSize: compact ? 12 : 13, fontWeight: selected ? '800' : '600' }}>
                    {t(item.label)}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </ScrollView>

        {!compact ? (
          <Text style={{ color: colors.dim, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, paddingHorizontal: 8, paddingTop: 12 }}>
            {t('BEEP BEEP BEAT - RHYTHM COACH')}
          </Text>
        ) : null}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: compact ? 16 : 28, paddingTop: compact ? 14 : 20, paddingBottom: compact ? 20 : 28, width: '100%', maxWidth: 1120, alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 }}>
            {title}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 6 }}>
            {description}
          </Text>
          {children}
        </ScrollView>
        {footer}
      </View>
    </FullBleedSafeArea>
  );
}

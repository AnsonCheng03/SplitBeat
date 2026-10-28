import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullBleedSafeArea } from '@/components/FullBleedSafeArea';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import {
  SettingsPageStyle1,
  SettingsPageStyle2,
  SettingsPageStyle3,
  SettingsPageStyle4,
  SettingsPageStyle5,
  SettingsPageStyle6,
  SettingsPageStyle7,
  SettingsPageStyle8,
  SettingsPageStyle9,
  SettingsPageStyle10,
  SettingsPageStyle11,
  SettingsPageStyle12,
  SettingsPageStyle13,
  SettingsPageStyle14,
  SettingsPageStyle15,
  SettingsPageStyle16,
  SettingsPageStyle17,
  SettingsPageStyle18,
  SettingsPageStyle19,
  SettingsPageStyle20,
  SettingsPageStyle21,
  SettingsPageStyle22,
} from '@/styles/settings';

export type SettingsSection = 'session' | 'rhythm' | 'challenges' | 'gameCenter' | 'audio' | 'appearance' | 'timing' | 'language';

const sections: { id: SettingsSection; label: string; href: '/setup' | '/settings/rhythm' | '/settings/challenges' | '/settings/game-center' | '/settings/audio' | '/settings/appearance' | '/settings/timing' | '/settings/language'; testID?: string }[] = [
  { id: 'session', label: 'Pace & length', href: '/setup' },
  { id: 'rhythm', label: 'Rhythm & meter', href: '/settings/rhythm', testID: 'setup.card.rhythm' },
  { id: 'challenges', label: 'Challenges', href: '/settings/challenges', testID: 'setup.card.challenges' },
  { id: 'gameCenter', label: 'Game Center', href: '/settings/game-center', testID: 'setup.card.gameCenter' },
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
  const mobileLayout = width < 640;
  const visibleSections = sections.filter((item) => {
    if (item.id === 'timing') return featureFlags.timingCalibration;
    if (item.id === 'challenges') return featureFlags.challengeMode;
    if (item.id === 'gameCenter') return featureFlags.gameCenter;
    return true;
  });

  const renderSectionLink = (item: (typeof sections)[number], mobile: boolean) => {
    const selected = item.id === section;
    return (
      <Link key={item.id} href={item.href} asChild>
        <Pressable
          testID={item.testID}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          style={({ pressed }) => (mobile
            ? SettingsPageStyle18({ selected, pressed, colors })
            : SettingsPageStyle7({ selected, pressed, colors }))}
        >
          <Text style={mobile
            ? SettingsPageStyle19({ selected, colors })
            : SettingsPageStyle8({ selected, colors, compact })}
          >
            {t(item.label)}
          </Text>
        </Pressable>
      </Link>
    );
  };

  return (
    <FullBleedSafeArea
      testID={testID}
      backgroundColor={colors.background}
      contentStyle={SettingsPageStyle14({ mobileLayout })}
      underlay={!mobileLayout ? (
        <View
          pointerEvents="none"
          style={SettingsPageStyle1({ sidebarWidth, insets, colors })}
        />
      ) : undefined}
    >
      {!mobileLayout ? (
        <View style={SettingsPageStyle2({ sidebarWidth, compact })}>
          <Link href={section === 'session' ? '/' : '/setup'} asChild>
            <Pressable
              testID={backTestID}
              accessibilityRole="button"
              accessibilityLabel={t(section === 'session' ? 'Return home' : 'Return to setup')}
              hitSlop={6}
              style={SettingsPageStyle3({ compact })}
            >
              <Text style={SettingsPageStyle4({ colors })}>
                ‹  {t(section === 'session' ? 'HOME' : 'SETUP')}
              </Text>
            </Pressable>
          </Link>

          <Text style={SettingsPageStyle5({ colors })}>
            {t('SETTINGS')}
          </Text>

          <ScrollView
            style={SettingsPageStyle6()}
            contentContainerStyle={SettingsPageStyle15()}
            showsVerticalScrollIndicator={false}
          >
            {visibleSections.map((item) => renderSectionLink(item, false))}
          </ScrollView>

          {!compact ? (
            <Text style={SettingsPageStyle9({ colors })}>
              {t('BEEP BEEP BEAT - RHYTHM COACH')}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={SettingsPageStyle10()}>
        {mobileLayout ? (
          <>
            <View style={SettingsPageStyle16()}>
              <Link href={section === 'session' ? '/' : '/setup'} asChild>
                <Pressable
                  testID={backTestID}
                  accessibilityRole="button"
                  accessibilityLabel={t(section === 'session' ? 'Return home' : 'Return to setup')}
                  style={SettingsPageStyle3({ compact: true, mobileLayout: true })}
                >
                  <Text style={SettingsPageStyle4({ colors })}>
                    ‹  {t(section === 'session' ? 'HOME' : 'SETUP')}
                  </Text>
                </Pressable>
              </Link>
              <Text style={SettingsPageStyle21({ colors })}>
                {t('SETTINGS')}
              </Text>
            </View>

            <ScrollView
              testID="settings.navigation"
              horizontal
              style={SettingsPageStyle22()}
              accessibilityLabel={t('Settings sections')}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={SettingsPageStyle17()}
            >
              {visibleSections.map((item) => renderSectionLink(item, true))}
            </ScrollView>
          </>
        ) : null}

        <ScrollView
          style={SettingsPageStyle11()}
          contentContainerStyle={SettingsPageStyle20({ compact, mobileLayout })}
          showsVerticalScrollIndicator={false}
        >
          <Text style={SettingsPageStyle12({ colors })}>
            {title}
          </Text>
          <Text style={SettingsPageStyle13({ colors })}>
            {description}
          </Text>
          {children}
        </ScrollView>
        {footer}
      </View>
    </FullBleedSafeArea>
  );
}

import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullBleedSafeArea } from '@/components/FullBleedSafeArea';
import { colors } from '@/theme';

export type SettingsSection = 'session' | 'rhythm' | 'audio' | 'timing';

const sections: { id: SettingsSection; label: string; href: '/setup' | '/settings/rhythm' | '/settings/audio' | '/settings/timing'; testID?: string }[] = [
  { id: 'session', label: 'Pace & length', href: '/setup' },
  { id: 'rhythm', label: 'Rhythm & meter', href: '/settings/rhythm', testID: 'setup.card.rhythm' },
  { id: 'audio', label: 'Sounds', href: '/settings/audio', testID: 'setup.card.audio' },
  { id: 'timing', label: 'Timing', href: '/settings/timing', testID: 'setup.card.timing' },
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
  const insets = useSafeAreaInsets();

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
            width: 224 + insets.left,
            borderRightWidth: 1,
            borderRightColor: colors.line,
            backgroundColor: colors.surface,
          }}
        />
      )}
    >
      <View
        style={{
          width: 224,
          paddingHorizontal: 14,
          paddingTop: 14,
          paddingBottom: 12,
          backgroundColor: 'transparent',
        }}
      >
        <Link href={section === 'session' ? '/' : '/setup'} asChild>
          <Pressable testID={backTestID} hitSlop={10} style={{ minHeight: 42, justifyContent: 'center', marginBottom: 20 }}>
            <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.6 }}>
              ‹  {section === 'session' ? 'HOME' : 'SETUP'}
            </Text>
          </Pressable>
        </Link>

        <Text style={{ color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, paddingHorizontal: 8 }}>
          SETTINGS
        </Text>

        <View style={{ gap: 5 }}>
          {sections.map((item) => {
            const selected = item.id === section;
            return (
              <Link key={item.id} href={item.href} asChild>
                <Pressable
                  testID={item.testID}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => ({
                    minHeight: 46,
                    justifyContent: 'center',
                    paddingHorizontal: 11,
                    borderRadius: 11,
                    backgroundColor: selected || pressed ? colors.surfaceRaised : 'transparent',
                    borderWidth: 1,
                    borderColor: selected ? colors.line : 'transparent',
                  })}
                >
                  <Text style={{ color: selected ? colors.text : colors.muted, fontSize: 13, fontWeight: selected ? '800' : '600' }}>
                    {item.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />
        <Text style={{ color: colors.dim, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, paddingHorizontal: 8 }}>
          BEEP BEEP BEAT - RHYTHM COACH
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 20, paddingBottom: 28, width: '100%', maxWidth: 1120, alignSelf: 'center' }}
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

import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

export function SettingsPage({
  testID,
  backTestID,
  title,
  description,
  children,
}: {
  testID: string;
  backTestID: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView testID={testID} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingTop: 10,
          paddingBottom: 80,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <Link href="/setup" asChild>
            <Pressable testID={backTestID} hitSlop={12}>
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.7 }}>
                ‹  SESSION SETTINGS
              </Text>
            </Pressable>
          </Link>
          <Text style={{ color: colors.dim, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 }}>
            SPLITBEAT
          </Text>
        </View>

        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.8 }}>
          {title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 8 }}>
          {description}
        </Text>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

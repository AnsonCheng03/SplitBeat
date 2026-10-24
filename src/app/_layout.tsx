import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { SessionProvider } from '@/store/sessionStore';
import { I18nProvider } from '@/i18n/I18nProvider';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <I18nProvider>
        <SessionProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade' }} />
        </SessionProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

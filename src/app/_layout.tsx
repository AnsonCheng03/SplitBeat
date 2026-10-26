import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NotationPreloader } from '@/components/NotationPreloader';
import { SessionProvider } from '@/store/sessionStore';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { rootNavigatorScreenOptions } from '@/styles/shared';

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <I18nProvider>
          <SessionProvider>
            <>
              <RootNavigator />
              <NotationPreloader />
            </>
          </SessionProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { mode, colors } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={rootNavigatorScreenOptions(colors)} />
    </>
  );
}

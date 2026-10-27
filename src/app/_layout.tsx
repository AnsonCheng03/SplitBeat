import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotationPreloader } from '@/components/NotationPreloader';
import { SessionProvider } from '@/store/sessionStore';
import { AppTutorialProvider, useAppTutorial } from '@/store/AppTutorialProvider';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { gestureHandlerRootStyle, rootNavigatorScreenOptions } from '@/styles/shared';
import { AppTutorialOverlay } from '@/components/AppTutorialOverlay';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={gestureHandlerRootStyle()}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <I18nProvider>
            <SessionProvider>
              <AppTutorialProvider>
                <>
                  <RootNavigator />
                  <NotationPreloader />
                  <AppTutorialHost />
                </>
              </AppTutorialProvider>
            </SessionProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppTutorialHost() {
  const { tutorialVisible, completeTutorial } = useAppTutorial();
  return tutorialVisible ? <AppTutorialOverlay onDismiss={completeTutorial} /> : null;
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

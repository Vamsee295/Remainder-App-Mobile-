import { Anton_400Regular } from '@expo-google-fonts/anton';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { Caveat_400Regular } from '@expo-google-fonts/caveat';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';

import { LoadingScreen } from '@/components/loading-screen';
import { C } from '@/constants/theme';
import { TasksProvider } from '@/hooks/use-tasks';
import { NotificationService } from '@/services/notification-service';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: C.paper, card: C.card, text: C.ink, border: C.ink, primary: C.accent },
};

export default function RootLayout() {
  const [intro, setIntro] = useState(true);
  const endIntro = useCallback(() => setIntro(false), []);
  const [loaded, error] = useFonts({
    Anton_400Regular,
    BarlowCondensed_700Bold,
    Caveat_400Regular,
    Inter_400Regular,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    // Request notification permissions on app launch
    NotificationService.requestPermissions();
  }, []);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // If fonts fail to load, still render: system fonts beat a blank app.
  if (!loaded && !error) return null;

  return (
    <ThemeProvider value={theme}>
      <TasksProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </TasksProvider>
      {intro ? <LoadingScreen onDone={endIntro} /> : null}
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

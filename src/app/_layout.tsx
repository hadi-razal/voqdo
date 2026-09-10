import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { JournalProvider, useJournal } from '@/context/journal';
import { ToastProvider } from '@/context/toast';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(colors.bg);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <JournalProvider>
          <ToastProvider>
            <RootNavigator fontsLoaded={fontsLoaded} />
          </ToastProvider>
        </JournalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready, settings } = useJournal();
  const segments = useSegments();
  const router = useRouter();

  const booted = ready && fontsLoaded;

  useEffect(() => {
    if (booted) SplashScreen.hideAsync();
  }, [booted]);

  // The journal is local, so there is nobody to authenticate — the only gate
  // is whether this person has seen the welcome screen yet.
  useEffect(() => {
    if (!booted) return;

    const onWelcome = segments[0] === 'welcome';

    if (!settings.onboarded && !onWelcome) router.replace('/welcome');
    else if (settings.onboarded && onWelcome) router.replace('/');
  }, [booted, settings.onboarded, segments, router]);

  if (!booted) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="record" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="write" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="review" options={{ gestureEnabled: false }} />
        <Stack.Screen name="categories" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="entry/[id]" />
        <Stack.Screen name="category/[key]" />
      </Stack>
    </>
  );
}

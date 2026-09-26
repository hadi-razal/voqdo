import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccountProvider, useAccount } from '@/context/account';
import { JournalProvider, useJournal } from '@/context/journal';
import { SyncProvider } from '@/context/sync';
import { ToastProvider } from '@/context/toast';
import { onboardingExit } from '@/lib/onboarding';
import { colors } from '@/theme';
import { Screen, Display, Body, PrimaryButton } from '@/components/vq';

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(colors.bg);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <JournalProvider>
          <AccountProvider>
            <SyncProvider>
              <ToastProvider>
                <RootNavigator fontsLoaded={fontsLoaded || !!fontError} />
              </ToastProvider>
            </SyncProvider>
          </AccountProvider>
        </JournalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready, settings, loadError, retryLoad } = useJournal();
  const { access } = useAccount();
  const segments = useSegments();
  const router = useRouter();

  const booted = ready && fontsLoaded;

  useEffect(() => {
    if (booted || loadError) SplashScreen.hideAsync();
  }, [booted, loadError]);

  // Two gates: onboarding, then the paid plan. Sign-in itself is silent.
  useEffect(() => {
    if (!booted) return;

    const onWelcome = segments[0] === 'welcome';
    if (!onWelcome) onboardingExit.pending = false;

    if (!settings.onboarded && !onWelcome) router.replace('/welcome');
    // Welcome finishing onboarding navigates itself; don't race it.
    else if (settings.onboarded && onWelcome && !onboardingExit.pending) router.replace('/');
  }, [booted, settings.onboarded, segments, router]);

  // After the free trial, only the paywall and the pages it links to stay open.
  const locked = booted && settings.onboarded && access.known && !access.hasAccess;
  useEffect(() => {
    const route = segments[0] ?? '';
    const allowed = ['paywall', 'pro', 'account', 'privacy', 'terms', 'welcome'].includes(route);
    if (locked && !allowed) router.replace('/paywall');
    else if (!locked && route === 'paywall' && access.known) router.replace('/');
  }, [locked, access.known, segments, router]);

  if (loadError) return (
    <Screen contentStyle={{ padding: 24, gap: 16 }}>
      <Display size={24}>Your journal couldn’t open</Display>
      <Body>Your saved entries haven’t been changed. Try opening them again.</Body>
      <PrimaryButton label="Try again" onPress={retryLoad} />
    </Screen>
  );
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
        <Stack.Screen name="search" />
        <Stack.Screen name="celebrate" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="pro" />
        <Stack.Screen name="paywall" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="account" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="challenges" />
        <Stack.Screen name="reflect" />
        <Stack.Screen name="entry/[id]" />
        <Stack.Screen name="category/[key]" />
      </Stack>
    </>
  );
}

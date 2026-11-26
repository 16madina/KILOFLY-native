import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_600SemiBold_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/global.css';
import { AuthProvider, useAuth } from '@/lib/auth';
import { usePushNotifications } from '@/lib/push';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, primary: colors.gold, text: colors.text, border: colors.border },
};

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_600SemiBold_Italic,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <AuthProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <PushRegistration />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
          <Stack.Screen name="listing/[id]" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="payment-result" options={{ animation: 'fade' }} />
          <Stack.Screen name="reserve/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="reservation/[id]" />
          <Stack.Screen name="request/[id]" />
          <Stack.Screen name="post-listing" options={{ presentation: 'modal' }} />
          <Stack.Screen name="post-request" options={{ presentation: 'modal' }} />
          <Stack.Screen name="conversation/[id]" />
          <Stack.Screen name="wallet" />
          <Stack.Screen name="edit-profile" />
        </Stack>
      </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

/** Registers this phone for push notifications once the user is signed in. */
function PushRegistration() {
  const { session } = useAuth();
  usePushNotifications(session?.user.id);
  return null;
}

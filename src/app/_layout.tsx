import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, Barlow_700Bold } from '@expo-google-fonts/barlow';
import { BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '../state/store';
import { colors } from '../theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <AppStack />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

// Every screen is declared here: signed-out people only reach Welcome, Log in
// and Sign up; everything else needs an account. Undeclared routes would be public.
function AppStack() {
  const { user } = useStore();
  const still = { animation: 'fade' as const, gestureEnabled: false };
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="exercise/[id]" />
        <Stack.Screen name="program/[id]" />
        <Stack.Screen name="workout/[program]/[day]" />
        <Stack.Screen name="workout/next" options={still} />
        <Stack.Screen name="workout/done" options={still} />
        <Stack.Screen name="session/[id]" options={still} />
        <Stack.Screen name="log/[id]" options={still} />
        <Stack.Screen name="summary" options={still} />
        <Stack.Screen name="scan" />
        <Stack.Screen name="records/[id]" />
        <Stack.Screen name="body" />
        <Stack.Screen name="achievements" />
        <Stack.Screen name="reminders" />
        <Stack.Screen name="backup" />
        <Stack.Screen name="builder" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="index" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

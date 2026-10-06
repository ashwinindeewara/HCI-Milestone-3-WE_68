import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '../src/constants/colors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.dark,
          },
          headerTintColor: Colors.surface,
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        {/* Onboarding & Authentication Stack Screens */}
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="select-role" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="account-created" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />

        {/* Main App Workspace Bottom Tabs Navigator */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}

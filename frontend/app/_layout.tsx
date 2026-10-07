import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.outerContainer}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}
        >
          {/* Onboarding & Authentication Stack Screens */}
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="select-role" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="account-created" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />

          {/* Dispute Flow Screens */}
          <Stack.Screen name="freelancer-disputes" options={{ headerShown: false }} />
          <Stack.Screen name="create-dispute" options={{ headerShown: false }} />
          <Stack.Screen name="dispute-details" options={{ headerShown: false }} />

          {/* Project & Contract Flow Screens */}
          <Stack.Screen name="project-details" options={{ headerShown: false }} />
          <Stack.Screen name="contracts" options={{ headerShown: false }} />
          <Stack.Screen name="contracts-list" options={{ headerShown: false }} />
          <Stack.Screen name="contract-details" options={{ headerShown: false }} />

          {/* Profile & Notifications Flow Screens */}
          <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
          <Stack.Screen name="notification-details" options={{ headerShown: false }} />

          {/* Admin & Staff Dashboards */}
          <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="staff-dashboard" options={{ headerShown: false }} />

          {/* Main Bottom Tabs Navigator */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Colors from '../src/constants/colors';
import AdminHeaderBack from '../src/components/AdminHeaderBack';

const queryClient = new QueryClient();

// Navy top bar used by every admin screen (the freelancer screens draw their own headers)
const adminHeaderOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: Colors.dark },
  headerTintColor: Colors.surface,
  headerTitleStyle: { fontWeight: '700' as const },
  contentStyle: { backgroundColor: Colors.background },
  headerLeft: () => <AdminHeaderBack fallbackHref="/admin-dashboard" />,
};

// The dashboard is the admin home, so with no history its arrow returns to the login screen
const adminDashboardHeaderOptions = {
  ...adminHeaderOptions,
  headerLeft: () => <AdminHeaderBack fallbackHref="/login" />,
};

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
          <Stack.Screen name="admin-dashboard" options={adminDashboardHeaderOptions} />
          <Stack.Screen name="admin-users" options={adminHeaderOptions} />
          <Stack.Screen name="admin-transactions" options={adminHeaderOptions} />
          <Stack.Screen name="admin-disputes" options={adminHeaderOptions} />
          <Stack.Screen name="admin-security" options={adminHeaderOptions} />
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

import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../src/constants/colors';

import {
  HomeIcon,
  ProjectsIcon,
  PaymentsIcon,
  AlertsIcon,
  ProfileIcon,
} from '../../src/components/Icons';

function TabBarIcon({ title, focused }: { title: string; focused: boolean }) {
  const iconColor = focused ? '#16A34A' : '#6B7280';
  const iconSize = 22;

  switch (title) {
    case 'Home':
      return <HomeIcon size={iconSize} color={iconColor} focused={focused} />;
    case 'Projects':
      return <ProjectsIcon size={iconSize} color={iconColor} />;
    case 'Payments':
      return <PaymentsIcon size={iconSize} color={iconColor} />;
    case 'Alerts':
      return <AlertsIcon size={iconSize} color={iconColor} />;
    case 'Profile':
      return <ProfileIcon size={iconSize} color={iconColor} />;
    default:
      return <Text style={{ fontSize: 18 }}>📱</Text>;
  }
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          headerTitle: 'Workspace',
          tabBarIcon: ({ focused }) => <TabBarIcon title="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Projects',
          headerTitle: 'My Projects',
          tabBarIcon: ({ focused }) => <TabBarIcon title="Projects" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="escrow"
        options={{
          title: 'Payments',
          headerTitle: 'Escrow & Payments',
          tabBarIcon: ({ focused }) => <TabBarIcon title="Payments" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          headerTitle: 'Notifications',
          tabBarIcon: ({ focused }) => <TabBarIcon title="Alerts" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabBarIcon title="Profile" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="find-talent"
        options={{
          href: null,
          headerTitle: 'Find Talent',
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          href: null,
          headerTitle: 'Project Files',
        }}
      />
      <Tabs.Screen
        name="create-project"
        options={{
          href: null,
          headerTitle: 'Create Project',
        }}
      />
      <Tabs.Screen
        name="talent-profile"
        options={{
          href: null,
          headerTitle: 'Talent Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  iconText: {
    fontSize: 18,
  },
  iconTextActive: {
    color: '#16A34A',
    fontWeight: '800',
  },
  iconTextInactive: {
    color: '#6B7280',
    opacity: 0.8,
  },
});

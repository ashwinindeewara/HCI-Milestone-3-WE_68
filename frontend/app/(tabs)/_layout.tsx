import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../src/constants/colors';

function TabBarIcon({ title, focused }: { title: string; focused: boolean }) {
  const getIcon = () => {
    switch (title) {
      case 'Home':
        return '🏠';
      case 'Projects':
        return '📁';
      case 'Find Talent':
        return '🔍';
      case 'Payments':
        return '💳';
      case 'Profile':
        return '👤';
      default:
        return '📱';
    }
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.iconText, focused && styles.iconTextActive]}>{getIcon()}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.dark,
        },
        headerTintColor: Colors.surface,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.neutralLight,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
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
          headerTitle: 'Freelancer & Client Workspace',
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
        name="find-talent"
        options={{
          title: 'Find Talent',
          headerTitle: 'Find Talent & Hire',
          tabBarIcon: ({ focused }) => <TabBarIcon title="Find Talent" focused={focused} />,
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
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Profile & Settings',
          tabBarIcon: ({ focused }) => <TabBarIcon title="Profile" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          headerTitle: 'Notifications',
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          href: null,
          headerTitle: 'Project Files',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    opacity: 0.6,
  },
  iconTextActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
});

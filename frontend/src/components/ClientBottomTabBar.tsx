import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HomeIcon,
  ProjectsIcon,
  SearchIcon,
  PaymentsIcon,
  ProfileIcon,
} from './Icons';

export type ClientTabName = 'home' | 'projects' | 'find-talent' | 'payments' | 'profile';

interface ClientBottomTabBarProps {
  activeTab: ClientTabName;
}

export default function ClientBottomTabBar({ activeTab }: ClientBottomTabBarProps) {
  const router = useRouter();

  const tabs: Array<{
    name: ClientTabName;
    label: string;
    route: string;
    IconComponent: React.ComponentType<{ size?: number; color?: string; focused?: boolean }>;
  }> = [
    { name: 'home', label: 'Home', route: '/client-dashboard', IconComponent: HomeIcon },
    { name: 'projects', label: 'Projects', route: '/client-contracts', IconComponent: ProjectsIcon },
    { name: 'find-talent', label: 'Find Talent', route: '/client-find-talent', IconComponent: SearchIcon },
    { name: 'payments', label: 'Payments', route: '/client-payments', IconComponent: PaymentsIcon },
    { name: 'profile', label: 'Profile', route: '/client-profile', IconComponent: ProfileIcon },
  ];

  return (
    <View style={styles.tabBarContainer}>
      {tabs.map((tab) => {
        const isFocused = activeTab === tab.name;
        const iconColor = isFocused ? '#16A34A' : '#6B7280';
        const Icon = tab.IconComponent;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
              if (tab.name === 'home') {
                router.replace('/client-dashboard');
              } else {
                router.push(tab.route as any);
              }
            }}
            activeOpacity={0.7}
          >
            <Icon size={22} color={iconColor} focused={isFocused} />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#16A34A',
    fontWeight: '700',
  },
});

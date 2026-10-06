import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/colors';

interface AdminTabBarProps {
  activeTab: 'dashboard' | 'users' | 'transactions' | 'disputes' | 'security';
}

export default function AdminTabBar({ activeTab }: AdminTabBarProps) {
  const router = useRouter();

  return (
    <View style={styles.adminTabBar}>
      <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/admin-dashboard')}>
        <Text style={[styles.tabIcon, activeTab === 'dashboard' && styles.tabIconActive]}>🎛️</Text>
        <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/admin-users')}>
        <Text style={[styles.tabIcon, activeTab === 'users' && styles.tabIconActive]}>👥</Text>
        <Text style={[styles.tabLabel, activeTab === 'users' && styles.tabLabelActive]}>Users</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/admin-transactions')}>
        <Text style={[styles.tabIcon, activeTab === 'transactions' && styles.tabIconActive]}>💵</Text>
        <Text style={[styles.tabLabel, activeTab === 'transactions' && styles.tabLabelActive]}>Transactions</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/admin-disputes')}>
        <Text style={[styles.tabIcon, activeTab === 'disputes' && styles.tabIconActive]}>⚠️</Text>
        <Text style={[styles.tabLabel, activeTab === 'disputes' && styles.tabLabelActive]}>Disputes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/admin-security')}>
        <Text style={[styles.tabIcon, activeTab === 'security' && styles.tabIconActive]}>🛡️</Text>
        <Text style={[styles.tabLabel, activeTab === 'security' && styles.tabLabelActive]}>Security</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  adminTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 999,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.neutralMedium,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

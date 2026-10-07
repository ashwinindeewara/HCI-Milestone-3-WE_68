import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { MUTED_TEXT, adminShadow } from '../constants/adminTheme';

type AdminTab = 'dashboard' | 'users' | 'transactions' | 'disputes' | 'security';

interface AdminTabBarProps {
  activeTab: AdminTab;
}

type TabIcon = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { key: AdminTab; label: string; href: string; icon: TabIcon; activeIcon: TabIcon }[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  { key: 'users', label: 'Users', href: '/admin-users', icon: 'people-outline', activeIcon: 'people' },
  { key: 'transactions', label: 'Transactions', href: '/admin-transactions', icon: 'wallet-outline', activeIcon: 'wallet' },
  { key: 'disputes', label: 'Disputes', href: '/admin-disputes', icon: 'scale-outline', activeIcon: 'scale' },
  { key: 'security', label: 'Security', href: '/admin-security', icon: 'shield-checkmark-outline', activeIcon: 'shield-checkmark' },
];

export default function AdminTabBar({ activeTab }: AdminTabBarProps) {
  const router = useRouter();

  return (
    <View style={styles.adminTabBar}>
      <View style={styles.inner}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => router.replace(tab.href as any)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
            >
              <View style={[styles.activeBar, active && styles.activeBarOn]} />
              <Ionicons
                name={active ? tab.activeIcon : tab.icon}
                size={22}
                color={active ? Colors.primary : MUTED_TEXT}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  adminTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    zIndex: 999,
    ...adminShadow.card,
  },
  inner: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: 'transparent',
  },
  activeBarOn: { backgroundColor: Colors.primary },
  tabLabel: { fontSize: 11, fontWeight: '600', color: MUTED_TEXT },
  tabLabelActive: { color: Colors.primaryDark, fontWeight: '700' },
});

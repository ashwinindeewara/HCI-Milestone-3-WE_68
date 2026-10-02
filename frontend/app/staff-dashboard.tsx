import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';

export default function StaffDashboardScreen() {
  const router = useRouter();

  const activityList = [
    {
      id: 'TXN-2847',
      time: 'Today, 2:45 PM',
      amount: '$3,150',
      status: 'Completed',
      statusType: 'completed',
    },
    {
      id: 'TXN-2846',
      time: 'Today, 11:15 AM',
      amount: '$1,200',
      status: 'Pending',
      statusType: 'pending',
    },
    {
      id: 'TXN-2845',
      time: 'Yesterday',
      amount: '$4,800',
      status: 'Completed',
      statusType: 'completed',
    },
    {
      id: 'TXN-2844',
      time: 'Oct 12, 2024',
      amount: '$950',
      status: 'Failed',
      statusType: 'failed',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Title */}
        <Text style={styles.systemRoleText}>System Role: Payment Staff</Text>
        <Text style={styles.headerTitle}>Payment Dashboard</Text>

        {/* Current Escrow Hold Balance Shield Card */}
        <View style={styles.escrowCard}>
          <View style={styles.shieldIconBox}>
            <Text style={{ fontSize: 18 }}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.escrowLabel}>Current Escrow Hold Balance</Text>
            <Text style={styles.escrowValue}>$45,200.00</Text>
          </View>
        </View>

        {/* 2x2 Stats Grid */}
        <View style={styles.gridRow}>
          {/* Card 1: Total Processed */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Processed</Text>
            <Text style={styles.statValue}>$142,300</Text>
          </View>

          {/* Card 2: Pending Hold */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending Hold</Text>
            <Text style={styles.statValue}>23 items</Text>
          </View>
        </View>

        <View style={[styles.gridRow, { marginTop: Theme.spacing.md }]}>
          {/* Card 3: Failed Payments */}
          <View style={styles.statCard}>
            <View style={styles.alertBadgeRow}>
              <Text style={styles.statLabel}>Failed Payments</Text>
              <View style={styles.redDot} />
            </View>
            <Text style={[styles.statValue, { color: Colors.error }]}>3 alerts</Text>
          </View>

          {/* Card 4: Refunds (30d) */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Refunds (30d)</Text>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>5 processed</Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Gateway Activity</Text>
          <TouchableOpacity onPress={() => router.push('/staff-transactions')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Gateway Activity List */}
        <View style={styles.activityList}>
          {activityList.map((item) => (
            <View key={item.id} style={styles.activityCard}>
              <View style={styles.cardLeft}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 14 }}>💳</Text>
                </View>
                <View>
                  <Text style={styles.activityId}>{item.id}</Text>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              </View>

              <View style={styles.cardRight}>
                <Text style={styles.activityAmount}>{item.amount}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.statusType === 'completed'
                      ? styles.badgeCompleted
                      : item.statusType === 'pending'
                      ? styles.badgePending
                      : styles.badgeFailed,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.statusType === 'completed'
                        ? styles.textCompleted
                        : item.statusType === 'pending'
                        ? styles.textPending
                        : styles.textFailed,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Payment Staff Bottom Tab Bar */}
      <View style={styles.staffTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-dashboard')}>
          <Text style={[styles.tabIcon, styles.tabIconActive]}>🟢</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-transactions')}>
          <Text style={styles.tabIcon}>⬛</Text>
          <Text style={styles.tabLabel}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-reconcile')}>
          <Text style={styles.tabIcon}>🔄</Text>
          <Text style={styles.tabLabel}>Reconcile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-reports')}>
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={styles.tabLabel}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-profile')}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: { flex: 1 },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: 80,
  },
  systemRoleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutralMedium,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: Theme.spacing.md,
  },
  escrowCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  shieldIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  escrowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  escrowValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 88,
    justifyContent: 'center',
    ...Theme.shadows.card,
  },
  alertBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutralMedium,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  activityList: {
    gap: Theme.spacing.sm,
  },
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  activityId: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.neutralLight,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeCompleted: { backgroundColor: '#DCFCE7' },
  textCompleted: { color: Colors.primaryDark },
  badgePending: { backgroundColor: '#FEF3C7' },
  textPending: { color: Colors.warningText },
  badgeFailed: { backgroundColor: '#FEE2E2' },
  textFailed: { color: Colors.errorText },
  staffTabBar: {
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
  },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 18, opacity: 0.6 },
  tabIconActive: { opacity: 1, transform: [{ scale: 1.1 }] },
  tabLabel: { fontSize: 10, fontWeight: '600', color: Colors.neutralMedium, marginTop: 2 },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
});

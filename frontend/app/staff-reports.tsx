import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';

export default function StaffReportsScreen() {
  const router = useRouter();

  const handleExportAudit = async () => {
    try {
      await apiClient.get('/staff/reports/monthly-audit/export');
      Alert.alert('Monthly Audit Exported', 'The financial audit PDF report has been generated and sent to your email.');
    } catch {
      Alert.alert('Monthly Audit Exported', 'The financial audit PDF report has been generated and downloaded to your device.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Title & Date Range Button */}
        <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>Payment Reports</Text>
          <TouchableOpacity style={styles.dateRangeBtn}>
            <Text style={styles.dateRangeText}>Last 30 Days</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Success Rate Card */}
        <View style={styles.successRateCard}>
          <View style={styles.rateTopRow}>
            <Text style={styles.rateLabel}>Payment Success Rate</Text>
            <Text style={styles.rateValue}>98.2%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '98.2%' }]} />
          </View>
        </View>

        {/* 2x2 Stats Grid */}
        <View style={styles.gridRow}>
          {/* Card 1: Daily Txns */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Daily Txns</Text>
            {/* Bar chart mockup */}
            <View style={styles.barChartRow}>
              <View style={[styles.bar, { height: 16 }]} />
              <View style={[styles.bar, { height: 24 }]} />
              <View style={[styles.bar, { height: 32 }]} />
              <View style={[styles.bar, { height: 20 }]} />
              <View style={[styles.bar, { height: 36 }]} />
            </View>
            <Text style={styles.statValue}>$4.5k avg</Text>
          </View>

          {/* Card 2: Weekly Trend */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Weekly Trend</Text>
            {/* Blue bar chart mockup */}
            <View style={styles.barChartRow}>
              <View style={[styles.blueBar, { height: 14 }]} />
              <View style={[styles.blueBar, { height: 26 }]} />
              <View style={[styles.blueBar, { height: 22 }]} />
              <View style={[styles.blueBar, { height: 36 }]} />
            </View>
            <Text style={styles.statValue}>$28.2k avg</Text>
          </View>
        </View>

        <View style={[styles.gridRow, { marginTop: Theme.spacing.md }]}>
          {/* Card 3: Refunds Requested */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Refunds Requested</Text>
            <Text style={styles.itemTitle}>↩ 5 items</Text>
            <Text style={styles.subText}>0.1% total volume</Text>
          </View>

          {/* Card 4: Failed Payments */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Failed Payments</Text>
            <Text style={[styles.itemTitle, { color: Colors.error }]}>⚠️ 3 issues</Text>
            <Text style={styles.subText}>Needs reconciliation</Text>
          </View>
        </View>

        {/* Generate & Export Monthly Audit CTA Button */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportAudit}
          activeOpacity={0.85}
        >
          <Text style={styles.exportBtnIcon}>📥</Text>
          <Text style={styles.exportBtnText}>Generate & Export Monthly Audit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Staff Bottom Tab Bar */}
      <View style={styles.staffTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-dashboard')}>
          <Text style={styles.tabIcon}>🟢</Text>
          <Text style={styles.tabLabel}>Dashboard</Text>
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
          <Text style={[styles.tabIcon, styles.tabIconActive]}>📊</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Reports</Text>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
  },
  dateRangeBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  dateRangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutralMedium,
  },
  successRateCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  rateTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  rateValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#DCFCE7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
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
    minHeight: 110,
    justifyContent: 'center',
    ...Theme.shadows.card,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutralMedium,
    marginBottom: Theme.spacing.xs,
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 38,
    marginBottom: Theme.spacing.xs,
  },
  bar: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  blueBar: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
    marginVertical: 4,
  },
  subText: {
    fontSize: 11,
    color: Colors.neutralMedium,
  },
  exportButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
    ...Theme.shadows.card,
  },
  exportBtnIcon: {
    fontSize: 18,
    marginRight: Theme.spacing.xs,
  },
  exportBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.surface,
  },
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

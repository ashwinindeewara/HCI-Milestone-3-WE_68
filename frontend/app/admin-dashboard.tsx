import React, { useState } from 'react';
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

export default function AdminDashboardScreen() {
  const router = useRouter();

  const handleAlertReview = (title: string) => {
    Alert.alert('Admin Investigation', `Opening security investigation log for: ${title}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Title & Admin Avatar */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={styles.avatarRow}>
            <View style={styles.verifiedIcon}>
              <Text style={{ fontSize: 14 }}>✓</Text>
            </View>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>AD</Text>
            </View>
          </View>
        </View>

        {/* 6 KPI Metric Cards Grid (2x3 Layout - Matching Screenshot 1) */}
        <View style={styles.gridRow}>
          <View style={styles.gridCard}>
            <Text style={styles.cardLabel}>Total Users</Text>
            <Text style={styles.cardValue}>1,247</Text>
          </View>

          <View style={[styles.gridCard, styles.cardLightGreen]}>
            <Text style={styles.cardLabelGreen}>Active Freelancers</Text>
            <Text style={styles.cardValue}>583</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCard}>
            <Text style={styles.cardLabel}>Active Clients</Text>
            <Text style={styles.cardValue}>412</Text>
          </View>

          <View style={[styles.gridCard, styles.cardLightGreen]}>
            <Text style={styles.cardLabelGreen}>Total Vol</Text>
            <Text style={styles.cardValue}>$284,500</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={[styles.gridCard, styles.cardYellow]}>
            <Text style={styles.cardLabelYellow}>Disputes Pending</Text>
            <Text style={styles.cardValueYellow}>8</Text>
          </View>

          <View style={[styles.gridCard, styles.cardRed]}>
            <View style={styles.criticalHeader}>
              <Text style={styles.cardLabelRed}>Security Alerts</Text>
              <View style={styles.criticalBadge}>
                <Text style={styles.criticalText}>Critical</Text>
              </View>
            </View>
            <Text style={styles.cardValueRed}>3</Text>
          </View>
        </View>

        {/* Recent Transactions Log Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/admin-transactions')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.txnCard}
          onPress={() => router.push('/admin-transactions')}
        >
          <View style={styles.txnIconBox}>
            <Text style={{ fontSize: 16 }}>💵</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.txnId}>#TXN-2847</Text>
            <Text style={styles.txnSub}>Mobile App Landing Page</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.txnAmount}>$1,200</Text>
            <View style={styles.tagEscrow}>
              <Text style={styles.tagTextEscrow}>Escrow</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.txnCard}
          onPress={() => router.push('/admin-transactions')}
        >
          <View style={styles.txnIconBox}>
            <Text style={{ fontSize: 16 }}>💵</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.txnId}>#TXN-2846</Text>
            <Text style={styles.txnSub}>Brand Strategy Book</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.txnAmount}>$850</Text>
            <View style={styles.tagReleased}>
              <Text style={styles.tagTextReleased}>Released</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Urgent Security Alerts Section */}
        <Text style={styles.sectionTitle}>Urgent Alerts</Text>

        <TouchableOpacity
          style={styles.alertCardRed}
          onPress={() => handleAlertReview('IP Mismatch Detected')}
        >
          <View style={styles.alertIconRed}>
            <Text style={{ fontSize: 16 }}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitleRed}>IP Mismatch Detected</Text>
            <Text style={styles.alertSubRed}>
              User Chen (Freelancer) logged from 2 locations
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.alertCardYellow}
          onPress={() => router.push('/admin-disputes')}
        >
          <View style={styles.alertIconYellow}>
            <Text style={{ fontSize: 16 }}>⚖️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitleYellow}>Dispute: #DSP-409 Pending</Text>
            <Text style={styles.alertSubYellow}>
              TechVentures vs. Adams • UI Assets delayed
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Admin Bottom Navigation Bar */}
      <View style={styles.adminTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-dashboard')}>
          <Text style={[styles.tabIcon, styles.tabIconActive]}>🎛️</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-users')}>
          <Text style={styles.tabIcon}>👥</Text>
          <Text style={styles.tabLabel}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-transactions')}>
          <Text style={styles.tabIcon}>💵</Text>
          <Text style={styles.tabLabel}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-disputes')}>
          <Text style={styles.tabIcon}>⚠️</Text>
          <Text style={styles.tabLabel}>Disputes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-security')}>
          <Text style={styles.tabIcon}>•••</Text>
          <Text style={styles.tabLabel}>More</Text>
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
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: 80,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.surface,
    fontWeight: '800',
    fontSize: 14,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  cardLightGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.primaryLight,
  },
  cardYellow: {
    backgroundColor: '#FEF3C7',
    borderColor: Colors.warning,
  },
  cardRed: {
    backgroundColor: '#FEE2E2',
    borderColor: Colors.error,
  },
  cardLabel: { fontSize: 12, color: Colors.neutralMedium, fontWeight: '500', marginBottom: 4 },
  cardLabelGreen: { fontSize: 12, color: Colors.primaryDark, fontWeight: '600', marginBottom: 4 },
  cardLabelYellow: { fontSize: 12, color: Colors.warningText, fontWeight: '600', marginBottom: 4 },
  cardLabelRed: { fontSize: 12, color: Colors.errorText, fontWeight: '600' },
  cardValue: { fontSize: 22, fontWeight: '800', color: Colors.dark },
  cardValueYellow: { fontSize: 22, fontWeight: '800', color: Colors.warningText },
  cardValueRed: { fontSize: 22, fontWeight: '800', color: Colors.errorText },
  criticalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  criticalBadge: { backgroundColor: Colors.error, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  criticalText: { color: Colors.surface, fontSize: 9, fontWeight: '800' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Theme.spacing.md, marginBottom: Theme.spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark, marginVertical: Theme.spacing.xs },
  seeAllText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  txnCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  txnIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: Theme.spacing.sm },
  txnId: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  txnSub: { fontSize: 11, color: Colors.neutralMedium, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '800', color: Colors.dark, marginBottom: 2 },
  tagEscrow: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagTextEscrow: { fontSize: 10, fontWeight: '700', color: Colors.primaryDark },
  tagReleased: { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagTextReleased: { fontSize: 10, fontWeight: '700', color: '#2563EB' },
  alertCardRed: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  alertIconRed: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FCA5A5', justifyContent: 'center', alignItems: 'center', marginRight: Theme.spacing.sm },
  alertTitleRed: { fontSize: 14, fontWeight: '700', color: Colors.errorText },
  alertSubRed: { fontSize: 11, color: Colors.errorText, marginTop: 2 },
  alertCardYellow: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  alertIconYellow: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FDE047', justifyContent: 'center', alignItems: 'center', marginRight: Theme.spacing.sm },
  alertTitleYellow: { fontSize: 14, fontWeight: '700', color: Colors.warningText },
  alertSubYellow: { fontSize: 11, color: Colors.warningText, marginTop: 2 },
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
  },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 18, opacity: 0.6 },
  tabIconActive: { opacity: 1, transform: [{ scale: 1.1 }] },
  tabLabel: { fontSize: 10, fontWeight: '600', color: Colors.neutralMedium, marginTop: 2 },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
});

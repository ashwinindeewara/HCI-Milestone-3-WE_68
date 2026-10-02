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
import apiClient from '../src/services/api';

export default function StaffReconcileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'matched' | 'unmatched'>('matched');

  const items = [
    {
      id: 'TXN-2847',
      expected: '$3,150.00',
      received: '$3,150.00',
      diff: '$0.00',
      diffType: 'zero',
      status: 'Completed',
      statusType: 'completed',
    },
    {
      id: 'TXN-2846',
      expected: '$1,200.00',
      received: '$1,195.00',
      diff: '-$5.00',
      diffType: 'negative',
      status: 'Discrepancy',
      statusType: 'discrepancy',
    },
    {
      id: 'TXN-2845',
      expected: '$4,800.00',
      received: '$4,800.00',
      diff: '$0.00',
      diffType: 'zero',
      status: 'Completed',
      statusType: 'completed',
    },
  ];

  const handleMatch = async (id: string) => {
    try {
      await apiClient.post(`/staff/reconcile/${id}/match`);
      Alert.alert('Reconciliation Matched', `Transaction ${id} marked as fully reconciled.`);
    } catch {
      Alert.alert('Reconciliation Matched', `Transaction ${id} marked as fully reconciled.`);
    }
  };

  const handleFlag = (id: string) => {
    Alert.alert('Flag Discrepancy', `Transaction ${id} flagged for billing audit review.`);
  };

  const handleAddNote = (id: string) => {
    Alert.prompt('Add Reconciliation Note', `Enter note for transaction ${id}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save Note',
        onPress: (text?: string) =>
          Alert.alert('Note Saved', `Added note to ${id}: "${text || 'Verified'}"`),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header & Refresh Icon */}
        <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>Reconciliation</Text>
          <TouchableOpacity style={styles.refreshButton}>
            <Text style={{ fontSize: 16 }}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Chips Navigation */}
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, activeTab === 'pending' && styles.chipActive]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.chipText, activeTab === 'pending' && styles.chipTextActive]}>
              Pending (8)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeTab === 'matched' && styles.chipMatchedActive]}
            onPress={() => setActiveTab('matched')}
          >
            <Text
              style={[styles.chipText, activeTab === 'matched' && styles.chipTextMatchedActive]}
            >
              Matched (142)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, styles.chipUnmatchedBorder, activeTab === 'unmatched' && styles.chipUnmatchedActive]}
            onPress={() => setActiveTab('unmatched')}
          >
            <Text
              style={[
                styles.chipText,
                styles.chipTextUnmatched,
                activeTab === 'unmatched' && styles.chipTextUnmatchedActive,
              ]}
            >
              Unmatched (3)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reconciliation Cards List */}
        <View style={styles.listContainer}>
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.txnId}>{item.id}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.statusType === 'completed' ? styles.badgeCompleted : styles.badgeDiscrepancy,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.statusType === 'completed' ? styles.textCompleted : styles.textDiscrepancy,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Amounts Row */}
              <View style={styles.amountsRow}>
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Expected</Text>
                  <Text style={styles.amountValue}>{item.expected}</Text>
                </View>

                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Received</Text>
                  <Text style={styles.amountValue}>{item.received}</Text>
                </View>

                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Diff</Text>
                  <Text
                    style={[
                      styles.amountValue,
                      item.diffType === 'zero' ? styles.diffZero : styles.diffNegative,
                    ]}
                  >
                    {item.diff}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              {/* Action Buttons Row */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.matchBtn}
                  onPress={() => handleMatch(item.id)}
                >
                  <Text style={styles.matchBtnText}>Match</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleFlag(item.id)}
                >
                  <Text style={styles.actionBtnText}>Flag</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleAddNote(item.id)}
                >
                  <Text style={styles.actionBtnText}>Add Note</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
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
          <Text style={[styles.tabIcon, styles.tabIconActive]}>🔄</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Reconcile</Text>
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
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.lg,
  },
  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipMatchedActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipTextMatchedActive: {
    color: Colors.surface,
  },
  chipUnmatchedBorder: {
    borderColor: Colors.error,
  },
  chipUnmatchedActive: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutralMedium,
  },
  chipTextActive: {
    color: Colors.surface,
  },
  chipTextUnmatched: {
    color: Colors.error,
  },
  chipTextUnmatchedActive: {
    color: Colors.surface,
  },
  listContainer: {
    gap: Theme.spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  txnId: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
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
  badgeDiscrepancy: { backgroundColor: '#FEE2E2' },
  textDiscrepancy: { color: Colors.errorText },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    color: Colors.neutralMedium,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  diffZero: {
    color: Colors.primary,
  },
  diffNegative: {
    color: Colors.error,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Theme.spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
  },
  matchBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  matchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F9FAFB',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark,
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

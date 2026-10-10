import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';
import StaffBottomTabBar from '../src/components/StaffBottomTabBar';

export interface ActivityItem {
  id: string;
  referenceNo?: string;
  milestoneTitle?: string;
  contractId?: string;
  time?: string;
  timestamp?: string;
  amount: number | string;
  status: string;
  type?: string;
}

export interface DashboardMetrics {
  currentEscrowHoldBalance: number;
  totalProcessed: number;
  pendingHoldCount: number;
  failedPaymentsCount: number;
  refunds30dCount: number;
  recentActivity: ActivityItem[];
}

export default function StaffDashboardScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<ActivityItem | null>(null);
  const [showTxnModal, setShowTxnModal] = useState(false);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    currentEscrowHoldBalance: 0,
    totalProcessed: 0,
    pendingHoldCount: 0,
    failedPaymentsCount: 0,
    refunds30dCount: 0,
    recentActivity: [],
  });

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/transactions/metrics');
      if (response.data) {
        setMetrics({
          currentEscrowHoldBalance: response.data.currentEscrowHoldBalance ?? 0,
          totalProcessed: response.data.totalProcessed ?? 0,
          pendingHoldCount: response.data.pendingHoldCount ?? 0,
          failedPaymentsCount: response.data.failedPaymentsCount ?? 0,
          refunds30dCount: response.data.refunds30dCount ?? 0,
          recentActivity: response.data.recentActivity || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspectActivityItem = (item: ActivityItem) => {
    setSelectedTxn(item);
    setShowTxnModal(true);
  };

  const formatCurrency = (val: number | string) => {
    if (typeof val === 'number') {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return val.startsWith('$') ? val : `$${val}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Title & Refresh */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.systemRoleText}>System Role: Payment Staff</Text>
            <Text style={styles.headerTitle}>Payment Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchDashboardMetrics} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={{ fontSize: 16 }}>🔄</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Current Escrow Hold Balance Shield Card */}
        <TouchableOpacity
          style={styles.escrowCard}
          onPress={() => router.push('/staff-reconcile')}
          activeOpacity={0.85}
        >
          <View style={styles.shieldIconBox}>
            <Text style={{ fontSize: 18 }}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.escrowLabel}>Current Escrow Hold Balance</Text>
            <Text style={styles.escrowValue}>{formatCurrency(metrics.currentEscrowHoldBalance)}</Text>
          </View>
          <Text style={styles.arrowIcon}>›</Text>
        </TouchableOpacity>

        {/* 2x2 Stats Grid */}
        <View style={styles.gridRow}>
          {/* Card 1: Total Processed */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push({ pathname: '/staff-transactions', params: { filter: 'completed' } })}
            activeOpacity={0.85}
          >
            <Text style={styles.statLabel}>Total Processed</Text>
            <Text style={styles.statValue}>
              ${typeof metrics.totalProcessed === 'number' ? metrics.totalProcessed.toLocaleString() : metrics.totalProcessed}
            </Text>
            <Text style={styles.cardSubText}>Click to view completed ›</Text>
          </TouchableOpacity>

          {/* Card 2: Pending Hold */}
          <TouchableOpacity
            style={[styles.statCard, styles.statCardYellow]}
            onPress={() => router.push({ pathname: '/staff-transactions', params: { filter: 'pending' } })}
            activeOpacity={0.85}
          >
            <Text style={styles.statLabel}>Pending Hold</Text>
            <Text style={[styles.statValue, { color: Colors.warningText }]}>
              {metrics.pendingHoldCount} items
            </Text>
            <Text style={styles.cardSubText}>Click to filter pending ›</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.gridRow, { marginTop: Theme.spacing.md }]}>
          {/* Card 3: Failed Payments */}
          <TouchableOpacity
            style={[styles.statCard, styles.statCardRed]}
            onPress={() => router.push({ pathname: '/staff-transactions', params: { filter: 'failed' } })}
            activeOpacity={0.85}
          >
            <View style={styles.alertBadgeRow}>
              <Text style={styles.statLabel}>Failed Payments</Text>
              <View style={styles.redDot} />
            </View>
            <Text style={[styles.statValue, { color: Colors.error }]}>
              {metrics.failedPaymentsCount} alerts
            </Text>
            <Text style={styles.cardSubText}>Click to filter failed ›</Text>
          </TouchableOpacity>

          {/* Card 4: Refunds (30d) */}
          <TouchableOpacity
            style={[styles.statCard, styles.statCardBlue]}
            onPress={() => router.push({ pathname: '/staff-transactions', params: { filter: 'refunded' } })}
            activeOpacity={0.85}
          >
            <Text style={styles.statLabel}>Refunds (30d)</Text>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>
              {metrics.refunds30dCount} processed
            </Text>
            <Text style={styles.cardSubText}>Click to filter refunds ›</Text>
          </TouchableOpacity>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Gateway Activity</Text>
          <TouchableOpacity onPress={() => router.push('/staff-transactions')}>
            <Text style={styles.viewAllText}>View All ›</Text>
          </TouchableOpacity>
        </View>

        {/* Gateway Activity List */}
        <View style={styles.activityList}>
          {metrics.recentActivity.map((item) => {
            const statusUpper = (item.status || 'COMPLETED').toUpperCase();
            const isCompleted = statusUpper === 'COMPLETED';
            const isPending = statusUpper === 'PENDING';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.activityCard}
                onPress={() => handleInspectActivityItem(item)}
                activeOpacity={0.85}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.iconCircle}>
                    <Text style={{ fontSize: 14 }}>💳</Text>
                  </View>
                  <View>
                    <Text style={styles.activityId}>{item.id}</Text>
                    <Text style={styles.activityTime}>{item.milestoneTitle || item.timestamp || item.time || 'Gateway Txn'}</Text>
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <Text style={styles.activityAmount}>{formatCurrency(item.amount)}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isCompleted ? styles.badgeCompleted : isPending ? styles.badgePending : styles.badgeFailed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isCompleted ? styles.textCompleted : isPending ? styles.textPending : styles.textFailed,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Transaction Detail & Audit Inspection Modal */}
      <Modal
        visible={showTxnModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTxnModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Gateway Transaction Detail</Text>
              <TouchableOpacity onPress={() => setShowTxnModal(false)}>
                <Text style={{ fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedTxn && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID:</Text>
                  <Text style={styles.detailValBold}>{selectedTxn.id}</Text>
                </View>
                {selectedTxn.referenceNo && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference No:</Text>
                    <Text style={styles.detailVal}>{selectedTxn.referenceNo}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Title / Description:</Text>
                  <Text style={styles.detailVal}>{selectedTxn.milestoneTitle || 'Payment Settlement'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValAmount}>{formatCurrency(selectedTxn.amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValBold, { color: Colors.primary }]}>{selectedTxn.status}</Text>
                </View>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={styles.inspectFullBtn}
                    onPress={() => {
                      setShowTxnModal(false);
                      router.push({ pathname: '/staff-transactions', params: { id: selectedTxn.id } });
                    }}
                  >
                    <Text style={styles.inspectFullText}>Open in Transactions List ›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Standardized Payment Staff Bottom Tab Bar */}
      <StaffBottomTabBar activeTab="dashboard" />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
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
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
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
  arrowIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryDark,
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
    minHeight: 96,
    justifyContent: 'center',
    ...Theme.shadows.card,
  },
  statCardYellow: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statCardRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  statCardBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  alertBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutralMedium,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 2,
  },
  cardSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.neutralMedium,
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
    flex: 1,
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

  /* Modal Inspection Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  modalBody: {
    gap: Theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.neutralMedium,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 13,
    color: Colors.dark,
  },
  detailValBold: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
  },
  detailValAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  modalActionRow: {
    marginTop: Theme.spacing.md,
  },
  inspectFullBtn: {
    height: 42,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inspectFullText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
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

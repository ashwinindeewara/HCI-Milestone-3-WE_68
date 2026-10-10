import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';

interface ReconciliationItem {
  id: string;
  dbId: number;
  referenceNo: string;
  batchId: string;
  expected: string;
  received: string;
  diff: string;
  diffType: 'zero' | 'negative' | 'positive';
  status: string;
  statusType: 'completed' | 'discrepancy' | 'pending';
  notes?: string;
}

interface CountsSummary {
  pending: number;
  matched: number;
  unmatched: number;
}

export default function StaffReconcileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'matched' | 'unmatched'>('matched');
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [counts, setCounts] = useState<CountsSummary>({ pending: 0, matched: 0, unmatched: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Flag and Add Note
  const [modalMode, setModalMode] = useState<'note' | 'flag' | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [inputText, setInputText] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const formatCurrency = (val: number) => {
    const abs = Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return val < 0 ? `-$${abs}` : `$${abs}`;
  };

  const fetchReconciliationData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Query records filtered by tab status
      const response = await apiClient.get('/reconciliation', {
        params: { status: activeTab },
      });

      // 2. Query summary tab counts
      const countsRes = await apiClient.get('/reconciliation/counts');
      if (countsRes.data) {
        setCounts({
          pending: countsRes.data.pending || 0,
          matched: countsRes.data.matched || 0,
          unmatched: countsRes.data.unmatched || 0,
        });
      }

      const rawData: any[] = response.data || [];
      const formattedItems: ReconciliationItem[] = rawData.map((rec) => {
        const exp = rec.expectedAmount ?? rec.amount ?? 0;
        const recvd = rec.receivedAmount ?? exp;
        const diffVal = rec.difference ?? (recvd - exp);

        let diffType: 'zero' | 'negative' | 'positive' = 'zero';
        if (diffVal < -0.01) diffType = 'negative';
        else if (diffVal > 0.01) diffType = 'positive';

        const stUpper = (rec.status || 'MATCHED').toUpperCase();
        let displayStatus = 'Completed';
        let statusType: 'completed' | 'discrepancy' | 'pending' = 'completed';

        if (stUpper === 'DISCREPANCY' || stUpper === 'UNMATCHED') {
          displayStatus = stUpper === 'DISCREPANCY' ? 'Discrepancy' : 'Unmatched';
          statusType = 'discrepancy';
        } else if (stUpper === 'PENDING' || stUpper === 'IN_REVIEW') {
          displayStatus = 'Pending';
          statusType = 'pending';
        } else {
          displayStatus = 'Completed';
          statusType = 'completed';
        }

        return {
          id: rec.referenceNo || `TXN-${rec.id}`,
          dbId: rec.id,
          referenceNo: rec.referenceNo || `TXN-${rec.id}`,
          batchId: rec.batchId || 'BATCH-202610-A',
          expected: formatCurrency(exp),
          received: formatCurrency(recvd),
          diff: formatCurrency(diffVal),
          diffType,
          status: displayStatus,
          statusType,
          notes: rec.notes || '',
        };
      });

      setItems(formattedItems);
    } catch (error: any) {
      console.warn('Reconciliation fetch warning:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchReconciliationData();
  }, [fetchReconciliationData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReconciliationData();
  };

  const handleMatch = async (item: ReconciliationItem) => {
    try {
      await apiClient.post(`/reconciliation/${item.dbId || item.referenceNo}/match`);
      Alert.alert('Reconciliation Matched', `Transaction ${item.id} marked as fully reconciled in database.`);
      fetchReconciliationData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to match record.';
      Alert.alert('Match Error', msg);
    }
  };

  const openFlagModal = (item: ReconciliationItem) => {
    setSelectedItem(item);
    setInputText('Under-received due to processing fee');
    setModalMode('flag');
  };

  const openNoteModal = (item: ReconciliationItem) => {
    setSelectedItem(item);
    setInputText('');
    setModalMode('note');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedItem(null);
    setInputText('');
    setIsSubmittingAction(false);
  };

  const handleModalSubmit = async () => {
    if (!selectedItem || !modalMode) return;

    setIsSubmittingAction(true);
    try {
      if (modalMode === 'flag') {
        await apiClient.post(`/reconciliation/${selectedItem.dbId || selectedItem.referenceNo}/flag`, {
          reason: inputText.trim() || 'Flagged for billing audit review.',
        });
        Alert.alert('Discrepancy Flagged', `Transaction ${selectedItem.id} flagged for audit review.`);
      } else if (modalMode === 'note') {
        if (!inputText.trim()) {
          Alert.alert('Note Required', 'Please enter a note before saving.');
          setIsSubmittingAction(false);
          return;
        }
        await apiClient.post(`/reconciliation/${selectedItem.dbId || selectedItem.referenceNo}/note`, {
          notes: inputText.trim(),
        });
        Alert.alert('Note Saved', `Saved note to database for ${selectedItem.id}`);
      }
      closeModal();
      fetchReconciliationData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Action failed. Please try again.';
      Alert.alert('Action Error', msg);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header & Refresh Icon */}
        <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>Reconciliation</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchReconciliationData}>
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
              Pending ({counts.pending})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeTab === 'matched' && styles.chipMatchedActive]}
            onPress={() => setActiveTab('matched')}
          >
            <Text
              style={[styles.chipText, activeTab === 'matched' && styles.chipTextMatchedActive]}
            >
              Matched ({counts.matched})
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
              Unmatched ({counts.unmatched})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching database records...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No {activeTab} records</Text>
            <Text style={styles.emptySub}>No reconciliation items found for this status.</Text>
          </View>
        ) : (
          /* Reconciliation Cards List */
          <View style={styles.listContainer}>
            {items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.txnId}>{item.id}</Text>
                    <Text style={styles.batchSub}>Batch: {item.batchId}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      item.statusType === 'completed'
                        ? styles.badgeCompleted
                        : item.statusType === 'pending'
                        ? styles.badgePending
                        : styles.badgeDiscrepancy,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.statusType === 'completed'
                          ? styles.textCompleted
                          : item.statusType === 'pending'
                          ? styles.textPending
                          : styles.textDiscrepancy,
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

                {/* Notes if present */}
                {!!item.notes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>📝 {item.notes}</Text>
                  </View>
                )}

                <View style={styles.cardDivider} />

                {/* Action Buttons Row */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.matchBtn}
                    onPress={() => handleMatch(item)}
                  >
                    <Text style={styles.matchBtnText}>Match</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openFlagModal(item)}
                  >
                    <Text style={styles.actionBtnText}>Flag</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openNoteModal(item)}
                  >
                    <Text style={styles.actionBtnText}>Add Note</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Cross-Platform Action Input Modal */}
      <Modal
        visible={modalMode !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalMode === 'flag' ? 'Flag Discrepancy' : 'Add Reconciliation Note'}
            </Text>
            <Text style={styles.modalSub}>
              {selectedItem ? `Transaction ${selectedItem.id}` : ''}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder={
                modalMode === 'flag'
                  ? 'Enter audit reason...'
                  : 'Enter note details...'
              }
              placeholderTextColor={Colors.neutralLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={closeModal}
                disabled={isSubmittingAction}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  modalMode === 'flag' && styles.modalFlagBtn,
                  isSubmittingAction && styles.btnDisabled,
                ]}
                onPress={handleModalSubmit}
                disabled={isSubmittingAction}
              >
                {isSubmittingAction ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    {modalMode === 'flag' ? 'Flag Record' : 'Save Note'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.neutralMedium,
  },
  emptyBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.neutralMedium,
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
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  txnId: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  batchSub: {
    fontSize: 11,
    color: Colors.neutralMedium,
    marginTop: 1,
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
  textPending: { color: '#B45309' },
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
  notesBox: {
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 4,
    marginTop: 6,
  },
  notesText: {
    fontSize: 11,
    color: Colors.neutralDark,
    fontStyle: 'italic',
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
  btnDisabled: {
    opacity: 0.6,
  },
  // Modal Overlay Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 2,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.neutralMedium,
    marginBottom: Theme.spacing.md,
  },
  modalInput: {
    minHeight: 80,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: 14,
    color: Colors.dark,
    textAlignVertical: 'top',
    marginBottom: Theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Theme.spacing.sm,
  },
  modalCancelBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutralMedium,
  },
  modalSubmitBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  modalFlagBtn: {
    backgroundColor: Colors.error,
  },
  modalSubmitText: {
    fontSize: 14,
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



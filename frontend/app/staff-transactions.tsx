import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';
import StaffBottomTabBar from '../src/components/StaffBottomTabBar';

export interface StaffTxn {
  id: string;
  referenceNo?: string;
  project?: string;
  milestoneTitle?: string;
  client?: string;
  freelancer?: string;
  date?: string;
  timestamp?: string;
  amount: number | string;
  status: string;
  type?: string;
}

export default function StaffTransactionsScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();

  // Read route filter params if navigated from dashboard metric cards
  const initialFilterParam = (searchParams.filter as string)?.toLowerCase() || 'all';
  const initialSearchParam = (searchParams.id as string) || '';

  const [activeFilter, setActiveFilter] = useState<string>(initialFilterParam);
  const [searchQuery, setSearchQuery] = useState(initialSearchParam);
  const [transactions, setTransactions] = useState<StaffTxn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<StaffTxn | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [activeFilter]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const statusQuery = activeFilter !== 'all' ? activeFilter.toUpperCase() : null;
      const response = await apiClient.get('/transactions', {
        params: statusQuery ? { status: statusQuery } : {},
      });

      if (response.data && Array.isArray(response.data)) {
        const mapped = response.data.map((t: any) => ({
          id: t.id,
          referenceNo: t.referenceNo || ('FTX-' + Math.floor(10000 + Math.random() * 90000)),
          project: t.milestoneTitle || 'Milestone Deliverable',
          client: t.contractId ? `Contract ${t.contractId}` : 'Escrow Gateway',
          freelancer: t.milestoneId ? `Milestone ${t.milestoneId}` : 'Settlement Account',
          date: t.timestamp || 'Today',
          amount: typeof t.amount === 'number' ? `$${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : t.amount,
          status: t.status || 'Completed',
          type: t.type || 'FUND',
        }));
        setTransactions(mapped);
      }
    } catch {
      // Fallback default list if API offline
      setTransactions([
        {
          id: 'TXN-2847',
          referenceNo: 'FTX-90124',
          project: 'E-Commerce Redesign',
          client: 'TechVentures Inc.',
          freelancer: 'Chathuni Imalsha',
          date: 'Oct 14, 2024',
          amount: '$3,150',
          status: 'Completed',
        },
        {
          id: 'TXN-2846',
          referenceNo: 'FTX-90125',
          project: 'API Integration',
          client: 'Global Retail Corp',
          freelancer: 'Amaya Perera',
          date: 'Oct 14, 2024',
          amount: '$1,200',
          status: 'Pending',
        },
        {
          id: 'TXN-2845',
          referenceNo: 'FTX-90126',
          project: 'Illustrations',
          client: 'Acme SaaS',
          freelancer: 'Vihaga Edirisinghe',
          date: 'Oct 13, 2024',
          amount: '$4,800',
          status: 'Completed',
        },
        {
          id: 'TXN-2844',
          referenceNo: 'FTX-90127',
          project: 'React Landing Page',
          client: 'Lumina Tech',
          freelancer: 'Ruwan Sadeepa',
          date: 'Oct 11, 2024',
          amount: '$950',
          status: 'Failed',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTxns = transactions.filter((t) => {
    const statusUpper = (t.status || '').toUpperCase();
    const filterUpper = activeFilter.toUpperCase();

    const matchesFilter =
      activeFilter === 'all' ||
      (filterUpper === 'PENDING' && statusUpper === 'PENDING') ||
      (filterUpper === 'FAILED' && statusUpper === 'FAILED') ||
      (filterUpper === 'COMPLETED' && statusUpper === 'COMPLETED') ||
      (filterUpper === 'REFUNDED' && (statusUpper === 'REFUNDED' || statusUpper === 'REFUND'));

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      (t.referenceNo && t.referenceNo.toLowerCase().includes(q)) ||
      (t.project && t.project.toLowerCase().includes(q)) ||
      (t.client && t.client.toLowerCase().includes(q)) ||
      (t.freelancer && t.freelancer.toLowerCase().includes(q));

    return matchesFilter && matchesSearch;
  });

  const handleInspectTxn = (txn: StaffTxn) => {
    setSelectedTxn(txn);
    setShowDetailModal(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Title & Refresh */}
        <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <TouchableOpacity style={styles.filterIconButton} onPress={fetchTransactions}>
            {isLoading ? <ActivityIndicator size="small" color={Colors.primary} /> : <Text style={{ fontSize: 16 }}>🎛️</Text>}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Txn ID, Client, Reference No..."
            placeholderTextColor={Colors.neutralLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ fontSize: 14, color: Colors.neutralMedium }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, activeFilter === 'all' && styles.chipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.chipText, activeFilter === 'all' && styles.chipTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'pending' && styles.chipActive]}
            onPress={() => setActiveFilter('pending')}
          >
            <Text style={[styles.chipText, activeFilter === 'pending' && styles.chipTextActive]}>
              Pending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'completed' && styles.chipActive]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[styles.chipText, activeFilter === 'completed' && styles.chipTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'failed' && styles.chipActive]}
            onPress={() => setActiveFilter('failed')}
          >
            <Text style={[styles.chipText, activeFilter === 'failed' && styles.chipTextActive]}>
              Failed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'refunded' && styles.chipActive]}
            onPress={() => setActiveFilter('refunded')}
          >
            <Text style={[styles.chipText, activeFilter === 'refunded' && styles.chipTextActive]}>
              Refunds
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Cards List */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Fetching database transactions...</Text>
            </View>
          ) : filteredTxns.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>💳</Text>
              <Text style={styles.emptyTitle}>No Matching Transactions</Text>
              <Text style={styles.emptySub}>No transactions match status '{activeFilter}'.</Text>
            </View>
          ) : (
            filteredTxns.map((item) => {
              const statusUpper = (item.status || 'COMPLETED').toUpperCase();
              const isCompleted = statusUpper === 'COMPLETED';
              const isPending = statusUpper === 'PENDING';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => handleInspectTxn(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.txnIdRow}>
                      <Text style={{ fontSize: 14, marginRight: 6 }}>💳</Text>
                      <Text style={styles.txnId}>{item.id}</Text>
                    </View>

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

                  <Text style={styles.projectTitle}>{item.project || 'Escrow Milestone Settlement'}</Text>
                  <Text style={styles.partiesText}>
                    {item.client || 'Client'} → {item.freelancer || 'Freelancer'}
                  </Text>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>{item.date || 'Today'}</Text>
                    <Text style={styles.amountText}>{item.amount}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Detail Inspection Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeaderTitle}>Transaction Inspection</Text>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Text style={{ fontSize: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedTxn && (
                <View style={styles.modalBody}>
                  <View style={styles.receiptHeader}>
                    <Text style={styles.receiptTitle}>{selectedTxn.id}</Text>
                    <Text style={styles.receiptRef}>Ref: {selectedTxn.referenceNo || 'FTX-90124'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Settlement Amount:</Text>
                    <Text style={styles.detailAmount}>{selectedTxn.amount}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction Status:</Text>
                    <Text style={styles.detailStatus}>{selectedTxn.status}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Project Deliverable:</Text>
                    <Text style={styles.detailText}>{selectedTxn.project}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gateway Settlement Date:</Text>
                    <Text style={styles.detailText}>{selectedTxn.date}</Text>
                  </View>

                  <View style={styles.modalActionButtons}>
                    <TouchableOpacity
                      style={styles.modalBtnPrimary}
                      onPress={() => setShowDetailModal(false)}
                    >
                      <Text style={styles.modalBtnPrimaryText}>Close Inspection</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Standardized Payment Staff Bottom Tab Bar */}
      <StaffBottomTabBar activeTab="transactions" />
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
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    height: 48,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.dark },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.md,
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
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutralMedium,
  },
  chipTextActive: {
    color: Colors.surface,
  },
  listContainer: {
    gap: Theme.spacing.md,
  },
  loadingBox: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.neutralMedium,
    marginTop: Theme.spacing.sm,
    fontSize: 13,
  },
  emptyBox: {
    backgroundColor: Colors.surface,
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.neutralMedium,
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
    marginBottom: Theme.spacing.xs,
  },
  txnIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txnId: {
    fontSize: 15,
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
  badgePending: { backgroundColor: '#FEF3C7' },
  textPending: { color: Colors.warningText },
  badgeFailed: { backgroundColor: '#FEE2E2' },
  textFailed: { color: Colors.errorText },
  projectTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  partiesText: {
    fontSize: 12,
    color: Colors.neutralMedium,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Theme.spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: Colors.neutralLight,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },

  /* Modal Inspection Styles */
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
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
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  modalBody: {
    gap: Theme.spacing.sm,
  },
  receiptHeader: {
    backgroundColor: Colors.background,
    padding: Theme.spacing.sm + 2,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Theme.spacing.xs,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  receiptRef: {
    fontSize: 12,
    color: Colors.neutralMedium,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutralMedium,
  },
  detailAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  detailStatus: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  detailText: {
    fontSize: 12,
    color: Colors.dark,
  },
  modalActionButtons: {
    marginTop: Theme.spacing.md,
    width: '100%',
  },
  modalBtnPrimary: {
    width: '100%',
    height: 44,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
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

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SkeletonCard from '../src/components/SkeletonCard';
import Colors from '../src/constants/colors';
import AdminTabBar from '../src/components/AdminTabBar';
import AdminToast, { ToastType } from '../src/components/AdminToast';
import apiClient from '../src/services/api';
import { formatAdminDateTime } from '../src/services/dateFormat';
import {
  AdminIcon,
  AdminCard,
  AdminScreenHeader,
  AdminSearchBar,
  AdminButton,
  AdminEmptyState,
  StatusPill,
} from '../src/components/AdminUI';
import AdminModal, {
  AdminField,
  AdminNotice,
  AdminDetailList,
  AdminActionList,
  AdminActionRow,
  AdminSectionTitle,
  AdminTag,
} from '../src/components/AdminModal';
import {
  Tone,
  adminLayout,
  adminRadius,
  adminSpace,
  adminType,
  MUTED_TEXT,
} from '../src/constants/adminTheme';

const ITEMS_PER_PAGE = 10;

export default function AdminTransactionsScreen() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleLimit, setVisibleLimit] = useState(4);

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as ToastType });
  const showToast = (message: string, type: ToastType = 'success') => setToast({ visible: true, message, type });

  // Modal States
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);

  // Refund Form Fields
  const [refundReason, setRefundReason] = useState('Client requested milestone cancellation');
  const [refundNote, setRefundNote] = useState('');

  // Fetch Transactions
  const { data: txnData, isLoading } = useQuery({
    queryKey: ['adminTransactions'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/admin/transactions');
        return {
          platformEscrowValue: response.data.platformEscrowValue || 0,
          trend: response.data.trend || '+100% settled',
          transactions: (response.data.transactions || []).map((t: any) => ({
            ...t,
            id: t.id?.toString(),
            date: t.date || 'Today',
            project: t.project || t.milestoneTitle || 'Milestone Payment',
            client: t.client || 'Client Account',
            freelancer: t.freelancer || 'Freelancer Account',
            amount: typeof t.amount === 'number' ? `$${t.amount.toFixed(2)}` : (t.amount || '$0.00'),
            rawAmount: typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount).replace(/[^0-9.]/g, '')) || 0,
            status: t.status || 'COMPLETED',
            risk: t.risk || 'Risk: Low',
            riskLevel: t.riskLevel || 'low',
          }))
        };
      } catch (error) {
        console.warn('[AdminTransactions] Transactions endpoint connection error:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const platformEscrowValue = txnData?.platformEscrowValue || 0;
  const trend = txnData?.trend || '+100% settled';
  const rawTransactions = txnData?.transactions || [];

  // Flag Transaction Mutation
  const flagMutation = useMutation({
    mutationFn: async (payload: { id: string; newStatus: string; project?: string; amount?: number; client?: string }) => {
      await apiClient.put(`/admin/transactions/${payload.id}/flag`, {
        status: payload.newStatus,
        project: payload.project,
        amount: payload.amount,
        client: payload.client,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      queryClient.invalidateQueries({ queryKey: ['adminDisputes'] });
      setIsDetailModalOpen(false);
      const actionText = variables.newStatus === 'DISPUTED' ? 'flagged for audit' : 'cleared from audit';
      showToast(`Transaction #${variables.id} ${actionText} successfully.`, 'success');
    },
    onError: () => {
      showToast('Failed to update transaction audit flag.', 'error');
    }
  });

  // Refund Mutation
  const refundMutation = useMutation({
    mutationFn: async (payload: { id: string; reason: string; amount?: number; project?: string; client?: string; freelancer?: string }) => {
      const res = await apiClient.post(`/admin/transactions/${payload.id}/refund`, payload);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      queryClient.invalidateQueries({ queryKey: ['adminDisputes'] });

      setIsRefundModalOpen(false);
      setIsDetailModalOpen(false);
      setSelectedTxn(null);
      setRefundNote('');
      setRefundReason('Client requested milestone cancellation');
      showToast(`Escrow transaction #${variables.id} successfully refunded to client.`, 'success');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to process escrow refund.';
      showToast(msg, 'error');
    }
  });

  const handleOpenDetail = (txn: any) => {
    setSelectedTxn(txn);
    setIsDetailModalOpen(true);
  };

  const handleOpenRefund = () => {
    if (!selectedTxn) return;
    if (selectedTxn.status === 'REFUNDED') {
      showToast('This escrow transaction has already been refunded.', 'info');
      return;
    }
    setIsDetailModalOpen(false);
    setIsRefundModalOpen(true);
  };

  const handleRefundSubmit = () => {
    if (!selectedTxn) return;
    const finalReason = refundNote.trim() ? `${refundReason}. Note: ${refundNote.trim()}` : refundReason;
    refundMutation.mutate({
      id: selectedTxn.id,
      reason: finalReason,
      amount: selectedTxn.rawAmount,
      project: selectedTxn.project,
      client: selectedTxn.client,
      freelancer: selectedTxn.freelancer,
    });
  };

  const filteredTransactions = useMemo(() => {
    let result = rawTransactions.filter((t: any) => {
      const matchesSearch =
        t.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Disputed' && (t.status === 'DISPUTED' || t.riskLevel === 'high')) ||
        (activeFilter === 'Completed' && t.status === 'COMPLETED') ||
        (activeFilter === 'Refunded' && t.status === 'REFUNDED');

      return matchesSearch && matchesFilter;
    });

    return result.sort((a: any, b: any) => {
      if (sortField === 'amount') {
        return sortOrder === 'asc' ? a.rawAmount - b.rawAmount : b.rawAmount - a.rawAmount;
      } else {
        return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      }
    });
  }, [rawTransactions, searchQuery, activeFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // CSV EXPORT FUNCTIONALITY
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transaction records available to export.', 'error');
      return;
    }

    const headers = ['Transaction ID', 'Project Title', 'Client', 'Freelancer', 'Amount ($)', 'Status', 'Risk Level', 'Date'];
    const rows = filteredTransactions.map((t: any) => [
      `"${t.id || ''}"`,
      `"${(t.project || '').replace(/"/g, '""')}"`,
      `"${(t.client || '').replace(/"/g, '""')}"`,
      `"${(t.freelancer || '').replace(/"/g, '""')}"`,
      `"${typeof t.rawAmount === 'number' ? t.rawAmount.toFixed(2) : (t.amount || '0.00').replace('$', '')}"`,
      `"${t.status || ''}"`,
      `"${t.risk || ''}"`,
      `"${t.date || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

    if (typeof window !== 'undefined' && window.document) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `financial_escrow_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showToast(`Exported ${filteredTransactions.length} transaction records to CSV.`, 'success');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={adminLayout.content}>
          <AdminScreenHeader
            title="Financial & Escrow Ledger"
            subtitle={`${rawTransactions.length} total escrow transactions`}
            right={<AdminButton label="Export CSV" icon="download-outline" variant="secondary" onPress={handleExportCSV} />}
          />

          {/* Escrow Balance hero */}
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <AdminIcon name="shield-checkmark-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.heroTitle}>Active Platform Escrow Balance</Text>
            </View>
            <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
              ${typeof platformEscrowValue === 'number'
                ? platformEscrowValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : platformEscrowValue}
            </Text>
            <View style={styles.trendTag}>
              <AdminIcon name="trending-up-outline" size={14} color={Colors.primary} />
              <Text style={styles.trendText}>{trend}</Text>
            </View>
          </View>

          <AdminSearchBar
            style={styles.search}
            placeholder="Search transaction ID, project, or party..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
          />

          {/* Filters & Sort Controls */}
          <View style={styles.filterSortRow}>
            <View style={styles.filterChips}>
              {['All', 'Completed', 'Disputed', 'Refunded'].map((filter) => {
                const isSelected = activeFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => {
                      setActiveFilter(filter);
                      setCurrentPage(1);
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{filter}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sortGroup}>
              <Text style={styles.sortLabel}>Sort by</Text>
              <View style={styles.segment}>
                <TouchableOpacity
                  style={[styles.segBtn, sortField === 'date' && styles.segBtnActive]}
                  onPress={() => toggleSort('date')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sortField === 'date' }}
                >
                  <Text style={[styles.segText, sortField === 'date' && styles.segTextActive]}>Date</Text>
                  {sortField === 'date' ? (
                    <AdminIcon name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={13} color={Colors.surface} />
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segBtn, sortField === 'amount' && styles.segBtnActive]}
                  onPress={() => toggleSort('amount')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sortField === 'amount' }}
                >
                  <Text style={[styles.segText, sortField === 'amount' && styles.segTextActive]}>Amount</Text>
                  {sortField === 'amount' ? (
                    <AdminIcon name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={13} color={Colors.surface} />
                  ) : null}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Transactions List */}
          <View style={styles.txnList}>
            {isLoading ? (
              <>
                <SkeletonCard height={110} />
                <SkeletonCard height={110} />
                <SkeletonCard height={110} />
              </>
            ) : filteredTransactions.length === 0 ? (
              <AdminCard>
                <AdminEmptyState
                  icon="card-outline"
                  title="No Transactions Found"
                  message="No financial records matched your search filters."
                />
              </AdminCard>
            ) : (
              filteredTransactions.slice(0, visibleLimit).map((txn: any) => (
                <AdminCard key={txn.id} style={styles.txnCard}>
                  <View style={styles.txnMain}>
                    <Text style={styles.txnProject} numberOfLines={2}>{txn.project}</Text>
                    <Text style={styles.txnParties} numberOfLines={2}>
                      {txn.client} • {txn.freelancer}
                    </Text>
                    <View style={styles.dateRow}>
                      <AdminIcon name="time-outline" size={13} color={MUTED_TEXT} />
                      <Text style={styles.txnDate}>{formatAdminDateTime(txn.date)}</Text>
                    </View>
                  </View>

                  <Text style={styles.txnAmount}>{txn.amount}</Text>

                  <View style={styles.txnMeta}>
                    <StatusPill label={txn.status} tone={statusTone(txn.status)} />
                    <AdminTag label={txn.risk} tone={riskTone(txn.riskLevel)} />
                    <AdminButton
                      label="Inspect"
                      icon="search-outline"
                      size="sm"
                      variant="secondary"
                      onPress={() => handleOpenDetail(txn)}
                    />
                  </View>
                </AdminCard>
              ))
            )}
          </View>

          {/* Load More Pagination Option for > 4 items */}
          {filteredTransactions.length > 4 && (
            <View style={styles.loadMoreContainer}>
              {visibleLimit < filteredTransactions.length ? (
                <AdminButton
                  label={`Load More (+${filteredTransactions.length - visibleLimit} remaining)`}
                  onPress={() => setVisibleLimit((prev) => prev + 4)}
                />
              ) : (
                <AdminButton label="Show Less" variant="secondary" onPress={() => setVisibleLimit(4)} />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* TRANSACTION INSPECT / DETAIL MODAL */}
      <AdminModal
        visible={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Financial Ledger Record"
        subtitle={selectedTxn ? `ID: ${selectedTxn.id}` : undefined}
        icon="receipt-outline"
        footer={<AdminButton label="Close Record" variant="secondary" onPress={() => setIsDetailModalOpen(false)} />}
      >
        {selectedTxn && (
          <>
            <View style={styles.summary}>
              <Text style={styles.summaryProject}>{selectedTxn.project}</Text>
              <Text style={styles.summaryAmount}>{selectedTxn.amount}</Text>
              <StatusPill label={selectedTxn.status} tone={statusTone(selectedTxn.status)} />
            </View>

            <AdminDetailList
              rows={[
                { label: 'Client', value: selectedTxn.client },
                { label: 'Freelancer', value: selectedTxn.freelancer },
                { label: 'Date & Time', value: formatAdminDateTime(selectedTxn.date) },
                {
                  label: 'Status',
                  value: selectedTxn.status,
                  tone: selectedTxn.status === 'REFUNDED' ? 'danger' : 'neutral',
                },
                { label: 'Audit Risk Level', value: selectedTxn.risk, tone: riskTone(selectedTxn.riskLevel) },
              ]}
            />

            <AdminSectionTitle>Actions</AdminSectionTitle>
            <AdminActionList>
              <AdminActionRow
                icon="flag-outline"
                tone="warning"
                label={selectedTxn.status === 'DISPUTED' ? 'Unflag / Clear Audit' : 'Flag Transaction for Audit'}
                onPress={() =>
                  flagMutation.mutate({
                    id: selectedTxn.id,
                    newStatus: selectedTxn.status === 'DISPUTED' ? 'COMPLETED' : 'DISPUTED',
                    project: selectedTxn.project,
                    amount: selectedTxn.rawAmount,
                    client: selectedTxn.client,
                  })
                }
              />
              {selectedTxn.status === 'REFUNDED' ? (
                <AdminActionRow
                  last
                  icon="checkmark-circle-outline"
                  tone="success"
                  label="Escrow Refund Issued & Settled"
                />
              ) : (
                <AdminActionRow
                  last
                  icon="arrow-undo-outline"
                  tone="danger"
                  label="Process Escrow Refund"
                  onPress={handleOpenRefund}
                />
              )}
            </AdminActionList>
          </>
        )}
      </AdminModal>

      {/* REFUND TRANSACTION MODAL */}
      <AdminModal
        visible={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        title="Process Escrow Refund"
        icon="arrow-undo-outline"
        tone="danger"
        footer={
          <>
            <AdminButton label="Cancel" variant="secondary" onPress={() => setIsRefundModalOpen(false)} />
            <AdminButton
              label="Confirm & Issue Refund"
              variant="danger"
              onPress={handleRefundSubmit}
              loading={refundMutation.isPending}
            />
          </>
        }
      >
        {selectedTxn && (
          <>
            <AdminNotice tone="warning">
              Refunding <Text style={styles.noticeStrong}>{selectedTxn.amount}</Text> for milestone:{' '}
              <Text style={styles.noticeStrong}>{selectedTxn.project}</Text>
            </AdminNotice>

            <AdminField
              label="Reason for Refund"
              placeholder="e.g. Milestone cancelled by client"
              value={refundReason}
              onChangeText={setRefundReason}
            />

            <AdminField
              label="Admin Note"
              placeholder="Enter administrative memo or notes..."
              multiline
              value={refundNote}
              onChangeText={setRefundNote}
            />
          </>
        )}
      </AdminModal>

      <AdminTabBar activeTab="transactions" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  contentContainer: {
    padding: adminSpace.lg,
    paddingBottom: adminLayout.bottomClearance,
  },

  hero: {
    backgroundColor: Colors.dark,
    borderRadius: adminRadius.lg,
    padding: adminSpace.xl,
    marginBottom: adminSpace.lg,
    shadowColor: '#101827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: adminSpace.sm },
  heroIcon: {
    width: 34,
    height: 34,
    borderRadius: adminRadius.sm + 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: '#D1D5DB', letterSpacing: 0.2 },
  heroAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.surface,
    letterSpacing: -1,
    marginTop: adminSpace.lg,
    marginBottom: adminSpace.md,
    fontVariant: ['tabular-nums'],
  },
  trendTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: adminRadius.pill,
  },
  trendText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },

  search: { marginBottom: adminSpace.md },
  filterSortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpace.md,
    marginBottom: adminSpace.lg,
  },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: adminRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.neutralMedium },
  chipTextActive: { color: Colors.surface },
  sortGroup: { flexDirection: 'row', alignItems: 'center', gap: adminSpace.sm },
  sortLabel: { ...adminType.label, color: MUTED_TEXT },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: adminRadius.sm + 2,
    padding: 3,
    gap: 2,
  },
  segBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: adminSpace.md,
    borderRadius: adminRadius.sm,
  },
  segBtnActive: { backgroundColor: Colors.dark },
  segText: { fontSize: 12, fontWeight: '700', color: Colors.neutralMedium },
  segTextActive: { color: Colors.surface },

  txnList: { gap: adminSpace.md },
  txnCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: adminSpace.lg,
    rowGap: adminSpace.md,
  },
  txnMain: { flexGrow: 1, flexShrink: 1, flexBasis: 220, minWidth: 200 },
  txnProject: { ...adminType.cardTitle },
  txnParties: { ...adminType.body, marginTop: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  txnDate: { ...adminType.caption },
  txnAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
    minWidth: 110,
  },
  txnMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: adminSpace.sm,
  },

  loadMoreContainer: { marginTop: adminSpace.lg, alignItems: 'center' },

  summary: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: adminRadius.md,
    padding: adminSpace.lg,
    marginBottom: adminSpace.lg,
    gap: adminSpace.sm,
  },
  summaryProject: { ...adminType.cardTitle, fontSize: 16 },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.dark,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  noticeStrong: { fontWeight: '800' },
});

const statusTone = (status: string): Tone => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'REFUNDED':
      return 'danger';
    case 'DISPUTED':
      return 'warning';
    case 'PENDING':
    case 'HELD':
    case 'IN_ESCROW':
      return 'info';
    default:
      return 'neutral';
  }
};

const riskTone = (level: string): Tone =>
  level === 'high' ? 'danger' : level === 'medium' ? 'warning' : level === 'low' ? 'success' : 'neutral';

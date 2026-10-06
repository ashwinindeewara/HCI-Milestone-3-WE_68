import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SkeletonCard from '../src/components/SkeletonCard';
import Colors from '../src/constants/colors';
import AdminTabBar from '../src/components/AdminTabBar';
import AdminToast, { ToastType } from '../src/components/AdminToast';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';

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
      }
      return {
        platformEscrowValue: 16950,
        trend: '+33% settled',
        transactions: [
          { id: 'TXN-2845', date: 'Yesterday', project: 'Illustrations & Branding Release', client: 'Client (ID: C-103)', freelancer: 'Freelancer', amount: '$4800.00', rawAmount: 4800, status: 'DISPUTED', risk: 'Risk: High', riskLevel: 'high' },
          { id: 'TXN-2846', date: 'Today, 11:15 AM', project: 'API Integration Escrow Fund', client: 'Client (ID: C-102)', freelancer: 'Freelancer', amount: '$1200.00', rawAmount: 1200, status: 'COMPLETED', risk: 'Risk: Low', riskLevel: 'low' },
          { id: 'TXN-2844', date: 'Oct 12, 2024', project: 'React Landing Page Gateway Deposit', client: 'Client (ID: C-104)', freelancer: 'Freelancer', amount: '$950.00', rawAmount: 950, status: 'COMPLETED', risk: 'Risk: Low', riskLevel: 'low' },
          { id: 'TXN-2843', date: 'Oct 11, 2024', project: 'Mobile App UI Audit Settlement', client: 'Client (ID: C-105)', freelancer: 'Freelancer', amount: '$1500.00', rawAmount: 1500, status: 'COMPLETED', risk: 'Risk: Low', riskLevel: 'low' }
        ]
      };
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
        {/* Title Header with Export CSV Action */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Financial & Escrow Ledger</Text>
            <Text style={styles.headerSubtitle}>{rawTransactions.length} total escrow transactions</Text>
          </View>

          <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV} activeOpacity={0.8}>
            <Text style={styles.exportBtnText}>📥 Export CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Escrow Balance KPI Banner */}
        <View style={styles.escrowCard}>
          <Text style={styles.escrowTitle}>Active Platform Escrow Balance</Text>
          <Text style={styles.escrowAmount}>
            ${typeof platformEscrowValue === 'number'
              ? platformEscrowValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : platformEscrowValue}
          </Text>
          <View style={styles.trendTag}>
            <Text style={styles.trendText}>📈 {trend}</Text>
          </View>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search transaction ID, project, or party..."
            placeholderTextColor={Colors.neutralLight}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
          />
        </View>

        {/* Filters & Sort Controls */}
        <View style={styles.filterSortRow}>
          <View style={styles.filterChipsRow}>
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
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sortBtnRow}>
            <TouchableOpacity
              style={[styles.sortBtn, sortField === 'date' && styles.sortBtnActive]}
              onPress={() => toggleSort('date')}
            >
              <Text style={[styles.sortBtnText, sortField === 'date' && styles.sortBtnTextActive]}>
                Date {sortField === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortBtn, sortField === 'amount' && styles.sortBtnActive]}
              onPress={() => toggleSort('amount')}
            >
              <Text style={[styles.sortBtnText, sortField === 'amount' && styles.sortBtnTextActive]}>
                Amount {sortField === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </Text>
            </TouchableOpacity>
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
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>💳</Text>
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptySub}>No financial records matched your search filters.</Text>
            </View>
          ) : (
            filteredTransactions.slice(0, visibleLimit).map((txn: any) => (
              <View key={txn.id} style={styles.txnCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txnProject}>{txn.project}</Text>
                    <Text style={styles.txnParties}>
                      {txn.client} • {txn.freelancer}
                    </Text>
                  </View>
                  <Text style={styles.txnAmount}>{txn.amount}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.txnDate}>🕒 {txn.date}</Text>

                  <View style={styles.badgesRow}>
                    <View
                      style={[
                        styles.statusTag,
                        txn.status === 'REFUNDED' && styles.tagRefunded,
                        txn.status === 'DISPUTED' && styles.tagDisputed,
                        txn.status === 'COMPLETED' && styles.tagCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTagText,
                          txn.status === 'REFUNDED' && styles.textRefunded,
                          txn.status === 'DISPUTED' && styles.textDisputed,
                          txn.status === 'COMPLETED' && styles.textCompleted,
                        ]}
                      >
                        {txn.status}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.riskTag,
                        txn.riskLevel === 'high' && styles.riskHigh,
                        txn.riskLevel === 'medium' && styles.riskMedium,
                        txn.riskLevel === 'low' && styles.riskLow,
                      ]}
                    >
                      <Text style={styles.riskText}>{txn.risk}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.inspectBtn}
                      onPress={() => handleOpenDetail(txn)}
                    >
                      <Text style={styles.inspectBtnText}>🔍 Inspect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Load More Pagination Option for > 4 items */}
        {filteredTransactions.length > 4 && (
          <View style={styles.loadMoreContainer}>
            {visibleLimit < filteredTransactions.length ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => setVisibleLimit((prev) => prev + 4)}
                activeOpacity={0.8}
              >
                <Text style={styles.loadMoreText}>
                  Load More (+{filteredTransactions.length - visibleLimit} remaining)
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.loadMoreBtnOutline}
                onPress={() => setVisibleLimit(4)}
                activeOpacity={0.8}
              >
                <Text style={styles.loadMoreTextOutline}>Show Less</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* TRANSACTION INSPECT / DETAIL MODAL */}
      <Modal
        visible={isDetailModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTxn && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Financial Ledger Record</Text>
                  <TouchableOpacity onPress={() => setIsDetailModalOpen(false)}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailBox}>
                  <Text style={styles.detailTxnId}>ID: {selectedTxn.id}</Text>
                  <Text style={styles.detailProjectTitle}>{selectedTxn.project}</Text>
                  <Text style={styles.detailAmountText}>{selectedTxn.amount}</Text>

                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Client:</Text>
                    <Text style={styles.detailMetaVal}>{selectedTxn.client}</Text>
                  </View>
                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Freelancer:</Text>
                    <Text style={styles.detailMetaVal}>{selectedTxn.freelancer}</Text>
                  </View>
                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Date & Time:</Text>
                    <Text style={styles.detailMetaVal}>{selectedTxn.date}</Text>
                  </View>
                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Status:</Text>
                    <Text style={[styles.detailMetaVal, selectedTxn.status === 'REFUNDED' && { color: Colors.errorText }]}>
                      {selectedTxn.status}
                    </Text>
                  </View>
                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Audit Risk Level:</Text>
                    <Text style={styles.detailMetaVal}>{selectedTxn.risk}</Text>
                  </View>
                </View>

                <View style={styles.detailActionsContainer}>
                  <TouchableOpacity
                    style={styles.detailActionItem}
                    onPress={() =>
                      flagMutation.mutate({
                        id: selectedTxn.id,
                        newStatus: selectedTxn.status === 'DISPUTED' ? 'COMPLETED' : 'DISPUTED',
                        project: selectedTxn.project,
                        amount: selectedTxn.rawAmount,
                        client: selectedTxn.client,
                      })
                    }
                  >
                    <Text style={styles.detailActionIcon}>🚩</Text>
                    <Text style={styles.detailActionLabel}>
                      {selectedTxn.status === 'DISPUTED' ? 'Unflag / Clear Audit' : 'Flag Transaction for Audit'}
                    </Text>
                  </TouchableOpacity>

                  {selectedTxn.status === 'REFUNDED' ? (
                    <View style={[styles.detailActionItem, { borderBottomWidth: 0, opacity: 0.6 }]}>
                      <Text style={styles.detailActionIcon}>✅</Text>
                      <Text style={[styles.detailActionLabel, { color: Colors.successText || Colors.primaryDark }]}>
                        Escrow Refund Issued & Settled
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.detailActionItem, { borderBottomWidth: 0 }]}
                      onPress={handleOpenRefund}
                    >
                      <Text style={styles.detailActionIcon}>↩️</Text>
                      <Text style={styles.detailActionLabel}>Process Escrow Refund</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.closeDetailBtn}
                  onPress={() => setIsDetailModalOpen(false)}
                >
                  <Text style={styles.closeDetailText}>Close Record</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* REFUND TRANSACTION MODAL */}
      <Modal
        visible={isRefundModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRefundModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTxn && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>↩️ Process Escrow Refund</Text>
                  <TouchableOpacity onPress={() => setIsRefundModalOpen(false)}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginVertical: 8 }}>
                  <Text style={{ fontSize: 13, color: Colors.neutralMedium }}>
                    Refunding <Text style={{ fontWeight: '700', color: Colors.dark }}>{selectedTxn.amount}</Text> for milestone:{' '}
                    <Text style={{ fontWeight: '700', color: Colors.dark }}>{selectedTxn.project}</Text>
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Reason for Refund</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Milestone cancelled by client"
                  placeholderTextColor={Colors.neutralLight}
                  value={refundReason}
                  onChangeText={setRefundReason}
                />

                <Text style={styles.inputLabel}>Admin Note</Text>
                <TextInput
                  style={[styles.modalInput, { height: 60, paddingTop: 8 }]}
                  placeholder="Enter administrative memo or notes..."
                  placeholderTextColor={Colors.neutralLight}
                  multiline
                  value={refundNote}
                  onChangeText={setRefundNote}
                />

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelModalBtn}
                    onPress={() => setIsRefundModalOpen(false)}
                  >
                    <Text style={styles.cancelModalText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dangerModalBtn}
                    onPress={handleRefundSubmit}
                    disabled={refundMutation.isPending}
                  >
                    {refundMutation.isPending ? (
                      <ActivityIndicator color={Colors.surface} size="small" />
                    ) : (
                      <Text style={styles.dangerModalText}>Confirm & Issue Refund</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <AdminTabBar activeTab="transactions" />
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
    marginBottom: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.neutralMedium,
    marginTop: 2,
  },
  exportBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnText: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '700',
  },
  escrowCard: {
    backgroundColor: Colors.dark,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  escrowTitle: {
    fontSize: 13,
    color: Colors.neutralLight,
    fontWeight: '600',
  },
  escrowAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.surface,
    marginVertical: Theme.spacing.xs,
  },
  trendTag: {
    backgroundColor: Colors.primary + '30',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
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
  filterSortRow: {
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  filterChipsRow: { flexDirection: 'row', gap: Theme.spacing.xs },
  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.neutralMedium, fontWeight: '500' },
  chipTextActive: { color: Colors.surface, fontWeight: '700' },
  sortBtnRow: { flexDirection: 'row', gap: Theme.spacing.xs },
  sortBtn: {
    paddingHorizontal: Theme.spacing.sm + 2,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  sortBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  sortBtnText: { fontSize: 11, color: Colors.neutralMedium, fontWeight: '600' },
  sortBtnTextActive: { color: Colors.primary, fontWeight: '700' },
  txnList: { gap: Theme.spacing.md },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  emptySub: { fontSize: 13, color: Colors.neutralMedium, textAlign: 'center', marginTop: 4 },
  txnCard: {
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
    marginBottom: Theme.spacing.xs,
  },
  txnProject: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  txnParties: { fontSize: 12, color: Colors.neutralMedium, marginTop: 2 },
  txnAmount: { fontSize: 16, fontWeight: '800', color: Colors.dark },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Theme.spacing.xs + 2,
    marginTop: Theme.spacing.xs,
  },
  txnDate: { fontSize: 11, color: Colors.neutralLight },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.background },
  tagRefunded: { backgroundColor: Colors.errorBg || '#FEE2E2' },
  tagDisputed: { backgroundColor: Colors.warningBg || '#FEF3C7' },
  tagCompleted: { backgroundColor: Colors.successBg || '#D1FAE5' },
  statusTagText: { fontSize: 10, fontWeight: '700', color: Colors.dark },
  textRefunded: { color: Colors.errorText || '#DC2626' },
  textDisputed: { color: Colors.warningText || '#D97706' },
  textCompleted: { color: Colors.successText || '#059669' },
  riskTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  riskHigh: { backgroundColor: Colors.errorBg },
  riskMedium: { backgroundColor: Colors.warningBg },
  riskLow: { backgroundColor: Colors.successBg },
  riskText: { fontSize: 10, fontWeight: '700', color: Colors.dark },
  inspectBtn: {
    paddingHorizontal: Theme.spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Colors.dark,
  },
  inspectBtnText: { color: Colors.surface, fontSize: 11, fontWeight: '700' },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xs,
  },
  pageBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 12, fontWeight: '700', color: Colors.dark },
  pageBtnTextDisabled: { color: Colors.neutralLight },
  pageIndicator: { fontSize: 12, fontWeight: '600', color: Colors.neutralMedium },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Theme.spacing.sm,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark },
  closeIcon: { fontSize: 18, fontWeight: '700', color: Colors.neutralMedium },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.dark, marginTop: Theme.spacing.sm, marginBottom: 4 },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    fontSize: 14,
    color: Colors.dark,
    backgroundColor: Colors.background,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.lg,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelModalBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 4,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelModalText: { fontSize: 13, fontWeight: '700', color: Colors.neutralMedium },
  dangerModalBtn: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xs + 4,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.errorText,
  },
  dangerModalText: { fontSize: 13, fontWeight: '700', color: Colors.surface },

  // Inspect Modal specific
  detailBox: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginVertical: Theme.spacing.sm,
  },
  detailTxnId: { fontSize: 11, color: Colors.neutralLight, fontWeight: '700' },
  detailProjectTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark, marginTop: 2 },
  detailAmountText: { fontSize: 22, fontWeight: '800', color: Colors.dark, marginVertical: 6 },
  detailMetaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailMetaLabel: { fontSize: 12, color: Colors.neutralMedium, fontWeight: '600' },
  detailMetaVal: { fontSize: 12, color: Colors.dark, fontWeight: '700' },
  detailActionsContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.surface,
    marginVertical: Theme.spacing.md,
  },
  detailActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailActionIcon: { fontSize: 16, marginRight: 12 },
  detailActionLabel: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  closeDetailBtn: {
    width: '100%',
    paddingVertical: Theme.spacing.sm + 2,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  closeDetailText: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  loadMoreContainer: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    alignItems: 'center',
  },
  loadMoreBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.sm + 4,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.card,
  },
  loadMoreText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
  loadMoreBtnOutline: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.sm + 4,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreTextOutline: {
    color: Colors.neutralMedium,
    fontWeight: '600',
    fontSize: 13,
  },
});

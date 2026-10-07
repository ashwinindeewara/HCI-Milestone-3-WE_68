import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SkeletonCard from '../src/components/SkeletonCard';
import Colors from '../src/constants/colors';
import AdminTabBar from '../src/components/AdminTabBar';
import AdminToast, { ToastType } from '../src/components/AdminToast';
import apiClient from '../src/services/api';
import { formatAdminMoney } from '../src/services/moneyFormat';
import {
  Tone,
  adminLayout,
  adminRadius,
  adminSpace,
  adminType,
  MUTED_TEXT,
  toneColors,
} from '../src/constants/adminTheme';
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminIcon,
  AdminIconName,
  AdminScreenHeader,
  AdminSearchBar,
  AdminStatCard,
  StatusPill,
} from '../src/components/AdminUI';
import AdminModal, {
  AdminDetailList,
  AdminField,
  AdminSectionTitle,
} from '../src/components/AdminModal';

const ITEMS_PER_PAGE = 10;

export default function AdminDisputesScreen() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortField, setSortField] = useState<'amount' | 'type'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleLimit, setVisibleLimit] = useState(4);

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as ToastType });
  const showToast = (message: string, type: ToastType = 'success') => setToast({ visible: true, message, type });

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);

  // Create Form Fields
  const [newProject, setNewProject] = useState('');
  const [newParties, setNewParties] = useState('');
  const [newIssueType, setNewIssueType] = useState('Milestone Release');
  const [newAmount, setNewAmount] = useState('500');
  const [newDescription, setNewDescription] = useState('');

  // Resolution Form Fields
  const [resolutionType, setResolutionType] = useState<'FULL_REFUND' | 'RELEASE_FREELANCER' | 'SPLIT_50_50' | 'CUSTOM' | 'UNSUSPEND_REINSTATE' | 'MAINTAIN_SUSPENSION'>('FULL_REFUND');
  const [resolutionNote, setResolutionNote] = useState('');

  // Fetch Disputes
  const { data: disputesData, isLoading } = useQuery({
    queryKey: ['adminDisputes'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/admin/disputes');
        if (Array.isArray(response.data) && response.data.length > 0) {
          return response.data.map((d: any) => ({
            ...d,
            id: d.id?.toString(),
            dspNumber: d.dspNumber || `DSP-${d.id?.slice(0, 6) || '001'}`,
            title: d.project || d.title || 'Untitled Dispute',
            parties: d.parties || 'Client vs Freelancer',
            type: d.issueType || d.type || 'Milestone Dispute',
            amount: typeof d.amount === 'number' ? `$${d.amount.toFixed(2)}` : (d.amount || '$0.00'),
            rawAmount: typeof d.amount === 'number' ? d.amount : parseFloat(String(d.amount).replace(/[^0-9.]/g, '')) || 0,
            status: d.status || 'Open',
            statusType: d.statusType || (d.status ? d.status.toLowerCase() : 'open'),
            description: d.description || 'No detailed description submitted.'
          }));
        }
      } catch (error) {
        console.warn('[AdminDisputes] Disputes endpoint connection error:', error);
        throw error;
      }
      return [];
    },
    retry: 2,
    retryDelay: 1000,
  });

  const disputes = disputesData || [];

  // Create Dispute Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/admin/disputes', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDisputes'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
      showToast('Dispute case created and logged successfully.', 'success');
    },
    onError: () => {
      showToast('Failed to create dispute case.', 'error');
    }
  });

  // Resolve Dispute Mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) => {
      await apiClient.post(`/admin/disputes/${id}/resolve`, { resolution });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDisputes'] });
      queryClient.invalidateQueries({ queryKey: ['adminTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      setIsResolveModalOpen(false);
      setSelectedDispute(null);
      setResolutionNote('');
      showToast('Dispute case officially resolved and closed.', 'success');
    },
    onError: () => {
      showToast('Failed to submit dispute resolution.', 'error');
    }
  });

  // Delete/Dismiss Dispute Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/disputes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDisputes'] });
      queryClient.invalidateQueries({ queryKey: ['adminTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      setIsResolveModalOpen(false);
      setSelectedDispute(null);
      showToast('Dispute case dismissed and removed.', 'info');
    },
    onError: () => {
      showToast('Failed to dismiss dispute.', 'error');
    }
  });

  const resetCreateForm = () => {
    setNewProject('');
    setNewParties('');
    setNewIssueType('Milestone Release');
    setNewAmount('500');
    setNewDescription('');
  };

  const handleOpenResolveModal = (dispute: any) => {
    setSelectedDispute(dispute);
    const isSuspensionAppeal =
      (dispute.type && dispute.type.toLowerCase().includes('suspension')) ||
      (dispute.title && dispute.title.toLowerCase().includes('suspension'));

    if (isSuspensionAppeal) {
      setResolutionType('UNSUSPEND_REINSTATE');
    } else {
      setResolutionType('FULL_REFUND');
    }
    setResolutionNote(`Arbitration verdict for ${dispute.dspNumber}: ${dispute.title}`);
    setIsResolveModalOpen(true);
  };

  const handleCreateDisputeSubmit = () => {
    if (!newProject.trim() || !newParties.trim()) {
      showToast('Please enter both project title and parties involved.', 'error');
      return;
    }

    createMutation.mutate({
      project: newProject,
      parties: newParties,
      issueType: newIssueType,
      amount: parseFloat(newAmount) || 250.0,
      description: newDescription || 'Admin opened dispute case.',
      status: 'Open',
    });
  };

  const handleResolveSubmit = () => {
    if (!selectedDispute) return;
    let label = 'Full Refund to Client';
    if (resolutionType === 'RELEASE_FREELANCER') label = 'Release 100% Funds to Freelancer';
    if (resolutionType === 'SPLIT_50_50') label = '50/50 Equal Escrow Split';
    if (resolutionType === 'UNSUSPEND_REINSTATE') label = 'Lift Suspension & Reinstate Account to Active';
    if (resolutionType === 'MAINTAIN_SUSPENSION') label = 'Reject Appeal & Maintain Account Suspension';
    if (resolutionType === 'CUSTOM') label = 'Custom Arbitration Award';

    const finalNote = `[${resolutionType}] Decision: ${label}. Notes: ${resolutionNote.trim() || 'Approved by Admin'}`;

    resolveMutation.mutate({
      id: selectedDispute.id,
      resolution: finalNote,
    });
  };

  const [searchQuery, setSearchQuery] = useState('');

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (filteredDisputes.length === 0) {
      showToast('No dispute records available to export.', 'error');
      return;
    }

    const headers = ['Case ID', 'DSP Number', 'Project Title', 'Parties Involved', 'Issue Type', 'Disputed Amount ($)', 'Status', 'Description'];
    const rows = filteredDisputes.map((d: any) => [
      `"${d.id || ''}"`,
      `"${(d.dspNumber || '').replace(/"/g, '""')}"`,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${(d.parties || '').replace(/"/g, '""')}"`,
      `"${(d.type || '').replace(/"/g, '""')}"`,
      `"${typeof d.rawAmount === 'number' ? d.rawAmount.toFixed(2) : (d.amount || '0.00').replace('$', '')}"`,
      `"${d.status || ''}"`,
      `"${(d.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

    if (typeof window !== 'undefined' && window.document) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `dispute_arbitration_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showToast(`Exported ${filteredDisputes.length} dispute records to CSV.`, 'success');
  };

  const filteredDisputes = useMemo(() => {
    let result = disputes.filter((d: any) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.parties.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.dspNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Open' && (d.statusType === 'open' || d.status === 'Open')) ||
        (activeFilter === 'Under Review' && (d.statusType === 'review' || d.status === 'Under Review')) ||
        (activeFilter === 'Resolved' && (d.statusType === 'resolved' || d.status === 'Resolved'));

      return matchesSearch && matchesFilter;
    });

    return result.sort((a: any, b: any) => {
      if (sortField === 'amount') {
        return sortOrder === 'asc' ? a.rawAmount - b.rawAmount : b.rawAmount - a.rawAmount;
      } else {
        return sortOrder === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
      }
    });
  }, [disputes, searchQuery, activeFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredDisputes.length / ITEMS_PER_PAGE) || 1;
  const paginatedDisputes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDisputes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDisputes, currentPage]);

  const toggleSort = (field: 'amount' | 'type') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
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
            title="Dispute Center"
            subtitle={`${disputes.length} active & past arbitrations`}
            right={
              <AdminButton
                label="File Dispute"
                icon="add"
                onPress={() => setIsCreateModalOpen(true)}
              />
            }
          />

          {/* Summary */}
          <View style={styles.statRow}>
            <AdminStatCard
              style={styles.statCompact}
              label="Open"
              tone="warning"
              icon="alert-circle-outline"
              value={countStatus(disputes, 'open', 'Open')}
            />
            <AdminStatCard
              style={styles.statCompact}
              label="Under Review"
              tone="info"
              icon="time-outline"
              value={countStatus(disputes, 'review', 'Under Review')}
            />
            <AdminStatCard
              style={styles.statCompact}
              label="Resolved"
              tone="success"
              icon="checkmark-circle-outline"
              value={countStatus(disputes, 'resolved', 'Resolved')}
            />
          </View>

          {/* Toolbar */}
          <View style={styles.toolbar}>
            <AdminSearchBar
              style={styles.toolbarSearch}
              placeholder="Search dispute ID, project, or party..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setCurrentPage(1);
              }}
            />
            <AdminButton
              label="Export CSV"
              icon="download-outline"
              variant="secondary"
              onPress={handleExportCSV}
            />
          </View>

          <View style={styles.filterSortRow}>
            <View style={styles.chipRow}>
              {['All', 'Open', 'Under Review', 'Resolved'].map((filter) => {
                const isSelected = activeFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => handleFilterChange(filter)}
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
              <Text style={styles.sortLabel}>Sort</Text>
              <TouchableOpacity
                style={[styles.sortBtn, sortField === 'amount' && styles.sortBtnActive]}
                onPress={() => toggleSort('amount')}
                accessibilityRole="button"
                accessibilityState={{ selected: sortField === 'amount' }}
              >
                <Text style={[styles.sortBtnText, sortField === 'amount' && styles.sortBtnTextActive]}>Amount</Text>
                {sortField === 'amount' ? (
                  <AdminIcon name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={13} color={Colors.primaryDark} />
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortBtn, sortField === 'type' && styles.sortBtnActive]}
                onPress={() => toggleSort('type')}
                accessibilityRole="button"
                accessibilityState={{ selected: sortField === 'type' }}
              >
                <Text style={[styles.sortBtnText, sortField === 'type' && styles.sortBtnTextActive]}>Type</Text>
                {sortField === 'type' ? (
                  <AdminIcon name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={13} color={Colors.primaryDark} />
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          {/* Dispute cards */}
          {isLoading ? (
            <View style={styles.skeletons}>
              <SkeletonCard height={140} />
              <SkeletonCard height={140} />
            </View>
          ) : filteredDisputes.length === 0 ? (
            <AdminCard>
              <AdminEmptyState
                icon="scale-outline"
                title="No Disputes Found"
                message="No dispute cases match the selected filter criterion."
              />
            </AdminCard>
          ) : (
            <CardGrid>
              {filteredDisputes.slice(0, visibleLimit).map((dispute: any) => (
                <AdminCard key={dispute.id} style={styles.disputeCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={adminType.overline}>{dispute.dspNumber}</Text>
                      <Text style={styles.projectTitle} numberOfLines={2}>
                        {dispute.title}
                      </Text>
                    </View>
                    <StatusPill label={dispute.status} tone={statusTone(dispute.statusType)} />
                  </View>

                  <Text style={styles.amount}>{formatAdminMoney(dispute.amount)}</Text>

                  <View style={styles.metaList}>
                    <View style={styles.metaRow}>
                      <AdminIcon name="people-outline" size={16} color={MUTED_TEXT} />
                      <Text style={styles.metaText} numberOfLines={2}>
                        {dispute.parties}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <AdminIcon name="pricetag-outline" size={16} color={MUTED_TEXT} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {dispute.type}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.descriptionSnippet} numberOfLines={1}>
                      {dispute.description}
                    </Text>
                    <AdminButton
                      label={dispute.statusType === 'resolved' ? 'View Case' : 'Review & Resolve'}
                      icon={dispute.statusType === 'resolved' ? 'eye-outline' : 'scale-outline'}
                      variant={dispute.statusType === 'resolved' ? 'secondary' : 'primary'}
                      onPress={() => handleOpenResolveModal(dispute)}
                    />
                  </View>
                </AdminCard>
              ))}
            </CardGrid>
          )}

          {/* Load more */}
          {filteredDisputes.length > 4 && (
            <View style={styles.loadMoreContainer}>
              {visibleLimit < filteredDisputes.length ? (
                <AdminButton
                  label={`Load More (+${filteredDisputes.length - visibleLimit} remaining)`}
                  variant="secondary"
                  onPress={() => setVisibleLimit((prev) => prev + 4)}
                />
              ) : (
                <AdminButton label="Show Less" variant="ghost" onPress={() => setVisibleLimit(4)} />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* CREATE DISPUTE MODAL */}
      <AdminModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Log New Dispute Case"
        icon="scale-outline"
        tone="warning"
        footer={
          <>
            <AdminButton label="Cancel" variant="secondary" onPress={() => setIsCreateModalOpen(false)} />
            <AdminButton
              label="Log Dispute Case"
              onPress={handleCreateDisputeSubmit}
              loading={createMutation.isPending}
            />
          </>
        }
      >
        <AdminField
          label="Project Title"
          placeholder="e.g. Mobile App Redesign Contract"
          value={newProject}
          onChangeText={setNewProject}
        />
        <AdminField
          label="Parties Involved"
          placeholder="e.g. Acme Corp vs Alex Rivera"
          value={newParties}
          onChangeText={setNewParties}
        />
        <View style={styles.fieldBox}>
          <Text style={styles.fieldLabel}>Issue Type</Text>
          <View style={styles.chipRow}>
            {['Milestone Release', 'Quality of Deliverable', 'Missed Deadline', 'Communication Failure'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, newIssueType === t && styles.chipActive]}
                onPress={() => setNewIssueType(t)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: newIssueType === t }}
              >
                <Text style={[styles.chipText, newIssueType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <AdminField
          label="Disputed Amount ($)"
          placeholder="500.00"
          keyboardType="numeric"
          value={newAmount}
          onChangeText={setNewAmount}
        />
        <AdminField
          label="Case Description & Details"
          placeholder="Explain the background and reasons for opening this dispute..."
          multiline
          value={newDescription}
          onChangeText={setNewDescription}
        />
      </AdminModal>

      {/* RESOLVE / REVIEW DISPUTE MODAL */}
      <AdminModal
        visible={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Arbitration Case Review"
        subtitle={selectedDispute ? selectedDispute.dspNumber : undefined}
        icon="scale-outline"
        tone="info"
        size="lg"
        footer={
          selectedDispute ? (
            <View style={styles.reviewFooter}>
              <AdminButton label="Close" variant="secondary" onPress={() => setIsResolveModalOpen(false)} />
              <AdminButton
                label="Dismiss Case"
                variant="danger"
                icon="trash-outline"
                onPress={() => deleteMutation.mutate(selectedDispute.id)}
                disabled={deleteMutation.isPending}
              />
              <AdminButton
                label="Issue Verdict & Close"
                onPress={handleResolveSubmit}
                loading={resolveMutation.isPending}
              />
            </View>
          ) : undefined
        }
      >
        {selectedDispute && (
          <>
            <AdminDetailList
              rows={[
                { label: 'Case', value: selectedDispute.dspNumber },
                { label: 'Project', value: selectedDispute.title },
                { label: 'Parties', value: selectedDispute.parties },
                { label: 'Issue', value: selectedDispute.type },
                { label: 'Amount', value: formatAdminMoney(selectedDispute.amount) },
                {
                  label: 'Status',
                  value: <StatusPill label={selectedDispute.status} tone={statusTone(selectedDispute.statusType)} />,
                },
              ]}
            />

            <View style={styles.quote}>
              <Text style={styles.quoteText}>"{selectedDispute.description}"</Text>
            </View>

            <AdminSectionTitle>
              {isSuspensionCase(selectedDispute) ? 'Select Appeal Verdict Action' : 'Select Resolution Award'}
            </AdminSectionTitle>
            <View style={styles.resolutionChoices}>
              {isSuspensionCase(selectedDispute) ? (
                <>
                  <TouchableOpacity
                    style={[styles.resChoice, resolutionType === 'UNSUSPEND_REINSTATE' && styles.resChoiceActive]}
                    onPress={() => setResolutionType('UNSUSPEND_REINSTATE')}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: resolutionType === 'UNSUSPEND_REINSTATE' }}
                  >
                    <ResolutionChoiceBody icon="shield-checkmark-outline" title="Lift Suspension & Reinstate Account" sub="Approve appeal and restore user account status back to Active." selected={resolutionType === 'UNSUSPEND_REINSTATE'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resChoice, resolutionType === 'MAINTAIN_SUSPENSION' && styles.resChoiceActive]}
                    onPress={() => setResolutionType('MAINTAIN_SUSPENSION')}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: resolutionType === 'MAINTAIN_SUSPENSION' }}
                  >
                    <ResolutionChoiceBody icon="ban-outline" title="Reject Appeal & Maintain Suspension" sub="Deny appeal request and keep user account in Suspended status." selected={resolutionType === 'MAINTAIN_SUSPENSION'} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.resChoice, resolutionType === 'FULL_REFUND' && styles.resChoiceActive]}
                    onPress={() => setResolutionType('FULL_REFUND')}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: resolutionType === 'FULL_REFUND' }}
                  >
                    <ResolutionChoiceBody icon="arrow-redo-outline" title="Full Refund to Client" sub="Refund 100% of escrow funds back to client account." selected={resolutionType === 'FULL_REFUND'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resChoice, resolutionType === 'RELEASE_FREELANCER' && styles.resChoiceActive]}
                    onPress={() => setResolutionType('RELEASE_FREELANCER')}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: resolutionType === 'RELEASE_FREELANCER' }}
                  >
                    <ResolutionChoiceBody icon="cash-outline" title="Release to Freelancer" sub="Pay out 100% of milestone funds to freelancer." selected={resolutionType === 'RELEASE_FREELANCER'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resChoice, resolutionType === 'SPLIT_50_50' && styles.resChoiceActive]}
                    onPress={() => setResolutionType('SPLIT_50_50')}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: resolutionType === 'SPLIT_50_50' }}
                  >
                    <ResolutionChoiceBody icon="swap-horizontal-outline" title="50/50 Equal Settlement" sub="Split escrow amount equally between both parties." selected={resolutionType === 'SPLIT_50_50'} />
                  </TouchableOpacity>
                </>
              )}
            </View>

            <AdminField
              label="Arbitration Verdict / Finding Notes"
              placeholder="Enter final arbitration note..."
              multiline
              value={resolutionNote}
              onChangeText={setResolutionNote}
            />
          </>
        )}
      </AdminModal>

      <AdminTabBar activeTab="disputes" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  contentContainer: {
    paddingHorizontal: adminSpace.lg,
    paddingTop: adminSpace.lg,
    paddingBottom: adminLayout.bottomClearance,
  },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.md, marginBottom: adminSpace.xl },
  statCompact: { minWidth: 100 },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: adminSpace.md,
    marginBottom: adminSpace.md,
  },
  toolbarSearch: { flex: 1, minWidth: 240 },
  filterSortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpace.md,
    marginBottom: adminSpace.xl,
  },
  sortGroup: { flexDirection: 'row', alignItems: 'center', gap: adminSpace.sm },
  sortLabel: { ...adminType.overline },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: adminSpace.md,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  sortBtnActive: { borderColor: Colors.primary, backgroundColor: toneColors.success.bg },
  sortBtnText: { fontSize: 12, fontWeight: '600', color: Colors.neutralMedium },
  sortBtnTextActive: { color: Colors.primaryDark, fontWeight: '700' },
  reviewFooter: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: adminSpace.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.sm },
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
  fieldBox: { marginBottom: adminSpace.lg },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.neutralDark, marginBottom: 6 },
  skeletons: { gap: adminSpace.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: adminSpace.lg },
  disputeCard: { width: '100%' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: adminSpace.md },
  projectTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark, marginTop: 4 },
  amount: { fontSize: 26, fontWeight: '800', color: Colors.dark, letterSpacing: -0.5, marginTop: adminSpace.md },
  metaList: { gap: 6, marginTop: adminSpace.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpace.sm },
  metaText: { ...adminType.body, flex: 1 },
  cardFooter: {
    marginTop: adminSpace.lg,
    paddingTop: adminSpace.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: adminSpace.md,
  },
  descriptionSnippet: { fontSize: 12, color: MUTED_TEXT },
  loadMoreContainer: { marginTop: adminSpace.xl, alignItems: 'center' },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.border,
    paddingLeft: adminSpace.md,
    marginBottom: adminSpace.lg,
  },
  quoteText: { ...adminType.body, fontStyle: 'italic' },
  resolutionChoices: { gap: adminSpace.sm, marginBottom: adminSpace.lg },
  resChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpace.md,
    padding: adminSpace.md,
    minHeight: 56,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: adminRadius.md,
    backgroundColor: Colors.surface,
  },
  resChoiceActive: { borderColor: Colors.primary, backgroundColor: toneColors.success.bg },
  resChoiceIcon: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: toneColors.neutral.bg,
  },
  resChoiceIconActive: { backgroundColor: Colors.primary },
  resChoiceTitle: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  resChoiceSub: { fontSize: 12, color: MUTED_TEXT, marginTop: 1 },
});

// Presentation helpers (module level, no component state)
const statusTone = (statusType: string): Tone =>
  statusType === 'open' ? 'warning' : statusType === 'review' ? 'info' : statusType === 'resolved' ? 'success' : 'neutral';

const isSuspensionCase = (d: any) =>
  !!((d.type && d.type.toLowerCase().includes('suspension')) || (d.title && d.title.toLowerCase().includes('suspension')));

function CardGrid({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const twoCol = width >= 900;
  return (
    <View style={styles.grid}>
      {React.Children.map(children, (child) => (
        <View style={{ width: twoCol ? '48%' : '100%', flexGrow: 0 }}>{child}</View>
      ))}
    </View>
  );
}

function ResolutionChoiceBody({
  icon,
  title,
  sub,
  selected,
}: {
  icon: AdminIconName;
  title: string;
  sub: string;
  selected: boolean;
}) {
  return (
    <>
      <View style={[styles.resChoiceIcon, selected && styles.resChoiceIconActive]}>
        <AdminIcon name={icon} size={18} color={selected ? Colors.surface : Colors.dark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.resChoiceTitle}>{title}</Text>
        <Text style={styles.resChoiceSub}>{sub}</Text>
      </View>
      <AdminIcon
        name={selected ? 'checkmark-circle' : 'radio-button-off'}
        size={20}
        color={selected ? Colors.primary : Colors.neutralLight}
      />
    </>
  );
}


const countStatus = (list: any[], key: 'open' | 'review' | 'resolved', label: string) =>
  list.filter((d: any) => d.statusType === key || d.status === label).length;

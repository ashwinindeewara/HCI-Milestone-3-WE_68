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
      }
      return [
        {
          id: 'DSP-401',
          dspNumber: 'DSP-401',
          title: 'Brand Style Guide Final Release',
          parties: 'Akila vs. Vihaga',
          type: 'Copyright',
          amount: '$3100.00',
          rawAmount: 3100.0,
          status: 'Resolved',
          statusType: 'resolved',
          description: 'Disagreement over logo vector rights.'
        },
        {
          id: 'DSP-409',
          dspNumber: 'DSP-409',
          title: 'UI Design Assets Delayed',
          parties: 'Ruwan vs. Chathuni',
          type: 'Delay',
          amount: '$1400.00',
          rawAmount: 1400.0,
          status: 'Under Review',
          statusType: 'review',
          description: 'Delays in submitting UI kit assets.'
        },
        {
          id: 'DSP-408',
          dspNumber: 'DSP-408',
          title: 'E-Commerce Back-end Bugs',
          parties: 'Ruwan vs. Amaya',
          type: 'Quality',
          amount: '$850.00',
          rawAmount: 850.0,
          status: 'Open',
          statusType: 'open',
          description: 'Backend response formatting error.'
        }
      ];
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
        {/* Title & Action Row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Dispute Center</Text>
            <Text style={styles.headerSubtitle}>{disputes.length} active & past arbitrations</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Theme.spacing.xs, alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExportCSV}
              activeOpacity={0.8}
            >
              <Text style={styles.exportBtnText}>📥 Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setIsCreateModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ File Dispute</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search dispute ID, project, or party..."
            placeholderTextColor={Colors.neutralLight}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
          />
        </View>

        {/* Filter Chips & Sort Controls */}
        <View style={styles.filterSortRow}>
          <View style={styles.filterChipsRow}>
            {['All', 'Open', 'Under Review', 'Resolved'].map((filter) => {
              const isSelected = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => handleFilterChange(filter)}
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
              style={[styles.sortBtn, sortField === 'amount' && styles.sortBtnActive]}
              onPress={() => toggleSort('amount')}
            >
              <Text style={[styles.sortBtnText, sortField === 'amount' && styles.sortBtnTextActive]}>
                Amount {sortField === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortBtn, sortField === 'type' && styles.sortBtnActive]}
              onPress={() => toggleSort('type')}
            >
              <Text style={[styles.sortBtnText, sortField === 'type' && styles.sortBtnTextActive]}>
                Type {sortField === 'type' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dispute Cards List */}
        <View style={styles.disputesList}>
          {isLoading ? (
            <>
              <SkeletonCard height={140} />
              <SkeletonCard height={140} />
            </>
          ) : filteredDisputes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>⚖️</Text>
              <Text style={styles.emptyTitle}>No Disputes Found</Text>
              <Text style={styles.emptySub}>No dispute cases match the selected filter criterion.</Text>
            </View>
          ) : (
            filteredDisputes.slice(0, visibleLimit).map((dispute: any) => (
              <View key={dispute.id} style={styles.disputeCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dspNumber}>{dispute.dspNumber}</Text>
                    <Text style={styles.projectTitle}>{dispute.title}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      dispute.statusType === 'open' && styles.badgeOpen,
                      dispute.statusType === 'review' && styles.badgeReview,
                      dispute.statusType === 'resolved' && styles.badgeResolved,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        dispute.statusType === 'open' && styles.textOpen,
                        dispute.statusType === 'review' && styles.textReview,
                        dispute.statusType === 'resolved' && styles.textResolved,
                      ]}
                    >
                      {dispute.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.partiesText}>👥 Parties: {dispute.parties}</Text>
                  <Text style={styles.issueText}>📌 Issue: {dispute.type}</Text>
                  <Text style={styles.amountText}>💰 Disputed Amount: {dispute.amount}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.descriptionSnippet} numberOfLines={1}>
                    {dispute.description}
                  </Text>
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => handleOpenResolveModal(dispute)}
                  >
                    <Text style={styles.reviewBtnText}>
                      {dispute.statusType === 'resolved' ? '🔍 View Case' : '⚖️ Review & Resolve'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Load More Pagination Option for > 4 items */}
        {filteredDisputes.length > 4 && (
          <View style={styles.loadMoreContainer}>
            {visibleLimit < filteredDisputes.length ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => setVisibleLimit((prev) => prev + 4)}
                activeOpacity={0.8}
              >
                <Text style={styles.loadMoreText}>
                  Load More (+{filteredDisputes.length - visibleLimit} remaining)
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

      {/* CREATE DISPUTE MODAL */}
      <Modal
        visible={isCreateModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚖️ Log New Dispute Case</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Project Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Mobile App Redesign Contract"
                placeholderTextColor={Colors.neutralLight}
                value={newProject}
                onChangeText={setNewProject}
              />

              <Text style={styles.inputLabel}>Parties Involved</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Acme Corp vs Alex Rivera"
                placeholderTextColor={Colors.neutralLight}
                value={newParties}
                onChangeText={setNewParties}
              />

              <Text style={styles.inputLabel}>Issue Type</Text>
              <View style={styles.radioGroup}>
                {['Milestone Release', 'Quality of Deliverable', 'Missed Deadline', 'Communication Failure'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.radioItem, newIssueType === t && styles.radioItemActive]}
                    onPress={() => setNewIssueType(t)}
                  >
                    <Text style={[styles.radioText, newIssueType === t && styles.radioTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Disputed Amount ($)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="500.00"
                placeholderTextColor={Colors.neutralLight}
                keyboardType="numeric"
                value={newAmount}
                onChangeText={setNewAmount}
              />

              <Text style={styles.inputLabel}>Case Description & Details</Text>
              <TextInput
                style={[styles.modalInput, { height: 70, paddingTop: 8 }]}
                placeholder="Explain the background and reasons for opening this dispute..."
                placeholderTextColor={Colors.neutralLight}
                multiline
                value={newDescription}
                onChangeText={setNewDescription}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleCreateDisputeSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <Text style={styles.submitModalText}>Log Dispute Case</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* RESOLVE / REVIEW DISPUTE MODAL */}
      <Modal
        visible={isResolveModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsResolveModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDispute && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Arbitration Case Review</Text>
                  <TouchableOpacity onPress={() => setIsResolveModalOpen(false)}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 420 }}>
                  <View style={styles.caseSummaryBox}>
                    <Text style={styles.caseDspNum}>{selectedDispute.dspNumber}</Text>
                    <Text style={styles.caseTitle}>{selectedDispute.title}</Text>
                    <Text style={styles.caseMeta}>👥 {selectedDispute.parties}</Text>
                    <Text style={styles.caseMeta}>💰 Amount: {selectedDispute.amount}</Text>
                    <Text style={styles.caseDesc}>"{selectedDispute.description}"</Text>
                  </View>

                  <Text style={styles.inputLabel}>
                    {((selectedDispute.type && selectedDispute.type.toLowerCase().includes('suspension')) ||
                    (selectedDispute.title && selectedDispute.title.toLowerCase().includes('suspension')))
                      ? 'Select Appeal Verdict Action'
                      : 'Select Resolution Award'}
                  </Text>
                  <View style={styles.resolutionChoicesColumn}>
                    {((selectedDispute.type && selectedDispute.type.toLowerCase().includes('suspension')) ||
                    (selectedDispute.title && selectedDispute.title.toLowerCase().includes('suspension'))) ? (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.resChoiceBox,
                            resolutionType === 'UNSUSPEND_REINSTATE' && styles.resChoiceBoxActive,
                          ]}
                          onPress={() => setResolutionType('UNSUSPEND_REINSTATE')}
                        >
                          <Text style={styles.resChoiceIcon}>🟢</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resChoiceTitle}>Lift Suspension & Reinstate Account</Text>
                            <Text style={styles.resChoiceSub}>Approve appeal and restore user account status back to Active.</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.resChoiceBox,
                            resolutionType === 'MAINTAIN_SUSPENSION' && styles.resChoiceBoxActive,
                          ]}
                          onPress={() => setResolutionType('MAINTAIN_SUSPENSION')}
                        >
                          <Text style={styles.resChoiceIcon}>🚫</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resChoiceTitle}>Reject Appeal & Maintain Suspension</Text>
                            <Text style={styles.resChoiceSub}>Deny appeal request and keep user account in Suspended status.</Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.resChoiceBox,
                            resolutionType === 'FULL_REFUND' && styles.resChoiceBoxActive,
                          ]}
                          onPress={() => setResolutionType('FULL_REFUND')}
                        >
                          <Text style={styles.resChoiceIcon}>💰</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resChoiceTitle}>Full Refund to Client</Text>
                            <Text style={styles.resChoiceSub}>Refund 100% of escrow funds back to client account.</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.resChoiceBox,
                            resolutionType === 'RELEASE_FREELANCER' && styles.resChoiceBoxActive,
                          ]}
                          onPress={() => setResolutionType('RELEASE_FREELANCER')}
                        >
                          <Text style={styles.resChoiceIcon}>💸</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resChoiceTitle}>Release to Freelancer</Text>
                            <Text style={styles.resChoiceSub}>Pay out 100% of milestone funds to freelancer.</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.resChoiceBox,
                            resolutionType === 'SPLIT_50_50' && styles.resChoiceBoxActive,
                          ]}
                          onPress={() => setResolutionType('SPLIT_50_50')}
                        >
                          <Text style={styles.resChoiceIcon}>⚖️</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resChoiceTitle}>50/50 Equal Settlement</Text>
                            <Text style={styles.resChoiceSub}>Split escrow amount equally between both parties.</Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  <Text style={styles.inputLabel}>Arbitration Verdict / Finding Notes</Text>
                  <TextInput
                    style={[styles.modalInput, { height: 60, paddingTop: 8 }]}
                    placeholder="Enter final arbitration note..."
                    placeholderTextColor={Colors.neutralLight}
                    multiline
                    value={resolutionNote}
                    onChangeText={setResolutionNote}
                  />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.dangerModalBtn}
                    onPress={() => deleteMutation.mutate(selectedDispute.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Text style={styles.dangerModalText}>Dismiss Case</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitModalBtn}
                    onPress={handleResolveSubmit}
                    disabled={resolveMutation.isPending}
                  >
                    {resolveMutation.isPending ? (
                      <ActivityIndicator color={Colors.surface} size="small" />
                    ) : (
                      <Text style={styles.submitModalText}>Issue Verdict & Close</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <AdminTabBar activeTab="disputes" />
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
    fontSize: 13,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Theme.spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 4,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.card,
  },
  addBtnText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
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
  disputesList: { gap: Theme.spacing.md },
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
  disputeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dspNumber: { fontSize: 11, color: Colors.neutralLight, fontWeight: '700' },
  projectTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeOpen: { backgroundColor: Colors.warningBg },
  badgeReview: { backgroundColor: Colors.infoBg },
  badgeResolved: { backgroundColor: Colors.successBg },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  textOpen: { color: Colors.warningText },
  textReview: { color: Colors.infoText },
  textResolved: { color: Colors.primaryDark },
  cardDetails: { marginVertical: Theme.spacing.sm, gap: 2 },
  partiesText: { fontSize: 13, color: Colors.neutralMedium, fontWeight: '600' },
  issueText: { fontSize: 13, color: Colors.neutralMedium },
  amountText: { fontSize: 14, fontWeight: '800', color: Colors.dark, marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Theme.spacing.sm,
    marginTop: 4,
  },
  descriptionSnippet: { flex: 1, fontSize: 12, color: Colors.neutralLight, marginRight: Theme.spacing.md },
  reviewBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Colors.dark,
  },
  reviewBtnText: { color: Colors.surface, fontSize: 12, fontWeight: '700' },
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
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  radioItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  radioItemActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radioText: { fontSize: 12, fontWeight: '600', color: Colors.neutralMedium },
  radioTextActive: { color: Colors.surface, fontWeight: '700' },
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
  submitModalBtn: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xs + 4,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.primary,
  },
  submitModalText: { fontSize: 13, fontWeight: '700', color: Colors.surface },
  dangerModalBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 4,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.errorText,
  },
  dangerModalText: { fontSize: 13, fontWeight: '700', color: Colors.surface },

  // Case summary
  caseSummaryBox: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  caseDspNum: { fontSize: 11, color: Colors.neutralLight, fontWeight: '700' },
  caseTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark, marginVertical: 2 },
  caseMeta: { fontSize: 12, color: Colors.neutralMedium, marginTop: 2 },
  caseDesc: { fontSize: 12, fontStyle: 'italic', color: Colors.dark, marginTop: 6 },

  // Resolution choices
  resolutionChoicesColumn: { gap: 8, marginVertical: 6 },
  resChoiceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.surface,
  },
  resChoiceBoxActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  resChoiceIcon: { fontSize: 22, marginRight: 10 },
  resChoiceTitle: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  resChoiceSub: { fontSize: 11, color: Colors.neutralMedium, marginTop: 1 },
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

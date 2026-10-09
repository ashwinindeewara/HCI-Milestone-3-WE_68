import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import apiClient from '../src/services/api';
import { getSavedUserData } from '../src/services/authService';

type Raw = Record<string, any>;
type MilestoneGroup = 'NEEDS_FUNDING' | 'AWAITING_REVIEW' | 'IN_PROGRESS' | 'COMPLETED' | 'OTHER';

type MilestoneItem = {
  id: string;
  contractId: string;
  projectId: string;
  projectTitle: string;
  freelancerName: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  group: MilestoneGroup;
};

const firstText = (...values: unknown[]): string => {
  const value = values.find((item) => item !== null && item !== undefined && String(item).trim() !== '');
  return value === undefined ? '' : String(value).trim();
};

const asNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asList = (value: any): Raw[] => {
  const candidate = value?.content ?? value?.items ?? value?.data ?? value;
  return Array.isArray(candidate) ? candidate : candidate && typeof candidate === 'object' ? [candidate] : [];
};

const normalizeStatus = (value: unknown) =>
  firstText(value, 'PENDING').toUpperCase().replace(/[ -]+/g, '_');

const statusLabel = (value: string) => {
  const status = normalizeStatus(value);
  const labels: Record<string, string> = {
    PENDING: 'Needs funding',
    FUNDED: 'Funded · In progress',
    IN_PROGRESS: 'In progress',
    SUBMITTED: 'Awaiting review',
    PENDING_REVIEW: 'Awaiting review',
    DELIVERED: 'Awaiting review',
    APPROVED: 'Approved',
    RELEASED: 'Funds released',
    COMPLETED: 'Completed',
    CHANGES_REQUESTED: 'Changes requested',
  };
  return labels[status] ?? status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const classify = (value: unknown): MilestoneGroup => {
  const status = normalizeStatus(value);
  if (['SUBMITTED', 'PENDING_REVIEW', 'DELIVERED'].includes(status)) return 'AWAITING_REVIEW';
  if (['FUNDED', 'IN_PROGRESS', 'ACTIVE', 'CHANGES_REQUESTED'].includes(status)) return 'IN_PROGRESS';
  if (['APPROVED', 'RELEASED', 'COMPLETED'].includes(status)) return 'COMPLETED';
  if (['PENDING', 'UNFUNDED', 'NOT_FUNDED', 'AWAITING_FUNDING'].includes(status)) return 'NEEDS_FUNDING';
  return 'OTHER';
};

const formatMoney = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value: string) => {
  if (!value) return 'Due date not set';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
};

function mapContractMilestones(contract: Raw): MilestoneItem[] {
  const contractId = firstText(contract.id, contract.contractId);
  if (!contractId) return [];
  const projectId = firstText(contract.projectId, contract.project?.id, `PRJ-${contractId}`);
  const milestones = Array.isArray(contract.milestones)
    ? contract.milestones
    : Array.isArray(contract.projectMilestones)
      ? contract.projectMilestones
      : [];

  return milestones.map((milestone: Raw, index: number) => {
    const status = normalizeStatus(milestone.status);
    return {
      id: firstText(milestone.id, milestone.milestoneId, `${contractId}-M${index + 1}`),
      contractId,
      projectId,
      projectTitle: firstText(contract.title, contract.projectTitle, contract.projectName, 'Untitled project'),
      freelancerName: firstText(contract.freelancerName, contract.freelancer?.fullName, contract.freelancer?.name, 'Freelancer not assigned'),
      title: firstText(milestone.title, milestone.name, `Milestone ${index + 1}`),
      description: firstText(milestone.description, milestone.details),
      amount: asNumber(milestone.amount ?? milestone.budget ?? milestone.escrowAmount),
      dueDate: firstText(milestone.dueDate, milestone.deadline, milestone.submissionDeadline),
      status,
      group: classify(status),
    };
  });
}

const FILTERS: { key: string; label: string; group?: MilestoneGroup }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'NEEDS_FUNDING', label: 'Needs funding', group: 'NEEDS_FUNDING' },
  { key: 'AWAITING_REVIEW', label: 'Awaiting review', group: 'AWAITING_REVIEW' },
  { key: 'IN_PROGRESS', label: 'In progress', group: 'IN_PROGRESS' },
  { key: 'COMPLETED', label: 'Completed', group: 'COMPLETED' },
];

export default function ClientMilestonesScreen() {
  const router = useRouter();
  const savedUser = getSavedUserData();
  const clientName = firstText(savedUser?.company, savedUser?.fullName, savedUser?.email);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem | null>(null);

  const loadMilestones = useCallback(async (refresh = false) => {
    if (!clientName) {
      setMilestones([]);
      setErrorMessage('Unable to identify the signed-in client. Please sign in again.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (refresh) setRefreshing(true); else setLoading(true);
    setErrorMessage('');

    try {
      const response = await apiClient.get(
        `/contracts/client/${encodeURIComponent(clientName)}`,
        { timeout: 20000 },
      );
      const contracts = asList(response.data);

      // A contract-list response may omit milestones. Fetch each individual contract
      // only when its list response doesn't contain milestones.
      const detailedContracts = await Promise.all(contracts.map(async (contract: Raw) => {
        const currentMilestones = Array.isArray(contract.milestones) || Array.isArray(contract.projectMilestones);
        const contractId = firstText(contract.id, contract.contractId);
        if (currentMilestones || !contractId) return contract;
        try {
          const detailResponse = await apiClient.get(`/contracts/${encodeURIComponent(contractId)}`, { timeout: 12000 });
          return detailResponse.data?.contract ?? detailResponse.data ?? contract;
        } catch (detailError: any) {
          console.warn('[ClientMilestones] Contract details unavailable:', contractId, detailError?.response?.status ?? detailError?.message);
          return contract;
        }
      }));

      const flattened = detailedContracts.flatMap(mapContractMilestones);
      setMilestones(flattened);
      if (contracts.length > 0 && flattened.length === 0) {
        setErrorMessage('Contracts loaded, but their milestone lists were not included. Check that GET /api/contracts/{id} returns milestones.');
      }
    } catch (error: any) {
      console.error('[ClientMilestones] Could not load milestones:', error);
      console.error('URL:', error?.config?.url, 'Base URL:', error?.config?.baseURL);
      console.error('Status:', error?.response?.status, 'Response:', error?.response?.data);
      setMilestones([]);
      setErrorMessage(
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        'Unable to load milestones. Check the backend connection and try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientName]);

  useFocusEffect(useCallback(() => {
    loadMilestones();
  }, [loadMilestones]));

  const counts = useMemo(() => ({
    all: milestones.length,
    needsFunding: milestones.filter((item) => item.group === 'NEEDS_FUNDING').length,
    awaitingReview: milestones.filter((item) => item.group === 'AWAITING_REVIEW').length,
    inProgress: milestones.filter((item) => item.group === 'IN_PROGRESS').length,
    completed: milestones.filter((item) => item.group === 'COMPLETED').length,
  }), [milestones]);

  const filtered = useMemo(() => {
    const selected = FILTERS.find((item) => item.key === activeFilter);
    const query = search.trim().toLowerCase();
    return milestones.filter((item) => {
      const matchesGroup = !selected?.group || item.group === selected.group;
      const matchesSearch = !query ||
        item.title.toLowerCase().includes(query) ||
        item.projectTitle.toLowerCase().includes(query) ||
        item.freelancerName.toLowerCase().includes(query);
      return matchesGroup && matchesSearch;
    });
  }, [milestones, activeFilter, search]);

  const openAction = (item: MilestoneItem) => {
    const params = {
      contractId: item.contractId,
      projectId: item.projectId,
      milestoneId: item.id,
    };

    if (item.group === 'NEEDS_FUNDING') {
      router.push({ pathname: '/client-fund-milestone', params });
    } else if (item.group === 'AWAITING_REVIEW') {
      router.push({ pathname: '/client-milestone-review', params });
    } else if (item.group === 'IN_PROGRESS') {
      // Match the dispute screen's View Case behavior: show details in a modal.
      setSelectedMilestone(item);
      setDetailModalVisible(true);
    } else {
      router.push({ pathname: '/client-project-details', params });
    }
  };

  const actionLabel = (item: MilestoneItem) => {
    if (item.group === 'NEEDS_FUNDING') return 'Fund Milestone';
    if (item.group === 'AWAITING_REVIEW') return 'Review Deliverables';
    if (item.group === 'IN_PROGRESS') return 'View Milestone';
    if (item.group === 'COMPLETED') return 'View Details';
    return 'View Project';
  };

  const groupColor = (item: MilestoneItem) => {
    if (item.group === 'NEEDS_FUNDING') return { bg: '#FFF4E5', text: '#B54708' };
    if (item.group === 'AWAITING_REVIEW') return { bg: '#FEF3C7', text: '#92400E' };
    if (item.group === 'COMPLETED') return { bg: '#DCFCE7', text: '#15803D' };
    if (item.group === 'IN_PROGRESS') return { bg: '#E0F2FE', text: '#0369A1' };
    return { bg: '#F2F4F7', text: '#475467' };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={21} color="#101828" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Milestones</Text>
          <Text style={styles.headerSubtitle}>Track funding, delivery, and approvals</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={() => loadMilestones(true)} accessibilityRole="button" accessibilityLabel="Refresh milestones">
          <Ionicons name="refresh-outline" size={20} color={Colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadMilestones(true)} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryIcon}><Ionicons name="layers-outline" size={21} color="#15803D" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Milestone overview</Text>
              <Text style={styles.summarySubtitle}>Across your client projects</Text>
            </View>
            <Text style={styles.summaryCount}>{counts.all}</Text>
          </View>
          <View style={styles.summaryGrid}>
            <SummaryMetric label="Needs funding" value={counts.needsFunding} tone="amber" />
            <SummaryMetric label="Needs review" value={counts.awaitingReview} tone="amber" />
            <SummaryMetric label="In progress" value={counts.inProgress} tone="blue" />
            <SummaryMetric label="Completed" value={counts.completed} tone="green" />
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#667085" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search milestones or projects..."
            placeholderTextColor="#98A2B3"
            accessibilityLabel="Search milestones"
          />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={17} color="#98A2B3" /></TouchableOpacity>}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((filter) => {
            const selected = activeFilter === filter.key;
            return (
              <TouchableOpacity key={filter.key} onPress={() => setActiveFilter(filter.key)} style={[styles.filterChip, selected && styles.filterChipActive]} activeOpacity={0.8}>
                <Text style={[styles.filterText, selected && styles.filterTextActive]}>{filter.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.stateText}>Loading your milestones...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIconError}><Ionicons name="alert-circle-outline" size={25} color="#D92D20" /></View>
            <Text style={styles.stateTitle}>Unable to load milestones</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => loadMilestones()}>
              <Text style={styles.primaryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIcon}><Ionicons name="layers-outline" size={25} color="#15803D" /></View>
            <Text style={styles.stateTitle}>{milestones.length === 0 ? 'No milestones yet' : 'No matching milestones'}</Text>
            <Text style={styles.stateText}>{milestones.length === 0 ? 'Milestones created with your projects will appear here.' : 'Try another filter or search term.'}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            <View style={styles.listHeadingRow}>
              <Text style={styles.listHeading}>{activeFilter === 'ALL' ? 'All milestones' : FILTERS.find((item) => item.key === activeFilter)?.label}</Text>
              <Text style={styles.listCount}>{filtered.length} item{filtered.length === 1 ? '' : 's'}</Text>
            </View>
            {filtered.map((item) => {
              const tone = groupColor(item);
              return (
                <View key={`${item.contractId}:${item.id}`} style={styles.milestoneCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.milestoneIcon}><Ionicons name="flag-outline" size={18} color={Colors.primaryDark} /></View>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.milestoneTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.projectName} numberOfLines={2}>{item.projectTitle}</Text>
                    </View>
                    <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
                  </View>

                  <View style={styles.detailLine}>
                    <Ionicons name="person-outline" size={13} color="#667085" />
                    <Text style={styles.detailText} numberOfLines={1}>Freelancer: {item.freelancerName}</Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Ionicons name="calendar-outline" size={13} color="#667085" />
                    <Text style={styles.detailText}>{formatDate(item.dueDate)}</Text>
                  </View>
                  {!!item.description && <Text style={styles.description} numberOfLines={2}>{item.description}</Text>}

                  <View style={styles.cardFooter}>
                    <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.statusPillText, { color: tone.text }]}>{statusLabel(item.status)}</Text>
                    </View>
                    <TouchableOpacity style={styles.actionButton} onPress={() => openAction(item)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`${actionLabel(item)} for ${item.title}`}>
                      <Text style={styles.actionButtonText}>{actionLabel(item)}</Text>
                      <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal
        visible={detailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailsSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalEyebrow}>MILESTONE DETAILS</Text>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {selectedMilestone?.title ?? 'Milestone'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setDetailModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close milestone details"
              >
                <Ionicons name="close" size={20} color="#344054" />
              </TouchableOpacity>
            </View>

            {selectedMilestone ? (
              <>
                <View style={styles.modalStatusPill}>
                  <Text style={styles.modalStatusText}>{statusLabel(selectedMilestone.status)}</Text>
                </View>
                <Text style={styles.modalProjectTitle}>{selectedMilestone.projectTitle}</Text>
                <View style={styles.modalDivider} />
                <MilestoneDetailRow label="Milestone ID" value={selectedMilestone.id} />
                <MilestoneDetailRow label="Contract ID" value={selectedMilestone.contractId} />
                <MilestoneDetailRow label="Freelancer" value={selectedMilestone.freelancerName} />
                <MilestoneDetailRow label="Amount" value={formatMoney(selectedMilestone.amount)} />
                <MilestoneDetailRow label="Due date" value={formatDate(selectedMilestone.dueDate)} />
                <Text style={styles.modalSectionLabel}>Description</Text>
                <Text style={styles.modalDescription}>
                  {selectedMilestone.description || 'No description was provided for this milestone.'}
                </Text>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    const milestone = selectedMilestone;
                    setDetailModalVisible(false);
                    router.push({
                      pathname: '/client-project-details',
                      params: {
                        contractId: milestone.contractId,
                        projectId: milestone.projectId,
                        milestoneId: milestone.id,
                      },
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Open Project Details</Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setDetailModalVisible(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MilestoneDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.modalDetailRow}>
      <Text style={styles.modalDetailLabel}>{label}</Text>
      <Text style={styles.modalDetailValue}>{value || 'Not provided'}</Text>
    </View>
  );
}

function SummaryMetric({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'blue' | 'green' }) {
  const palette = {
    amber: { backgroundColor: '#FFF7ED', color: '#B45309' },
    blue: { backgroundColor: '#EFF8FF', color: '#175CD3' },
    green: { backgroundColor: '#F0FDF4', color: '#15803D' },
  }[tone];
  return (
    <View style={[styles.metricBox, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.metricValue, { color: palette.color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EAECF0', gap: 10 },
  backButton: { width: 34, height: 42, justifyContent: 'center', alignItems: 'flex-start' },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 19, fontWeight: '900', color: '#101828' },
  headerSubtitle: { marginTop: 3, fontSize: 11, color: '#667085' },
  refreshButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#F0FDF4' },
  content: { padding: 15, paddingBottom: 30, maxWidth: 760, width: '100%', alignSelf: 'center' },
  summaryCard: { padding: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 15, marginBottom: 14 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13 },
  summaryIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  summaryTitle: { color: '#101828', fontSize: 14, fontWeight: '900' },
  summarySubtitle: { marginTop: 2, color: '#667085', fontSize: 10 },
  summaryCount: { color: '#15803D', fontSize: 24, fontWeight: '900' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricBox: { flexGrow: 1, flexBasis: '45%', minHeight: 62, justifyContent: 'center', paddingHorizontal: 11, paddingVertical: 9, borderRadius: 10 },
  metricValue: { fontSize: 19, fontWeight: '900' },
  metricLabel: { marginTop: 3, color: '#475467', fontSize: 10, fontWeight: '600' },
  searchBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 10, paddingHorizontal: 11, marginBottom: 12 },
  searchInput: { flex: 1, minHeight: 42, fontSize: 12, color: '#101828', outlineStyle: 'none' as any },
  filters: { gap: 7, paddingBottom: 15 },
  filterChip: { paddingHorizontal: 13, paddingVertical: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 20 },
  filterChipActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  filterText: { color: '#475467', fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },
  list: { gap: 10 },
  listHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 },
  listHeading: { color: '#101828', fontSize: 14, fontWeight: '900' },
  listCount: { color: '#667085', fontSize: 10 },
  milestoneCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 13, padding: 12, shadowColor: '#101828', shadowOpacity: 0.035, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 9 },
  milestoneIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FDF4', borderRadius: 9 },
  cardTitleWrap: { flex: 1 },
  milestoneTitle: { color: '#101828', fontSize: 12, fontWeight: '900', lineHeight: 17 },
  projectName: { marginTop: 2, color: '#667085', fontSize: 10, lineHeight: 14 },
  amount: { color: '#15803D', fontSize: 12, fontWeight: '900' },
  detailLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  detailText: { flex: 1, color: '#667085', fontSize: 10 },
  description: { marginTop: 8, color: '#475467', fontSize: 10, lineHeight: 15 },
  cardFooter: { marginTop: 11, paddingTop: 9, borderTopWidth: 1, borderTopColor: '#F2F4F7', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  statusPillText: { fontSize: 9, fontWeight: '800' },
  actionButton: { minHeight: 34, paddingHorizontal: 11, borderRadius: 8, backgroundColor: '#16A34A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  stateCard: { minHeight: 170, padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 13, gap: 8 },
  stateIcon: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  stateIconError: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#FEF3F2', alignItems: 'center', justifyContent: 'center' },
  stateTitle: { color: '#101828', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  stateText: { color: '#667085', fontSize: 11, lineHeight: 17, textAlign: 'center' },
  primaryButton: { marginTop: 6, minHeight: 38, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18, backgroundColor: 'rgba(16,24,40,0.45)' },
  detailsSheet: { width: '100%', maxWidth: 520, maxHeight: '88%', backgroundColor: '#FFFFFF', borderRadius: 17, padding: 18, shadowColor: '#101828', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  modalEyebrow: { color: '#15803D', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  modalTitle: { marginTop: 4, color: '#101828', fontSize: 18, lineHeight: 24, fontWeight: '900' },
  modalClose: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#F2F4F7' },
  modalStatusPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E0F2FE', marginBottom: 10 },
  modalStatusText: { color: '#0369A1', fontSize: 10, fontWeight: '800' },
  modalProjectTitle: { color: '#344054', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  modalDivider: { height: 1, backgroundColor: '#EAECF0', marginBottom: 5 },
  modalDetailRow: { minHeight: 38, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
  modalDetailLabel: { width: 95, color: '#667085', fontSize: 11 },
  modalDetailValue: { flex: 1, color: '#101828', fontSize: 11, fontWeight: '700', textAlign: 'right' },
  modalSectionLabel: { marginTop: 13, marginBottom: 5, color: '#344054', fontSize: 11, fontWeight: '900' },
  modalDescription: { color: '#475467', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  secondaryButton: { minHeight: 40, marginTop: 8, borderRadius: 8, borderWidth: 1, borderColor: '#D0D5DD', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  secondaryButtonText: { color: '#344054', fontSize: 11, fontWeight: '800' },
});

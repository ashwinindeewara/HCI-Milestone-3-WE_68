import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';
import { getSavedUserData } from '../src/services/authService';

interface ContractViewModel {
  id: string;
  title: string;
  freelancerName: string;
  milestoneTitle: string;
  progress: number;
  escrowTag: string;
  dueDate: string;
  status: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Date not set';
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return value;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

const getContractStatusLabel = (value: unknown): string => {
  const status = String(value ?? '').trim().toUpperCase();
  if (['COMPLETED', 'RELEASED'].includes(status)) return 'Completed';
  if (['REJECTED', 'DECLINED', 'CANCELLED', 'CANCELED'].includes(status)) return 'Rejected';
  if (['DRAFT', 'PENDING', 'SENT', 'OFFERED', 'PENDING_REVIEW'].includes(status)) return 'Pending';
  return status ? 'Active' : 'Pending';
};

const formatMoney = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return `$${amount.toLocaleString()}`;
};

export default function ClientContractsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [contracts, setContracts] = useState<ContractViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadContracts = useCallback(async () => {
    setErrorMessage('');

    try {
      const currentUser = getSavedUserData();
      // Use the same client identifier sent when a contract is created.
      const clientName =
        currentUser?.company?.trim?.() ||
        currentUser?.fullName?.trim?.() ||
        currentUser?.email?.trim?.() ||
        '';

      if (!clientName) {
        setContracts([]);
        setErrorMessage(
          'Could not identify the logged-in client. Please sign in again.'
        );
        return;
      }

      const encodedClientName = encodeURIComponent(clientName);
      console.log(
        `[ClientProjects] Requesting GET /contracts/client/${encodedClientName}`
      );

      const response = await apiClient.get(
        `/contracts/client/${encodedClientName}`,
        { timeout: 20000 }
      );

      console.log('[ClientProjects] Client contracts API response:', response.data);

      const responseData = response.data;
      const candidate =
        responseData?.content ??
        responseData?.items ??
        responseData?.data ??
        responseData;

      // The recommended backend returns List<Contract>. Accept a single
      // Contract object too, so this UI remains compatible with the current API.
      let rawList: any[] = [];
      if (Array.isArray(candidate)) {
        rawList = candidate;
      } else if (
        candidate &&
        typeof candidate === 'object' &&
        (candidate.id || candidate.contractId)
      ) {
        rawList = [candidate];
      }

      const mapped: ContractViewModel[] = rawList
        .filter((item: any) => item && (item.id || item.contractId))
        .map((item: any) => {
          const milestones = Array.isArray(item.milestones) ? item.milestones : [];
          const completedStatuses = ['APPROVED', 'RELEASED', 'COMPLETED'];
          const completedCount = milestones.filter((milestone: any) =>
            completedStatuses.includes(String(milestone?.status ?? '').toUpperCase())
          ).length;

          const currentMilestone = milestones.find((milestone: any) =>
            !completedStatuses.includes(String(milestone?.status ?? '').toUpperCase())
          );
          const lastMilestone = milestones.length
            ? milestones[milestones.length - 1]
            : undefined;
          const milestoneTitle = currentMilestone?.title
            ? String(currentMilestone.title)
            : milestones.length > 0
              ? 'All milestones completed'
              : 'No milestones';

          const explicitProgress =
            item.progress !== null && item.progress !== undefined
              ? Number(item.progress)
              : null;
          let progress = 0;
          if (milestones.length > 0) {
            progress = Math.round((completedCount / milestones.length) * 100);
          } else if (explicitProgress !== null && Number.isFinite(explicitProgress)) {
            progress = Math.max(0, Math.min(100, explicitProgress));
          } else if (getContractStatusLabel(item.status) === 'Completed') {
            progress = 100;
          }

          const escrowAmount = item.inEscrowAmount ?? item.escrowAmount;
          const escrowMoney = formatMoney(escrowAmount);
          const budgetMoney = formatMoney(item.totalBudget ?? item.budget);
          const escrowTag = escrowMoney
            ? `${escrowMoney} In Escrow`
            : budgetMoney
              ? `${budgetMoney} Budget`
              : 'Escrow unavailable';

          const dueDateValue =
            currentMilestone?.dueDate ??
            lastMilestone?.dueDate ??
            item.endDate ??
            item.dueDate ??
            null;

          return {
            id: String(item.id ?? item.contractId),
            title: String(item.title ?? item.projectName ?? 'Untitled project'),
            freelancerName: String(
              item.freelancerName ??
                item.freelancer?.fullName ??
                item.freelancer?.name ??
                'Freelancer not assigned'
            ),
            milestoneTitle,
            progress,
            escrowTag,
            dueDate: `Due ${formatDate(dueDateValue)}`,
            status: getContractStatusLabel(item.status),
          };
        });

      console.log(`[ClientProjects] Loaded ${mapped.length} contract(s) for ${clientName}`);
      setContracts(mapped);
    } catch (error: any) {
      console.error('[ClientProjects] Failed to load client contracts:', error);
      console.error('Request URL:', error?.config?.url);
      console.error('Base URL:', error?.config?.baseURL);
      console.error('HTTP status:', error?.response?.status);
      console.error('Response data:', error?.response?.data);

      setErrorMessage(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          error?.message ??
          'Could not load this client’s projects. Check your connection and try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadContracts();
  };

  const filteredProjects = contracts.filter((p) => {
    const matchesFilter =
      activeFilter === 'All' || p.status.toLowerCase() === activeFilter.toLowerCase();
    const matchesQuery =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.freelancerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header */}
        <Text style={styles.headerTitle}>My Projects</Text>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor={Colors.neutralLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsRow}>
          {['All', 'Active', 'Completed', 'Pending'].map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                  filter === 'Active' && !isSelected && styles.filterChipActiveBg,
                ]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                    filter === 'Active' && !isSelected && styles.filterChipTextGreen,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Project Cards List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading projects...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateTitle}>Unable to load projects</Text>
            <Text style={styles.stateMessage}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadContracts}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateTitle}>
              {contracts.length === 0 ? 'No projects yet' : 'No matching projects'}
            </Text>
            <Text style={styles.stateMessage}>
              {contracts.length === 0
                ? 'Projects returned by the backend will appear here.'
                : 'Try another search term or select a different status filter.'}
            </Text>
          </View>
        ) : (
          <View style={styles.projectList}>
            {filteredProjects.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.projectCard}
                onPress={() =>
                  router.push({
                    pathname: '/client-milestone-review',
                    params: { contractId: item.id },
                  })
                }
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.projectTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.freelancerName} numberOfLines={1}>{item.freelancerName}</Text>
                  </View>

                  <View
                    style={[
                      styles.tagBox,
                      item.status === 'Completed' ? styles.tagCompleted : styles.tagActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        item.status === 'Completed' ? styles.tagTextCompleted : styles.tagTextActive,
                      ]}
                    >
                      {item.escrowTag}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.milestoneText} numberOfLines={1}>
                    Milestone: {item.milestoneTitle}
                  </Text>
                  <Text style={styles.progressPercent}>{item.progress}%</Text>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dueDate}>📅 {item.dueDate}</Text>
                  <Text style={styles.viewDetails}>View Details ›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <View style={styles.clientTabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-dashboard')}>
            <Text style={[styles.tabIcon, styles.tabIconActive]}>🏠</Text>
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-contracts')}>
            <Text style={styles.tabIcon}>📁</Text>
            <Text style={styles.tabLabel}>Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-find-talent')}>
            <Text style={styles.tabIcon}>🔍</Text>
            <Text style={styles.tabLabel}>Find Talent</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-reports')}>
            <Text style={styles.tabIcon}>💳</Text>
            <Text style={styles.tabLabel}>Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-profile')}>
            <Text style={styles.tabIcon}>👤</Text>
            <Text style={styles.tabLabel}>Profile</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: 80,
  },
  loadingContainer: {
    paddingVertical: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.sm,
    color: Colors.neutralMedium,
    fontSize: 13,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: Theme.spacing.md,
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
  },
  filterChipsRow: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Theme.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipActiveBg: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.primaryLight,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.neutralMedium,
  },
  filterChipTextActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  filterChipTextGreen: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  stateContainer: {
    paddingVertical: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateMessage: {
    marginTop: Theme.spacing.sm,
    color: Colors.neutralMedium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Theme.spacing.md,
    minHeight: 42,
    paddingHorizontal: Theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  retryButtonText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  projectList: {
    gap: Theme.spacing.md,
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
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
  projectTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  freelancerName: {
    fontSize: 12,
    color: Colors.neutralMedium,
    marginTop: 2,
  },
  tagBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  tagActive: {
    backgroundColor: '#DCFCE7',
  },
  tagCompleted: {
    backgroundColor: '#E0F2FE',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tagTextActive: {
    color: Colors.primaryDark,
  },
  tagTextCompleted: {
    color: '#0369A1',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 4,
  },
  milestoneText: {
    fontSize: 12,
    color: Colors.neutralMedium,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Theme.spacing.xs + 2,
  },
  dueDate: {
    fontSize: 12,
    color: Colors.neutralLight,
  },
  viewDetails: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  clientTabBar: {
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
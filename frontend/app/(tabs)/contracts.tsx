import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';
import { calculateMilestoneProgress, FreelancerApiService, getCurrentUser } from '../../src/services/api';

interface ProjectDisplayItem {
  id: string;
  contractId: string;
  title: string;
  client: string;
  milestone: string;
  progress: number;
  escrowTag: string;
  dueDate: string;
  status: string;
}

export default function ContractsScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [projects, setProjects] = useState<ProjectDisplayItem[]>(() => {
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    try {
      const activeUser = getCurrentUser();
      const activeName = activeUser?.fullName || '';
      const activeEmail = activeUser?.email || '';
      const res = await FreelancerApiService.getFreelancerProjects(activeName, activeEmail);
      if (res.data && Array.isArray(res.data)) {
        if (res.data.length > 0) {
          const formatted: ProjectDisplayItem[] = await Promise.all(res.data.map(async (p: any) => {
            const contractId = p.contractId || p.id;
            let progress = p.completionPercentage ?? 0;
            try {
              const milestoneResponse = await FreelancerApiService.getContractMilestones(contractId);
              if (Array.isArray(milestoneResponse.data)) {
                progress = calculateMilestoneProgress(milestoneResponse.data);
              }
            } catch {
              // Keep the persisted project value if milestone refresh is unavailable.
            }
            const isCompleted = p.status === 'COMPLETED' || progress >= 100;
            const escrowText = isCompleted
              ? 'Completed & Paid'
              : p.inEscrowAmount
                ? `$${p.inEscrowAmount.toLocaleString()} In Escrow`
                : '$0 In Escrow';

            return {
              id: p.id,
              contractId,
              title: p.title,
              client: p.clientName,
              milestone: p.statusBadge || (isCompleted ? 'Final Delivery' : 'In Progress'),
              progress,
              escrowTag: escrowText,
              dueDate: p.dueDate || 'Due soon',
              status: isCompleted ? 'Completed' : 'Active',
            };
          }));
          setProjects(formatted);
        } else {
          setProjects([]);
        }
      } else {
        setProjects([]);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();

  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const filteredProjects = projects.filter((p) => {
    const matchesFilter =
      activeFilter === 'All' || p.status.toLowerCase() === activeFilter.toLowerCase();
    const matchesQuery =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Top Header Bar with Centered Title & Back Button */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/dashboard');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <Text style={styles.backArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>My Projects</Text>
          <TouchableOpacity
            style={styles.contractsListBtn}
            onPress={() => router.push('/contracts-list')}
            activeOpacity={0.8}
          >
            <Text style={styles.contractsListBtnText}>📄 Contracts</Text>
          </TouchableOpacity>
        </View>

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
          {['All', 'Active', 'Completed'].map((filter) => {
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
        {loading && projects.length === 0 ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.projectList}>
            {filteredProjects.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.projectCard}
                onPress={() => router.push(`/project-details?id=${item.contractId || item.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectTitle}>{item.title}</Text>
                    <Text style={styles.clientName}>{item.client}</Text>
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
                  <Text style={styles.milestoneText}>Status: {item.milestone}</Text>
                  <Text style={styles.progressPercent}>{item.progress}%</Text>
                </View>

                {/* Green Progress Bar */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dueDate}>📅 {item.dueDate}</Text>
                  <Text style={styles.viewDetails}>View Overview ›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: 40,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
    paddingTop: Platform.OS === 'android' ? 6 : 2,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrowText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#0F172A',
    lineHeight: 30,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
  },
  contractsListBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  contractsListBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  searchBar: {
    height: 48,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark,
  },
  filterChipsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#16A34A',
    borderWidth: 1,
    borderColor: '#15803D',
  },
  filterChipActiveBg: {
    backgroundColor: '#DCFCE7',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterChipTextGreen: {
    color: '#15803D',
  },
  projectList: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  clientName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  tagBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tagCompleted: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagTextActive: {
    color: '#15803D',
  },
  tagTextCompleted: {
    color: '#4B5563',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  milestoneText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dueDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
});

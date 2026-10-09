import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import { getSavedUserData } from '../src/services/authService';
import apiClient from '../src/services/api';

interface ProjectCardData {
  id: string;
  title: string;
  freelancerName: string;
  escrowTag: string;
  milestoneTitle: string;
  progress: number;
}

type ActivityTone = 'SUCCESS' | 'WARNING' | 'ERROR';

interface ActivityItemData {
  id: string;
  title: string;
  description: string;
  type: ActivityTone;
  createdAt: string;
  projectTitle: string;
  performedBy: string;
}

const unwrapActivityList = (value: any): any[] => {
  let candidate = value;
  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(candidate)) return candidate;
    if (!candidate || typeof candidate !== 'object') return [];
    candidate = candidate.activities ?? candidate.items ?? candidate.content ?? candidate.data ?? candidate.result;
  }
  return Array.isArray(candidate) ? candidate : [];
};

const toActivityTitle = (rawType: unknown, rawDescription: unknown): string => {
  const type = String(rawType ?? '').toUpperCase();
  const description = String(rawDescription ?? '').toUpperCase();
  const combined = `${type} ${description}`;
  const statusMatch = description.match(/STATUS CHANGED TO\s+([A-Z_]+)/);
  const status = statusMatch?.[1] ?? '';

  if (status === 'FUNDED' || combined.includes('MILESTONE_FUNDED')) return 'Milestone Funded';
  if (['SUBMITTED', 'DELIVERED', 'PENDING_REVIEW'].includes(status) || combined.includes('DELIVERABLE_SUBMITTED')) return 'Deliverable Submitted';
  if (status === 'RELEASED' || combined.includes('PAYMENT_RELEASED')) return 'Payment Released';
  if (['APPROVED', 'COMPLETED'].includes(status)) return 'Milestone Approved';
  if (status === 'CHANGES_REQUESTED' || combined.includes('CHANGES_REQUESTED')) return 'Changes Requested';
  if (status === 'REJECTED' || combined.includes('REJECTED')) return 'Milestone Rejected';
  if (type.includes('FILE_UPLOADED')) return 'File Uploaded';
  if (type.includes('CONTRACT_ACCEPTED')) return 'Contract Accepted';
  if (type.includes('PROJECT_ACTIVATED')) return 'Project Activated';

  const readable = String(rawType ?? 'PROJECT_UPDATE')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return readable || 'Project Updated';
};

const toActivityTone = (rawType: unknown, rawDescription: unknown): ActivityTone => {
  const combined = `${String(rawType ?? '')} ${String(rawDescription ?? '')}`.toUpperCase();
  if (/REJECTED|CHANGES_REQUESTED|FAILED|DISPUTE/.test(combined)) return 'ERROR';
  if (/SUBMITTED|DELIVERED|PENDING_REVIEW|FUNDED/.test(combined)) return 'WARNING';
  return 'SUCCESS';
};

const formatActivityDate = (value: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Fetch activity rows for the contracts returned by the client-scoped contracts API.
 * ProjectService creates project IDs as PRJ-<contract ID>, and ProjectController
 * exposes saved events from GET /projects/{projectId}/activities.
 */
async function fetchRecentClientActivities(contractItems: any[]): Promise<ActivityItemData[]> {
  const groups = await Promise.all(contractItems.map(async (contract: any) => {
    const rawId = String(contract?.id ?? contract?.contractId ?? '').trim();
    if (!rawId) return [] as ActivityItemData[];

    const contractId = rawId.startsWith('PRJ-') ? rawId.slice(4) : rawId;
    const projectId = String(contract?.projectId ?? contract?.project?.id ?? (rawId.startsWith('PRJ-') ? rawId : `PRJ-${contractId}`));
    const projectTitle = String(contract?.title ?? contract?.projectName ?? contract?.project?.title ?? 'Project');

    try {
      const response = await apiClient.get(
        `/projects/${encodeURIComponent(projectId)}/activities`,
        { timeout: 10000 },
      );
      const rawActivities = unwrapActivityList(response.data);

      return rawActivities.map((activity: any, index: number) => {
        const rawType = activity?.type ?? activity?.eventType ?? 'PROJECT_UPDATE';
        const rawDescription = activity?.description ?? activity?.message ?? activity?.details ?? '';
        return {
          id: `${projectId}-${String(activity?.id ?? `${rawType}-${index}`)}`,
          title: toActivityTitle(rawType, rawDescription),
          description: String(rawDescription || 'A project activity was recorded.'),
          type: toActivityTone(rawType, rawDescription),
          createdAt: String(activity?.createdAt ?? activity?.timestamp ?? activity?.eventTime ?? ''),
          projectTitle,
          performedBy: String(activity?.performedBy ?? activity?.actorName ?? activity?.createdBy ?? ''),
        } as ActivityItemData;
      });
    } catch (error: any) {
      // One project having no events must not prevent other project activities from loading.
      console.info(
        `[ClientDashboard] Could not load activities for project ${projectId}:`,
        error?.response?.status ?? error?.message,
      );
      return [] as ActivityItemData[];
    }
  }));

  return groups
    .flat()
    .sort((a, b) => {
      const dateA = Date.parse(a.createdAt);
      const dateB = Date.parse(b.createdAt);
      return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
    })
    .slice(0, 5);
}

export default function ClientDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    activeProjects: 0,
    pendingApprovals: 0,
    pendingPayments: 0,
    upcomingDeadlines: 0,
  });

  // Projects are loaded from the backend for the currently signed-in client.
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [projectsError, setProjectsError] = useState('');

  const [activities, setActivities] = useState<ActivityItemData[]>([]);

  const currentUser = getSavedUserData();

  const getInitials = (fullName?: string) => {
    if (!fullName) return 'CL';
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning,';
    if (hour >= 12 && hour < 17) return 'Good afternoon,';
    if (hour >= 17 && hour < 21) return 'Good evening,';
    return 'Good night,';
  };

  const clientName = String(
    currentUser?.company || currentUser?.fullName || currentUser?.name || currentUser?.email || ''
  ).trim();

  const loadData = useCallback(async () => {
    setProjectsError('');

    try {
      if (!clientName) {
        setProjects([]);
        setActivities([]);
        setMetrics({
          activeProjects: 0,
          pendingApprovals: 0,
          pendingPayments: 0,
          upcomingDeadlines: 0,
        });
        setProjectsError('Your client profile could not be identified. Please sign in again.');
        return;
      }

      // This endpoint must return all contracts belonging to this client.
      // Supports either a List<Contract> response or a single Contract object.
      const requestPath = `/contracts/client/${encodeURIComponent(clientName)}`;
      console.log('[ClientDashboard] Requesting client contracts:', requestPath);

      const response = await apiClient.get(requestPath, { timeout: 15000 });
      console.log('[ClientDashboard] Client contracts response:', response.data);

      const responseData = response.data;
      const candidate =
        responseData?.content ??
        responseData?.items ??
        responseData?.contracts ??
        responseData?.data ??
        responseData;

      const rawContracts: any[] = Array.isArray(candidate)
        ? candidate
        : candidate && typeof candidate === 'object' && (candidate.id || candidate.contractId)
          ? [candidate]
          : [];

      const completedStatuses = ['COMPLETED', 'RELEASED'];
      // Only show projects that have actually been accepted/started.
      // Drafts, pending offers, sent offers, rejected and completed contracts are excluded.
      // ACCEPTED is included because the current signing flow marks a signed contract ACCEPTED
      // and creates/activates its project from that contract.
      const activeStatuses = [
        'ACTIVE',
        'IN_PROGRESS',
        'IN PROGRESS',
        'IN-PROGRESS',
        'ACCEPTED',
      ];

      const clientProjects = rawContracts.filter((contract: any) => {
        const id = contract?.id ?? contract?.contractId;
        const status = String(contract?.status ?? '').trim().toUpperCase();
        return Boolean(id) && activeStatuses.includes(status);
      });

      let pendingApprovalsCount = 0;
      let pendingEscrowTotal = 0;
      let upcomingDeadlinesCount = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mappedProjects: ProjectCardData[] = clientProjects.map((contract: any) => {
        const milestones = Array.isArray(contract.milestones) ? contract.milestones : [];
        const completedCount = milestones.filter((milestone: any) =>
          completedStatuses.includes(String(milestone?.status ?? '').toUpperCase())
        ).length;

        milestones.forEach((milestone: any) => {
          const milestoneStatus = String(milestone?.status ?? '').toUpperCase();
          if (['SUBMITTED', 'PENDING_REVIEW', 'DELIVERED'].includes(milestoneStatus)) {
            pendingApprovalsCount += 1;
          }

          if (milestone?.dueDate && !completedStatuses.includes(milestoneStatus)) {
            const dueDate = new Date(milestone.dueDate);
            if (!Number.isNaN(dueDate.getTime())) {
              dueDate.setHours(0, 0, 0, 0);
              if (dueDate >= today) upcomingDeadlinesCount += 1;
            }
          }
        });

        const progressFromApi = Number(contract.progress);
        const progress = milestones.length > 0
          ? Math.max(0, Math.min(100, Math.round((completedCount / milestones.length) * 100)))
          : Number.isFinite(progressFromApi)
            ? Math.max(0, Math.min(100, progressFromApi))
            : 0;

        const escrowValue = contract.inEscrowAmount ?? contract.escrowAmount;
        const escrowAmount = escrowValue === null || escrowValue === undefined || escrowValue === ''
          ? null
          : Number(escrowValue);
        if (escrowAmount !== null && Number.isFinite(escrowAmount)) {
          pendingEscrowTotal += escrowAmount;
        }

        const budgetValue = contract.totalBudget ?? contract.budget;
        const budgetAmount = budgetValue === null || budgetValue === undefined || budgetValue === ''
          ? null
          : Number(budgetValue);
        const currencyAmount = escrowAmount !== null && Number.isFinite(escrowAmount)
          ? escrowAmount
          : budgetAmount !== null && Number.isFinite(budgetAmount)
            ? budgetAmount
            : null;
        const escrowTag = currencyAmount === null
          ? 'Escrow unavailable'
          : escrowAmount !== null && Number.isFinite(escrowAmount)
            ? `$${currencyAmount.toLocaleString()} Escrowed`
            : `$${currencyAmount.toLocaleString()} Budget`;

        const currentMilestone = milestones.find((milestone: any) =>
          !completedStatuses.includes(String(milestone?.status ?? '').toUpperCase())
        );

        return {
          id: String(contract.id ?? contract.contractId),
          title: String(contract.title ?? contract.projectName ?? 'Untitled project'),
          freelancerName: String(
            contract.freelancerName ??
            contract.freelancer?.fullName ??
            contract.freelancer?.name ??
            'Freelancer not assigned'
          ),
          escrowTag,
          milestoneTitle: String(currentMilestone?.title ?? milestones[0]?.title ?? 'No milestone yet'),
          progress,
        };
      });

      console.log(`[ClientDashboard] Loaded ${mappedProjects.length} project(s) for ${clientName}`);
      setProjects(mappedProjects);
      setMetrics({
        activeProjects: mappedProjects.length,
        pendingApprovals: pendingApprovalsCount,
        pendingPayments: pendingEscrowTotal,
        upcomingDeadlines: upcomingDeadlinesCount,
      });

      // Load only events belonging to this client's contracts. This replaces the
      // previous global/dashboard-metrics feed, which could return demo or unrelated data.
      setActivities([]);
      void fetchRecentClientActivities(rawContracts)
        .then(setActivities)
        .catch((activityError: any) => {
          console.info('[ClientDashboard] Could not load client activity:', activityError);
          setActivities([]);
        });
    } catch (error: any) {
      console.error('[ClientDashboard] Error loading client projects:', error);
      console.error('Request URL:', error?.config?.url);
      console.error('Base URL:', error?.config?.baseURL);
      console.error('HTTP status:', error?.response?.status);
      console.error('Response data:', error?.response?.data);
      setProjects([]);
      setActivities([]);
      setProjectsError(
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        'Could not load your projects. Please try again.'
      );
      setMetrics({
        activeProjects: 0,
        pendingApprovals: 0,
        pendingPayments: 0,
        upcomingDeadlines: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const displayName = currentUser?.fullName || currentUser?.name || currentUser?.company || 'Client';

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Profile Greeting */}
        <View style={styles.headerRow}>
          <View style={styles.userGreetingRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
            <View>
              <Text style={styles.greetingSub}>{getGreeting()}</Text>
              <Text style={styles.userName}>{displayName}</Text>
            </View>
          </View>

          {/* Bell Notification Badge */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push('/client-contracts')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
            <View style={styles.badgeDot}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 2x2 Metric Summary Grid */}
        <View style={styles.gridRow}>
          {/* Card 1: Active Projects (Light Green BG) */}
          <View style={[styles.gridCard, styles.cardLightGreen]}>
            <Text style={styles.cardLabelGreen}>Active Projects</Text>
            <Text style={styles.cardValue}>{metrics.activeProjects.toLocaleString()}</Text>
          </View>

          {/* Card 2: Pending Approvals */}
          <View style={styles.gridCard}>
            <Text style={styles.cardLabel}>Pending Approvals</Text>
            <Text style={styles.cardValue}>{metrics.pendingApprovals}</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          {/* Card 3: Pending Payments */}
          <View style={styles.gridCard}>
            <Text style={styles.cardLabel}>Pending Payments</Text>
            <Text style={styles.cardValue}>${metrics.pendingPayments.toLocaleString()}</Text>
          </View>

          {/* Card 4: Upcoming Deadlines (Light Green BG) */}
          <View style={[styles.gridCard, styles.cardLightGreen]}>
            <Text style={styles.cardLabelGreen}>Upcoming Deadlines</Text>
            <Text style={styles.cardValue}>{metrics.upcomingDeadlines.toLocaleString()}</Text>
          </View>
        </View>

        {/* Quick Action Pills Row */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.actionPillWhite}
            onPress={() => router.push('/client-find-talent')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionPillIcon}>🔍</Text>
            <Text style={styles.actionPillTextDark}>Find Talent</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPillWhite}
            onPress={() => router.push('/create-dispute')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionPillIcon}>+</Text>
            <Text style={styles.actionPillTextDark}>Disputes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPillGreen}
            onPress={() => router.push('/client-milestone-review')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionPillTextWhite}>Milestones</Text>
          </TouchableOpacity>
        </View>

        {/* Active Projects List Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Projects</Text>
          <TouchableOpacity onPress={() => router.push('/client-contracts')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {projectsError ? (
          <View style={styles.projectStateContainer}>
            <Text style={styles.projectStateTitle}>Unable to load active projects</Text>
            <Text style={styles.projectStateMessage}>{projectsError}</Text>
            <TouchableOpacity
              style={styles.projectRetryButton}
              onPress={() => {
                setLoading(true);
                loadData();
              }}
            >
              <Text style={styles.projectRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.projectStateContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.projectStateMessage}>Loading your projects...</Text>
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.projectStateContainer}>
            <Text style={styles.projectStateTitle}>No active projects yet</Text>
            <Text style={styles.projectStateMessage}>
              Contracts for {clientName || 'this client'} will appear here when available.
            </Text>
          </View>
        ) : (
          projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => router.push({ pathname: '/client-milestone-review', params: { contractId: project.id, projectId: `PRJ-${project.id}` } })}
              activeOpacity={0.85}
            >
              <View style={styles.projectCardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.projectTitle} numberOfLines={1}>
                    {project.title}
                  </Text>
                  <Text style={styles.clientName} numberOfLines={1}>
                    Freelancer: {project.freelancerName}
                  </Text>
                </View>
                <View style={styles.escrowTag}>
                  <Text style={styles.escrowTagText}>{project.escrowTag}</Text>
                </View>
              </View>

              <View style={styles.milestoneProgressRow}>
                <Text style={styles.milestoneLabel} numberOfLines={1}>
                  Milestone: {project.milestoneTitle}
                </Text>
                <Text style={styles.progressPercent}>{project.progress}%</Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${project.progress}%` }]} />
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Recent Activity List Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

        <View style={styles.activityList}>
          {activities.length === 0 ? (
            <Text style={styles.projectStateMessage}>No recent activity available.</Text>
          ) : (
            activities.map((act, idx) => (
              <View
                key={act.id || idx}
                style={[
                  styles.activityRow,
                  idx === activities.length - 1 && styles.activityRowLast,
                ]}
              >
                <View
                  style={[
                    styles.activityIcon,
                    act.type === 'SUCCESS' && styles.activitySuccess,
                    act.type === 'WARNING' && styles.activityWarning,
                    act.type === 'ERROR' && styles.activityError,
                  ]}
                >
                  {act.type === 'SUCCESS' ? (
                    <Text style={styles.activityIconText}>✓</Text>
                  ) : act.type === 'WARNING' ? (
                    <Text style={styles.activityIconTextWarning}>◷</Text>
                  ) : (
                    <Text style={styles.activityIconTextError}>!</Text>
                  )}
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{act.title}</Text>
                  <Text style={styles.activityDescription}>{act.description}</Text>
                  <Text style={styles.activityMeta}>
                    {[act.projectTitle, act.performedBy, formatActivityDate(act.createdAt)]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
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

            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-payment-list')}>
              <Text style={styles.tabIcon}>💳</Text>
              <Text style={styles.tabLabel}>Payments</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-profile')}>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Theme.spacing.sm,
    color: Colors.neutralMedium,
    fontSize: 13,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
  greetingSub: {
    fontSize: 16,
    color: Colors.neutralMedium,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  cardLightGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.primaryLight,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.neutralMedium,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardLabelGreen: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginVertical: Theme.spacing.md,
  },
  actionPillWhite: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  actionPillIcon: {
    fontSize: 14,
  },
  actionPillTextDark: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
  },
  actionPillGreen: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  actionPillIconGreen: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
  actionPillTextWhite: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  projectStateContainer: {
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  projectStateTitle: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  projectStateMessage: {
    marginTop: Theme.spacing.xs,
    color: Colors.neutralMedium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  projectRetryButton: {
    marginTop: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  projectRetryText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  projectCardHeader: {
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
  clientName: {
    fontSize: 12,
    color: Colors.neutralMedium,
    marginTop: 2,
  },
  escrowTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  escrowTagText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  milestoneProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 4,
  },
  milestoneLabel: {
    fontSize: 12,
    color: Colors.neutralMedium,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Theme.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  projectCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Theme.spacing.xs + 2,
  },
  dueDateText: {
    fontSize: 12,
    color: Colors.neutralLight,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityRowLast: {
    borderBottomWidth: 0,
  },

  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },

  activitySuccess: {
    backgroundColor: '#DCFCE7',
  },

  activityWarning: {
    backgroundColor: '#FEF3C7',
  },

  activityError: {
    backgroundColor: '#FEE2E2',
  },

  activityIconText: {
    color: '#16A34A',
    fontSize: 20,
    fontWeight: '800',
  },

  activityIconTextWarning: {
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '800',
  },

  activityIconTextError: {
    color: '#EF4444',
    fontSize: 17,
    fontWeight: '800',
  },

  activityContent: {
    flex: 1,
    paddingRight: Theme.spacing.xs,
  },

  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 2,
  },

  activityDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.neutralMedium,
  },
  activityMeta: {
    fontSize: 10,
    lineHeight: 14,
    color: Colors.neutralLight,
    marginTop: 3,
  },
  activityList: {
    marginTop: 4,
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

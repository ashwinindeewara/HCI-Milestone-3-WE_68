import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';
import ContractService from '../../src/services/contractService';
import { getUserSession } from '../../src/services/storage';

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Role determination from session or URL params
  const session = getUserSession();
  const sessionRole = session?.role?.toUpperCase();
  const roleParam = Array.isArray(params.role) ? params.role[0] : params.role;
  const paramRole = typeof roleParam === 'string' ? roleParam.toUpperCase() : null;

  const currentRole = sessionRole || paramRole || 'FREELANCER';
  const userName = session?.fullName || 'User Account';
  const userStatus = session?.status || 'Active';
  const isSuspended = userStatus.toUpperCase() === 'SUSPENDED';

  // Role Redirect Guard
  useEffect(() => {
    if (currentRole === 'ADMIN') {
      router.replace('/admin-dashboard');
    } else if (currentRole === 'PAYMENT_STAFF') {
      router.replace('/staff-dashboard');
    }
  }, [currentRole]);

  // Role-Specific Metrics
  const freelancerMetrics = {
    totalEarnings: 12450,
    activeProjects: 4,
    pendingMilestones: 2,
    pendingEscrow: 3200,
  };

  const clientMetrics = {
    totalSpent: 18600,
    activeContracts: 3,
    openJobPosts: 2,
    escrowDeposited: 5400,
  };

  const loadData = async () => {
    try {
      await ContractService.getDashboardMetrics();
    } catch {
      // Fallback state loaded
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Account Suspended View Guard
  if (isSuspended) {
    return (
      <View style={styles.suspendedContainer}>
        <View style={styles.suspendedCard}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>🔒</Text>
          <Text style={styles.suspendedTitle}>Account Suspended</Text>
          <Text style={styles.suspendedText}>
            Your account has been suspended by a platform administrator. Access to contract management, workspace tools, and payouts has been temporarily disabled.
          </Text>
          <View style={styles.suspendedBtnRow}>
            <TouchableOpacity
              style={styles.contactSupportBtn}
              onPress={() => alert('Support Request: Please email support@freelanceflow.com to appeal your account suspension.')}
            >
              <Text style={styles.contactSupportText}>💬 Contact Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signOutSuspendedBtn}
              onPress={() => {
                router.replace('/login');
              }}
            >
              <Text style={styles.signOutSuspendedText}>🚪 Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const isClient = currentRole === 'CLIENT';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      {/* Header Profile Greeting with Active Role Badge */}
      <View style={styles.headerRow}>
        <View style={styles.userGreetingRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.greetingSub}>
              Good morning, {isClient ? 'Client' : 'Freelancer'}
            </Text>
            <Text style={styles.userName}>{userName}</Text>
            <View style={[styles.roleBadge, isClient ? styles.clientBadge : styles.freelancerBadge]}>
              <Text style={[styles.roleBadgeText, isClient ? styles.clientBadgeText : styles.freelancerBadgeText]}>
                ⚡ {isClient ? 'CLIENT WORKSPACE' : 'FREELANCER WORKSPACE'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bell Notification Badge */}
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => router.push('/(tabs)/notifications')}
        >
          <Text style={{ fontSize: 20 }}>🔔</Text>
          <View style={styles.badgeDot}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 2x2 Dynamic Metric Summary Grid */}
      {isClient ? (
        <>
          <View style={styles.gridRow}>
            {/* Client Card 1: Total Spent */}
            <View style={[styles.gridCard, styles.cardLightGreen]}>
              <Text style={styles.cardLabelGreen}>Total Spent</Text>
              <Text style={styles.cardValue}>${clientMetrics.totalSpent.toLocaleString()}</Text>
            </View>

            {/* Client Card 2: Active Contracts */}
            <View style={styles.gridCard}>
              <Text style={styles.cardLabel}>Active Contracts</Text>
              <Text style={styles.cardValue}>{clientMetrics.activeContracts}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            {/* Client Card 3: Open Job Posts */}
            <View style={styles.gridCard}>
              <Text style={styles.cardLabel}>Open Job Posts</Text>
              <Text style={styles.cardValue}>{clientMetrics.openJobPosts}</Text>
            </View>

            {/* Client Card 4: Escrow Deposited */}
            <View style={[styles.gridCard, styles.cardLightGreen]}>
              <Text style={styles.cardLabelGreen}>Escrow Deposited</Text>
              <Text style={styles.cardValue}>${clientMetrics.escrowDeposited.toLocaleString()}</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.gridRow}>
            {/* Freelancer Card 1: Total Earnings */}
            <View style={[styles.gridCard, styles.cardLightGreen]}>
              <Text style={styles.cardLabelGreen}>Total Earnings</Text>
              <Text style={styles.cardValue}>${freelancerMetrics.totalEarnings.toLocaleString()}</Text>
            </View>

            {/* Freelancer Card 2: Active Projects */}
            <View style={styles.gridCard}>
              <Text style={styles.cardLabel}>Active Projects</Text>
              <Text style={styles.cardValue}>{freelancerMetrics.activeProjects}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            {/* Freelancer Card 3: Pending Milestones */}
            <View style={styles.gridCard}>
              <Text style={styles.cardLabel}>Pending Milestones</Text>
              <Text style={styles.cardValue}>{freelancerMetrics.pendingMilestones}</Text>
            </View>

            {/* Freelancer Card 4: Pending Escrow */}
            <View style={[styles.gridCard, styles.cardLightGreen]}>
              <Text style={styles.cardLabelGreen}>Pending Escrow</Text>
              <Text style={styles.cardValue}>${freelancerMetrics.pendingEscrow.toLocaleString()}</Text>
            </View>
          </View>
        </>
      )}

      {/* Quick Action Pills Row */}
      <View style={styles.quickActionsRow}>
        {isClient ? (
          <>
            <TouchableOpacity
              style={styles.actionPillWhite}
              onPress={() => router.push('/(tabs)/find-talent')}
            >
              <Text style={styles.actionPillIcon}>🔍</Text>
              <Text style={styles.actionPillTextDark}>Hire Talent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPillWhite}
              onPress={() => router.push('/(tabs)/contracts')}
            >
              <Text style={styles.actionPillIcon}>📁</Text>
              <Text style={styles.actionPillTextDark}>Contracts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPillGreen}
              onPress={() => router.push('/(tabs)/escrow')}
            >
              <Text style={styles.actionPillIconGreen}>💳</Text>
              <Text style={styles.actionPillTextWhite}>Escrow</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionPillWhite}
              onPress={() => router.push('/(tabs)/contracts')}
            >
              <Text style={styles.actionPillIcon}>📁</Text>
              <Text style={styles.actionPillTextDark}>Projects</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPillWhite}
              onPress={() => router.push('/(tabs)/escrow')}
            >
              <Text style={styles.actionPillIcon}>💳</Text>
              <Text style={styles.actionPillTextDark}>Payments</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPillGreen}
              onPress={() => router.push('/freelancer-disputes')}
            >
              <Text style={styles.actionPillIconGreen}>+</Text>
              <Text style={styles.actionPillTextWhite}>Disputes</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Active Projects / Contracts Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>
          {isClient ? 'Hired Freelancers & Contracts' : 'Active Projects'}
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/contracts')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {isClient ? (
        <>
          {/* Client Project 1 */}
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => router.push('/(tabs)/contracts')}
            activeOpacity={0.85}
          >
            <View style={styles.projectCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.projectTitle}>E-Commerce Platform Design</Text>
                <Text style={styles.clientName}>Hired Freelancer: Alex Rivera</Text>
              </View>
              <View style={styles.escrowTag}>
                <Text style={styles.escrowTagText}>$2,400 In Escrow</Text>
              </View>
            </View>

            <View style={styles.milestoneProgressRow}>
              <Text style={styles.milestoneLabel}>Milestone: Final Review & Delivery</Text>
              <Text style={styles.progressPercent}>80%</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '80%' }]} />
            </View>

            <View style={styles.projectCardFooter}>
              <Text style={styles.dueDateText}>📅 Due Oct 20, 2024</Text>
              <Text style={styles.viewDetailsText}>Manage Contract ›</Text>
            </View>
          </TouchableOpacity>

          {/* Client Project 2 */}
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => router.push('/(tabs)/contracts')}
            activeOpacity={0.85}
          >
            <View style={styles.projectCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.projectTitle}>Mobile App Backend API</Text>
                <Text style={styles.clientName}>Hired Freelancer: DevTeam Solutions</Text>
              </View>
              <View style={styles.escrowTag}>
                <Text style={styles.escrowTagText}>$3,000 In Escrow</Text>
              </View>
            </View>

            <View style={styles.milestoneProgressRow}>
              <Text style={styles.milestoneLabel}>Milestone: Security Audit & Auth</Text>
              <Text style={styles.progressPercent}>45%</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '45%' }]} />
            </View>

            <View style={styles.projectCardFooter}>
              <Text style={styles.dueDateText}>📅 Due Nov 05, 2024</Text>
              <Text style={styles.viewDetailsText}>Manage Contract ›</Text>
            </View>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Freelancer Project 1 */}
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => router.push('/(tabs)/contracts')}
            activeOpacity={0.85}
          >
            <View style={styles.projectCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.projectTitle}>E-Commerce Redesign</Text>
                <Text style={styles.clientName}>Client: TechVentures Inc.</Text>
              </View>
              <View style={styles.escrowTag}>
                <Text style={styles.escrowTagText}>$2,400 In Escrow</Text>
              </View>
            </View>

            <View style={styles.milestoneProgressRow}>
              <Text style={styles.milestoneLabel}>Milestone: UI Design Phase</Text>
              <Text style={styles.progressPercent}>65%</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '65%' }]} />
            </View>

            <View style={styles.projectCardFooter}>
              <Text style={styles.dueDateText}>📅 Due Oct 15, 2024</Text>
              <Text style={styles.viewDetailsText}>View Details ›</Text>
            </View>
          </TouchableOpacity>

          {/* Freelancer Project 2 */}
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => router.push('/(tabs)/contracts')}
            activeOpacity={0.85}
          >
            <View style={styles.projectCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.projectTitle}>Mobile App Contract</Text>
                <Text style={styles.clientName}>Client: Global Retail Corp</Text>
              </View>
              <View style={styles.escrowTag}>
                <Text style={styles.escrowTagText}>$3,800 In Escrow</Text>
              </View>
            </View>

            <View style={styles.milestoneProgressRow}>
              <Text style={styles.milestoneLabel}>Milestone: API Integration</Text>
              <Text style={styles.progressPercent}>30%</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '30%' }]} />
            </View>

            <View style={styles.projectCardFooter}>
              <Text style={styles.dueDateText}>📅 Due Nov 01, 2024</Text>
              <Text style={styles.viewDetailsText}>View Details ›</Text>
            </View>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 12,
    color: Colors.neutralMedium,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
    marginTop: 4,
  },
  clientBadge: {
    backgroundColor: Colors.infoBg,
  },
  freelancerBadge: {
    backgroundColor: Colors.successBg,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  clientBadgeText: {
    color: Colors.infoText,
  },
  freelancerBadgeText: {
    color: Colors.primaryDark,
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
  suspendedContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  suspendedCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error,
    ...Theme.shadows.card,
  },
  suspendedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.errorText,
    marginBottom: Theme.spacing.xs,
  },
  suspendedText: {
    fontSize: 13,
    color: Colors.neutralMedium,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Theme.spacing.lg,
  },
  suspendedBtnRow: {
    width: '100%',
    gap: Theme.spacing.sm,
  },
  contactSupportBtn: {
    height: 46,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactSupportText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  signOutSuspendedBtn: {
    height: 46,
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutSuspendedText: {
    color: Colors.errorText,
    fontWeight: '700',
    fontSize: 14,
  },
});

import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import { getSavedUserData } from '../src/services/authService';

export default function ClientDashboardScreen() {

  const { role } = useLocalSearchParams<{ role: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    activeProjects: 3,
    pendingApprovals: 2,
    pendingPayments: 5600,
    upcomingDeadlines: 4,
  });
  const currentUser = getSavedUserData();

  const getInitials = (fullName: string) => {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    }
    if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    }
    if (hour >= 17 && hour < 21) {
      return 'Good Evening';
    }
    return 'Good Night';
  };

  const loadData = async () => {
    try {
      //await ContractService.getDashboardMetrics();
    } catch {
      // Demo state fallback
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

  return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          {/* Header Profile Greeting */}
          <View style={styles.headerRow}>
            <View style={styles.userGreetingRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{getInitials(currentUser.fullName)}</Text>
              </View>
              <View>
                <Text style={styles.greetingSub}>{getGreeting()}!</Text>
                <Text style={styles.userName}>{currentUser.fullName}</Text>
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

          {/* 2x2 Metric Summary Grid (Matching Screenshot 1) */}
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
              <Text style={styles.cardValue}>${metrics.pendingPayments}</Text>
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
              onPress={() => router.push('/(tabs)/contracts')}
            >
              <Text style={styles.actionPillIcon}>🔍</Text>
              <Text style={styles.actionPillTextDark}>Find Talents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPillWhite}
              onPress={() => router.push('/(tabs)/escrow')}
            >
              <Text style={styles.actionPillIcon}>+</Text>
              <Text style={styles.actionPillTextDark}>Disputes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPillGreen}
              onPress={() => router.push('/freelancer-disputes')}
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

          {/* Project Card 1: Saas Dashboard Design */}
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => router.push('/(tabs)/contracts')}
            activeOpacity={0.85}
          >
            <View style={styles.projectCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.projectTitle}>Saas Dashboard Design</Text>
                <Text style={styles.clientName}>Freelancer: Sarah Johnson</Text>
              </View>
              <View style={styles.escrowTag}>
                <Text style={styles.escrowTagText}>$4,800 Escrowed</Text>
              </View>
            </View>

            <View style={styles.milestoneProgressRow}>
              <Text style={styles.milestoneLabel}>Milestone: Interactive Prototype</Text>
              <Text style={styles.progressPercent}>80%</Text>
            </View>

            {/* Green Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '80%' }]} />
            </View>

          </TouchableOpacity>

          {/* Project Card 2: Mobile App Contract */}
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => router.push('/(tabs)/contracts')}
            activeOpacity={0.85}
          >
            <View style={styles.projectCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.projectTitle}>iOS Mobile App Dev</Text>
                <Text style={styles.clientName}>Freelancer: David Kim</Text>
              </View>
              <View style={styles.escrowTag}>
                <Text style={styles.escrowTagText}>$3,800 Escrowed</Text>
              </View>
            </View>

            <View style={styles.milestoneProgressRow}>
              <Text style={styles.milestoneLabel}>Milestone: API Setup & Auth</Text>
              <Text style={styles.progressPercent}>100%</Text>
            </View>

            {/* Green Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '100%' }]} />
            </View>
          </TouchableOpacity>

          {/* Recent Activity List Section */}
          <View style={styles.sectionHeaderRow}>
             <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>

          <View style={styles.activityList}>

            <View style={styles.activityRow}>
              <View style={[styles.activityIcon, styles.activitySuccess]}>
                <Text style={styles.activityIconText}>✓</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Milestone approved</Text>
                <Text style={styles.activityDescription}>
                  Interactive Prototype by Sarah Johnson
                </Text>
              </View>
            </View>

            <View style={styles.activityRow}>
              <View style={[styles.activityIcon, styles.activityWarning]}>
                <Text style={styles.activityIconTextWarning}>◷</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New deliverable submitted</Text>
                <Text style={styles.activityDescription}>
                  API Specs by David Kim (Pending Review)
                </Text>
              </View>
            </View>

            <View style={[styles.activityRow, styles.activityRowLast]}>
              <View style={[styles.activityIcon, styles.activityError]}>
                <Text style={styles.activityIconTextError}>!</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Payment alert</Text>
                <Text style={styles.activityDescription}>
                  Escrow funded successfully for Android App ($5,000)
                </Text>
              </View>
            </View>
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

            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-reports')}>
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

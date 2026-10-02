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
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';
import ContractService from '../../src/services/contractService';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    totalEarnings: 12450,
    activeProjects: 4,
    pendingMilestones: 2,
    pendingEscrow: 3200,
  });

  const loadData = async () => {
    try {
      await ContractService.getDashboardMetrics();
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
            <Text style={styles.avatarText}>CI</Text>
          </View>
          <View>
            <Text style={styles.greetingSub}>Good morning,</Text>
            <Text style={styles.userName}>Chathuni Imalsha</Text>
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
        {/* Card 1: Total Earnings (Light Green BG) */}
        <View style={[styles.gridCard, styles.cardLightGreen]}>
          <Text style={styles.cardLabelGreen}>Total Earnings</Text>
          <Text style={styles.cardValue}>${metrics.totalEarnings.toLocaleString()}</Text>
        </View>

        {/* Card 2: Active Projects */}
        <View style={styles.gridCard}>
          <Text style={styles.cardLabel}>Active Projects</Text>
          <Text style={styles.cardValue}>{metrics.activeProjects}</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        {/* Card 3: Pending Milestones */}
        <View style={styles.gridCard}>
          <Text style={styles.cardLabel}>Pending Milestones</Text>
          <Text style={styles.cardValue}>{metrics.pendingMilestones}</Text>
        </View>

        {/* Card 4: Pending Escrow (Light Green BG) */}
        <View style={[styles.gridCard, styles.cardLightGreen]}>
          <Text style={styles.cardLabelGreen}>Pending Escrow</Text>
          <Text style={styles.cardValue}>${metrics.pendingEscrow.toLocaleString()}</Text>
        </View>
      </View>

      {/* Quick Action Pills Row */}
      <View style={styles.quickActionsRow}>
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
      </View>

      {/* Active Projects List Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Active Projects</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/contracts')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {/* Project Card 1: E-Commerce Redesign */}
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => router.push('/(tabs)/contracts')}
        activeOpacity={0.85}
      >
        <View style={styles.projectCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.projectTitle}>E-Commerce Redesign</Text>
            <Text style={styles.clientName}>TechVentures Inc.</Text>
          </View>
          <View style={styles.escrowTag}>
            <Text style={styles.escrowTagText}>$2,400 In Escrow</Text>
          </View>
        </View>

        <View style={styles.milestoneProgressRow}>
          <Text style={styles.milestoneLabel}>Milestone: UI Design Phase</Text>
          <Text style={styles.progressPercent}>65%</Text>
        </View>

        {/* Green Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: '65%' }]} />
        </View>

        <View style={styles.projectCardFooter}>
          <Text style={styles.dueDateText}>📅 Due Oct 15, 2024</Text>
          <Text style={styles.viewDetailsText}>View Details ›</Text>
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
            <Text style={styles.projectTitle}>Mobile App Contract</Text>
            <Text style={styles.clientName}>Global Retail Corp</Text>
          </View>
          <View style={styles.escrowTag}>
            <Text style={styles.escrowTagText}>$3,800 In Escrow</Text>
          </View>
        </View>

        <View style={styles.milestoneProgressRow}>
          <Text style={styles.milestoneLabel}>Milestone: API Integration</Text>
          <Text style={styles.progressPercent}>30%</Text>
        </View>

        {/* Green Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: '30%' }]} />
        </View>

        <View style={styles.projectCardFooter}>
          <Text style={styles.dueDateText}>📅 Due Nov 01, 2024</Text>
          <Text style={styles.viewDetailsText}>View Details ›</Text>
        </View>
      </TouchableOpacity>
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
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';

export default function FreelancerDisputesScreen() {
  const router = useRouter();

  const disputesList = [
    {
      id: 'DSP-409',
      project: 'E-Commerce Redesign',
      amount: '$2,400',
      reason: 'Payment Delay',
      date: 'Filed Oct 10, 2024',
      status: 'Under Review',
      statusType: 'review',
    },
    {
      id: 'DSP-408',
      project: 'Mobile App Contract',
      amount: '$3,800',
      reason: 'Scope Disagreement',
      date: 'Filed Oct 12, 2024',
      status: 'Open',
      statusType: 'open',
    },
    {
      id: 'DSP-401',
      project: 'Logo & Brand Identity',
      amount: '$450',
      reason: 'Milestone Discrepancy',
      date: 'Filed Sep 15, 2024',
      status: 'Resolved',
      statusType: 'resolved',
    },
  ];

  const handleViewDetails = (project: string) => {
    Alert.alert('Dispute Details', `Opening discussion thread and arbitration details for ${project}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Top Header Bar with Back Arrow */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Disputes</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Section Title & Create Disputes Action Link */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Disputes (3)</Text>
          <TouchableOpacity onPress={() => router.push('/create-dispute')}>
            <Text style={styles.createLinkText}>create Disputes</Text>
          </TouchableOpacity>
        </View>

        {/* Disputes Cards List */}
        <View style={styles.listContainer}>
          {disputesList.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    item.statusType === 'review'
                      ? styles.badgeReview
                      : item.statusType === 'open'
                      ? styles.badgeOpen
                      : styles.badgeResolved,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.statusType === 'review'
                        ? styles.textReview
                        : item.statusType === 'open'
                        ? styles.textOpen
                        : styles.textResolved,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>

                {/* Amount */}
                <Text style={styles.amountText}>{item.amount}</Text>
              </View>

              {/* Project Title & Subtitle */}
              <Text style={styles.projectTitle}>{item.project}</Text>
              <Text style={styles.subtitleText}>
                {item.reason} • {item.date}
              </Text>

              <View style={styles.cardDivider} />

              {/* View Details & Discussion Footer Link */}
              <TouchableOpacity
                style={styles.cardFooter}
                onPress={() => handleViewDetails(item.project)}
              >
                <Text style={styles.footerLinkText}>View Details & Discussion</Text>
                <Text style={styles.footerArrow}>›</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/dashboard')}>
          <Text style={[styles.tabIcon, styles.tabIconActive]}>🏠</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/contracts')}>
          <Text style={styles.tabIcon}>📁</Text>
          <Text style={styles.tabLabel}>Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/escrow')}>
          <Text style={styles.tabIcon}>💳</Text>
          <Text style={styles.tabLabel}>Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/notifications')}>
          <Text style={styles.tabIcon}>🔔</Text>
          <Text style={styles.tabLabel}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/profile')}>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '600',
    color: Colors.dark,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutralMedium,
  },
  createLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  listContainer: {
    gap: Theme.spacing.md,
  },
  card: {
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
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.sm,
  },
  badgeReview: {
    backgroundColor: '#FEF3C7',
  },
  textReview: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeOpen: {
    backgroundColor: '#FEE2E2',
  },
  textOpen: {
    color: Colors.errorText,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeResolved: {
    backgroundColor: '#DCFCE7',
  },
  textResolved: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark,
  },
  projectTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.dark,
    marginTop: 4,
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 13,
    color: Colors.neutralMedium,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Theme.spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  footerArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  bottomTabBar: {
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

import React, { useState } from 'react';
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

export default function AdminDisputesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Open');

  const disputes = [
    {
      id: 'DSP-409',
      title: 'UI Design Assets Delayed',
      parties: 'Ruwan vs. Chathuni',
      type: 'Delay',
      amount: '$1,400',
      status: 'Under Review',
      statusType: 'review',
    },
    {
      id: 'DSP-408',
      title: 'E-Commerce Back-end Bugs',
      parties: 'Ruwan vs. Amaya',
      type: 'Quality',
      amount: '$850',
      status: 'Open',
      statusType: 'open',
    },
    {
      id: 'DSP-401',
      title: 'Brand Style Guide Final Release',
      parties: 'Akila vs. Vihaga',
      type: 'Copyright',
      amount: '$3,100',
      status: 'Resolved',
      statusType: 'resolved',
    },
  ];

  const handleResolve = (dspId: string, title: string) => {
    Alert.alert('Arbitration Action', `Manage dispute case #${dspId} (${title})`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Release Funds to Freelancer',
        onPress: () => Alert.alert('Settled', `Funds for case #${dspId} released.`),
      },
      {
        text: 'Refund Client',
        onPress: () => Alert.alert('Refunded', `Funds for case #${dspId} refunded to client.`),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Title Header */}
        <Text style={styles.headerTitle}>Disputes Hub</Text>

        {/* Filter Chips (Matching Screenshot 4) */}
        <View style={styles.filterChipsRow}>
          {['Open (5)', 'Review (3)', 'Resolved (12)'].map((tab) => {
            const isSelected = activeTab === tab.split(' ')[0];
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setActiveTab(tab.split(' ')[0])}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Disputes Cards List */}
        <View style={styles.disputesList}>
          {disputes.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => handleResolve(item.id, item.title)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.dspId}>{item.id}</Text>
                <View
                  style={[
                    styles.statusTag,
                    item.statusType === 'review'
                      ? styles.tagReview
                      : item.statusType === 'open'
                        ? styles.tagOpen
                        : styles.tagResolved,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
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
              </View>

              <Text style={styles.disputeTitle}>{item.title}</Text>
              <Text style={styles.partiesText}>{item.parties}</Text>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooter}>
                <View style={styles.typeTag}>
                  <Text style={styles.typeLabel}>Type: </Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{item.type}</Text>
                  </View>
                </View>

                <Text style={styles.amountText}>{item.amount}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Admin Bottom Navigation Bar */}
      <View style={styles.adminTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-dashboard')}>
          <Text style={styles.tabIcon}>🎛️</Text>
          <Text style={styles.tabLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-users')}>
          <Text style={styles.tabIcon}>👥</Text>
          <Text style={styles.tabLabel}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-transactions')}>
          <Text style={styles.tabIcon}>💵</Text>
          <Text style={styles.tabLabel}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-disputes')}>
          <Text style={[styles.tabIcon, styles.tabIconActive]}>⚠️</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Disputes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-security')}>
          <Text style={styles.tabIcon}>•••</Text>
          <Text style={styles.tabLabel}>More</Text>
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
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: Theme.spacing.md,
  },
  filterChipsRow: { flexDirection: 'row', gap: Theme.spacing.xs, marginBottom: Theme.spacing.lg },
  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: '#DCFCE7', borderColor: Colors.primaryLight },
  chipText: { fontSize: 13, color: Colors.neutralMedium, fontWeight: '500' },
  chipTextActive: { color: Colors.primaryDark, fontWeight: '700' },
  disputesList: { gap: Theme.spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dspId: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusTagText: { fontSize: 11, fontWeight: '700' },
  tagReview: { backgroundColor: '#FEF3C7' },
  textReview: { color: Colors.warningText, fontSize: 11, fontWeight: '700' },
  tagOpen: { backgroundColor: '#FEE2E2' },
  textOpen: { color: Colors.errorText, fontSize: 11, fontWeight: '700' },
  tagResolved: { backgroundColor: '#DCFCE7' },
  textResolved: { color: Colors.primaryDark, fontSize: 11, fontWeight: '700' },
  disputeTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 2 },
  partiesText: { fontSize: 12, color: Colors.neutralMedium },
  cardDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Theme.spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeTag: { flexDirection: 'row', alignItems: 'center' },
  typeLabel: { fontSize: 12, color: Colors.neutralMedium },
  typeBadge: { backgroundColor: Colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 11, color: Colors.dark, fontWeight: '600' },
  amountText: { fontSize: 18, fontWeight: '800', color: '#991B1B' },
  adminTabBar: {
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

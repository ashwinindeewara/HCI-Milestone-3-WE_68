import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';

export default function StaffTransactionsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const transactions = [
    {
      id: 'TXN-2847',
      project: 'E-Commerce Redesign',
      client: 'TechVentures Inc.',
      freelancer: 'Chathuni Imalsha',
      date: 'Oct 14, 2024',
      amount: '$3,150',
      status: 'Completed',
      statusType: 'completed',
    },
    {
      id: 'TXN-2846',
      project: 'API Integration',
      client: 'Global Retail Corp',
      freelancer: 'Amaya Perera',
      date: 'Oct 14, 2024',
      amount: '$1,200',
      status: 'Pending',
      statusType: 'pending',
    },
    {
      id: 'TXN-2845',
      project: 'Illustrations',
      client: 'Acme SaaS',
      freelancer: 'Vihaga Edirisinghe',
      date: 'Oct 13, 2024',
      amount: '$4,800',
      status: 'Completed',
      statusType: 'completed',
    },
    {
      id: 'TXN-2843',
      project: 'React Landing Page',
      client: 'Lumina Tech',
      freelancer: 'Ruwan Sadeepa',
      date: 'Oct 11, 2024',
      amount: '$1,500',
      status: 'Failed',
      statusType: 'failed',
    },
  ];

  const filteredTxns = transactions.filter((t) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'pending' && t.statusType === 'pending') ||
      (activeFilter === 'failed' && t.statusType === 'failed');

    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.freelancer.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleInspectTxn = (txnId: string) => {
    Alert.alert('Payment Detail', `Inspecting billing receipt & gateway logs for ${txnId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Title & Filter Icon */}
        <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <TouchableOpacity style={styles.filterIconButton}>
            <Text style={{ fontSize: 16 }}>🎛️</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Txn ID, Client, Freelancer..."
            placeholderTextColor={Colors.neutralLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, activeFilter === 'all' && styles.chipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.chipText, activeFilter === 'all' && styles.chipTextActive]}>
              All (1,248)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'pending' && styles.chipActive]}
            onPress={() => setActiveFilter('pending')}
          >
            <Text style={[styles.chipText, activeFilter === 'pending' && styles.chipTextActive]}>
              Pending (23)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'failed' && styles.chipActive]}
            onPress={() => setActiveFilter('failed')}
          >
            <Text style={[styles.chipText, activeFilter === 'failed' && styles.chipTextActive]}>
              Failed (3)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Cards */}
        <View style={styles.listContainer}>
          {filteredTxns.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => handleInspectTxn(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.txnIdRow}>
                  <Text style={{ fontSize: 14, marginRight: 6 }}>💳</Text>
                  <Text style={styles.txnId}>{item.id}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    item.statusType === 'completed'
                      ? styles.badgeCompleted
                      : item.statusType === 'pending'
                      ? styles.badgePending
                      : styles.badgeFailed,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.statusType === 'completed'
                        ? styles.textCompleted
                        : item.statusType === 'pending'
                        ? styles.textPending
                        : styles.textFailed,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.projectTitle}>{item.project}</Text>
              <Text style={styles.partiesText}>
                {item.client} → {item.freelancer}
              </Text>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>{item.date}</Text>
                <Text style={styles.amountText}>{item.amount}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Payment Staff Bottom Tab Bar */}
      <View style={styles.staffTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-dashboard')}>
          <Text style={styles.tabIcon}>🟢</Text>
          <Text style={styles.tabLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-transactions')}>
          <Text style={[styles.tabIcon, styles.tabIconActive]}>⬛</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-reconcile')}>
          <Text style={styles.tabIcon}>🔄</Text>
          <Text style={styles.tabLabel}>Reconcile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-reports')}>
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={styles.tabLabel}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-profile')}>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
  },
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
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
  searchInput: { flex: 1, fontSize: 14, color: Colors.dark },
  chipsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.md,
  },
  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutralMedium,
  },
  chipTextActive: {
    color: Colors.surface,
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
  txnIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txnId: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeCompleted: { backgroundColor: '#DCFCE7' },
  textCompleted: { color: Colors.primaryDark },
  badgePending: { backgroundColor: '#FEF3C7' },
  textPending: { color: Colors.warningText },
  badgeFailed: { backgroundColor: '#FEE2E2' },
  textFailed: { color: Colors.errorText },
  projectTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  partiesText: {
    fontSize: 12,
    color: Colors.neutralMedium,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Theme.spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: Colors.neutralLight,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  staffTabBar: {
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

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

export default function AdminTransactionsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const transactions = [
    {
      id: 'TXN-2847',
      date: 'Oct 12, 2024',
      project: 'E-Commerce Redesign',
      client: 'Ruwan Sadeepa',
      freelancer: 'Chathuni Imalsha',
      amount: '$1,200',
      status: 'Escrow Locked',
      risk: 'Risk: Low',
      riskLevel: 'low',
    },
    {
      id: 'TXN-2846',
      date: 'Oct 10, 2024',
      project: 'Mobile App Contract',
      client: 'Akila Deshan Corp',
      freelancer: 'Amaya Perera',
      amount: '$2,400',
      status: 'Released',
      risk: 'Risk: Low',
      riskLevel: 'low',
    },
    {
      id: 'TXN-2845',
      date: 'Oct 08, 2024',
      project: 'WordPress Theme Dev',
      client: 'Ruwan Sadeepa',
      freelancer: 'Vihaga Edirisinghe',
      amount: '$750',
      status: 'In Dispute',
      risk: 'Risk: High',
      riskLevel: 'high',
    },
    {
      id: 'TXN-2844',
      date: 'Oct 05, 2024',
      project: 'Brand Identity Guide',
      client: 'Akila Deshan',
      freelancer: 'Amaya Perera',
      amount: '$3,100',
      status: 'Released',
      risk: 'Risk: Medium',
      riskLevel: 'medium',
    },
  ];

  const filteredTxns = transactions.filter(
    (t) =>
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInspectTxn = (txnId: string) => {
    Alert.alert('Transaction Audit', `Opening detailed escrow ledger for transaction #${txnId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Platform Escrow Value Hero Card (Matching Screenshot 3) */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>PLATFORM ESCROW VALUE</Text>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValue}>$284,500</Text>
            <View style={styles.trendBadge}>
              <Text style={styles.trendText}>This Month +18%</Text>
            </View>
          </View>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Txn ID, Project, Client..."
            placeholderTextColor={Colors.neutralLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Transaction Cards List */}
        <View style={styles.txnList}>
          {filteredTxns.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => handleInspectTxn(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.txnId}>{item.id}</Text>
                <Text style={styles.txnDate}>{item.date}</Text>
              </View>

              <Text style={styles.projectTitle}>{item.project}</Text>
              <Text style={styles.partiesText}>
                C: {item.client} • F: {item.freelancer}
              </Text>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooter}>
                <Text style={styles.amountText}>{item.amount}</Text>

                <View style={styles.badgesRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'In Dispute'
                        ? styles.badgeDispute
                        : item.status === 'Escrow Locked'
                        ? styles.badgeEscrow
                        : styles.badgeReleased,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.status === 'In Dispute'
                          ? styles.textDispute
                          : item.status === 'Escrow Locked'
                          ? styles.textEscrow
                          : styles.textReleased,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.riskBadge,
                      item.riskLevel === 'high'
                        ? styles.riskHigh
                        : item.riskLevel === 'medium'
                        ? styles.riskMedium
                        : styles.riskLow,
                    ]}
                  >
                    <Text
                      style={[
                        styles.riskText,
                        item.riskLevel === 'high'
                          ? styles.textRiskHigh
                          : item.riskLevel === 'medium'
                          ? styles.textRiskMedium
                          : styles.textRiskLow,
                      ]}
                    >
                      {item.risk}
                    </Text>
                  </View>
                </View>
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
          <Text style={[styles.tabIcon, styles.tabIconActive]}>💵</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-disputes')}>
          <Text style={styles.tabIcon}>⚠️</Text>
          <Text style={styles.tabLabel}>Disputes</Text>
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
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: 80,
  },
  heroCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  heroLabel: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark, letterSpacing: 0.5, marginBottom: 4 },
  heroValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroValue: { fontSize: 32, fontWeight: '800', color: Colors.dark },
  trendBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  trendText: { fontSize: 11, fontWeight: '700', color: Colors.primaryDark },
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
  txnList: { gap: Theme.spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  txnId: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  txnDate: { fontSize: 12, color: Colors.neutralLight },
  projectTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 2 },
  partiesText: { fontSize: 12, color: Colors.neutralMedium },
  cardDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Theme.spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  badgesRow: { flexDirection: 'row', gap: Theme.spacing.xs },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  badgeEscrow: { backgroundColor: '#EFF6FF' },
  textEscrow: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  badgeReleased: { backgroundColor: '#DCFCE7' },
  textReleased: { color: Colors.primaryDark, fontSize: 11, fontWeight: '700' },
  badgeDispute: { backgroundColor: '#FEF3C7' },
  textDispute: { color: Colors.warningText, fontSize: 11, fontWeight: '700' },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  riskText: { fontSize: 11, fontWeight: '700' },
  riskLow: { backgroundColor: '#DCFCE7' },
  textRiskLow: { color: Colors.primaryDark, fontSize: 11, fontWeight: '700' },
  riskMedium: { backgroundColor: '#FEF3C7' },
  textRiskMedium: { color: Colors.warningText, fontSize: 11, fontWeight: '700' },
  riskHigh: { backgroundColor: '#FEE2E2' },
  textRiskHigh: { color: Colors.errorText, fontSize: 11, fontWeight: '700' },
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

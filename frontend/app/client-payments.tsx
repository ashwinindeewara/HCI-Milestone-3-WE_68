import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import { getCurrentUser, apiClient, clearApiCache } from '../src/services/api';
import ClientBottomTabBar from '../src/components/ClientBottomTabBar';

export default function ClientPaymentsScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    totalEscrow: 5400,
    totalPaid: 13100,
  });

  const [transactions, setTransactions] = useState<any[]>([
    {
      id: 'TX-101',
      title: 'UI Design & Component Library',
      freelancer: 'Chathuni Imalsha',
      amount: '$3,150.00',
      date: 'Oct 12, 2026',
      status: 'Released',
    },
    {
      id: 'TX-102',
      title: 'API Specifications & Architecture',
      freelancer: 'Chathuni Imalsha',
      amount: '$4,000.00',
      date: 'Oct 01, 2026',
      status: 'Released',
    },
    {
      id: 'TX-103',
      title: 'Wireframes & UX Research',
      freelancer: 'Sadaru Client',
      amount: '$1,260.00',
      date: 'Sep 28, 2026',
      status: 'In Escrow',
    },
  ]);

  useEffect(() => {
    fetchPaymentsSummary();
  }, []);

  const fetchPaymentsSummary = async () => {
    try {
      const activeName = currentUser?.fullName || '';
      const activeEmail = currentUser?.email || '';
      const res = await apiClient.get('/escrow/summary', {
        params: { freelancerName: activeName, email: activeEmail },
      });
      if (res.data) {
        setSummary((prev) => ({
          ...prev,
          totalEscrow: res.data.totalInEscrow || prev.totalEscrow,
          totalPaid: res.data.releasedAmount || prev.totalPaid,
        }));
      }
    } catch {
      // Keep default state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    clearApiCache();
    fetchPaymentsSummary();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          {/* Header Bar */}
          <Text style={styles.headerTitle}>Client Payments & Escrow</Text>

          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              {/* Financial Summary Cards */}
              <View style={styles.gridRow}>
                <View style={[styles.card, styles.cardGreen]}>
                  <Text style={styles.cardLabelGreen}>Total Paid Out</Text>
                  <Text style={styles.cardValueGreen}>${summary.totalPaid.toLocaleString()}</Text>
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Currently In Escrow</Text>
                  <Text style={styles.cardValue}>${summary.totalEscrow.toLocaleString()}</Text>
                </View>
              </View>

              {/* Payment Release History Ledger */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Payment Release History</Text>
              </View>

              <View style={styles.listContainer}>
                {transactions.map((tx) => (
                  <View key={tx.id} style={styles.txCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txTitle}>{tx.title}</Text>
                      <Text style={styles.txSub}>{tx.freelancer} • {tx.date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.txAmount}>{tx.amount}</Text>
                      <View style={[styles.badge, tx.status === 'Released' ? styles.badgeGreen : styles.badgeBlue]}>
                        <Text style={[styles.badgeText, tx.status === 'Released' ? styles.badgeTextGreen : styles.badgeTextBlue]}>
                          {tx.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Standardized Client Bottom Tab Bar */}
        <ClientBottomTabBar activeTab="payments" />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: Theme.spacing.md,
  },
  loaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutralMedium,
    marginBottom: 4,
  },
  cardLabelGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark,
  },
  cardValueGreen: {
    fontSize: 22,
    fontWeight: '800',
    color: '#15803D',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  listContainer: {
    gap: 12,
  },
  txCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 2,
  },
  txSub: {
    fontSize: 12,
    color: Colors.neutralMedium,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  badgeBlue: {
    backgroundColor: '#E0F2FE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: '#166534',
  },
  badgeTextBlue: {
    color: '#0369A1',
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

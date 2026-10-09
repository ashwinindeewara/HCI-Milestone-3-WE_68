import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiClient from '../src/services/api';
import { getSavedUserData } from '../src/services/authService';
import Colors from '../src/constants/colors';

 type RawRecord = Record<string, any>;

type PaymentRow = {
  id: string;
  contractId: string;
  projectId: string;
  milestoneId: string;
  projectTitle: string;
  milestoneTitle: string;
  freelancerName: string;
  amount: number;
  chargedAmount: number;
  status: 'IN_ESCROW' | 'RELEASED';
  dateLabel: string;
  sortTime: number;
};

const FUNDED_STATUSES = new Set([
  'FUNDED',
  'SUBMITTED',
  'DELIVERED',
  'PENDING_REVIEW',
  'APPROVED',
  'RELEASED',
  'PAID',
  'PAYMENT_RELEASED',
]);
const RELEASED_STATUSES = new Set(['RELEASED', 'PAID', 'PAYMENT_RELEASED']);

const firstText = (...values: unknown[]): string => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

const amountValue = (...values: unknown[]): number => {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
};

const money = (value: number): string =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

const parseDate = (value: unknown): { label: string; timestamp: number } => {
  if (!value) return { label: 'Funding date unavailable', timestamp: 0 };
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return { label: 'Funding date unavailable', timestamp: 0 };
  return {
    label: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    timestamp: date.getTime(),
  };
};

const unwrapList = (data: any): RawRecord[] => {
  const candidate = data?.content ?? data?.items ?? data?.data ?? data;
  if (Array.isArray(candidate)) return candidate;
  if (candidate && typeof candidate === 'object' && (candidate.id || candidate.contractId)) {
    return [candidate];
  }
  return [];
};

const normalizeStatus = (value: unknown) => String(value ?? '').trim().toUpperCase().replace(/[ -]/g, '_');

function mapPayments(contracts: RawRecord[]): PaymentRow[] {
  const rows: PaymentRow[] = [];

  contracts.forEach((contract, contractIndex) => {
    const contractId = firstText(contract.id, contract.contractId);
    if (!contractId) return;

    const projectId = firstText(contract.projectId, contract.project?.id, contract.id?.startsWith?.('PRJ-') ? contract.id : '', `PRJ-${contractId}`);
    const projectTitle = firstText(contract.title, contract.projectName, contract.project?.title, 'Untitled project');
    const freelancerName = firstText(contract.freelancerName, contract.freelancer?.fullName, contract.freelancer?.name, 'Freelancer');
    const milestones = Array.isArray(contract.milestones)
      ? contract.milestones
      : Array.isArray(contract.projectMilestones)
        ? contract.projectMilestones
        : [];

    milestones.forEach((milestone: RawRecord, milestoneIndex: number) => {
      const status = normalizeStatus(milestone.status ?? milestone.paymentStatus ?? milestone.fundingStatus);
      if (!FUNDED_STATUSES.has(status)) return;

      const milestoneId = firstText(milestone.id, milestone.milestoneId, `milestone-${milestoneIndex + 1}`);
      const principal = amountValue(milestone.amount, milestone.budget, milestone.escrowAmount);
      if (principal <= 0) return;

      const released = RELEASED_STATUSES.has(status);
      const date = parseDate(
        milestone.paidAt ?? milestone.releasedAt ?? milestone.fundedAt ?? milestone.paymentDate ?? milestone.updatedAt,
      );
      // This application currently stores funding status, not a gateway transaction.
      // Use a 5% display estimate unless the backend later supplies a stored charge total.
      const chargedAmount = amountValue(milestone.totalCharged, milestone.chargedAmount, principal * 1.05);

      rows.push({
        id: `${contractId}:${milestoneId}`,
        contractId,
        projectId,
        milestoneId,
        projectTitle,
        milestoneTitle: firstText(milestone.title, milestone.name, `Milestone ${milestoneIndex + 1}`),
        freelancerName,
        amount: principal,
        chargedAmount,
        status: released ? 'RELEASED' : 'IN_ESCROW',
        dateLabel: date.label,
        sortTime: date.timestamp,
      });
    });
  });

  return rows.sort((a, b) => b.sortTime - a.sortTime);
}

export default function ClientPaymentsListScreen() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage('');

    try {
      const user = getSavedUserData();
      const clientName = firstText(user?.company, user?.fullName, user?.email);
      if (!clientName) {
        setPayments([]);
        setErrorMessage('Could not identify the logged-in client. Please sign in again.');
        return;
      }

      const endpoint = `/contracts/client/${encodeURIComponent(clientName)}`;
      console.log('[ClientPayments] Loading payments for client:', clientName);
      console.log('[ClientPayments] GET', endpoint);

      const response = await apiClient.get(endpoint, { timeout: 20000 });
      const contracts = unwrapList(response.data);
      const mapped = mapPayments(contracts);
      setPayments(mapped);
      console.log(`[ClientPayments] Loaded ${mapped.length} funded milestone(s).`);
    } catch (error: any) {
      console.error('[ClientPayments] Failed to load payment history:', error?.message);
      console.error('Request URL:', error?.config?.url);
      console.error('Base URL:', error?.config?.baseURL);
      console.error('HTTP status:', error?.response?.status);
      console.error('Response data:', error?.response?.data);
      setErrorMessage(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          (error?.code === 'ECONNABORTED'
            ? 'The server took too long to respond. Check the backend and database, then retry.'
            : error?.message) ??
          'Could not load payment history. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const summary = useMemo(() => {
    const totalCapitalDeployed = payments.reduce((sum, row) => sum + row.amount, 0);
    const inEscrow = payments
      .filter((row) => row.status === 'IN_ESCROW')
      .reduce((sum, row) => sum + row.amount, 0);
    const released = payments
      .filter((row) => row.status === 'RELEASED')
      .reduce((sum, row) => sum + row.amount, 0);
    return { totalCapitalDeployed, inEscrow, released };
  }, [payments]);

  const openProject = (payment: PaymentRow) => {
    router.push({
      pathname: '/client-project-details',
      params: {
        contractId: payment.contractId,
        projectId: payment.projectId,
        milestoneId: payment.milestoneId,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadPayments(true)} tintColor="#16A34A" />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Payments</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => loadPayments(true)}
              accessibilityRole="button"
              accessibilityLabel="Refresh payment history"
            >
              <Ionicons name="refresh-outline" size={18} color="#475467" />
            </TouchableOpacity>
          </View>

          <View style={styles.capitalCard}>
            <Text style={styles.capitalEyebrow}>TOTAL CAPITAL DEPLOYED</Text>
            <Text style={styles.capitalAmount}>{money(summary.totalCapitalDeployed)}</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>In Escrow</Text>
                <Text style={styles.escrowAmount}>{money(summary.inEscrow)}</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Released</Text>
                <Text style={styles.releasedAmount}>{money(summary.released)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            <Text style={styles.countText}>{payments.length} {payments.length === 1 ? 'payment' : 'payments'}</Text>
          </View>

          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color="#16A34A" />
              <Text style={styles.stateText}>Loading your payments...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateBox}>
              <Ionicons name="alert-circle-outline" size={28} color="#B42318" />
              <Text style={styles.stateTitle}>Unable to load payments</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadPayments()}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : payments.length === 0 ? (
            <View style={styles.stateBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="card-outline" size={25} color="#16A34A" />
              </View>
              <Text style={styles.stateTitle}>No funded milestones yet</Text>
              <Text style={styles.stateText}>
                Payments will appear here when a milestone is recorded as funded or released.
              </Text>
            </View>
          ) : (
            <View style={styles.paymentList}>
              {payments.map((payment) => (
                <TouchableOpacity
                  key={payment.id}
                  style={styles.paymentCard}
                  activeOpacity={0.82}
                  onPress={() => openProject(payment)}
                  accessibilityRole="button"
                  accessibilityLabel={`View payment for ${payment.projectTitle}, ${payment.milestoneTitle}`}
                >
                  <View style={styles.paymentTopRow}>
                    <View style={styles.paymentTitleGroup}>
                      <Text style={styles.projectName} numberOfLines={1}>{payment.projectTitle}</Text>
                      <Text style={styles.milestoneName} numberOfLines={1}>{payment.milestoneTitle}</Text>
                    </View>
                    <Text style={styles.paymentAmount}>{money(payment.chargedAmount)}</Text>
                  </View>
                  <View style={styles.paymentBottomRow}>
                    <Text style={styles.paymentDate}>{payment.dateLabel}</Text>
                    <View style={[
                      styles.statusPill,
                      payment.status === 'RELEASED' ? styles.releasedPill : styles.escrowPill,
                    ]}>
                      <Text style={[
                        styles.statusPillText,
                        payment.status === 'RELEASED' ? styles.releasedPillText : styles.escrowPillText,
                      ]}>
                        {payment.status === 'RELEASED' ? 'Released' : 'In Escrow'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.viewProjectHint}>View project details ›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Text style={styles.disclaimer}>
            Summary totals use milestone amounts. Payment history shows the milestone amount plus an estimated 5% fee unless the API provides a stored charge total. This screen reflects recorded statuses, not a verified card or bank transaction.
          </Text>
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
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const color = active ? '#16A34A' : '#667085';
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} accessibilityRole="button">
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 20, maxWidth: 680, width: '100%', alignSelf: 'center', flexGrow: 1 },
  pageHeader: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pageTitle: { color: '#101828', fontSize: 17, fontWeight: '800' },
  refreshButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#F2F4F7' },
  capitalCard: { borderRadius: 12, backgroundColor: '#F0FDF4', padding: 13, marginBottom: 17 },
  capitalEyebrow: { color: '#15803D', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  capitalAmount: { marginTop: 2, color: '#101828', fontSize: 20, lineHeight: 25, fontWeight: '900' },
  summaryGrid: { flexDirection: 'row', gap: 6, marginTop: 10 },
  summaryCell: { flex: 1, minHeight: 42, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#EAECF0', backgroundColor: '#FFFFFF' },
  summaryLabel: { color: '#667085', fontSize: 9 },
  escrowAmount: { marginTop: 2, color: '#344054', fontSize: 12, fontWeight: '800' },
  releasedAmount: { marginTop: 2, color: '#15803D', fontSize: 12, fontWeight: '800' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { color: '#101828', fontSize: 12, fontWeight: '900' },
  countText: { color: '#98A2B3', fontSize: 9, fontWeight: '600' },
  paymentList: { gap: 8 },
  paymentCard: { padding: 11, borderRadius: 10, borderWidth: 1, borderColor: '#EAECF0', backgroundColor: '#FFFFFF' },
  paymentTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  paymentTitleGroup: { flex: 1 },
  projectName: { color: '#101828', fontSize: 10, fontWeight: '900' },
  milestoneName: { color: '#667085', fontSize: 9, marginTop: 2 },
  paymentAmount: { color: '#101828', fontSize: 10, fontWeight: '900' },
  paymentBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 },
  paymentDate: { color: '#667085', fontSize: 8 },
  statusPill: { borderRadius: 12, paddingHorizontal: 7, paddingVertical: 4 },
  escrowPill: { backgroundColor: '#EFF6FF' },
  releasedPill: { backgroundColor: '#DCFCE7' },
  statusPillText: { fontSize: 8, fontWeight: '800' },
  escrowPillText: { color: '#2563EB' },
  releasedPillText: { color: '#15803D' },
  viewProjectHint: { color: '#16A34A', fontSize: 8, fontWeight: '700', textAlign: 'right', marginTop: 6 },
  stateBox: { paddingHorizontal: 18, paddingVertical: 28, borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0', alignItems: 'center', gap: 8 },
  stateTitle: { color: '#101828', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  stateText: { color: '#667085', fontSize: 10, lineHeight: 15, textAlign: 'center' },
  retryButton: { marginTop: 5, backgroundColor: '#16A34A', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 9 },
  retryButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  emptyIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  disclaimer: { marginTop: 13, color: '#98A2B3', fontSize: 8, lineHeight: 12 },
  bottomTabBar: { minHeight: 59, borderTopWidth: 1, borderTopColor: '#EAECF0', backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 4 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 5 },
  tabLabel: { color: '#667085', fontSize: 8, fontWeight: '600' },
  tabLabelActive: { color: '#16A34A', fontWeight: '900' },

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

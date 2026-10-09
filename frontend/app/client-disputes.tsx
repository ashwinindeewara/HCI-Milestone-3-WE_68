import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../src/constants/colors';
import apiClient from '../src/services/api';
import { getSavedUserData } from '../src/services/authService';

type Raw = Record<string, any>;

type DisputeCase = {
  id: string;
  contractId: string;
  projectId: string;
  projectTitle: string;
  freelancerName: string;
  status: string;
  filedDate: string;
  disputedAmount: number;
  reason: string;
  description: string;
};

const firstText = (...values: unknown[]): string => {
  const value = values.find((entry) => entry !== undefined && entry !== null && String(entry).trim() !== '');
  return value === undefined ? '' : String(value).trim();
};

const amountValue = (value: unknown): number => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};

const unwrapList = (value: any): Raw[] => {
  const list = value?.content ?? value?.items ?? value?.data ?? value;
  return Array.isArray(list) ? list : list && typeof list === 'object' ? [list] : [];
};

const formatMoney = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value?: string) => {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const normalizeStatus = (status: unknown) => firstText(status, 'OPEN').toUpperCase().replace(/[ -]+/g, '_');

const statusLabel = (status: string) => {
  const normalized = normalizeStatus(status);
  if (['UNDER_REVIEW', 'IN_REVIEW', 'MEDIATION', 'PENDING_REVIEW'].includes(normalized)) return 'Under Review';
  if (['OPEN', 'OPEN_DISPUTE', 'SUBMITTED', 'ACTIVE'].includes(normalized)) return 'Open Dispute';
  if (['RESOLVED', 'CLOSED', 'SETTLED', 'COMPLETED'].includes(normalized)) return 'Resolved';
  return normalized.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const mapDispute = (item: Raw, index: number): DisputeCase => {
  const contractId = firstText(item.contractId, item.contract?.id, item.idOfContract);
  const projectId = firstText(item.projectId, item.project?.id, contractId ? `PRJ-${contractId}` : '');
  return {
    id: firstText(item.id, item.disputeId, `dispute-${index + 1}`),
    contractId,
    projectId,
    projectTitle: firstText(item.projectTitle, item.projectName, item.title, item.project?.title, item.contract?.title, 'Untitled project'),
    freelancerName: firstText(item.freelancerName, item.freelancer?.fullName, item.freelancer?.name, 'Freelancer not assigned'),
    status: normalizeStatus(item.status ?? item.disputeStatus),
    filedDate: firstText(item.filedAt, item.filedDate, item.createdAt, item.createdDate),
    disputedAmount: amountValue(item.disputedAmount ?? item.amount ?? item.claimAmount),
    reason: firstText(item.reason, item.category, item.title, 'Project dispute'),
    description: firstText(item.description, item.details, item.statement, item.reasonDescription),
  };
};

export default function ClientDisputesScreen() {
  const router = useRouter();
  const savedUser = getSavedUserData();
  const clientName = firstText(savedUser?.company, savedUser?.fullName, savedUser?.email);

  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [caseModalVisible, setCaseModalVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!clientName) {
      setCases([]);
      setErrorMessage('Could not identify the logged-in client. Please sign in again.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) setRefreshing(true); else setLoading(true);
    setErrorMessage('');

    try {
      // Expected backend endpoint: GET /api/disputes/client/{clientName}
      const response = await apiClient.get(
        `/disputes/client/${encodeURIComponent(clientName)}`,
        { timeout: 15000 },
      );
      const mapped = unwrapList(response.data).map(mapDispute);
      setCases(mapped);
    } catch (error: any) {
      console.error('[ClientDisputes] Failed to load disputes:', error);
      console.error('URL:', error?.config?.url);
      console.error('Base URL:', error?.config?.baseURL);
      console.error('Status:', error?.response?.status);
      console.error('Response:', error?.response?.data);
      setErrorMessage(
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        (error?.response?.status === 404
          ? 'The disputes API endpoint is not available yet. Add GET /api/disputes/client/{clientName} to the backend.'
          : error?.message ?? 'Unable to load disputes.'),
      );
      setCases([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientName]);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const activeCases = useMemo(
    () => cases.filter((item) => !['RESOLVED', 'CLOSED', 'SETTLED', 'COMPLETED'].includes(normalizeStatus(item.status))),
    [cases],
  );

  const openCase = (item: DisputeCase) => {
    setSelectedCase(item);
    setCaseModalVisible(true);
  };

  const openProject = (item: DisputeCase) => {
    setCaseModalVisible(false);
    const contractId = item.contractId || (item.projectId.startsWith('PRJ-') ? item.projectId.slice(4) : item.projectId);
    const projectId = item.projectId || (contractId ? `PRJ-${contractId}` : '');
    router.push({
      pathname: '/client-project-details',
      params: { contractId, projectId },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={19} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disputes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.fileDisputeCard}
          onPress={() => router.push('/client-create-dispute')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="File a dispute"
        >
          <View style={styles.alertIconWrap}>
            <View style={styles.alertDot} />
          </View>
          <View style={styles.fileDisputeCopy}>
            <Text style={styles.fileDisputeTitle}>File a Dispute</Text>
            <Text style={styles.fileDisputeSubtitle}>Request platform mediation</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color="#98A2B3" />
        </TouchableOpacity>

        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Active Mediation Files ({activeCases.length})</Text>
          <TouchableOpacity onPress={() => loadData(true)} accessibilityRole="button" accessibilityLabel="Refresh disputes">
            <Ionicons name="refresh-outline" size={17} color={Colors.neutralMedium} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <Text style={styles.stateText}>Loading your disputes...</Text>
          </View>
        ) : errorMessage && activeCases.length > 0 ? (
          <View style={styles.stateCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#D92D20" />
            <Text style={styles.stateTitle}>Unable to refresh disputes</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : activeCases.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Ionicons name="shield-checkmark-outline" size={25} color="#16A34A" /></View>
            <Text style={styles.stateTitle}>No active disputes</Text>
          </View>
        ) : (
          <View style={styles.caseList}>
            {activeCases.map((item) => {
              const underReview = ['UNDER_REVIEW', 'IN_REVIEW', 'MEDIATION', 'PENDING_REVIEW'].includes(normalizeStatus(item.status));
              return (
                <View key={item.id} style={styles.caseCard}>
                  <View style={styles.caseTopRow}>
                    <View style={[styles.statusDot, underReview ? styles.statusDotReview : styles.statusDotOpen]} />
                    <View style={styles.caseHeadingCopy}>
                      <View style={[styles.statusPill, underReview ? styles.statusPillReview : styles.statusPillOpen]}>
                        <Text style={[styles.statusPillText, underReview ? styles.reviewStatusText : styles.openStatusText]}>{statusLabel(item.status)}</Text>
                      </View>
                      <Text style={styles.filedDate}>Filed {formatDate(item.filedDate)}</Text>
                    </View>
                  </View>

                  <Text style={styles.caseTitle} numberOfLines={2}>{item.projectTitle}</Text>
                  <Text style={styles.caseReason} numberOfLines={1}>{item.reason}</Text>
                  <Text style={styles.freelancerText}>Freelancer: {item.freelancerName}</Text>

                  <View style={styles.caseDivider} />
                  <View style={styles.caseFooter}>
                    <Text style={styles.disputedAmount}>Disputed amount: {formatMoney(item.disputedAmount)}</Text>
                    <TouchableOpacity style={styles.viewCaseButton} onPress={() => openCase(item)} activeOpacity={0.8}>
                      <Text style={styles.viewCaseText}>View Case</Text>
                      <Ionicons name="chevron-forward" size={13} color="#15803D" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={caseModalVisible} transparent animationType="fade" onRequestClose={() => setCaseModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.caseDetailsSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dispute Details</Text>
              <TouchableOpacity onPress={() => setCaseModalVisible(false)} style={styles.modalClose} accessibilityLabel="Close case details">
                <Ionicons name="close" size={19} color="#344054" />
              </TouchableOpacity>
            </View>
            {selectedCase ? (
              <>
                <View style={[styles.statusPill, styles.statusPillOpen, { alignSelf: 'flex-start', marginBottom: 10 }]}>
                  <Text style={styles.openStatusText}>{statusLabel(selectedCase.status)}</Text>
                </View>
                <Text style={styles.caseDetailsTitle}>{selectedCase.projectTitle}</Text>
                <DetailRow label="Case ID" value={selectedCase.id} />
                <DetailRow label="Reason" value={selectedCase.reason} />
                <DetailRow label="Freelancer" value={selectedCase.freelancerName} />
                <DetailRow label="Filed" value={formatDate(selectedCase.filedDate)} />
                <DetailRow label="Disputed amount" value={formatMoney(selectedCase.disputedAmount)} />
                {selectedCase.description ? <Text style={styles.caseDescription}>{selectedCase.description}</Text> : null}
                <TouchableOpacity style={styles.submitButton} onPress={() => openProject(selectedCase)}>
                  <Text style={styles.submitButtonText}>View Project</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setCaseModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { minHeight: 47, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  backButton: { width: 28, height: 34, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#101828', fontSize: 14, fontWeight: '800' },
  headerSpacer: { width: 28 },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 28, maxWidth: 640, width: '100%', alignSelf: 'center' },
  fileDisputeCard: { minHeight: 47, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#EAECF0', borderRadius: 10, backgroundColor: '#F9FAFB', marginBottom: 16 },
  alertIconWrap: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE4E2', marginRight: 9 },
  alertDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F04438' },
  fileDisputeCopy: { flex: 1 },
  fileDisputeTitle: { fontSize: 11, fontWeight: '800', color: '#101828' },
  fileDisputeSubtitle: { marginTop: 2, fontSize: 9, color: '#667085' },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 11, color: '#101828', fontWeight: '800' },
  caseList: { gap: 9 },
  caseCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, shadowColor: '#101828', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  caseTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  statusDot: { width: 9, height: 9, borderRadius: 5, marginTop: 4, marginRight: 6 },
  statusDotReview: { backgroundColor: '#FBBF24' },
  statusDotOpen: { backgroundColor: '#F97066' },
  caseHeadingCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 9 },
  statusPillReview: { backgroundColor: '#FEF3C7' },
  statusPillOpen: { backgroundColor: '#FEE4E2' },
  statusPillText: { fontSize: 7, fontWeight: '700' },
  reviewStatusText: { color: '#92400E' },
  openStatusText: { color: '#B42318', fontSize: 7, fontWeight: '700' },
  filedDate: { fontSize: 8, color: '#667085', textAlign: 'right' },
  caseTitle: { marginTop: 5, color: '#101828', fontSize: 10, fontWeight: '800', lineHeight: 14 },
  caseReason: { marginTop: 2, color: '#475467', fontSize: 9 },
  freelancerText: { marginTop: 2, color: '#667085', fontSize: 8 },
  caseDivider: { height: 1, backgroundColor: '#F2F4F7', marginTop: 8, marginBottom: 6 },
  caseFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  disputedAmount: { color: '#667085', fontSize: 8, flex: 1 },
  viewCaseButton: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 3, paddingLeft: 5 },
  viewCaseText: { color: '#15803D', fontSize: 8, fontWeight: '800' },
  stateContainer: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  stateCard: { borderWidth: 1, borderColor: '#EAECF0', borderRadius: 10, padding: 16, alignItems: 'center', gap: 7 },
  emptyCard: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 26, borderWidth: 1, borderColor: '#EAECF0', borderRadius: 10, backgroundColor: '#FCFCFD' },
  emptyIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FDF4', marginBottom: 8 },
  stateTitle: { marginTop: 3, color: '#101828', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  stateText: { color: '#667085', fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 2 },
  retryButton: { marginTop: 5, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 7, backgroundColor: Colors.primary },
  retryButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16,24,40,0.40)' },
  caseDetailsSheet: { backgroundColor: '#FFFFFF', marginHorizontal: 18, padding: 16, borderRadius: 15, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: '#101828', fontSize: 16, fontWeight: '900' },
  modalClose: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F2F4F7', alignItems: 'center', justifyContent: 'center' },
  submitButton: { minHeight: 43, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: 9, marginTop: 15, paddingHorizontal: 12 },
  submitButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  cancelButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center', marginTop: 7, borderRadius: 9, borderWidth: 1, borderColor: '#EAECF0' },
  cancelButtonText: { color: '#344054', fontSize: 10, fontWeight: '800' },
  caseDetailsTitle: { color: '#101828', fontSize: 13, fontWeight: '900', marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F2F4F7', gap: 10 },
  detailLabel: { width: 100, color: '#667085', fontSize: 10 },
  detailValue: { flex: 1, color: '#101828', fontSize: 10, fontWeight: '700' },
  caseDescription: { color: '#475467', fontSize: 10, lineHeight: 16, marginTop: 12 },
});


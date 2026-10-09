import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';

type RawRecord = Record<string, any>;
type PaymentMethod = 'CARD' | 'BANK';

interface FundMilestone {
  id: string;
  title: string;
  amount: number;
  dueDate?: string;
  status: string;
}

interface ContractData {
  id: string;
  title: string;
  clientName: string;
  freelancerName: string;
  totalBudget: number;
  status: string;
  milestones: FundMilestone[];
}

const firstParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const toText = (value: unknown, fallback = '') =>
  value === undefined || value === null ? fallback : String(value);

const toAmount = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const formatMoney = (value: number) =>
  `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const mapContract = (raw: RawRecord): ContractData => {
  const milestonesRaw = Array.isArray(raw.milestones)
    ? raw.milestones
    : Array.isArray(raw.projectMilestones)
      ? raw.projectMilestones
      : [];

  return {
    id: toText(raw.id ?? raw.contractId),
    title: toText(raw.title ?? raw.projectName, 'Untitled project'),
    clientName: toText(raw.clientName ?? raw.client?.fullName, 'Client'),
    freelancerName: toText(
      raw.freelancerName ?? raw.freelancer?.fullName ?? raw.freelancer?.name,
      'Freelancer',
    ),
    totalBudget: toAmount(raw.totalBudget ?? raw.budget),
    status: toText(raw.status, 'DRAFT'),
    milestones: milestonesRaw.map((item: RawRecord, index: number) => ({
      id: toText(item.id ?? item.milestoneId, `milestone-${index + 1}`),
      title: toText(item.title ?? item.name, `Milestone ${index + 1}`),
      amount: toAmount(item.amount ?? item.budget ?? item.escrowAmount),
      dueDate: toText(item.dueDate ?? item.deadline, ''),
      status: toText(item.status, 'PENDING'),
    })),
  };
};

export default function ClientFundMilestoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string | string[];
    contractId?: string | string[];
    projectId?: string | string[];
    milestoneId?: string | string[];
  }>();

  const routeId =
    firstParam(params.contractId) ??
    firstParam(params.id) ??
    firstParam(params.projectId) ??
    '';
  const contractId = routeId.startsWith('PRJ-') ? routeId.slice(4) : routeId;
  const projectId = firstParam(params.projectId) || (contractId ? `PRJ-${contractId}` : '');
  const initialMilestoneId = firstParam(params.milestoneId) || '';

  const [contract, setContract] = useState<ContractData | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(initialMilestoneId);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showMilestonePicker, setShowMilestonePicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadContract = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!contractId) {
      setContract(null);
      setErrorMessage('No contract ID was provided. Return to Milestone Review and try again.');
      setLoading(false);
      return;
    }

    try {
      console.log('[FundMilestone] Loading contract:', contractId);
      const response = await apiClient.get(
        `/contracts/${encodeURIComponent(contractId)}`,
        { timeout: 15000 },
      );
      const raw = response.data?.contract ?? response.data?.data ?? response.data;
      if (!raw || typeof raw !== 'object') {
        throw new Error('The server did not return contract details.');
      }

      const mapped = mapContract(raw);
      if (!mapped.id) {
        throw new Error('The response did not contain a contract ID.');
      }
      if (mapped.milestones.length === 0) {
        throw new Error('This contract has no milestones to fund yet.');
      }

      setContract(mapped);
      setSelectedMilestoneId((current) => {
        const candidate = current || initialMilestoneId;
        return mapped.milestones.some((m) => m.id === candidate)
          ? candidate
          : mapped.milestones[0].id;
      });
      console.log('[FundMilestone] Loaded milestones:', mapped.milestones.length);
    } catch (error: any) {
      console.error('[FundMilestone] Failed to load contract:', error);
      console.error('Request URL:', error?.config?.url);
      console.error('Base URL:', error?.config?.baseURL);
      console.error('HTTP status:', error?.response?.status);
      console.error('Response data:', error?.response?.data);
      setErrorMessage(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          error?.message ??
          'Unable to load contract and milestone data.',
      );
    } finally {
      setLoading(false);
    }
  }, [contractId, initialMilestoneId]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const selectedMilestone = useMemo(
    () => contract?.milestones.find((milestone) => milestone.id === selectedMilestoneId) ?? null,
    [contract, selectedMilestoneId],
  );

  const milestoneAmount = selectedMilestone?.amount ?? 0;
  const platformFee = useMemo(() => Math.round(milestoneAmount * 0.05 * 100) / 100, [milestoneAmount]);
  const totalCharged = milestoneAmount + platformFee;

  const confirmPayment = async () => {
    if (!contract || !selectedMilestone) {
      setErrorMessage('Select a milestone before confirming payment.');
      return;
    }
    if (milestoneAmount <= 0) {
      setErrorMessage('This milestone has no valid amount to fund.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const activeProjectId = projectId || `PRJ-${contract.id}`;
      console.log('[FundMilestone] Marking milestone as funded:', {
        contractId: contract.id,
        projectId: activeProjectId,
        milestoneId: selectedMilestone.id,
        paymentMethod,
        amount: milestoneAmount,
        platformFee,
      });

      // Uses the existing milestone-status endpoint. This changes the milestone
      // status to FUNDED; it does not charge a real card or bank account.
      const response = await apiClient.patch(
        `/projects/${encodeURIComponent(activeProjectId)}/milestones/${encodeURIComponent(selectedMilestone.id)}/status`,
        {},
        { params: { status: 'FUNDED' }, timeout: 15000 },
      );

      const returnedStatus = toText(response.data?.status, 'FUNDED');
      setContract((current) => current ? {
        ...current,
        milestones: current.milestones.map((item) =>
          item.id === selectedMilestone.id ? { ...item, status: returnedStatus } : item,
        ),
      } : current);
      setSuccessMessage(
        `Milestone funding status updated. ${formatMoney(totalCharged)} is shown as the total including the 5% platform fee.`,
      );
    } catch (error: any) {
      console.error('[FundMilestone] Failed to confirm funding:', error);
      console.error('Request URL:', error?.config?.url);
      console.error('HTTP status:', error?.response?.status);
      console.error('Response data:', error?.response?.data);
      setErrorMessage(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          error?.message ??
          'Unable to update the milestone funding status.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const returnToReview = () => {
    if (!contract || !selectedMilestone) {
      router.back();
      return;
    }
    router.replace({
      pathname: '/client-milestone-review',
      params: {
        contractId: contract.id,
        projectId: projectId || `PRJ-${contract.id}`,
        milestoneId: selectedMilestone.id,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.stateText}>Loading milestone funding details...</Text>
      </SafeAreaView>
    );
  }

  if (!contract || errorMessage && !contract.milestones.length) {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <Text style={styles.errorTitle}>Unable to load funding details</Text>
        <Text style={styles.stateText}>{errorMessage || 'Contract details were not found.'}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={loadContract}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backGlyph}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Fund Milestone</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.fieldLabel}>Select Milestone to Fund</Text>
          <TouchableOpacity
            style={styles.milestonePicker}
            onPress={() => setShowMilestonePicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Select milestone to fund"
          >
            <Text style={styles.milestonePickerText} numberOfLines={1}>
              {selectedMilestone?.title ?? 'Select a milestone'}
            </Text>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>

          {contract ? (
            <View style={styles.projectReference}>
              <Text style={styles.projectTitle} numberOfLines={1}>{contract.title}</Text>
              <Text style={styles.projectMeta} numberOfLines={1}>
                {contract.freelancerName} · Contract {contract.id}
              </Text>
            </View>
          ) : null}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Funding Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Milestone Amount</Text>
              <Text style={styles.summaryValue}>{formatMoney(milestoneAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform Escrow Fee (5%)</Text>
              <Text style={styles.summaryValue}>{formatMoney(platformFee)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Charged</Text>
              <Text style={styles.totalValue}>{formatMoney(totalCharged)}</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Payment Method</Text>
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'CARD' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('CARD')}
            accessibilityRole="radio"
            accessibilityState={{ selected: paymentMethod === 'CARD' }}
          >
            <View style={[styles.methodIcon, styles.cardMethodIcon]}>
              <View style={styles.cardGlyph} />
            </View>
            <View style={styles.paymentCopy}>
              <Text style={styles.paymentTitle}>Credit/Debit Card</Text>
              <Text style={styles.paymentSubtitle}>Visa ending in 4242</Text>
            </View>
            <View style={[styles.radioOuter, paymentMethod === 'CARD' && styles.radioOuterSelected]}>
              {paymentMethod === 'CARD' ? <View style={styles.radioInner} /> : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'BANK' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('BANK')}
            accessibilityRole="radio"
            accessibilityState={{ selected: paymentMethod === 'BANK' }}
          >
            <View style={[styles.methodIcon, styles.bankMethodIcon]}>
              <Text style={styles.bankGlyph}>▤</Text>
            </View>
            <View style={styles.paymentCopy}>
              <Text style={styles.paymentTitle}>Bank Account (ACH)</Text>
              <Text style={styles.paymentSubtitle}>Connect via Plaid</Text>
            </View>
            <View style={[styles.radioOuter, paymentMethod === 'BANK' && styles.radioOuterSelected]}>
              {paymentMethod === 'BANK' ? <View style={styles.radioInner} /> : null}
            </View>
          </TouchableOpacity>

          <View style={styles.securityNote}>
            <Text style={styles.securityIcon}>♢</Text>
            <Text style={styles.securityText}>
              Your funds are securely held in escrow until the milestone is approved.
            </Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}
          {successMessage ? (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>{successMessage}</Text>
              <TouchableOpacity onPress={returnToReview} style={styles.returnButton}>
                <Text style={styles.returnButtonText}>Return to Milestone Review</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryButton, (submitting || Boolean(successMessage)) && styles.disabledButton]}
            onPress={confirmPayment}
            disabled={submitting || Boolean(successMessage)}
          >
            {submitting
              ? <ActivityIndicator color={Colors.surface} />
              : <Text style={styles.primaryButtonText}>{successMessage ? 'Funding Status Updated' : 'Confirm Payment'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>

      <Modal
        visible={showMilestonePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMilestonePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select milestone</Text>
            <ScrollView style={styles.modalList}>
              {contract.milestones.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.modalOption, selectedMilestoneId === item.id && styles.modalOptionSelected]}
                  onPress={() => {
                    setSelectedMilestoneId(item.id);
                    setSuccessMessage('');
                    setErrorMessage('');
                    setShowMilestonePicker(false);
                  }}
                >
                  <View style={styles.modalOptionCopy}>
                    <Text style={styles.modalOptionTitle}>{item.title}</Text>
                    <Text style={styles.modalOptionMeta}>Status: {item.status.replace(/_/g, ' ')}</Text>
                  </View>
                  <Text style={styles.modalOptionAmount}>{formatMoney(item.amount)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowMilestonePicker(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 28 },
  stateScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: Colors.surface },
  stateText: { marginTop: 9, color: Colors.neutralMedium, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  errorTitle: { color: Colors.dark, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  header: { height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backButton: { width: 30, height: 36, justifyContent: 'center' },
  backGlyph: { color: Colors.dark, fontSize: 27, lineHeight: 30 },
  headerTitle: { flex: 1, marginLeft: 2, color: Colors.dark, fontSize: 14, fontWeight: '800' },
  headerSpacer: { width: 30 },
  fieldLabel: { marginTop: 7, marginBottom: 7, color: Colors.dark, fontSize: 11, fontWeight: '700' },
  milestonePicker: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, borderWidth: 1, borderColor: Colors.border, borderRadius: 9, backgroundColor: '#F8FAFC' },
  milestonePickerText: { flex: 1, color: Colors.dark, fontSize: 11 },
  chevron: { marginLeft: 8, color: Colors.neutralMedium, fontSize: 18 },
  projectReference: { marginTop: 10, paddingHorizontal: 2 },
  projectTitle: { color: Colors.dark, fontSize: 12, fontWeight: '800' },
  projectMeta: { marginTop: 3, color: Colors.neutralMedium, fontSize: 9 },
  summaryCard: { marginTop: 14, marginBottom: 9, padding: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, backgroundColor: '#F8FAFC' },
  summaryTitle: { marginBottom: 8, color: Colors.dark, fontSize: 11, fontWeight: '800' },
  summaryRow: { minHeight: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  summaryLabel: { color: Colors.neutralMedium, fontSize: 10 },
  summaryValue: { color: Colors.dark, fontSize: 10, fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 7 },
  totalRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: Colors.dark, fontSize: 11, fontWeight: '800' },
  totalValue: { color: Colors.primaryDark, fontSize: 14, fontWeight: '900' },
  paymentOption: { minHeight: 49, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, backgroundColor: Colors.surface, marginBottom: 7 },
  paymentOptionSelected: { borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  methodIcon: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  cardMethodIcon: { backgroundColor: '#DCFCE7' },
  cardGlyph: { width: 14, height: 11, backgroundColor: Colors.primary, borderRadius: 2 },
  bankMethodIcon: { backgroundColor: '#F3F4F6' },
  bankGlyph: { color: Colors.neutralMedium, fontSize: 17 },
  paymentCopy: { flex: 1 },
  paymentTitle: { color: Colors.dark, fontSize: 10, fontWeight: '800' },
  paymentSubtitle: { marginTop: 2, color: Colors.neutralMedium, fontSize: 9 },
  radioOuter: { width: 13, height: 13, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: Colors.primary },
  radioInner: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
  securityNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7, padding: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: Colors.border, borderRadius: 9 },
  securityIcon: { color: Colors.primary, fontSize: 18, fontWeight: '800' },
  securityText: { flex: 1, color: Colors.neutralMedium, fontSize: 9, lineHeight: 13 },
  primaryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 17, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14 },
  primaryButtonText: { color: Colors.surface, fontSize: 11, fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
  secondaryButton: { minHeight: 40, minWidth: 110, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 9, paddingHorizontal: 14 },
  secondaryButtonText: { color: Colors.dark, fontSize: 12, fontWeight: '700' },
  errorBanner: { marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  errorBannerText: { color: '#B91C1C', fontSize: 10, lineHeight: 15 },
  successBanner: { marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  successBannerText: { color: '#166534', fontSize: 10, lineHeight: 15 },
  returnButton: { alignSelf: 'flex-start', paddingVertical: 7 },
  returnButtonText: { color: Colors.primaryDark, fontSize: 10, fontWeight: '800' },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(15,23,42,0.38)' },
  modalCard: { maxHeight: '75%', padding: 15, backgroundColor: Colors.surface, borderRadius: 13 },
  modalTitle: { marginBottom: 10, color: Colors.dark, fontSize: 15, fontWeight: '800' },
  modalList: { flexGrow: 0 },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: Colors.border, borderRadius: 9 },
  modalOptionSelected: { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  modalOptionCopy: { flex: 1 },
  modalOptionTitle: { color: Colors.dark, fontSize: 11, fontWeight: '700' },
  modalOptionMeta: { marginTop: 3, color: Colors.neutralMedium, fontSize: 9 },
  modalOptionAmount: { color: Colors.primaryDark, fontSize: 10, fontWeight: '800' },
  modalCloseButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center', marginTop: 7, borderWidth: 1, borderColor: Colors.border, borderRadius: 9 },
  modalCloseText: { color: Colors.dark, fontSize: 11, fontWeight: '700' },
});

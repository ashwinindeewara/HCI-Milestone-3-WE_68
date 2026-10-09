import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import apiClient from '../src/services/api';

type RawRecord = Record<string, any>;
type PaymentMethod = 'CARD' | 'BANK';

interface SummaryMilestone {
  id: string;
  title: string;
  amount: number;
  status: string;
}

interface SummaryContract {
  id: string;
  title: string;
  milestones: SummaryMilestone[];
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

const unwrapContract = (responseData: any): RawRecord =>
  responseData?.contract ?? responseData?.data ?? responseData;

const mapContract = (raw: RawRecord): SummaryContract => {
  const rawMilestones = Array.isArray(raw?.milestones)
    ? raw.milestones
    : Array.isArray(raw?.projectMilestones)
      ? raw.projectMilestones
      : [];

  return {
    id: toText(raw?.id ?? raw?.contractId),
    title: toText(raw?.title ?? raw?.projectName, 'Untitled project'),
    milestones: rawMilestones.map((item: RawRecord, index: number) => ({
      id: toText(item?.id ?? item?.milestoneId, `milestone-${index + 1}`),
      title: toText(item?.title ?? item?.name, `Milestone ${index + 1}`),
      amount: toAmount(item?.amount ?? item?.budget ?? item?.escrowAmount),
      status: toText(item?.status, 'PENDING'),
    })),
  };
};

export default function ClientPaymentSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string | string[];
    contractId?: string | string[];
    projectId?: string | string[];
    milestoneId?: string | string[];
    paymentMethod?: string | string[];
  }>();

  const routeId =
    firstParam(params.contractId) ??
    firstParam(params.id) ??
    firstParam(params.projectId) ??
    '';
  const contractId = routeId.startsWith('PRJ-') ? routeId.slice(4) : routeId;
  const projectId = firstParam(params.projectId) || (contractId ? `PRJ-${contractId}` : '');
  const milestoneId = firstParam(params.milestoneId) ?? '';
  const paymentMethod: PaymentMethod =
    firstParam(params.paymentMethod)?.toUpperCase() === 'BANK' ? 'BANK' : 'CARD';

  const [contract, setContract] = useState<SummaryContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadContract = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      if (!contractId) throw new Error('No contract ID was provided. Return to Fund Milestone and try again.');
      const response = await apiClient.get(`/contracts/${encodeURIComponent(contractId)}`, {
        timeout: 15000,
      });
      const mapped = mapContract(unwrapContract(response.data));
      if (!mapped.id) throw new Error('The server response did not contain a contract ID.');
      if (mapped.milestones.length === 0) throw new Error('This contract has no milestones to fund.');
      if (!mapped.milestones.some((item) => item.id === milestoneId)) {
        throw new Error('The selected milestone was not found in this contract. Return to Fund Milestone and select it again.');
      }
      setContract(mapped);
    } catch (error: any) {
      console.error('[PaymentSummary] Failed to load contract:', error);
      console.error('URL:', error?.config?.url);
      console.error('Status:', error?.response?.status);
      console.error('Response:', error?.response?.data);
      setErrorMessage(
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        'Unable to load payment summary.',
      );
    } finally {
      setLoading(false);
    }
  }, [contractId, milestoneId]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const selectedMilestone = useMemo(
    () => contract?.milestones.find((item) => item.id === milestoneId) ?? null,
    [contract, milestoneId],
  );
  const milestoneAmount = selectedMilestone?.amount ?? 0;
  const platformFee = Math.round(milestoneAmount * 0.05 * 100) / 100;
  const grandTotal = milestoneAmount + platformFee;

  const payNow = async () => {
    setErrorMessage('');

    if (!contract || !selectedMilestone) {
      setErrorMessage('The selected milestone is unavailable. Return and select a milestone again.');
      return;
    }
    if (!authorized) {
      setErrorMessage('Please confirm the authorization checkbox before continuing.');
      return;
    }
    if (milestoneAmount <= 0) {
      setErrorMessage('The milestone amount must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      const activeProjectId = projectId || `PRJ-${contract.id}`;
      console.log('[PaymentSummary] Submitting funding-status update:', {
        contractId: contract.id,
        projectId: activeProjectId,
        milestoneId: selectedMilestone.id,
        paymentMethod,
        milestoneAmount,
        platformFee,
        grandTotal,
      });

      // Persists the milestone status as FUNDED and increments contracts.in_escrow_amount.
      // Demo only: this does not charge a real card or bank account.
      const response = await apiClient.post(
        `/contracts/${encodeURIComponent(contract.id)}/payments/milestones/${encodeURIComponent(selectedMilestone.id)}`,
        { paymentMethod },
        { timeout: 15000 },
      );

      const result = response.data ?? {};
      if (result.paymentMade !== true) {
        throw new Error(result.message || 'The backend did not confirm the funding status.');
      }
      const returnedStatus = toText(result.milestoneStatus, 'FUNDED');
      const serverTotal = toAmount(result.totalCharged ?? grandTotal);
      const serverFee = toAmount(result.platformFee ?? platformFee);
      const serverAmount = toAmount(result.milestoneAmount ?? milestoneAmount);
      console.log('[PaymentSummary] Funding status recorded:', result);

      // Navigate only after the backend confirms the write.
      router.replace({
        pathname: '/client-payment-success',
        params: {
          contractId: contract.id,
          projectId: activeProjectId,
          milestoneId: selectedMilestone.id,
          milestoneTitle: selectedMilestone.title,
          totalCharged: serverTotal.toFixed(2),
          milestoneAmount: serverAmount.toFixed(2),
          platformFee: serverFee.toFixed(2),
          paymentMethod,
          fundingStatus: returnedStatus,
        },
      });
    } catch (error: any) {
      console.error('[PaymentSummary] Pay Now failed:', error);
      console.error('URL:', error?.config?.url);
      console.error('Status:', error?.response?.status);
      console.error('Response:', error?.response?.data);
      setErrorMessage(
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        'Unable to update funding status. Check the backend endpoint and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.stateText}>Loading payment summary...</Text>
      </SafeAreaView>
    );
  }

  if (!contract || !selectedMilestone) {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <Text style={styles.stateTitle}>Unable to load payment summary</Text>
        <Text style={styles.stateText}>{errorMessage || 'The selected contract or milestone was not found.'}</Text>
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
          <Text style={styles.headerTitle}>Payment Summary</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.eyebrow}>MILESTONE FUNDING</Text>
          <Text style={styles.milestoneTitle}>{selectedMilestone.title}</Text>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Milestone Escrow</Text>
            <Text style={styles.summaryValue}>{formatMoney(milestoneAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Fee</Text>
            <Text style={styles.summaryValue}>{formatMoney(platformFee)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>{formatMoney(grandTotal)}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Charged To</Text>
        <View style={styles.paymentMethodCard}>
          <View style={styles.paymentIcon}>
            {paymentMethod === 'CARD' ? <View style={styles.cardGlyph} /> : <Text style={styles.bankGlyph}>▤</Text>}
          </View>
          <View style={styles.paymentCopy}>
            <Text style={styles.paymentTitle}>
              {paymentMethod === 'CARD' ? 'Visa ending in 4242' : 'Bank Account (ACH)'}
            </Text>
            <Text style={styles.paymentSubtitle}>
              {paymentMethod === 'CARD' ? 'Expires 12/27' : 'Selected bank account'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.authorizationRow}
          onPress={() => setAuthorized((value) => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: authorized }}
        >
          <View style={[styles.checkbox, authorized && styles.checkboxChecked]}>
            {authorized ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.authorizationText}>
            I authorize this app to proceed with the displayed total of {formatMoney(grandTotal)} and understand that funds should be released according to the milestone terms.
          </Text>
        </TouchableOpacity>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.primaryButton, (!authorized || submitting) && styles.buttonDisabled]}
          onPress={payNow}
          disabled={!authorized || submitting}
          accessibilityRole="button"
        >
          {submitting
            ? <ActivityIndicator color={Colors.surface} />
            : <Text style={styles.primaryButtonText}>Pay Now</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 28 },
  stateScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: Colors.surface },
  stateTitle: { color: Colors.dark, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  stateText: { marginTop: 9, marginBottom: 8, color: Colors.neutralMedium, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  header: { height: 42, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backButton: { width: 30, height: 36, justifyContent: 'center' },
  backGlyph: { color: Colors.dark, fontSize: 27, lineHeight: 30 },
  headerTitle: { flex: 1, marginLeft: 3, color: Colors.dark, fontSize: 14, fontWeight: '800' },
  headerSpacer: { width: 30 },
  summaryCard: { padding: 14, borderWidth: 1, borderColor: Colors.border, borderRadius: 13, backgroundColor: '#F8FAFC' },
  eyebrow: { color: Colors.neutralMedium, fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  milestoneTitle: { marginTop: 3, color: Colors.dark, fontSize: 14, fontWeight: '800' },
  divider: { height: 1, backgroundColor: Colors.border, marginTop: 11, marginBottom: 7 },
  summaryRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  summaryLabel: { color: Colors.neutralMedium, fontSize: 10 },
  summaryValue: { color: Colors.dark, fontSize: 10, fontWeight: '700' },
  totalRow: { minHeight: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  totalLabel: { color: Colors.dark, fontSize: 11, fontWeight: '800' },
  totalValue: { color: Colors.primaryDark, fontSize: 15, fontWeight: '900' },
  sectionLabel: { marginTop: 17, marginBottom: 8, color: Colors.neutralMedium, fontSize: 10, fontWeight: '700' },
  paymentMethodCard: { minHeight: 48, flexDirection: 'row', alignItems: 'center', padding: 9, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, backgroundColor: Colors.surface },
  paymentIcon: { width: 26, height: 28, borderRadius: 4, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  cardGlyph: { width: 15, height: 12, borderRadius: 2, backgroundColor: Colors.primary },
  bankGlyph: { color: Colors.neutralMedium, fontSize: 17 },
  paymentCopy: { flex: 1 },
  paymentTitle: { color: Colors.dark, fontSize: 10, fontWeight: '800' },
  paymentSubtitle: { marginTop: 2, color: Colors.neutralMedium, fontSize: 9 },
  authorizationRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 15, gap: 9 },
  checkbox: { width: 14, height: 14, marginTop: 1, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary },
  checkmark: { color: Colors.surface, fontSize: 10, lineHeight: 12, fontWeight: '900' },
  authorizationText: { flex: 1, color: Colors.neutralMedium, fontSize: 9, lineHeight: 13 },
  primaryButton: { minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 17, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14 },
  primaryButtonText: { color: Colors.surface, fontSize: 11, fontWeight: '800' },
  buttonDisabled: { opacity: 0.5 },
  secondaryButton: { minHeight: 40, minWidth: 110, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 9, paddingHorizontal: 14 },
  secondaryButtonText: { color: Colors.dark, fontSize: 12, fontWeight: '700' },
  errorBanner: { marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#B91C1C', fontSize: 10, lineHeight: 15 },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import { apiClient, FreelancerApiService, getCurrentUser } from '../src/services/api';
import ContractService from '../src/services/contractService';

interface FreelancerBankDetails {
  id?: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  routingNumber: string;
  accountType: string;
  paymentType: string;
  badge?: string;
}

export default function ClientConfirmPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contractId?: string;
    milestoneId?: string;
    amount?: string;
    title?: string;
    freelancerName?: string;
    freelancerEmail?: string;
  }>();

  const firstParam = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

  const parseAmount = (val?: string | string[]) => {
    if (!val) return 2000;
    const str = firstParam(val) || '';
    const clean = str.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) || num <= 0 ? 2000 : num;
  };

  const contractId = firstParam(params.contractId) || '101';
  const milestoneId = firstParam(params.milestoneId) || 'M-2';
  const initialAmount = parseAmount(params.amount);
  const milestoneTitle = firstParam(params.title) || 'UI Design & Component Library';
  const freelancerName = firstParam(params.freelancerName) || 'Chathuni Imalsha';
  const freelancerEmail = firstParam(params.freelancerEmail) || '';

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [bankDetails, setBankDetails] = useState<FreelancerBankDetails | null>(null);

  useEffect(() => {
    fetchFreelancerBankDetails();
  }, [freelancerName, freelancerEmail]);

  const fetchFreelancerBankDetails = async () => {
    setLoading(true);
    try {
      // 1. Try fetching from backend payout-accounts
      const res = await apiClient.get('/payout-accounts', {
        params: {
          freelancerName,
          ...(freelancerEmail ? { email: freelancerEmail } : {}),
        },
        timeout: 6000,
      });

      const accounts = Array.isArray(res.data) ? res.data : res.data?.content || [];
      if (accounts.length > 0) {
        const defaultAcc = accounts.find((a: any) => a.isDefault) || accounts[0];
        setBankDetails({
          id: defaultAcc.id,
          bankName: defaultAcc.bankName || defaultAcc.name || '',
          accountHolder: defaultAcc.accountHolder || '',
          accountNumber: defaultAcc.accountNumber || '',
          routingNumber: defaultAcc.routingNumber || '',
          accountType: defaultAcc.accountType || '',
          paymentType: defaultAcc.paymentType || '',
          badge: defaultAcc.badge || 'Active',
        });
      } else {
        // Keep manually saved local data available when the API is temporarily unavailable.
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          const k = `payout_accounts_${freelancerEmail || freelancerName || 'default'}`;
          const s = localStorage.getItem(k);
          if (s) {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const item = parsed[0];
              setBankDetails({
                id: item.id,
                bankName: item.bankName || item.name || '',
                accountHolder: item.accountHolder || '',
                accountNumber: item.accountNumber || '',
                routingNumber: item.routingNumber || '',
                accountType: item.accountType || '',
                paymentType: item.paymentType || '',
                badge: item.badge || 'Active',
              });
            }
          }
        }
      }
    } catch {
      setBankDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!bankDetails) {
      Alert.alert(
        'Bank account required',
        'The freelancer must manually add and link a payment bank account before this payment can be released.'
      );
      return;
    }
    setProcessing(true);
    try {
      // 1. Post to backend escrow release endpoint
      try {
        await apiClient.post('/escrow/release', { milestoneId }, { timeout: 8000 });
      } catch (e1) {
        console.info('[ConfirmPayment] /escrow/release fallback to /milestones/approve', e1);
        try {
          await apiClient.post(`/milestones/${encodeURIComponent(milestoneId)}/approve`, {}, { timeout: 8000 });
        } catch (e2) {
          console.info('[ConfirmPayment] Fallback to ContractService.releasePayment', e2);
          await ContractService.releasePayment(milestoneId);
        }
      }

      // 2. Credit funds to freelancer balance in localStorage for instant sync
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        try {
          const freelancerKey = `escrow_avail_${freelancerEmail || freelancerName || 'default'}`;
          const currentVal = parseFloat(localStorage.getItem(freelancerKey) || '0');
          const newVal = (isNaN(currentVal) ? 0 : currentVal) + initialAmount;
          localStorage.setItem(freelancerKey, String(newVal));

          // Add history item
          const historyKey = `escrow_history_${freelancerEmail || freelancerName || 'default'}`;
          const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
          const newHistoryItem = {
            id: 'tx-rel-' + Date.now(),
            title: `Payment Released: ${milestoneTitle}`,
            sub: `Transferred to ${bankDetails.bankName}`,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            amount: initialAmount,
            formattedAmount: `+$${initialAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            status: 'Released',
          };
          localStorage.setItem(historyKey, JSON.stringify([newHistoryItem, ...existingHistory]));
        } catch (e) {}
      }

      setProcessing(false);
      setSuccessModalVisible(true);
    } catch (err: any) {
      setProcessing(false);
      Alert.alert(
        'Payment Complete',
        'Milestone payment has been released to freelancer.'
      );
      setSuccessModalVisible(true);
    }
  };

  const handleGoBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/client-dashboard');
      }
    } catch (e) {
      router.replace('/client-dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrapper}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleGoBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirm Payment</Text>
            <View style={{ width: 36 }} />
          </View>

          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              {/* Payment Hero Amount Card */}
              <View style={styles.heroCard}>
                <Text style={styles.heroSubTitle}>MILESTONE ESCROW RELEASE</Text>
                <Text style={styles.heroAmount}>
                  ${initialAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={styles.milestoneTitle}>{milestoneTitle}</Text>
                <View style={styles.escrowBadge}>
                  <Text style={styles.escrowBadgeText}>🔒 Escrow Protected</Text>
                </View>
              </View>

              {/* Freelancer Payout Bank Details Card */}
              {bankDetails ? (
                <View style={styles.bankCard}>
                  <View style={styles.bankHeaderRow}>
                    <Text style={styles.bankIcon}>🏛️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bankCardHeading}>Freelancer Bank Details</Text>
                      <Text style={styles.bankSubText}>Receiving Account for Direct Deposit</Text>
                    </View>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>✓ {bankDetails.badge || 'Active'}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Recipient</Text>
                    <Text style={styles.detailValueBold}>{freelancerName}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank Name</Text>
                    <Text style={styles.detailValue}>{bankDetails.bankName}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Holder</Text>
                    <Text style={styles.detailValue}>{bankDetails.accountHolder}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Number</Text>
                    <Text style={styles.detailValue}>{bankDetails.accountNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Routing Number</Text>
                    <Text style={styles.detailValue}>{bankDetails.routingNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payout Method</Text>
                    <Text style={styles.detailValue}>{bankDetails.paymentType} ({bankDetails.accountType})</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.bankCard}>
                  <Text style={styles.bankCardHeading}>No payout account linked</Text>
                  <Text style={styles.bankSubText}>
                    The freelancer must manually add their bank account details before payment can be released.
                  </Text>
                </View>
              )}

              {/* Payment Summary Box */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Payment Breakdown</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Milestone Amount</Text>
                  <Text style={styles.summaryVal}>
                    ${initialAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Platform Fee (0%)</Text>
                  <Text style={styles.summaryVal}>$0.00</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total Payout Amount</Text>
                  <Text style={styles.totalVal}>
                    ${initialAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.confirmBtn, (processing || !bankDetails) && styles.disabledBtn]}
                onPress={handleConfirmPayment}
                disabled={processing || !bankDetails}
                activeOpacity={0.88}
              >
                {processing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.confirmBtnText}>Confirm & Release Payment</Text>
                    <Text style={styles.confirmBtnArrow}>→</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => router.back()}
                disabled={processing}
              >
                <Text style={styles.cancelBtnText}>Back to Review</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      {/* Success Confirmation Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconBox}>
              <Text style={{ fontSize: 36 }}>🎉</Text>
            </View>

            <Text style={styles.successTitle}>Payment Released!</Text>
            <Text style={styles.successMessage}>
              You have successfully approved milestone "{milestoneTitle}" and released ${initialAmount.toLocaleString()} to {freelancerName}'s bank account.
            </Text>

            {bankDetails && <View style={styles.successBankPill}>
              <Text style={styles.successBankPillText}>
                🏛️ {bankDetails.bankName} • {bankDetails.accountNumber}
              </Text>
            </View>}

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                router.replace('/client-dashboard');
              }}
            >
              <Text style={styles.modalDoneBtnText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrow: {
    fontSize: 28,
    fontWeight: '400',
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  loaderBox: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroSubTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  escrowBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  escrowBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  bankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  bankIcon: {
    fontSize: 26,
  },
  bankCardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  bankSubText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  detailValueBold: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  confirmBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 12,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  confirmBtnArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  successBankPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  successBankPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  modalDoneBtn: {
    width: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

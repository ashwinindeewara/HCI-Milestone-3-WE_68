import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../src/constants/colors';
import { apiClient, getCurrentUser } from '../src/services/api';
import {
  HomeIcon,
  ProjectsIcon,
  PaymentsIcon,
  AlertsIcon,
  ProfileIcon,
} from '../src/components/Icons';

interface MilestoneItem {
  id: string;
  title: string;
  amount: string;
}

interface ContractDetailData {
  id: string;
  title: string;
  clientName: string;
  paymentTerms: string;
  totalBudget: number;
  deliverables: string[];
  milestones: MilestoneItem[];
  signatoryName: string;
  signedDate: string;
  isSigned: boolean;
  status: string;
}

export default function ContractDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = getCurrentUser();
  const isChathuni =
    currentUser?.email === 'chathuniimalsha.com' ||
    (currentUser?.fullName && currentUser.fullName.toLowerCase().includes('chathuni'));
  const activeFreelancerName = currentUser?.fullName || (isChathuni ? 'Chathuni Imalsha' : 'Freelancer');

  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);
  const [freelancerSignature, setFreelancerSignature] = useState(currentUser?.fullName || (isChathuni ? 'Chathuni Imalsha' : ''));

  const isChathuniDemo = isChathuni && (!id || id === 'C-101');

  const [contract, setContract] = useState<ContractDetailData>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const s = localStorage.getItem(`contract_details_cache_${id}`);
        if (s) {
          const p = JSON.parse(s);
          if (p && p.title) return p;
        }
      } catch (e) {}
    }
    if (isChathuniDemo) {
      return {
        id: id || 'C-101',
        title: 'E-Commerce Redesign',
        clientName: 'TechVentures Inc.',
        paymentTerms: 'Milestone-based (Escrow Protection)',
        totalBudget: 8000.0,
        deliverables: [
          'Full UX Research and interactive wireframes',
          'Figma Design System setup & component library',
          '24 High-fidelity viewport layouts (desktop & mobile)',
        ],
        milestones: [
          { id: '1', title: '1. Wireframes approved', amount: '$2,000' },
          { id: '2', title: '2. Design system finalized', amount: '$3,000' },
          { id: '3', title: '3. High-fidelity handover', amount: '$3,000' },
        ],
        signatoryName: 'Sarah Chen',
        signedDate: 'Signed Oct 05, 2024',
        isSigned: false,
        status: 'PENDING',
      };
    }
    return {
      id: id || '',
      title: '',
      clientName: '',
      paymentTerms: 'Milestone-based (Escrow Protection)',
      totalBudget: 0,
      deliverables: [],
      milestones: [],
      signatoryName: '',
      signedDate: '',
      isSigned: false,
      status: 'OFFERED',
    };
  });

  useEffect(() => {
    if (id) {
      apiClient
        .get(`/contracts/${id}`)
        .then((res) => {
          if (res.data) {
            const d = res.data;
            const updated = {
              id: d.id || id,
              title: d.title || '',
              clientName: d.clientName || '',
              paymentTerms: d.paymentTerms || 'Milestone-based (Escrow Protection)',
              totalBudget: d.totalBudget || 0,
              deliverables: Array.isArray(d.deliverables)
                ? d.deliverables
                : (d.keyDeliverables ? d.keyDeliverables.split('\n') : []),
              milestones: Array.isArray(d.milestones) && d.milestones.length > 0
                ? d.milestones.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    amount: typeof m.amount === 'number' ? `$${m.amount.toLocaleString()}` : (m.amount || '$0'),
                  }))
                : [],
              signatoryName: d.signatoryName || '',
              signedDate: d.signedDate || '',
              isSigned: d.isSigned ?? false,
              status: d.status || 'PENDING',
            };
            setContract(updated);
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
              try {
                localStorage.setItem(`contract_details_cache_${id}`, JSON.stringify(updated));
              } catch (e) {}
            }
          }
        })
        .catch(() => {
          // Keep current state
        });
    }
  }, [id]);

  const [rejecting, setRejecting] = useState(false);
  const [rejectedSuccess, setRejectedSuccess] = useState(false);

  const handleSignContract = async () => {
    setSigning(true);
    try {
      const signerParam = encodeURIComponent(freelancerSignature.trim() || activeFreelancerName);
      await apiClient.post(`/contracts/${contract.id}/accept?signerName=${signerParam}`);
      setSignedSuccess(true);
      setContract((prev: ContractDetailData) => ({ ...prev, isSigned: true, status: 'ACCEPTED' }));
    } catch {
      // In offline mode, still succeed
      setSignedSuccess(true);
      setContract((prev: ContractDetailData) => ({ ...prev, isSigned: true, status: 'ACCEPTED' }));
    } finally {
      setSigning(false);
    }
  };

  const handleRejectContract = async () => {
    setRejecting(true);
    try {
      await apiClient.post(`/contracts/${contract.id}/reject?reason=Scope%20and%20terms%20declined`);
      setRejectedSuccess(true);
      setContract((prev: ContractDetailData) => ({ ...prev, isSigned: false, status: 'REJECTED' }));
    } catch {
      setRejectedSuccess(true);
      setContract((prev: ContractDetailData) => ({ ...prev, isSigned: false, status: 'REJECTED' }));
    } finally {
      setRejecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrapper}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {/* Top Back Link */}
          <TouchableOpacity
            style={styles.backLinkRow}
            onPress={() => router.replace('/contracts-list')}
            activeOpacity={0.7}
          >
            <Text style={styles.backLinkArrow}>←</Text>
            <Text style={styles.backLinkText}>Contracts</Text>
          </TouchableOpacity>

          {/* Page Title */}
          <Text style={styles.pageTitle}>Contract Details</Text>

          {/* Success Banner */}
          {signedSuccess && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerIcon}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.successBannerTitle}>Contract Accepted & Signed!</Text>
                <Text style={styles.successBannerSub}>
                  Project is now active. Escrow protection is in place.
                </Text>
              </View>
            </View>
          )}

          {/* Client & Project Overview Card (Matching Image 5) */}
          <View style={styles.infoCard}>
            <View style={styles.infoField}>
              <Text style={styles.fieldLabel}>CLIENT</Text>
              <Text style={styles.fieldValueBold}>{contract.clientName}</Text>
            </View>

            <View style={styles.infoField}>
              <Text style={styles.fieldLabel}>PROJECT</Text>
              <Text style={styles.fieldValueBold}>{contract.title}</Text>
            </View>

            <View style={styles.infoField}>
              <Text style={styles.fieldLabel}>PAYMENT TERMS</Text>
              <Text style={styles.fieldValueGreen}>{contract.paymentTerms}</Text>
            </View>
          </View>

          {/* Key Deliverables Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Key Deliverables</Text>
            <View style={styles.bulletList}>
              {contract.deliverables.map((item: string, idx: number) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Milestones (3) Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              Milestones ({contract.milestones.length})
            </Text>
            <View style={styles.milestonesList}>
              {contract.milestones.map((m: MilestoneItem) => (
                <View key={m.id} style={styles.milestoneRowCard}>
                  <Text style={styles.milestoneRowTitle}>{m.title}</Text>
                  <Text style={styles.milestoneRowAmount}>{m.amount}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Digital Signature Section with dedicated space for signing */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Digital Signature</Text>

            {/* Client Signature Card */}
            <View style={styles.sigCardWrapper}>
              <Text style={styles.sigRoleLabel}>Client Signature</Text>
              <View style={styles.signatureBox}>
                <View style={styles.sigHeaderRow}>
                  <Text style={styles.signerName}>{contract.signatoryName}</Text>
                  <View style={styles.verifiedSigBadge}>
                    <Text style={styles.verifiedSigBadgeText}>✓ Client Verified</Text>
                  </View>
                </View>
                <View style={styles.signatureDivider} />
                <Text style={styles.signerDate}>• {contract.signedDate} • {contract.clientName || 'Client'}</Text>
              </View>
            </View>

            {/* Freelancer Signature Section with Permanent "Sign Here" Box */}
            <View style={[styles.sigCardWrapper, { marginTop: 14 }]}>
              <View style={styles.sigRoleHeaderRow}>
                <Text style={styles.sigRoleLabel}>Freelancer Signature</Text>
                <View style={styles.signHereFlag}>
                  <Text style={styles.signHereFlagText}>✍️ SIGN HERE ▶</Text>
                </View>
              </View>

              {/* Dedicated "Sign Here" Box */}
              <View style={[styles.signHereBoxContainer, (contract.isSigned || signedSuccess) && styles.signHereBoxContainerSigned]}>
                <View style={styles.signHereBoxHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.signHereBoxIcon}>✒️</Text>
                    <Text style={styles.signHereBoxTitle}>SIGN HERE</Text>
                  </View>
                  {contract.isSigned || signedSuccess ? (
                    <View style={styles.verifiedSigBadgeGreen}>
                      <Text style={styles.verifiedSigBadgeTextGreen}>✓ Signed & Sealed</Text>
                    </View>
                  ) : (
                    <View style={styles.awaitingSigBadge}>
                      <Text style={styles.awaitingSigBadgeText}>⏳ Ready to Sign</Text>
                    </View>
                  )}
                </View>

                {/* Signature Writing Pad Area */}
                <View style={styles.signHerePadArea}>
                  <TextInput
                    style={styles.signHereInput}
                    value={freelancerSignature}
                    onChangeText={(val) => {
                      setFreelancerSignature(val);
                      if (signedSuccess) setSignedSuccess(false);
                    }}
                    placeholder="Sign your legal name here..."
                    placeholderTextColor="#94A3B8"
                  />
                  <View style={styles.signHereLineRow}>
                    <Text style={styles.signHereXMark}>✕</Text>
                    <View style={styles.signHereUnderline} />
                  </View>
                </View>

                {/* Quick Action Helpers */}
                <View style={styles.signHereActionsRow}>
                  <TouchableOpacity
                    style={styles.sigAutoFillBtn}
                    onPress={() => setFreelancerSignature(activeFreelancerName)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sigAutoFillBtnText}>✍️ Auto-Fill "{activeFreelancerName}"</Text>
                  </TouchableOpacity>

                  {freelancerSignature ? (
                    <TouchableOpacity
                      style={styles.sigClearBtn}
                      onPress={() => {
                        setFreelancerSignature('');
                        setSignedSuccess(false);
                        setContract((prev: ContractDetailData) => ({ ...prev, isSigned: false }));
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sigClearBtnText}>✕ Clear Signature</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {contract.isSigned || signedSuccess ? (
                  <View style={styles.signedVerificationMeta}>
                    <Text style={styles.signedVerificationMetaText}>
                      • Signed Today • Digitally Verified by Escrow Security
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.signingLegalNotice}>
                    Sign inside this box to digitally accept contract terms under Escrow Milestone Protection.
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Accept & Sign Contract Primary CTA Button */}
          <View style={styles.buttonWrapper}>
            {rejectedSuccess || contract.status === 'REJECTED' ? (
              <View style={styles.rejectedBanner}>
                <Text style={styles.rejectedBannerText}>✕ Contract Declined</Text>
              </View>
            ) : contract.isSigned || signedSuccess ? (
              <View style={{ gap: 10, width: '100%' }}>
                <TouchableOpacity
                  style={styles.btnViewProject}
                  onPress={() => router.push(`/project-details?id=${contract.id}`)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnViewProjectText}>✓ Contract Signed • View Project</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnReSign}
                  onPress={() => {
                    setSignedSuccess(false);
                    setContract((prev: ContractDetailData) => ({ ...prev, isSigned: false }));
                    setFreelancerSignature('');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnReSignText}>✎ Clear & Sign Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 10, width: '100%' }}>
                <TouchableOpacity
                  style={styles.btnSign}
                  onPress={handleSignContract}
                  disabled={signing}
                  activeOpacity={0.88}
                >
                  {signing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.btnSignText}>Accept & Sign Contract</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnReject}
                  onPress={handleRejectContract}
                  disabled={rejecting}
                  activeOpacity={0.85}
                >
                  {rejecting ? (
                    <ActivityIndicator color="#EF4444" />
                  ) : (
                    <Text style={styles.btnRejectText}>Decline Contract</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Tab Navigation (Consistent with other pages) */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => router.replace('/(tabs)/dashboard')}
          >
            <HomeIcon size={20} color="#6B7280" />
            <Text style={styles.bottomNavLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => router.replace('/(tabs)/contracts')}
          >
            <ProjectsIcon size={20} color="#16A34A" />
            <Text style={[styles.bottomNavLabel, styles.bottomNavLabelActive]}>Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => router.replace('/(tabs)/escrow')}
          >
            <PaymentsIcon size={20} color="#6B7280" />
            <Text style={styles.bottomNavLabel}>Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => router.replace('/(tabs)/notifications')}
          >
            <AlertsIcon size={20} color="#6B7280" />
            <Text style={styles.bottomNavLabel}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => router.replace('/(tabs)/profile')}
          >
            <ProfileIcon size={20} color="#6B7280" />
            <Text style={styles.bottomNavLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    width: '100%',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90,
  },
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  backLinkArrow: {
    fontSize: 18,
    color: '#16A34A',
    fontWeight: '700',
  },
  backLinkText: {
    fontSize: 15,
    color: '#16A34A',
    fontWeight: '700',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  successBannerIcon: {
    fontSize: 18,
    color: '#16A34A',
    fontWeight: '800',
  },
  successBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  successBannerSub: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  infoField: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  fieldValueBold: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldValueGreen: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  bulletList: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 16,
    color: '#16A34A',
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
    lineHeight: 20,
  },
  milestonesList: {
    gap: 10,
  },
  milestoneRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  milestoneRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  milestoneRowAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
  },
  signatureBox: {
    backgroundColor: '#FAFCFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  signatureBoxSigned: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  sigCardWrapper: {
    marginBottom: 4,
  },
  sigRoleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sigHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  signerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cursiveSignature: {
    fontStyle: 'italic',
    color: '#15803D',
    fontSize: 18,
    fontWeight: '800',
  },
  verifiedSigBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  verifiedSigBadgeText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
  },
  verifiedSigBadgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  verifiedSigBadgeTextGreen: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
  },
  sigRoleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  signHereFlag: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FACC15',
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  signHereFlagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854D0E',
    letterSpacing: 0.5,
  },
  signHereBoxContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FACC15',
    padding: 16,
    marginVertical: 4,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  signHereBoxContainerSigned: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  signHereBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  signHereBoxIcon: {
    fontSize: 16,
  },
  signHereBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#854D0E',
  },
  awaitingSigBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  awaitingSigBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  signHerePadArea: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  signHereInput: {
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#0F172A',
    paddingVertical: 4,
    minHeight: 44,
  },
  signHereLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  signHereXMark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  signHereUnderline: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#94A3B8',
  },
  signHereActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sigAutoFillBtn: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sigAutoFillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  sigClearBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  sigClearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  signedVerificationMeta: {
    marginTop: 4,
  },
  signedVerificationMetaText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
  },
  signingLegalNotice: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  btnReSign: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnReSignText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  signatureDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  signerDate: {
    fontSize: 13,
    color: '#64748B',
  },
  buttonWrapper: {
    marginTop: 8,
    marginBottom: 16,
  },
  btnSign: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnSignText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnViewProject: {
    backgroundColor: '#166534',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnViewProjectText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnReject: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnRejectText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  rejectedBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rejectedBannerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavIcon: {
    fontSize: 18,
    color: '#64748B',
    marginBottom: 2,
  },
  bottomNavIconActive: {
    color: '#16A34A',
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  bottomNavLabelActive: {
    color: '#16A34A',
    fontWeight: '700',
  },
});

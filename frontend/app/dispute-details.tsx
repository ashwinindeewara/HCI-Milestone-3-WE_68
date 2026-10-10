import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import { apiClient, getCurrentUser } from '../src/services/api';
import {
  HomeIcon,
  ProjectsIcon,
  PaymentsIcon,
  AlertsIcon,
  ProfileIcon,
} from '../src/components/Icons';

interface DiscussionMessage {
  id?: number | string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
}

interface DisputeDetailData {
  id: string;
  dspNumber: string;
  project: string;
  parties: string;
  issueType: string;
  description: string;
  evidenceFile?: string;
  evidenceFilesList?: string[];
  amount: number | string;
  status: string;
  statusType: string;
  filedDate: string;
  timelineStep: number; // 1: Open, 2: Reviewing, 3: Resolved
  messages: DiscussionMessage[];
}

const DEFAULT_DISPUTE_DETAIL: DisputeDetailData = {
  id: 'DSP-409',
  dspNumber: 'DSP-409',
  project: 'E-Commerce Redesign',
  parties: 'TechVentures Inc. vs. Chathuni',
  issueType: 'Payment Delay',
  description:
    'Completed Milestone: UI Design Phase. Deliverable was uploaded on time and approved by client internally, but the payment escrow remains locked.',
  evidenceFilesList: [],
  amount: '$2,400',
  status: 'Under Review',
  statusType: 'review',
  filedDate: 'Oct 10, 2024',
  timelineStep: 2,
  messages: [
    {
      id: 1,
      senderName: 'Sarah',
      senderRole: 'FREELANCER',
      message: 'I have submitted all the design source files. Client approved via Slack chat.',
      timestamp: '10:45 AM',
    },
    {
      id: 2,
      senderName: 'Admin',
      senderRole: 'ADMIN',
      message: 'Understood. We are verifying the timeline with the client. Please hold on.',
      timestamp: '11:20 AM',
    },
  ],
};

const isExampleEvidenceFile = (file: string) => {
  const fileName = file.split(/[\\/]/).pop()?.toLowerCase();
  return fileName === 'contract-agreement.pdf' || fileName === 'approved-screens-specs.png';
};

export default function DisputeDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const disputeId = (params.id as string) || 'DSP-409';
  const currentUser = getCurrentUser();
  const activeViewerName = currentUser?.fullName || 'User';
  const viewerRole = String(currentUser?.role || 'FREELANCER').toUpperCase();
  const isChathuni =
    currentUser?.email === 'chathuniimalsha.com' ||
    (currentUser?.fullName && currentUser.fullName.toLowerCase().includes('chathuni')) ||
    (currentUser?.email && currentUser.email.toLowerCase().includes('chathuni'));
  const isChathuniDemo = isChathuni && disputeId === 'DSP-409';

  const [dispute, setDispute] = useState<DisputeDetailData>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const s = localStorage.getItem(`dispute_detail_cache_${disputeId}`);
        if (s) {
          const p = JSON.parse(s);
          if (p && p.project) {
            return {
              ...p,
              evidenceFilesList: (p.evidenceFilesList || []).filter(
                (file: string) => !isExampleEvidenceFile(file)
              ),
            };
          }
        }
      } catch (e) {}
    }
    if (isChathuniDemo) {
      return DEFAULT_DISPUTE_DETAIL;
    }
    return {
      id: disputeId,
      dspNumber: disputeId,
      project: 'Dispute Case',
      parties: 'Client vs. Freelancer',
      issueType: 'Payment Delay',
      description: '',
      evidenceFilesList: [],
      amount: '$0',
      status: 'Under Review',
      statusType: 'review',
      filedDate: 'Recently',
      timelineStep: 2,
      messages: [],
    };
  });
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const fetchDisputeDetails = async () => {
    try {
      const res = await apiClient.get(`/disputes/${disputeId}`, {
        params: {
          viewerName: activeViewerName,
          viewerEmail: currentUser?.email || '',
          role: viewerRole,
        },
      });
      if (res.data) {
        const d = res.data;
        const formatted: DisputeDetailData = {
          id: d.id || disputeId,
          dspNumber: d.dspNumber || disputeId,
          project: d.project || (isChathuniDemo ? 'E-Commerce Redesign' : 'Dispute Case'),
          parties: d.parties || 'Client vs. Freelancer',
          issueType: d.issueType || 'Payment Delay',
          description: d.description || (isChathuniDemo ? DEFAULT_DISPUTE_DETAIL.description : ''),
          evidenceFilesList:
            d.evidenceFilesList && d.evidenceFilesList.length > 0
              ? d.evidenceFilesList.filter((file: string) => !isExampleEvidenceFile(file))
              : [],
          amount: typeof d.amount === 'number' ? `$${d.amount.toLocaleString()}` : (d.amount || (isChathuniDemo ? '$2,400' : '$0')),
          status: d.status || 'Under Review',
          statusType: d.statusType || 'review',
          filedDate: d.filedDate ? d.filedDate.replace('Filed ', '') : (d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recently'),
          timelineStep: d.timelineStep || (d.status === 'Resolved' ? 3 : d.status === 'Open' ? 1 : 2),
          messages:
            d.messages && d.messages.length > 0
              ? d.messages
              : (isChathuniDemo ? DEFAULT_DISPUTE_DETAIL.messages : []),
        };
        setDispute(formatted);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          try {
            localStorage.setItem(`dispute_detail_cache_${disputeId}`, JSON.stringify(formatted));
          } catch (e) {}
        }
      }
    } catch {
      console.warn('Fallback offline dispute detail view');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputeDetails();
  }, [disputeId]);

  const handleSendMessage = async () => {
    if (!replyText.trim()) return;

    const newMsgText = replyText.trim();
    setReplyText('');
    setIsSending(true);

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localMsg: DiscussionMessage = {
      senderName: activeViewerName,
      senderRole: viewerRole,
      message: newMsgText,
      timestamp: timeNow,
    };

    setDispute((prev) => ({
      ...prev,
      messages: [...prev.messages, localMsg],
    }));

    try {
      await apiClient.post(`/disputes/${disputeId}/messages`, {
        senderName: activeViewerName,
        senderRole: viewerRole,
        message: newMsgText,
      });
    } catch (e: any) {
      console.warn('Sent message stored locally:', e.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadFile = (fileName: string) => {
    setDownloadToast(`Downloaded ${fileName}`);
    setTimeout(() => {
      setDownloadToast(null);
    }, 2500);
  };

  const handleRemoveEvidence = (fileName: string) => {
    setDispute((prev) => ({
      ...prev,
      evidenceFilesList: (prev.evidenceFilesList || []).filter((f) => f !== fileName),
    }));
    setDownloadToast(`Removed ${fileName}`);
    setTimeout(() => {
      setDownloadToast(null);
    }, 2500);
  };

  const isReview = dispute.statusType === 'review' || dispute.status === 'Under Review';
  const isOpen = dispute.statusType === 'open' || dispute.status === 'Open';
  const isResolved = dispute.statusType === 'resolved' || dispute.status === 'Resolved';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.replace(
                viewerRole === 'CLIENT' ? '/client-disputes' : '/freelancer-disputes'
              )}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Dispute Details</Text>
            <View style={{ width: 36 }} />
          </View>

          {downloadToast && (
            <View style={styles.toastNotice}>
              <Text style={styles.toastNoticeText}>✓ {downloadToast}</Text>
            </View>
          )}

          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              {/* Top Summary Card Matching Screenshot 3 */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryTopRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      isReview ? styles.badgeReview : isOpen ? styles.badgeOpen : styles.badgeResolved,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isReview ? styles.textReview : isOpen ? styles.textOpen : styles.textResolved,
                      ]}
                    >
                      {dispute.status}
                    </Text>
                  </View>
                  <Text style={styles.amountText}>{dispute.amount}</Text>
                </View>

                <Text style={styles.projectTitle}>{dispute.project}</Text>
                <Text style={styles.subtitleText}>
                  {dispute.issueType} <Text style={styles.dotSeparator}>•</Text> {dispute.filedDate}
                </Text>
              </View>

              {/* Section 1: Description */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>Description</Text>
                <Text style={styles.bodyParagraph}>{dispute.description}</Text>
              </View>

              {/* Section 2: Attached Evidence */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>Attached Evidence</Text>
                <View style={styles.evidenceList}>
                  {(dispute.evidenceFilesList || []).map((file, idx) => (
                    <View key={idx} style={styles.evidenceRow}>
                      <TouchableOpacity
                        style={styles.evidenceLeft}
                        onPress={() => handleDownloadFile(file)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.paperclipIcon}>📎</Text>
                        <Text style={styles.evidenceFileName} numberOfLines={1}>
                          {file}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.evidenceActionsRow}>
                        <TouchableOpacity
                          style={styles.downloadIconBox}
                          onPress={() => handleDownloadFile(file)}
                          activeOpacity={0.7}
                          accessibilityLabel={`Download ${file}`}
                        >
                          <Text style={styles.downloadIcon}>⤓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.crossEvidenceBtn}
                          onPress={() => handleRemoveEvidence(file)}
                          activeOpacity={0.7}
                          accessibilityLabel={`Remove ${file}`}
                        >
                          <Text style={styles.crossEvidenceIcon}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  {(!dispute.evidenceFilesList || dispute.evidenceFilesList.length === 0) && (
                    <Text style={styles.emptyEvidenceText}>No evidence files attached.</Text>
                  )}
                </View>
              </View>

              {/* Section 3: Discussion Thread */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>Discussion Thread</Text>
                <View style={styles.messagesList}>
                  {dispute.messages.length === 0 ? (
                    <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                      <Text style={{ color: '#94A3B8', fontSize: 13 }}>No messages in this dispute discussion yet.</Text>
                    </View>
                  ) : (
                    dispute.messages.map((msg, index) => {
                    const isFreelancer =
                      msg.senderRole === 'FREELANCER' ||
                      msg.senderName === activeViewerName ||
                      msg.senderName === 'Sarah' ||
                      msg.senderName === 'Chathuni';
                    return (
                      <View
                        key={index}
                        style={[
                          styles.messageBubble,
                          isFreelancer ? styles.bubbleFreelancer : styles.bubbleAdmin,
                        ]}
                      >
                        <Text style={styles.messageContentText}>{msg.message}</Text>
                        <Text style={styles.messageMetaText}>
                          {msg.senderName} <Text style={styles.dotSeparator}>•</Text> {msg.timestamp}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>

                {/* Reply Input Bar */}
                <View style={styles.replyBar}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Type a response to this dispute..."
                    placeholderTextColor="#94A3B8"
                    value={replyText}
                    onChangeText={setReplyText}
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, (!replyText.trim() || isSending) && styles.sendBtnDisabled]}
                    onPress={handleSendMessage}
                    disabled={!replyText.trim() || isSending}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sendBtnText}>➤</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Section 4: Timeline Status */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>Timeline Status</Text>
                <View style={styles.timelineRow}>
                  {/* Step 1: Open */}
                  <View style={styles.timelineStep}>
                    <View style={[styles.timelineDot, styles.timelineDotActiveGreen]} />
                    <Text style={[styles.timelineLabel, styles.timelineLabelGreen]}>Open</Text>
                  </View>

                  {/* Line 1 */}
                  <View
                    style={[
                      styles.timelineLine,
                      dispute.timelineStep >= 2 ? styles.timelineLineActiveGreen : styles.timelineLineInactive,
                    ]}
                  />

                  {/* Step 2: Reviewing */}
                  <View style={styles.timelineStep}>
                    <View
                      style={[
                        styles.timelineDot,
                        dispute.timelineStep >= 2 ? styles.timelineDotActiveAmber : styles.timelineDotInactive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.timelineLabel,
                        dispute.timelineStep >= 2 ? styles.timelineLabelAmber : styles.timelineLabelMuted,
                      ]}
                    >
                      Reviewing
                    </Text>
                  </View>

                  {/* Line 2 */}
                  <View
                    style={[
                      styles.timelineLine,
                      dispute.timelineStep >= 3 ? styles.timelineLineActiveGreen : styles.timelineLineInactive,
                    ]}
                  />

                  {/* Step 3: Resolved */}
                  <View style={styles.timelineStep}>
                    <View
                      style={[
                        styles.timelineDot,
                        dispute.timelineStep >= 3 ? styles.timelineDotActiveGreen : styles.timelineDotInactive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.timelineLabel,
                        dispute.timelineStep >= 3 ? styles.timelineLabelGreen : styles.timelineLabelMuted,
                      ]}
                    >
                      Resolved
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomTabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/dashboard')}>
            <HomeIcon size={20} color="#16A34A" focused={true} />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/contracts')}>
            <ProjectsIcon size={20} color="#64748B" />
            <Text style={styles.tabLabel}>Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/escrow')}>
            <PaymentsIcon size={20} color="#64748B" />
            <Text style={styles.tabLabel}>Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/notifications')}>
            <AlertsIcon size={20} color="#64748B" />
            <Text style={styles.tabLabel}>Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/profile')}>
            <ProfileIcon size={20} color="#64748B" />
            <Text style={styles.tabLabel}>Profile</Text>
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
    paddingTop: 14,
    paddingBottom: 90,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  toastNotice: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    alignItems: 'center',
  },
  toastNoticeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  loaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeReview: {
    backgroundColor: '#FEF3C7',
  },
  textReview: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeOpen: {
    backgroundColor: '#FEE2E2',
  },
  textOpen: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeResolved: {
    backgroundColor: '#DCFCE7',
  },
  textResolved: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  projectTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
  },
  dotSeparator: {
    color: '#94A3B8',
    marginHorizontal: 4,
  },
  sectionContainer: {
    marginBottom: 22,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  bodyParagraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    fontWeight: '400',
  },
  evidenceList: {
    gap: 10,
  },
  evidenceRow: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  evidenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  paperclipIcon: {
    fontSize: 16,
    color: '#64748B',
  },
  evidenceFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
  },
  evidenceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  downloadIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIcon: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
  },
  crossEvidenceBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossEvidenceIcon: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyEvidenceText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  messagesList: {
    gap: 12,
    marginBottom: 12,
  },
  messageBubble: {
    borderRadius: 14,
    padding: 14,
  },
  bubbleFreelancer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  bubbleAdmin: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageContentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0F172A',
    fontWeight: '400',
    marginBottom: 6,
  },
  messageMetaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  replyInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#0F172A',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  timelineStep: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 6,
  },
  timelineDotActiveGreen: {
    backgroundColor: '#16A34A',
  },
  timelineDotActiveAmber: {
    backgroundColor: '#F59E0B',
  },
  timelineDotInactive: {
    backgroundColor: '#CBD5E1',
  },
  timelineLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  timelineLabelGreen: {
    color: '#16A34A',
  },
  timelineLabelAmber: {
    color: '#D97706',
  },
  timelineLabelMuted: {
    color: '#94A3B8',
  },
  timelineLine: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
    marginBottom: 18,
  },
  timelineLineActiveGreen: {
    backgroundColor: '#16A34A',
  },
  timelineLineInactive: {
    backgroundColor: '#E2E8F0',
  },
  bottomTabBar: {
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
    paddingBottom: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#16A34A',
    fontWeight: '700',
  },
});

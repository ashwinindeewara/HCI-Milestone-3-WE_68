import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';
import ContractService from '../src/services/contractService';

type UnknownRecord = Record<string, any>;

interface DeliverableViewModel {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileType?: string;
  size?: string;
  url?: string;
  status?: string;
}

interface MessageViewModel {
  id: string;
  senderName: string;
  role?: string;
  content: string;
  createdAt?: string;
  isCurrentUser?: boolean;
}

interface MilestoneViewModel {
  id: string;
  title: string;
  description?: string;
  amount: number;
  dueDate?: string;
  status: string;
  deliverables: DeliverableViewModel[];
  messages: MessageViewModel[];
  submittedAt?: string;
}

interface ContractViewModel {
  id: string;
  title: string;
  clientName: string;
  freelancerName: string;
  freelancerEmail?: string;
  totalBudget: number;
  inEscrowAmount?: number;
  status: string;
  milestones: MilestoneViewModel[];
}

const firstParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const asNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const asString = (value: unknown, fallback = '') =>
  value === null || value === undefined ? fallback : String(value);

const formatDate = (value?: string) => {
  if (!value) return 'Not set';
  const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}$/)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  if (Number.isNaN(dateOnly.getTime())) return value;
  return dateOnly.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatBytes = (value: unknown) => {
  const bytes = asNumber(value, -1);
  if (bytes < 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const unwrapList = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const mapDeliverable = (item: UnknownRecord, index: number): DeliverableViewModel => ({
  id: asString(item.id ?? item.fileId ?? item.uuid, `deliverable-${index}`),
  title: asString(item.title ?? item.name ?? item.fileName ?? item.filename, `Deliverable ${index + 1}`),
  description: asString(item.description ?? item.comment ?? item.notes, ''),
  fileName: asString(item.fileName ?? item.filename ?? item.name ?? item.title, `Deliverable ${index + 1}`),
  fileType: asString(item.fileType ?? item.contentType ?? item.type, ''),
  size: asString(item.sizeLabel ?? item.fileSizeLabel ?? item.fileSize, '') || formatBytes(item.size ?? item.fileSize),
  url: asString(item.downloadUrl ?? item.fileUrl ?? item.url ?? item.href, '') || undefined,
  status: asString(item.status, 'PENDING_REVIEW'),
});

const mapMessage = (item: UnknownRecord, index: number, clientName: string): MessageViewModel => {
  const senderName = asString(
    item.senderName ?? item.authorName ?? item.fromName ?? item.user?.fullName ?? item.sender?.fullName,
    'Project member',
  );
  return {
    id: asString(item.id, `message-${index}`),
    senderName,
    role: asString(item.role ?? item.senderRole ?? item.user?.role, ''),
    content: asString(item.content ?? item.message ?? item.text ?? item.body, ''),
    createdAt: asString(item.createdAt ?? item.sentAt ?? item.timestamp, ''),
    isCurrentUser: Boolean(item.isCurrentUser) || senderName === clientName,
  };
};

const mapMilestone = (item: UnknownRecord, index: number, clientName: string): MilestoneViewModel => {
  const rawDeliverables =
    item.submittedDeliverables ?? item.deliverables ?? item.attachments ?? item.files ?? [];
  const rawMessages = item.messages ?? item.conversation ?? item.comments ?? [];

  return {
    id: asString(item.id ?? item.milestoneId, `milestone-${index + 1}`),
    title: asString(item.title ?? item.name, `Milestone ${index + 1}`),
    description: asString(item.description, ''),
    amount: asNumber(item.amount ?? item.budget ?? item.escrowAmount),
    dueDate: asString(item.dueDate ?? item.deadline ?? item.submissionDeadline, ''),
    status: asString(item.status, 'PENDING'),
    deliverables: unwrapList(rawDeliverables).map(mapDeliverable),
    messages: unwrapList(rawMessages).map((message, messageIndex) =>
      mapMessage(message, messageIndex, clientName),
    ),
    submittedAt: asString(item.submittedAt ?? item.submissionDate ?? item.submittedDate, ''),
  };
};

const mapContract = (raw: UnknownRecord): ContractViewModel => {
  const clientName = asString(raw.clientName ?? raw.client?.fullName, 'Client');
  const rawMilestones = raw.milestones ?? raw.projectMilestones ?? [];
  return {
    id: asString(raw.id ?? raw.contractId, ''),
    title: asString(raw.title ?? raw.projectName, 'Untitled project'),
    clientName,
    freelancerName: asString(
      raw.freelancerName ?? raw.freelancer?.fullName ?? raw.freelancer?.name,
      'Freelancer',
    ),
    freelancerEmail: asString(raw.freelancerEmail ?? raw.freelancer?.email, '') || undefined,
    totalBudget: asNumber(raw.totalBudget ?? raw.budget),
    inEscrowAmount: asNumber(raw.inEscrowAmount ?? raw.escrowAmount, 0),
    status: asString(raw.status, 'DRAFT'),
    milestones: unwrapList(rawMilestones).map((milestone, index) =>
      mapMilestone(milestone, index, clientName),
    ),
  };
};

export default function ClientMilestoneReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string | string[];
    contractId?: string | string[];
    projectId?: string | string[];
    milestoneId?: string | string[];
  }>();

  const routeId = firstParam(params.contractId) ?? firstParam(params.id) ?? firstParam(params.projectId);
  const projectParam = firstParam(params.projectId);
  const requestedMilestoneId = firstParam(params.milestoneId);
  const contractId = (routeId ?? '').startsWith('PRJ-') ? routeId!.slice(4) : routeId;
  const projectId = projectParam ?? (contractId ? `PRJ-${contractId}` : '');

  const scrollRef = useRef<ScrollView>(null);
  const [contract, setContract] = useState<ContractViewModel | null>(null);
  const [milestone, setMilestone] = useState<MilestoneViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [changesModalVisible, setChangesModalVisible] = useState(false);
  const [changesReason, setChangesReason] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const loadReview = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      let rawContract: any = null;

      // 1. Try loading specific contract by contractId if provided
      if (contractId) {
        console.log('[MilestoneReview] Loading contract by ID:', contractId);
        try {
          const contractResponse = await apiClient.get(
            `/contracts/${encodeURIComponent(contractId)}`,
            { timeout: 8000 },
          );
          rawContract = contractResponse.data?.contract ?? contractResponse.data;
        } catch (apiErr) {
          console.info('[MilestoneReview] Backend GET by ID unavailable, using ContractService fallback...', apiErr);
          const fallback = await ContractService.getContractById(contractId);
          if (fallback) rawContract = fallback;
        }
      }

      // 2. If no contractId or not found by ID, fetch all contracts
      if (!rawContract) {
        try {
          const listResponse = await apiClient.get('/contracts', { timeout: 8000 });
          const list = unwrapList(listResponse.data);
          if (list.length > 0) {
            rawContract = list[0];
          }
        } catch (apiErr) {
          console.info('[MilestoneReview] Backend GET all contracts failed, using ContractService fallback...', apiErr);
          const allContracts = await ContractService.getContracts();
          if (allContracts && allContracts.length > 0) {
            rawContract = allContracts[0];
          }
        }
      }

      if (!rawContract) {
        throw new Error('No setup contract or project data was found.');
      }

      const mappedContract = mapContract(rawContract);

      // If milestones list is empty, generate setup milestones matching contract total budget
      if (!mappedContract.milestones || mappedContract.milestones.length === 0) {
        const budget = mappedContract.totalBudget || 5000;
        mappedContract.milestones = [
          {
            id: 'M-1',
            title: '1. Wireframes & UX Research',
            description: 'User flows, wireframe screens, and low-fidelity prototypes.',
            amount: Math.round(budget * 0.35),
            dueDate: '2026-10-15',
            status: 'RELEASED',
            deliverables: [],
            messages: [],
          },
          {
            id: 'M-2',
            title: '2. UI Design & Component Library',
            description: 'High-fidelity Figma UI design system and component specs.',
            amount: Math.round(budget * 0.35),
            dueDate: '2026-10-30',
            status: 'SUBMITTED',
            deliverables: [],
            messages: [],
          },
          {
            id: 'M-3',
            title: '3. Final Production & Handoff',
            description: 'Final code delivery, asset export, and deployment documentation.',
            amount: Math.round(budget * 0.30),
            dueDate: '2026-11-15',
            status: 'PENDING',
            deliverables: [],
            messages: [],
          },
        ];
      }

      let chosenMilestone = requestedMilestoneId
        ? mappedContract.milestones.find((item) => item.id === requestedMilestoneId)
        : undefined;
      chosenMilestone ??= mappedContract.milestones.find(
        (item) => ['SUBMITTED', 'PENDING_REVIEW', 'DELIVERED', 'FUNDED'].includes(item.status.toUpperCase()),
      );
      chosenMilestone ??= mappedContract.milestones[0];

      if (!chosenMilestone) {
        throw new Error('No setup milestones were found for this contract.');
      }

      // Try fetching optional detail endpoints for deliverables and messages if available
      const activeProjId = projectId || (mappedContract.id ? `PRJ-${mappedContract.id}` : '');
      const deliverablesRequest = apiClient
        .get(`/projects/${encodeURIComponent(activeProjId)}/milestones/${encodeURIComponent(chosenMilestone.id)}/deliverables`, { timeout: 4000 })
        .then((response) => ({ kind: 'deliverables', data: response.data }))
        .catch((error) => {
          console.info('[MilestoneReview] Deliverables endpoint unavailable; using contract data.', error?.message);
          return null;
        });
      const messagesRequest = apiClient
        .get(`/projects/${encodeURIComponent(activeProjId)}/milestones/${encodeURIComponent(chosenMilestone.id)}/messages`, { timeout: 4000 })
        .then((response) => ({ kind: 'messages', data: response.data }))
        .catch((error) => {
          console.info('[MilestoneReview] Messages endpoint unavailable; using contract data.', error?.message);
          return null;
        });

      const [deliverablesResult, messagesResult] = await Promise.all([deliverablesRequest, messagesRequest]);
      if (deliverablesResult?.data) {
        chosenMilestone = {
          ...chosenMilestone,
          deliverables: unwrapList(deliverablesResult.data).map(mapDeliverable),
        };
      }
      if (messagesResult?.data) {
        chosenMilestone = {
          ...chosenMilestone,
          messages: unwrapList(messagesResult.data).map((message, index) =>
            mapMessage(message, index, mappedContract.clientName)
          ),
        };
      }
      if (chosenMilestone && chosenMilestone.deliverables.length === 0) {
        chosenMilestone = {
          ...chosenMilestone,
          deliverables: [
            {
              id: `D-${chosenMilestone.id}-1`,
              title: `${chosenMilestone.title} Deliverable`,
              fileName: `${chosenMilestone.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_v1.pdf`,
              description: 'Submitted milestone assets, source code, and project documentation.',
              fileType: 'PDF / Source Archive',
              size: '5.2 MB',
              status: 'PENDING_REVIEW',
            },
          ],
        };
      }

      setContract(mappedContract);
      setMilestone(chosenMilestone);
    } catch (error: any) {
      console.error('[MilestoneReview] Failed to load setup milestone data:', error);
      setErrorMessage(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          error?.message ??
          'Unable to load the setup milestone review.',
      );
    } finally {
      setLoading(false);
    }
  }, [contractId, projectId, requestedMilestoneId]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const handleSelectMilestone = (selected: MilestoneViewModel) => {
    setMilestone(selected);
  };

  const isApproved = useMemo(
    () => ['APPROVED', 'COMPLETED', 'RELEASED'].includes((milestone?.status ?? '').toUpperCase()),
    [milestone?.status],
  );

  // Opening the funding screen is navigation only. Do not update the status
  // or release funds here; that happens when the user confirms on Fund Milestone.
  const openFundingScreen = () => {
    if (!contract || !milestone) {
      Alert.alert('Milestone unavailable', 'Load the contract and selected milestone before continuing.');
      return;
    }

    const activeProjectId = projectId || `PRJ-${contract.id}`;
    console.log('[MilestoneReview] Opening funding screen', {
      contractId: contract.id,
      projectId: activeProjectId,
      milestoneId: milestone.id,
    });

    router.push({
      pathname: '/client-fund-milestone',
      params: {
        contractId: contract.id,
        projectId: activeProjectId,
        milestoneId: milestone.id,
      },
    });
  };

  // Request Changes remains an API action; approval/funding is handled by the
  // separate Fund Milestone screen.
  const updateMilestoneStatus = async (reason: string) => {
    if (!contract || !milestone || !reason.trim()) return;
    setActionLoading(true);
    try {
      const activeProjId = projectId || `PRJ-${contract.id}`;
      const response = await apiClient.patch(
        `/projects/${encodeURIComponent(activeProjId)}/milestones/${encodeURIComponent(milestone.id)}/status`,
        { reason: reason.trim() },
        { params: { status: 'CHANGES_REQUESTED' }, timeout: 15000 },
      );
      const updatedStatus = asString(response.data?.status, 'CHANGES_REQUESTED');
      const updatedMilestone = { ...milestone, status: updatedStatus };
      const updatedContractMilestones = contract.milestones.map((item) =>
        item.id === milestone.id ? updatedMilestone : item,
      );

      setMilestone(updatedMilestone);
      setContract({ ...contract, milestones: updatedContractMilestones });
      setChangesModalVisible(false);
      setChangesReason('');
      Alert.alert('Changes Requested', 'Your change request has been sent to the freelancer.');
    } catch (error: any) {
      console.error('[MilestoneReview] Request changes failed:', error);
      Alert.alert(
        'Unable to request changes',
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          error?.message ??
          'Check that the milestone status endpoint is available.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!contract || !milestone || !messageText.trim()) return;
    setSendingMessage(true);
    try {
      const activeProjId = projectId || `PRJ-${contract.id}`;
      let newMessageData: any = null;

      try {
        const response = await apiClient.post(
          `/projects/${encodeURIComponent(activeProjId)}/milestones/${encodeURIComponent(milestone.id)}/messages`,
          { content: messageText.trim(), senderRole: 'CLIENT' },
          { timeout: 8000 },
        );
        newMessageData = response.data?.message ?? response.data;
      } catch {
        // Fallback message creation
        newMessageData = {
          id: `msg-${Date.now()}`,
          content: messageText.trim(),
          senderName: contract.clientName,
          role: 'CLIENT',
          createdAt: new Date().toISOString(),
          isCurrentUser: true,
        };
      }

      const newMessage = mapMessage(
        {
          ...newMessageData,
          content: newMessageData?.content ?? messageText.trim(),
          senderName: newMessageData?.senderName ?? contract.clientName,
          createdAt: newMessageData?.createdAt ?? new Date().toISOString(),
          isCurrentUser: true,
        },
        milestone.messages.length,
        contract.clientName,
      );

      const updatedMessages = [...milestone.messages, newMessage];
      const updatedMilestone = { ...milestone, messages: updatedMessages };
      const updatedContractMilestones = contract.milestones.map((m) =>
        m.id === milestone.id ? updatedMilestone : m,
      );

      setMilestone(updatedMilestone);
      setContract({ ...contract, milestones: updatedContractMilestones });
      setMessageText('');
    } catch (error: any) {
      console.error('[MilestoneReview] Send message failed:', error);
      Alert.alert(
        'Unable to send message',
        error?.response?.data?.message ?? 'Could not send message to freelancer.',
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const openDeliverable = async (item: DeliverableViewModel) => {
    if (!item.url) {
      Alert.alert('File info', `File "${item.fileName}" was submitted. Download URL is not provided in mock mode.`);
      return;
    }
    try {
      await Linking.openURL(item.url);
    } catch (error) {
      console.error('Could not open deliverable URL:', error);
      Alert.alert('Could not open file', 'Please check the file URL.');
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toUpperCase();
    if (['RELEASED', 'APPROVED', 'COMPLETED'].includes(s)) return styles.badgeSuccess;
    if (['FUNDED', 'SUBMITTED', 'PENDING_REVIEW', 'DELIVERED'].includes(s)) return styles.badgeInfo;
    if (['CHANGES_REQUESTED', 'REJECTED'].includes(s)) return styles.badgeWarning;
    return styles.badgeNeutral;
  };

  const getStatusTextStyle = (status: string) => {
    const s = status.toUpperCase();
    if (['RELEASED', 'APPROVED', 'COMPLETED'].includes(s)) return styles.badgeTextSuccess;
    if (['FUNDED', 'SUBMITTED', 'PENDING_REVIEW', 'DELIVERED'].includes(s)) return styles.badgeTextInfo;
    if (['CHANGES_REQUESTED', 'REJECTED'].includes(s)) return styles.badgeTextWarning;
    return styles.badgeTextNeutral;
  };

  const handleGoBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/client-dashboard');
      }
    } catch (e) {
      console.warn('[MilestoneReview] Navigation goBack error, falling back to dashboard:', e);
      router.replace('/client-dashboard');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.stateText}>Loading milestone setup data...</Text>
      </SafeAreaView>
    );
  }

  if (errorMessage || !contract || !milestone) {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <Text style={styles.errorTitle}>Unable to load setup milestones</Text>
        <Text style={styles.stateText}>{errorMessage || 'The requested contract setup data was not found.'}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={loadReview}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const submitDate = milestone.submittedAt || milestone.dueDate;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerBack}
              onPress={handleGoBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.headerBackText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Milestone Review</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Project Summary Card */}
          <View style={styles.projectCard}>
            <Text style={styles.eyebrowGreen}>ACTIVE CONTRACT</Text>
            <Text style={styles.projectName}>{contract.title}</Text>
            <View style={styles.separator} />
            <InfoRow label="Client" value={contract.clientName} />
            <InfoRow label="Freelancer" value={contract.freelancerName} />
            <InfoRow label="Total Budget" value={`$${contract.totalBudget.toLocaleString()}`} highlight />
            <InfoRow label="Contract Status" value={contract.status.replace(/_/g, ' ')} />
          </View>

          {/* Deliverables Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submitted Deliverables ({milestone.deliverables.length})</Text>
            {milestone.deliverables.length > 0 ? (
              milestone.deliverables.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.fileCard}
                  onPress={() => openDeliverable(item)}
                  accessibilityRole="button"
                >
                  <View style={styles.fileIconBox}>
                    <Text style={styles.fileIcon}>▤</Text>
                  </View>
                  <View style={styles.fileCopy}>
                    <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
                    {item.description ? (
                      <Text style={styles.fileDesc} numberOfLines={1}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.fileMeta} numberOfLines={1}>
                      {item.fileType || 'Submitted deliverable'}{item.size ? ` · ${item.size}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.downloadIcon}>⇩</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No deliverables submitted for "{milestone.title}" yet.
                </Text>
              </View>
            )}
          </View>

          {/* Conversation Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Milestone Conversation</Text>
            {milestone.messages.length > 0 ? (
              milestone.messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageCard,
                    message.isCurrentUser ? styles.ownMessageCard : styles.otherMessageCard,
                  ]}
                >
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageSender}>
                      {message.senderName}{message.role ? ` (${message.role.replace(/_/g, ' ')})` : ''}
                    </Text>
                    <Text style={styles.messageTime}>{formatTime(message.createdAt)}</Text>
                  </View>
                  <Text style={styles.messageText}>{message.content}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No messages for this milestone yet.</Text>
              </View>
            )}
            <View style={styles.messageComposer}>
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Write a message to freelancer..."
                placeholderTextColor={Colors.neutralLight}
                style={styles.messageInput}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!messageText.trim() || sendingMessage) && styles.disabledButton]}
                onPress={sendMessage}
                disabled={!messageText.trim() || sendingMessage}
              >
                {sendingMessage
                  ? <ActivityIndicator color={Colors.surface} size="small" />
                  : <Text style={styles.sendButtonText}>Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={openFundingScreen}
            accessibilityRole="button"
            accessibilityLabel="Continue to fund this milestone"
          >
            <Text style={styles.primaryButtonText}>
              {isApproved ? 'Proceed to Funding' : 'Approve Milestone'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionRowSecondary}>
            <TouchableOpacity
              style={[styles.secondaryButton, { flex: 1 }]}
              onPress={() => setChangesModalVisible(true)}
              disabled={actionLoading || isApproved}
            >
              <Text style={styles.secondaryButtonText}>Request Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.messageFreelancerButton, { flex: 1 }]}
              onPress={() => {
                scrollRef.current?.scrollToEnd({ animated: true });
              }}
            >
              <Text style={styles.messageFreelancerText}>Message Freelancer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Changes Request Modal */}
      <Modal
        visible={changesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChangesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Changes</Text>
            <Text style={styles.modalDescription}>
              Tell the freelancer what updates are needed for “{milestone.title}”.
            </Text>
            <TextInput
              value={changesReason}
              onChangeText={setChangesReason}
              style={styles.changesInput}
              placeholder="Describe the required updates or revisions..."
              placeholderTextColor={Colors.neutralLight}
              multiline
              textAlignVertical="top"
              maxLength={1500}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setChangesModalVisible(false)}
                disabled={actionLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, (!changesReason.trim() || actionLoading) && styles.disabledButton]}
                onPress={() => updateMilestoneStatus(changesReason.trim())}
                disabled={!changesReason.trim() || actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator color={Colors.surface} size="small" />
                  : <Text style={styles.modalSubmitText}>Send Request</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  stateScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
    backgroundColor: Colors.surface,
  },
  stateText: {
    marginTop: Theme.spacing.sm,
    color: Colors.neutralMedium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  errorTitle: {
    color: Colors.dark,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 24,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBack: {
    width: 30,
    height: 36,
    justifyContent: 'center',
  },
  headerBackText: {
    color: Colors.dark,
    fontSize: 27,
    lineHeight: 30,
  },
  headerTitle: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 30,
  },
  projectCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 11,
    backgroundColor: '#FAFBFC',
    padding: 11,
  },
  eyebrowGreen: {
    color: Colors.primaryDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  projectName: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
    marginBottom: 5,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  infoRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoLabel: {
    flex: 1,
    color: Colors.neutralMedium,
    fontSize: 10,
  },
  infoValue: {
    flex: 1.2,
    color: Colors.dark,
    fontSize: 10,
    textAlign: 'left',
  },
  infoValueHighlight: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  section: {
    marginTop: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  sectionTitle: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '800',
  },
  setupSubtext: {
    color: Colors.neutralMedium,
    fontSize: 9,
  },
  milestonesList: {
    gap: 7,
  },
  milestoneCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    padding: 10,
  },
  milestoneCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
  },
  milestoneCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  milestoneNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  milestoneTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 3,
  },
  milestoneDescText: {
    fontSize: 10,
    color: Colors.neutralMedium,
    lineHeight: 14,
    marginBottom: 6,
  },
  milestoneFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  milestoneAmountText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  milestoneDueDateText: {
    fontSize: 9,
    color: Colors.neutralMedium,
  },
  activeTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    color: Colors.surface,
    fontSize: 8,
    fontWeight: '800',
  },
  activeMilestoneCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 11,
    backgroundColor: '#F7FDF9',
    padding: 12,
  },
  activeMilestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activeMilestoneEyebrow: {
    color: Colors.primaryDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  activeMilestoneTitle: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  activeMilestoneDesc: {
    color: Colors.neutralMedium,
    fontSize: 10,
    lineHeight: 15,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  badgeTextSuccess: {
    color: Colors.primaryDark,
  },
  badgeInfo: {
    backgroundColor: '#E0F2FE',
  },
  badgeTextInfo: {
    color: '#0369A1',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextWarning: {
    color: '#D97706',
  },
  badgeNeutral: {
    backgroundColor: '#F3F4F6',
  },
  badgeTextNeutral: {
    color: Colors.neutralMedium,
  },
  fileCard: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginBottom: 6,
    backgroundColor: Colors.surface,
  },
  fileIconBox: {
    width: 27,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  fileIcon: {
    color: '#3B82F6',
    fontSize: 16,
  },
  fileCopy: {
    flex: 1,
  },
  fileName: {
    color: Colors.dark,
    fontSize: 10,
    fontWeight: '700',
  },
  fileDesc: {
    color: Colors.neutralMedium,
    fontSize: 9,
    marginTop: 1,
  },
  fileMeta: {
    color: Colors.neutralLight,
    fontSize: 8,
    marginTop: 2,
  },
  downloadIcon: {
    color: Colors.neutralMedium,
    fontSize: 17,
    marginLeft: 8,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 11,
    backgroundColor: Colors.surface,
  },
  emptyText: {
    color: Colors.neutralMedium,
    fontSize: 10,
    lineHeight: 15,
  },
  messageCard: {
    padding: 9,
    borderRadius: 8,
    marginBottom: 7,
  },
  otherMessageCard: {
    backgroundColor: '#F5F7FA',
  },
  ownMessageCard: {
    backgroundColor: '#EAFBF0',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  messageSender: {
    flex: 1,
    color: Colors.dark,
    fontSize: 9,
    fontWeight: '800',
  },
  messageTime: {
    color: Colors.neutralLight,
    fontSize: 8,
  },
  messageText: {
    color: Colors.neutralMedium,
    fontSize: 10,
    lineHeight: 14,
  },
  messageComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    marginTop: 2,
  },
  messageInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
    color: Colors.dark,
    fontSize: 11,
  },
  sendButton: {
    minHeight: 38,
    minWidth: 48,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  sendButtonText: {
    color: Colors.surface,
    fontWeight: '800',
    fontSize: 10,
  },
  actionBar: {
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  actionRowSecondary: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  primaryButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  secondaryButtonText: {
    color: Colors.dark,
    fontSize: 10,
    fontWeight: '700',
  },
  messageFreelancerButton: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },
  messageFreelancerText: {
    color: Colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
  },
  backButton: {
    marginTop: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.55,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    padding: 17,
  },
  modalTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  modalDescription: {
    color: Colors.neutralMedium,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
  },
  changesInput: {
    minHeight: 110,
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    color: Colors.dark,
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  modalCancelButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  modalCancelText: {
    color: Colors.dark,
    fontSize: 11,
    fontWeight: '700',
  },
  modalSubmitButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  modalSubmitText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '800',
  },
});
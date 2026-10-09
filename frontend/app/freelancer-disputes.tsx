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
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import { apiClient, clearApiCache, getCurrentUser, FreelancerApiService } from '../src/services/api';
import {
  HomeIcon,
  ProjectsIcon,
  PaymentsIcon,
  AlertsIcon,
  ProfileIcon,
} from '../src/components/Icons';

const PROJECT_OPTIONS = [
  { label: 'E-Commerce Redesign', amount: 2400 },
  { label: 'Mobile App Contract', amount: 3800 },
  { label: 'Logo & Brand Identity', amount: 450 },
  { label: 'Brand Identity & Marketing Assets', amount: 1800 },
];

const ISSUE_TYPE_OPTIONS = [
  'Payment Delay',
  'Scope Disagreement',
  'Milestone Discrepancy',
  'Quality Dispute',
  'Contract Termination',
  'Other',
];

interface DisputeItem {
  id: string;
  dspNumber?: string;
  project: string;
  amount: number | string;
  issueType?: string;
  reason?: string;
  date?: string;
  filedDate?: string;
  status: string;
  statusType: 'review' | 'open' | 'resolved' | string;
  description?: string;
  evidenceFile?: string;
}

const FALLBACK_DISPUTES: DisputeItem[] = [
  {
    id: 'DSP-409',
    project: 'E-Commerce Redesign',
    amount: '$2,400',
    reason: 'Payment Delay',
    date: 'Filed Oct 10, 2024',
    status: 'Under Review',
    statusType: 'review',
  },
  {
    id: 'DSP-408',
    project: 'Mobile App Contract',
    amount: '$3,800',
    reason: 'Scope Disagreement',
    date: 'Filed Oct 12, 2024',
    status: 'Open',
    statusType: 'open',
  },
  {
    id: 'DSP-401',
    project: 'Logo & Brand Identity',
    amount: '$450',
    reason: 'Milestone Discrepancy',
    date: 'Filed Sep 15, 2024',
    status: 'Resolved',
    statusType: 'resolved',
  },
];

export default function FreelancerDisputesScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const isChathuni =
    currentUser?.email === 'chathuniimalsha.com' ||
    (currentUser?.fullName && currentUser.fullName.toLowerCase().includes('chathuni')) ||
    (currentUser?.email && currentUser.email.toLowerCase().includes('chathuni'));

  const [disputes, setDisputes] = useState<DisputeItem[]>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const u = getCurrentUser();
        const k = `disputes_list_${u?.email || u?.fullName || 'default'}`;
        const s = localStorage.getItem(k);
        if (s) {
          const p = JSON.parse(s);
          if (Array.isArray(p)) return p;
        }
      } catch (e) {}
    }
    return isChathuni ? FALLBACK_DISPUTES : [];
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingDispute, setEditingDispute] = useState<DisputeItem | null>(null);
  const [editProject, setEditProject] = useState('');
  const [editIssueType, setEditIssueType] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEvidenceFiles, setEditEvidenceFiles] = useState<string[]>([]);
  const [editProjectModalVisible, setEditProjectModalVisible] = useState(false);
  const [editIssueModalVisible, setEditIssueModalVisible] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchDisputes = async () => {
    try {
      const activeName = currentUser?.fullName || (isChathuni ? 'Chathuni Imalsha' : '');
      const res = await FreelancerApiService.getDisputes(activeName, currentUser?.email);
      const data = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(data)) {
        const formatted: DisputeItem[] = data.map((d: any) => ({
          id: d.id || d.dspNumber,
          project: d.project,
          amount: typeof d.amount === 'number' ? `$${d.amount.toLocaleString()}` : (d.amount || '$0'),
          reason: d.issueType || d.reason || 'Payment Issue',
          date: d.filedDate || (d.createdAt ? `Filed ${new Date(d.createdAt).toLocaleDateString()}` : 'Filed Recently'),
          status: d.status || 'Under Review',
          statusType: d.statusType || (d.status === 'Resolved' ? 'resolved' : d.status === 'Open' ? 'open' : 'review'),
          description: d.description || '',
          evidenceFile: d.evidenceFile || '',
        }));
        setDisputes(formatted);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          const k = `disputes_list_${currentUser?.email || currentUser?.fullName || 'default'}`;
          localStorage.setItem(k, JSON.stringify(formatted));
        }
      }
    } catch {
      if (!isChathuni) {
        setDisputes([]);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          const k = `disputes_list_${currentUser?.email || currentUser?.fullName || 'default'}`;
          localStorage.setItem(k, JSON.stringify([]));
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchDisputes();
    }, [currentUser?.email, currentUser?.fullName])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDisputes();
  };

  const handleOpenDetails = (disputeId: string) => {
    router.push({
      pathname: '/dispute-details',
      params: { id: disputeId },
    });
  };

  const openEditDispute = async (item: DisputeItem) => {
    router.push({
      pathname: '/create-dispute',
      params: { editId: item.id },
    });
  };

  const openEditFilePicker = (folder = false) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    if (folder) {
      input.setAttribute('webkitdirectory', 'true');
      input.setAttribute('directory', 'true');
    }
    input.onchange = async (event: any) => {
      const files = Array.from(event.target.files || []) as File[];
      for (const file of files) {
        try {
          const response = await FreelancerApiService.uploadFile(file, 'DISPUTE', editingDispute?.id || 'EDIT', currentUser?.fullName || 'Freelancer');
          const fileRef = response?.fileUrl || response?.originalFileName || file.name;
          setEditEvidenceFiles((previous) => Array.from(new Set([...previous, fileRef])));
        } catch {
          setEditEvidenceFiles((previous) => Array.from(new Set([...previous, file.name])));
        }
      }
    };
    input.click();
  };

  const saveEditedDispute = async () => {
    if (!editingDispute || !editProject.trim() || !editIssueType.trim() || !editDescription.trim()) {
      Alert.alert('Missing information', 'Project, issue type, and description are required.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const response = await FreelancerApiService.updateDispute(editingDispute.id, {
        project: editProject.trim(),
        issueType: editIssueType.trim(),
        description: editDescription.trim(),
        evidenceFile: editEvidenceFiles.join(','),
      });
      const updated = response?.data || response;
      const updatedList = disputes.map((dispute) =>
        dispute.id === editingDispute.id
          ? {
              ...dispute,
              project: updated.project || editProject.trim(),
              reason: updated.issueType || editIssueType.trim(),
              description: updated.description || editDescription.trim(),
              evidenceFile: updated.evidenceFile ?? editEvidenceFiles.join(','),
            }
          : dispute
      );
      setDisputes(updatedList);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(
          `disputes_list_${currentUser?.email || currentUser?.fullName || 'default'}`,
          JSON.stringify(updatedList)
        );
      }
      setEditingDispute(null);
    } catch {
      Alert.alert('Unable to update dispute', 'Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const deleteDispute = (item: DisputeItem) => {
    const removeFromList = () => {
      setDisputes((previous) => {
        const updatedList = previous.filter((dispute) => dispute.id !== item.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(
            `disputes_list_${currentUser?.email || currentUser?.fullName || 'default'}`,
            JSON.stringify(updatedList)
          );
        }
        return updatedList;
      });
    };

    const performDelete = async () => {
      const previousList = disputes;
      removeFromList();
      try {
        await FreelancerApiService.deleteDispute(item.id);
        clearApiCache('/disputes');
        await fetchDisputes();
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return;
        }
        setDisputes(previousList);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(
            `disputes_list_${currentUser?.email || currentUser?.fullName || 'default'}`,
            JSON.stringify(previousList)
          );
        }
        const message = error?.response?.data?.message || error?.message || 'Please try again.';
        Alert.alert('Unable to delete dispute', message);
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Delete the dispute for "${item.project}" permanently?`)) {
        void performDelete();
      }
      return;
    }

    Alert.alert(
      'Delete dispute?',
      `This will permanently delete the dispute for "${item.project}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void performDelete() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        >
          {/* Top Header Bar with Centered Title & Back Button */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.replace('/(tabs)/dashboard')}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Disputes</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Section Title & Create Disputes Action Button */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Active Disputes ({disputes.filter((d) => d.status !== 'Resolved').length || disputes.length})
            </Text>
            <TouchableOpacity
              style={styles.createDisputeGreenBtn}
              onPress={() => router.push('/create-dispute')}
              activeOpacity={0.85}
            >
              <Text style={styles.createBtnPlus}>+</Text>
              <Text style={styles.createBtnText}>Create Dispute</Text>
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {loading && disputes.length === 0 ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            /* Disputes Cards List Matching Screenshot 1 */
            <View style={styles.listContainer}>
              {disputes.length === 0 ? (
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12 }}>
                  <Text style={{ fontSize: 36, marginBottom: 12 }}>⚖️</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 }}>
                    No Disputes Found
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 }}>
                    You currently do not have any open or resolved disputes.
                  </Text>
                </View>
              ) : (
                disputes.map((item) => {
                const isReview = item.statusType === 'review' || item.status === 'Under Review';
                const isOpen = item.statusType === 'open' || item.status === 'Open';
                const isResolved = item.statusType === 'resolved' || item.status === 'Resolved';

                return (
                  <View
                    key={item.id}
                    style={styles.card}
                  >
                    <View style={styles.cardHeader}>
                      {/* Status Pill Badge */}
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
                          {item.status}
                        </Text>
                      </View>

                      {/* Amount */}
                      <Text style={styles.amountText}>{item.amount}</Text>
                    </View>

                    {/* Project Title & Subtitle */}
                    <Text style={styles.projectTitle}>{item.project}</Text>
                    <Text style={styles.subtitleText}>
                      {item.reason} <Text style={styles.dotSeparator}>•</Text> {item.date}
                    </Text>

                    <View style={styles.cardDivider} />

                    {/* View Details & Discussion Footer Link */}
                    <TouchableOpacity
                      style={styles.cardFooter}
                      onPress={() => handleOpenDetails(item.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.footerLinkText}>View Details & Discussion</Text>
                      <Text style={styles.footerArrow}>›</Text>
                    </TouchableOpacity>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={(event) => {
                          event.stopPropagation();
                          openEditDispute(item);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.editButtonText}>✏️ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(event) => {
                          event.stopPropagation();
                          deleteDispute(item);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }))}
            </View>
          )}
        </ScrollView>

        <Modal visible={!!editingDispute} transparent animationType="slide" onRequestClose={() => setEditingDispute(null)}>
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modalCard} contentContainerStyle={styles.modalCardContent} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Dispute</Text>
                <TouchableOpacity onPress={() => setEditingDispute(null)} disabled={isSavingEdit}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.inputLabel}>Project</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setEditProjectModalVisible(true)}>
                <Text style={[styles.selectValue, !editProject && { color: '#94A3B8' }]}>
                  {editProject || 'Select a project...'}
                </Text>
                <Text style={styles.dropdownArrow}>⌄</Text>
              </TouchableOpacity>
              <Text style={styles.inputLabel}>Issue Type</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setEditIssueModalVisible(true)}>
                <Text style={styles.selectValue}>{editIssueType || 'Select an issue type...'}</Text>
                <Text style={styles.dropdownArrow}>⌄</Text>
              </TouchableOpacity>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.editInput, styles.descriptionInput]}
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Text style={styles.inputLabel}>Evidence Files</Text>
              <View style={styles.evidenceDropZone}>
                <Text style={styles.evidenceTitle}>Upload supporting files</Text>
                <Text style={styles.evidenceSubtitle}>PDF, JPG, PNG, ZIP, DOCX (Max 15MB)</Text>
                <View style={styles.evidenceButtonsRow}>
                  <TouchableOpacity style={styles.evidenceButton} onPress={() => openEditFilePicker(true)}>
                    <Text style={styles.evidenceButtonText}>📂 Upload Folder</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.evidenceButton} onPress={() => openEditFilePicker(false)}>
                    <Text style={styles.evidenceButtonText}>📄 Browse Files</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.evidenceChipsRow}>
                  {editEvidenceFiles.map((file) => (
                    <View key={file} style={styles.evidenceChip}>
                      <Text style={styles.evidenceChipText} numberOfLines={1}>📎 {file}</Text>
                      <TouchableOpacity onPress={() => setEditEvidenceFiles((files) => files.filter((entry) => entry !== file))}>
                        <Text style={styles.evidenceChipRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingDispute(null)} disabled={isSavingEdit}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={saveEditedDispute} disabled={isSavingEdit}>
                  {isSavingEdit ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        <Modal visible={editProjectModalVisible} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditProjectModalVisible(false)}>
            <View style={styles.selectorModal}>
              <Text style={styles.selectorTitle}>Select Project</Text>
              {PROJECT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.selectorItem, editProject === option.label && styles.selectorItemSelected]}
                  onPress={() => {
                    setEditProject(option.label);
                    setEditProjectModalVisible(false);
                  }}
                >
                  <Text style={styles.selectorItemText}>{option.label} (${option.amount})</Text>
                  {editProject === option.label && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={editIssueModalVisible} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditIssueModalVisible(false)}>
            <View style={styles.selectorModal}>
              <Text style={styles.selectorTitle}>Select Issue Type</Text>
              {ISSUE_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.selectorItem, editIssueType === option && styles.selectorItemSelected]}
                  onPress={() => {
                    setEditIssueType(option);
                    setEditIssueModalVisible(false);
                  }}
                >
                  <Text style={styles.selectorItemText}>{option}</Text>
                  {editIssueType === option && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  createDisputeGreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  createBtnPlus: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  loaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
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
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 14,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  footerArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  modalCardContent: {
    paddingBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
  },
  modalClose: {
    color: '#64748B',
    fontSize: 18,
    padding: 4,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    color: '#0F172A',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    color: '#0F172A',
    fontSize: 14,
    flex: 1,
  },
  dropdownArrow: {
    color: '#64748B',
    fontSize: 20,
    marginLeft: 8,
  },
  descriptionInput: {
    minHeight: 110,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
  saveButton: {
    minWidth: 120,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#16A34A',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  evidenceDropZone: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  evidenceTitle: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  evidenceSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  evidenceButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  evidenceButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    paddingVertical: 8,
    alignItems: 'center',
  },
  evidenceButtonText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  evidenceChipsRow: {
    gap: 6,
    marginTop: 10,
  },
  evidenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  evidenceChipText: {
    color: '#334155',
    fontSize: 11,
    flex: 1,
  },
  evidenceChipRemove: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  selectorModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    width: '100%',
    maxWidth: 420,
  },
  selectorTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  selectorItem: {
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorItemSelected: {
    backgroundColor: '#DCFCE7',
  },
  selectorItemText: {
    color: '#334155',
    fontSize: 13,
    flex: 1,
  },
  checkmark: {
    color: '#16A34A',
    fontSize: 16,
    fontWeight: '800',
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

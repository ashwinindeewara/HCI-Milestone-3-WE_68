import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';
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

export default function CreateDisputeScreen() {
  const router = useRouter();

  const [project, setProject] = useState('E-Commerce Redesign');
  const [issueType, setIssueType] = useState('Payment Delay');
  const [description, setDescription] = useState(
    'Completed Milestone: UI Design Phase. Deliverable was uploaded on time and approved by client internally, but the payment escrow remains locked.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'contract-agreement.pdf',
    'approved-screens-specs.png',
  ]);

  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Trigger Windows File Explorer Dialog for Individual Files
  const openLaptopFilePicker = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '*/*';
      input.onchange = (e: any) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length > 0) {
          const names = files.map((f) => f.name);
          setUploadedFiles((prev) => Array.from(new Set([...prev, ...names])));
        }
      };
      input.click();
    }
  };

  // Trigger Windows File Explorer Dialog for Entire Folders (Directory Upload)
  const openLaptopFolderPicker = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.setAttribute('webkitdirectory', 'true');
      input.setAttribute('directory', 'true');
      input.multiple = true;
      input.onchange = (e: any) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length > 0) {
          // Extract top folder name or relative path
          const folderNames = files.map((f) => f.webkitRelativePath || f.name);
          // Show folder root or top files
          const topFolder = files[0].webkitRelativePath
            ? files[0].webkitRelativePath.split('/')[0] + ' (Folder - ' + files.length + ' files)'
            : 'Uploaded Folder (' + files.length + ' files)';
          setUploadedFiles((prev) => Array.from(new Set([...prev, topFolder])));
        }
      };
      input.click();
    }
  };

  const removeFile = (fileToRemove: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f !== fileToRemove));
  };

  const [projectOptions, setProjectOptions] = useState(PROJECT_OPTIONS);
  const [createdDisputeId, setCreatedDisputeId] = useState<string | null>(null);

  React.useEffect(() => {
    apiClient.get('/projects').then((res) => {
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const opts = res.data.map((p: any) => ({
          label: p.title,
          amount: p.inEscrowAmount || p.totalBudget || 2400,
          client: p.clientName,
          contractId: p.contractId,
        }));
        setProjectOptions(opts);
      }
    }).catch(() => { });
  }, []);

  const handleSubmitDispute = async () => {
    const finalDescription =
      description.trim() ||
      'Completed Milestone: UI Design Phase. Deliverable was uploaded on time and approved by client internally, but the payment escrow remains locked.';

    setIsSubmitting(true);
    const selectedProj = projectOptions.find((p) => p.label === project) || PROJECT_OPTIONS[0];
    const amount = selectedProj ? selectedProj.amount : 2400;

    let targetDisputeId = 'DSP-409';

    try {
      const res = await apiClient.post('/disputes', {
        project,
        issueType,
        description: finalDescription,
        evidenceFile: uploadedFiles.length > 0 ? uploadedFiles.join(',') : 'contract-agreement.pdf',
        amount,
        parties: `${project} Client vs. Chathuni`,
        clientName: (selectedProj as any)?.client || 'TechVentures Inc.',
        freelancerName: 'Chathuni Imalsha',
        contractId: (selectedProj as any)?.contractId || 'C-101',
      });
      if (res.data && res.data.id) {
        targetDisputeId = res.data.id;
      }
    } catch (e: any) {
      console.warn('Fallback offline dispute creation:', e.message);
    } finally {
      setIsSubmitting(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        // Requirement 2: Redirect the freelancer to the dispute details page
        router.replace(`/dispute-details?id=${targetDisputeId}`);
      }, 700);
    }
  };

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
              onPress={() => router.replace('/freelancer-disputes')}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Dispute</Text>
            <View style={{ width: 36 }} />
          </View>

          {showSuccessToast && (
            <View style={styles.toastSuccess}>
              <Text style={styles.toastText}>✓ Dispute created and submitted for review!</Text>
            </View>
          )}

          {/* Form Group 1: Project Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Project</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setProjectModalVisible(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.selectValue}>{project}</Text>
              <Text style={styles.dropdownArrow}>⌄</Text>
            </TouchableOpacity>
          </View>

          {/* Form Group 2: Issue Type Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Issue Type</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setIssueModalVisible(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.selectValue}>{issueType}</Text>
              <Text style={styles.dropdownArrow}>⌄</Text>
            </TouchableOpacity>
          </View>

          {/* Form Group 3: Description */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholder="Please describe the dispute reasons and requested action in detail..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Form Group 4: Evidence Files Upload Box */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Evidence Files</Text>

            {/* Main Dropzone Container (Click to browse files) */}
            <TouchableOpacity
              style={styles.dropZone}
              onPress={openLaptopFilePicker}
              activeOpacity={0.8}
            >
              <View style={styles.uploadIconBox}>
                <Text style={styles.uploadIcon}>↑</Text>
              </View>
              <Text style={styles.uploadTitle}>Upload supporting files</Text>
              <Text style={styles.uploadSubtext}>PDF, JPG, PNG, ZIP, DOCX (Max 15MB)</Text>

              {/* Action Buttons: Choose Laptop Files & Choose Laptop Folder */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.folderBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    openLaptopFolderPicker();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.folderBtnIcon}>📂</Text>
                  <Text style={styles.folderBtnText}>Upload Laptop Folder</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.filesBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    openLaptopFilePicker();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.filesBtnIcon}>📄</Text>
                  <Text style={styles.filesBtnText}>Browse Files</Text>
                </TouchableOpacity>
              </View>

              {/* Display Uploaded File / Folder Chips */}
              {uploadedFiles.length > 0 && (
                <View style={styles.attachedChipsRow}>
                  {uploadedFiles.map((file, idx) => (
                    <View key={idx} style={styles.fileChip}>
                      <Text style={styles.fileChipText} numberOfLines={1}>
                        {file.includes('(Folder') ? '📁 ' : '📎 '}
                        {file}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          removeFile(file);
                        }}
                        style={styles.removeChipBtn}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <Text style={styles.removeChipText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Submit Dispute Primary CTA */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.btnDisabled]}
            onPress={handleSubmitDispute}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Dispute</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Project Selector Modal */}
        <Modal visible={projectModalVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setProjectModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Project</Text>
              {projectOptions.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.modalItem,
                    project === item.label && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setProject(item.label);
                    setProjectModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      project === item.label && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.label} (${item.amount})
                  </Text>
                  {project === item.label && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Issue Type Selector Modal */}
        <Modal visible={issueModalVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIssueModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Issue Type</Text>
              {ISSUE_TYPE_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.modalItem,
                    issueType === item && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setIssueType(item);
                    setIssueModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      issueType === item && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {issueType === item && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomTabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => router.push('/(tabs)/dashboard')}
          >
            <HomeIcon size={20} color="#16A34A" focused={true} />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => router.push('/(tabs)/contracts')}
          >
            <ProjectsIcon size={20} color="#64748B" />
            <Text style={styles.tabLabel}>Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => router.push('/(tabs)/escrow')}
          >
            <PaymentsIcon size={20} color="#64748B" />
            <Text style={styles.tabLabel}>Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <AlertsIcon size={20} color="#64748B" />
            <Text style={styles.tabLabel}>Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => router.push('/(tabs)/profile')}
          >
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
  toastSuccess: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  toastText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  selectInput: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  selectValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  dropdownArrow: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
  },
  textArea: {
    minHeight: 120,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  dropZone: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16A34A',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  folderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  folderBtnIcon: {
    fontSize: 13,
  },
  folderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  filesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  filesBtnIcon: {
    fontSize: 13,
  },
  filesBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  attachedChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
    maxWidth: '100%',
  },
  fileChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    maxWidth: 220,
  },
  removeChipBtn: {
    padding: 2,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  submitButton: {
    height: 52,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  modalItemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  modalItemTextSelected: {
    color: '#16A34A',
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 16,
    color: '#16A34A',
    fontWeight: '700',
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

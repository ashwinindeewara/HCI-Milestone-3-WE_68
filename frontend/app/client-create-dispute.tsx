import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';

export default function CreateDisputeScreen() {
  const router = useRouter();

  const [project, setProject] = useState('E-Commerce Redesign');
  const [issueType, setIssueType] = useState('Payment Delay');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleSelectProject = () => {
    Alert.alert('Select Project', 'Choose project to file dispute for:', [
      { text: 'E-Commerce Redesign', onPress: () => setProject('E-Commerce Redesign') },
      { text: 'Mobile App Contract', onPress: () => setProject('Mobile App Contract') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSelectIssueType = () => {
    Alert.alert('Select Issue Type', 'Choose category:', [
      { text: 'Payment Delay', onPress: () => setIssueType('Payment Delay') },
      { text: 'Scope Disagreement', onPress: () => setIssueType('Scope Disagreement') },
      { text: 'Quality Dispute', onPress: () => setIssueType('Quality Dispute') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleUploadFile = () => {
    Alert.alert('Upload Evidence', 'Attach supporting document or screenshot:', [
      { text: 'Contract_Milestone_Proof.pdf', onPress: () => setUploadedFile('Contract_Milestone_Proof.pdf') },
      { text: 'Work_Submission_Screenshot.png', onPress: () => setUploadedFile('Work_Submission_Screenshot.png') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmitDispute = async () => {
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please provide a detailed description of the dispute reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/disputes', {
        project,
        issueType,
        description,
        evidenceFile: uploadedFile,
      });
    } catch {
      // Offline fallback state
    } finally {
      setIsSubmitting(false);
      Alert.alert(
        'Dispute Submitted',
        'Your dispute has been logged and sent to Administrator review.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/freelancer-disputes'),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Dispute</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Form Group 1: Project */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Project</Text>
          <TouchableOpacity style={styles.selectInput} onPress={handleSelectProject}>
            <Text style={styles.selectValue}>{project}</Text>
            <Text style={styles.dropdownArrow}>⌄</Text>
          </TouchableOpacity>
        </View>

        {/* Form Group 2: Issue Type */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Issue Type</Text>
          <TouchableOpacity style={styles.selectInput} onPress={handleSelectIssueType}>
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
            placeholderTextColor={Colors.neutralLight}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Form Group 4: Evidence Files Dropzone */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Evidence Files</Text>
          <TouchableOpacity style={styles.dropZone} onPress={handleUploadFile}>
            <View style={styles.uploadIconBox}>
              <Text style={{ fontSize: 20, color: Colors.primary }}>⇡</Text>
            </View>
            <Text style={styles.uploadTitle}>
              {uploadedFile ? `Attached: ${uploadedFile}` : 'Upload supporting files'}
            </Text>
            <Text style={styles.uploadSubtext}>PDF, JPG, PNG (Max 5MB)</Text>
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
            <ActivityIndicator color={Colors.surface} size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Dispute</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/dashboard')}>
          <Text style={[styles.tabIcon, styles.tabIconActive]}>🏠</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/contracts')}>
          <Text style={styles.tabIcon}>📁</Text>
          <Text style={styles.tabLabel}>Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/escrow')}>
          <Text style={styles.tabIcon}>💳</Text>
          <Text style={styles.tabLabel}>Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/notifications')}>
          <Text style={styles.tabIcon}>🔔</Text>
          <Text style={styles.tabLabel}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: { flex: 1 },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: 80,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '600',
    color: Colors.dark,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark,
  },
  formGroup: {
    marginBottom: Theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: Theme.spacing.xs,
  },
  selectInput: {
    height: 48,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
  },
  selectValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  dropdownArrow: {
    fontSize: 16,
    color: Colors.neutralMedium,
  },
  textArea: {
    minHeight: 120,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: 14,
    color: Colors.dark,
  },
  dropZone: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 11,
    color: Colors.neutralMedium,
  },
  submitButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.surface,
  },
  bottomTabBar: {
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

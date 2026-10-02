import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Colors from '../constants/colors';
import Theme from '../constants/theme';
import { Milestone } from '../types';

interface DeliverableModalProps {
  visible: boolean;
  milestone: Milestone | null;
  onClose: () => void;
  onSubmit: (milestoneId: string, fileName: string, notes: string) => Promise<void>;
}

export const DeliverableModal: React.FC<DeliverableModalProps> = ({
  visible,
  milestone,
  onClose,
  onSubmit,
}) => {
  const [fileName, setFileName] = useState('design-specs-v1.pdf');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  if (!milestone) return null;

  const handleSubmit = async () => {
    if (!fileName.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(milestone.id, fileName, notes);
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        setIsSubmitting(false);
        setNotes('');
        onClose();
      }, 1200);
    } catch {
      setIsSubmitting(false);
    }
  };

  const sampleFiles = [
    'design-specs-v1.pdf',
    'homepage-prototype.fig',
    'source-code-bundle.zip',
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Upload Deliverable</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.milestoneTitle}>
            Milestone: <Text style={{ color: Colors.primary }}>{milestone.title}</Text>
          </Text>

          {showSuccessToast ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>✓ Deliverable Uploaded Successfully!</Text>
              <Text style={styles.successSub}>
                Client has been notified for review and escrow approval.
              </Text>
            </View>
          ) : (
            <>
              {/* File Attachment Dropzone Simulation */}
              <Text style={styles.label}>Select File Attachment:</Text>
              <View style={styles.fileOptionsRow}>
                {sampleFiles.map((file) => (
                  <TouchableOpacity
                    key={file}
                    style={[
                      styles.fileChip,
                      fileName === file && styles.fileChipSelected,
                    ]}
                    onPress={() => setFileName(file)}
                  >
                    <Text
                      style={[
                        styles.fileChipText,
                        fileName === file && styles.fileChipTextSelected,
                      ]}
                    >
                      {file}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fileHint}>
                Supports .fig, .pdf, .zip up to 50MB (WCAG & HCI UI-02 Guidelines)
              </Text>

              {/* Notes Input */}
              <Text style={styles.label}>Notes to Reviewer (Optional):</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                placeholder="Provide details about completed work, Figma links, or release notes..."
                placeholderTextColor={Colors.neutralLight}
                value={notes}
                onChangeText={setNotes}
              />

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={Colors.surface} size="small" />
                  ) : (
                    <Text style={styles.submitText}>Submit for Approval</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 39, 0.6)',
    justifyContent: 'center',
    padding: Theme.spacing.md,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.modal,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
  },
  closeBtn: {
    width: Theme.minTouchTarget,
    height: Theme.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: Colors.neutralMedium,
  },
  milestoneTitle: {
    fontSize: 13,
    color: Colors.neutralMedium,
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Theme.spacing.xs,
    marginTop: Theme.spacing.sm,
  },
  fileOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
    marginBottom: 4,
  },
  fileChip: {
    paddingHorizontal: Theme.spacing.sm + 2,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fileChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  fileChipText: {
    fontSize: 12,
    color: Colors.neutralMedium,
  },
  fileChipTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  fileHint: {
    fontSize: 11,
    color: Colors.neutralLight,
    marginBottom: Theme.spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.sm,
    fontSize: 13,
    color: Colors.dark,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  cancelBtn: {
    minHeight: Theme.minTouchTarget,
    paddingHorizontal: Theme.spacing.md,
    justifyContent: 'center',
    borderRadius: Theme.borderRadius.sm,
  },
  cancelText: {
    color: Colors.neutralMedium,
    fontWeight: '500',
  },
  submitBtn: {
    minHeight: Theme.minTouchTarget,
    paddingHorizontal: Theme.spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  successBox: {
    backgroundColor: Colors.successBg,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
  },
  successTitle: {
    color: Colors.successText,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  successSub: {
    color: Colors.successText,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default DeliverableModal;

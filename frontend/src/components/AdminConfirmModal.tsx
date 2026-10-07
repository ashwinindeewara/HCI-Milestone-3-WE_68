import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '../constants/colors';
import { adminRadius, adminSpace, adminShadow } from '../constants/adminTheme';

interface AdminConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function AdminConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
}: AdminConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isLoading}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color={Colors.surface} />
              ) : (
                <Text style={styles.confirmText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 39, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpace.xl,
  },
  modalBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: adminRadius.lg + 4,
    padding: adminSpace.xl,
    ...adminShadow.raised,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: adminSpace.sm,
  },
  message: {
    fontSize: 14,
    color: Colors.neutralMedium,
    marginBottom: adminSpace.xl,
    lineHeight: 21,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: adminSpace.sm,
  },
  cancelBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: adminSpace.lg,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cancelText: {
    color: Colors.dark,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: adminSpace.lg,
    borderRadius: adminRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmText: {
    color: Colors.surface,
    fontWeight: '700',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Colors from '../constants/colors';
import Theme from '../constants/theme';
import apiClient from '../services/api';

export interface ContactSupportModalProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialCategory?: string;
  initialSubject?: string;
  onSuccess?: (ticketId: string, message: string) => void;
}

export default function ContactSupportModal({
  visible,
  onClose,
  initialEmail = '',
  initialCategory = 'General Inquiry',
  initialSubject = '',
  onSuccess,
}: ContactSupportModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<{ ticketId: string; message: string } | null>(null);

  useEffect(() => {
    if (visible) {
      setEmail(initialEmail);
      setCategory(initialCategory || 'General Inquiry');
      if (initialCategory.toLowerCase().includes('suspension') || initialSubject.toLowerCase().includes('suspension')) {
        setSubject(initialSubject || `Account Suspension Appeal (${initialEmail || 'User'})`);
      } else {
        setSubject(initialSubject || '');
      }
      setMessage('');
      setErrorMsg('');
      setSubmittedTicket(null);
    }
  }, [visible, initialEmail, initialCategory, initialSubject]);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Please describe your inquiry or reason for contacting support.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await apiClient.post('/support/ticket', {
        email: email.trim().toLowerCase(),
        name: name.trim() || email.split('@')[0],
        category: category,
        subject: subject.trim() || `${category} from ${email.trim()}`,
        message: message.trim(),
      });

      const ticketId = response.data?.ticketId || `TICKET-SUP-${1000 + Math.floor(Math.random() * 9000)}`;
      const msg = response.data?.message || 'Support ticket submitted successfully.';

      setSubmittedTicket({ ticketId, message: msg });
      if (onSuccess) {
        onSuccess(ticketId, msg);
      }
    } catch (err: any) {
      const respErr = err.response?.data?.message || 'Failed to submit support ticket. Please try again.';
      setErrorMsg(respErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmittedTicket(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 22 }}>🎧</Text>
              <Text style={styles.modalTitle}>Contact Support & Help Desk</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {submittedTicket ? (
            /* Success Ticket Confirmation Box */
            <View style={styles.successContainer}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>✅</Text>
              <Text style={styles.successTitle}>Support Ticket Submitted!</Text>
              <View style={styles.ticketBadge}>
                <Text style={styles.ticketBadgeText}>Ticket ID: {submittedTicket.ticketId}</Text>
              </View>
              <Text style={styles.successSub}>
                {submittedTicket.message}
              </Text>
              <Text style={styles.successNote}>
                An email confirmation has been dispatched to <Text style={{ fontWeight: '700', color: Colors.dark }}>{email}</Text>.
              </Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Done & Return</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Support Form */
            <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                </View>
              ) : null}

              {/* Email Address */}
              <Text style={styles.inputLabel}>Your Email Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="you@example.com"
                placeholderTextColor={Colors.neutralLight}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMsg) setErrorMsg('');
                }}
              />

              {/* Full Name */}
              <Text style={styles.inputLabel}>Your Name (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Alex Rivera"
                placeholderTextColor={Colors.neutralLight}
                value={name}
                onChangeText={setName}
              />

              {/* Inquiry Category */}
              <Text style={styles.inputLabel}>Inquiry Category</Text>
              <View style={styles.categoryRadioGrid}>
                {[
                  '🚫 Account Suspension Appeal',
                  '💳 Payment & Escrow Query',
                  '🛠️ Technical Support',
                  '❓ General Inquiry',
                ].map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Subject */}
              <Text style={styles.inputLabel}>Subject / Summary</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Request to review account suspension"
                placeholderTextColor={Colors.neutralLight}
                value={subject}
                onChangeText={setSubject}
              />

              {/* Message Details */}
              <Text style={styles.inputLabel}>Details / Reason for Contact *</Text>
              <TextInput
                style={[styles.modalInput, { height: 90, paddingTop: 10 }]}
                placeholder="Please explain your issue or appeal details..."
                placeholderTextColor={Colors.neutralLight}
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={(text) => {
                  setMessage(text);
                  if (errorMsg) setErrorMsg('');
                }}
              />

              {/* Action Buttons */}
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={Colors.surface} size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Submit Ticket</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Theme.spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  closeBtn: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutralMedium,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
    marginTop: Theme.spacing.sm,
    marginBottom: 4,
  },
  modalInput: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    fontSize: 14,
    color: Colors.dark,
    backgroundColor: Colors.background,
  },
  categoryRadioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutralMedium,
  },
  categoryChipTextActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm + 2,
    marginBottom: Theme.spacing.xs,
  },
  errorText: {
    color: Colors.errorText,
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.lg,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 4,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutralMedium,
  },
  primaryBtn: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xs + 4,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.card,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.surface,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark,
    marginVertical: 4,
  },
  ticketBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    marginVertical: Theme.spacing.xs,
  },
  ticketBadgeText: {
    color: Colors.primaryDark,
    fontWeight: '800',
    fontSize: 13,
  },
  successSub: {
    fontSize: 13,
    color: Colors.neutralMedium,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  successNote: {
    fontSize: 12,
    color: Colors.neutralLight,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: Theme.spacing.lg,
  },
});

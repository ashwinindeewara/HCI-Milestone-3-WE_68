import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Colors from '../constants/colors';
import Theme from '../constants/theme';
import apiClient from '../services/api';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
  onResetSuccess?: (email: string) => void;
}

export default function ForgotPasswordModal({
  visible,
  onClose,
  initialEmail = '',
  onResetSuccess,
}: ForgotPasswordModalProps) {
  // Modal Step State: 1 = Request Code, 2 = Verify Code & Reset, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Field States
  const [email, setEmail] = useState(initialEmail);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receivedCodeBanner, setReceivedCodeBanner] = useState('');

  const resetModalState = () => {
    setStep(1);
    setEmail(initialEmail);
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setReceivedCodeBanner('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  // Step 1: Request Reset Code
  const handleRequestCode = async () => {
    setErrorMsg('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email: trimmedEmail,
      });

      const code = response.data?.resetCode || '849201';
      setReceivedCodeBanner(`🔑 Verification code: ${code}`);
      setResetCode(code);
      setStep(2);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Failed to request password reset code. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Submit Reset Password
  const handleResetPassword = async () => {
    setErrorMsg('');
    if (!resetCode.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and Confirm password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        resetCode: resetCode.trim(),
        newPassword: newPassword,
      });

      setStep(3);
      if (onResetSuccess) {
        onResetSuccess(email.trim());
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Failed to reset password. Please verify your code and try again.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Header Close Button */}
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.modalTitle}>
                    {step === 1
                      ? 'Forgot Password'
                      : step === 2
                      ? 'Reset Your Password'
                      : 'Password Reset Complete'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {step === 1
                      ? 'Enter your email to receive a 6-digit verification code.'
                      : step === 2
                      ? `Code sent to ${email.trim() || 'your email'}.`
                      : 'Your password has been updated successfully.'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Error Message Banner */}
              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>⚠️ {errorMsg}</Text>
                </View>
              ) : null}

              {/* Demo Reset Code Banner */}
              {receivedCodeBanner && step === 2 ? (
                <View style={styles.codeBanner}>
                  <Text style={styles.codeBannerText}>{receivedCodeBanner}</Text>
                  <Text style={styles.codeBannerSubtext}>
                    (Code pre-filled for rapid testing & verification)
                  </Text>
                </View>
              ) : null}

              {/* Step 1 Content: Enter Email */}
              {step === 1 && (
                <View style={styles.formSection}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.neutralLight}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errorMsg) setErrorMsg('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <TouchableOpacity
                    style={[styles.primaryButton, isSubmitting && styles.btnDisabled]}
                    onPress={handleRequestCode}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={Colors.surface} size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Send Reset Code 📩</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 2 Content: Enter Code & New Password */}
              {step === 2 && (
                <View style={styles.formSection}>
                  <Text style={styles.label}>6-Digit Verification Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 849201"
                    placeholderTextColor={Colors.neutralLight}
                    value={resetCode}
                    onChangeText={(text) => {
                      setResetCode(text);
                      if (errorMsg) setErrorMsg('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor={Colors.neutralLight}
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        if (errorMsg) setErrorMsg('');
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.label}>Confirm New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Re-enter new password"
                      placeholderTextColor={Colors.neutralLight}
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (errorMsg) setErrorMsg('');
                      }}
                    />
                  </View>

                  <View style={styles.step2Actions}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => setStep(1)}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.secondaryBtnText}>‹ Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        { flex: 1 },
                        isSubmitting && styles.btnDisabled,
                      ]}
                      onPress={handleResetPassword}
                      disabled={isSubmitting}
                      activeOpacity={0.85}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color={Colors.surface} size="small" />
                      ) : (
                        <Text style={styles.buttonText}>Update Password 🔐</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Step 3 Content: Reset Complete */}
              {step === 3 && (
                <View style={styles.successSection}>
                  <View style={styles.successBadge}>
                    <Text style={styles.successIcon}>✓</Text>
                  </View>
                  <Text style={styles.successTitle}>Password Updated!</Text>
                  <Text style={styles.successText}>
                    Your account password has been updated securely. You can now log in using your new credentials.
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleClose}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.buttonText}>Proceed to Login 🚀</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.modal,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.neutralMedium,
    maxWidth: 320,
    lineHeight: 18,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: Colors.neutralMedium,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  errorBannerText: {
    color: Colors.errorText,
    fontSize: 13,
    fontWeight: '600',
  },
  codeBanner: {
    backgroundColor: Colors.primaryLight + '50',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    alignItems: 'center',
  },
  codeBannerText: {
    color: Colors.primaryDark,
    fontSize: 15,
    fontWeight: '800',
  },
  codeBannerSubtext: {
    color: Colors.primaryDark,
    fontSize: 11,
    marginTop: 2,
    opacity: 0.8,
  },
  formSection: {
    marginTop: Theme.spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 48,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    fontSize: 14,
    color: Colors.dark,
  },
  passwordContainer: {
    height: 48,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
  },
  eyeBtn: {
    padding: 6,
  },
  primaryButton: {
    height: 50,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.surface,
    textAlign: 'center',
  },
  step2Actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: Theme.spacing.xs,
    width: '100%',
  },
  secondaryBtn: {
    height: 50,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    marginTop: Theme.spacing.lg,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    width: '100%',
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.successBg || '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  successIcon: {
    fontSize: 32,
    color: Colors.success || '#166534',
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: Colors.neutralMedium,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Theme.spacing.md,
  },
});

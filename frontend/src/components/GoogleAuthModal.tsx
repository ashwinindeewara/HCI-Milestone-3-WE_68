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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/colors';
import Theme from '../constants/theme';
import apiClient from '../services/api';
import { saveUserSession } from '../services/storage';

interface GoogleAuthModalProps {
  visible: boolean;
  onClose: () => void;
  defaultRole?: string;
}

export type RoleOption = 'FREELANCER' | 'CLIENT' | 'ADMIN' | 'PAYMENT_STAFF';

export interface GoogleAccountItem {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarBg: string;
}

/**
 * Validates Google email format, detects domain typos (e.g. gmail.om),
 * and rejects fake / disposable email addresses.
 */
export const validateGoogleEmail = (email: string): { isValid: boolean; errorMsg?: string } => {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, errorMsg: 'Please enter your Google email address.' };
  }

  // Basic syntax check
  const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!basicRegex.test(trimmed)) {
    return {
      isValid: false,
      errorMsg: `⚠️ Invalid Email Format: '${trimmed}' is not a valid email address (e.g. user@gmail.com).`,
    };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { isValid: false, errorMsg: '⚠️ Invalid Email: Email address must contain exactly one "@" symbol.' };
  }

  const domain = parts[1];

  // Common Google / Email domain typos dictionary
  const domainTypos: { [key: string]: string } = {
    'gmail.om': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmail.cm': 'gmail.com',
    'gmail.c': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmall.com': 'gmail.com',
    'gmail.com.com': 'gmail.com',
    'googlemail.om': 'googlemail.com',
    'googlemail.co': 'googlemail.com',
  };

  if (domainTypos[domain]) {
    return {
      isValid: false,
      errorMsg: `⚠️ Domain Typo Detected: Did you mean '@${domainTypos[domain]}' instead of '@${domain}'? Please correct your email address.`,
    };
  }

  // Reject disposable / fake test domains
  const fakeDomains = [
    'fake.com', 'temp.com', 'test.com', 'example.com', 'invalid.com',
    'disposable.com', 'tempmail.com', 'mailinator.com', '10minutemail.com',
    'trashmail.com', 'sharklasers.com', 'yopmail.com'
  ];

  if (fakeDomains.some((fake) => domain === fake || domain.endsWith('.' + fake))) {
    return {
      isValid: false,
      errorMsg: `⚠️ Invalid Google Account: '${trimmed}' uses a disposable/fake email domain. Please sign in with a valid Google or G-Suite email account.`,
    };
  }

  // Check valid TLD length (must be at least 2 characters)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || /^\d+$/.test(tld)) {
    return {
      isValid: false,
      errorMsg: `⚠️ Invalid Top-Level Domain: '.${tld}' is not a recognized top-level domain extension.`,
    };
  }

  return { isValid: true };
};

export default function GoogleAuthModal({
  visible,
  onClose,
  defaultRole = 'FREELANCER',
}: GoogleAuthModalProps) {
  const router = useRouter();

  // Step State: 1 = Google Email Entry, 2 = User Role Selection Feature
  const [step, setStep] = useState<1 | 2>(1);

  // Dynamic Google Accounts state
  const [savedAccounts, setSavedAccounts] = useState<GoogleAccountItem[]>([]);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Input states
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Selected User Role State (Role Selection Feature)
  const [selectedRole, setSelectedRole] = useState<RoleOption>(
    (defaultRole as RoleOption) || 'FREELANCER'
  );

  // Execution & loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const resetModal = () => {
    setStep(1);
    setShowCustomInput(false);
    setIsRemoveMode(false);
    setEmailInput('');
    setNameInput('');
    setErrorMsg('');
    setLoadingEmail(null);
    setIsSubmitting(false);
    setSelectedRole((defaultRole as RoleOption) || 'FREELANCER');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Step 1 Validation: Check Google Account Email validity
  const validateAndProceedToRoleSelection = (email: string, name?: string) => {
    setErrorMsg('');
    const validation = validateGoogleEmail(email);

    if (!validation.isValid) {
      setErrorMsg(validation.errorMsg || 'Please enter a valid Google email address.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    setEmailInput(trimmedEmail);
    if (name) setNameInput(name);

    // Proceed to Step 2: Role Selection Feature Screen
    setStep(2);
  };

  // Step 2 Submission: Authenticate with backend using chosen role
  const completeGoogleAuth = async () => {
    setErrorMsg('');
    const trimmedEmail = emailInput.trim().toLowerCase();
    const displayName = nameInput.trim() || trimmedEmail.split('@')[0];

    setIsSubmitting(true);
    setLoadingEmail(trimmedEmail);

    try {
      const response = await apiClient.post('/auth/google', {
        email: trimmedEmail,
        name: displayName,
        idToken: 'mock_google_id_token_' + Date.now(),
        role: selectedRole,
      });

      const userRole = response.data?.role || selectedRole;

      // Add to dynamic saved accounts list
      const exists = savedAccounts.some((a) => a.email === trimmedEmail);
      if (!exists) {
        const initials = displayName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        setSavedAccounts((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            name: displayName,
            email: trimmedEmail,
            initials: initials || 'G',
            avatarBg: '#E0E7FF',
          },
        ]);
      }

      saveUserSession({
        id: response.data?.id,
        fullName: response.data?.fullName || displayName,
        email: response.data?.email || trimmedEmail,
        role: userRole,
        token: response.data?.token,
      });

      handleClose();

      // Dynamic role-based navigation
      if (userRole === 'ADMIN') {
        router.replace('/admin-dashboard');
      } else if (userRole === 'PAYMENT_STAFF') {
        router.replace('/staff-dashboard');
      } else if (userRole === 'CLIENT') {
        router.replace({ pathname: '/(tabs)/dashboard', params: { role: 'CLIENT' } });
      } else {
        router.replace({ pathname: '/(tabs)/dashboard', params: { role: 'FREELANCER' } });
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Google authentication failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
      setLoadingEmail(null);
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
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>

              {/* Authentic Google Brand Header */}
              <View style={styles.headerArea}>
                <View style={styles.googleGContainer}>
                  <Text style={styles.googleLetterG}>G</Text>
                </View>
                <Text style={styles.googleTitle}>
                  {step === 1 ? 'Sign in with Google' : 'Select User Role'}
                </Text>
                <Text style={styles.googleSubtitle}>
                  {step === 1
                    ? 'to continue to FreelanceFlow'
                    : `Choose how you want to access FreelanceFlow as ${emailInput}`}
                </Text>
              </View>

              {/* Error Message Banner */}
              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Remove Account Mode Banner */}
              {isRemoveMode && step === 1 ? (
                <View style={styles.removeBanner}>
                  <Text style={styles.removeBannerText}>
                    🗑️ Tap an account to remove it from this device
                  </Text>
                  <TouchableOpacity onPress={() => setIsRemoveMode(false)}>
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {step === 1 ? (
                  /* Step 1: Google Account Email Entry & Saved Accounts */
                  savedAccounts.length > 0 && !showCustomInput ? (
                    <View style={styles.accountsListContainer}>
                      {savedAccounts.map((acc, index) => {
                        const isLoadingThis = loadingEmail === acc.email;
                        return (
                          <TouchableOpacity
                            key={acc.id}
                            style={[
                              styles.accountRow,
                              index < savedAccounts.length - 1 && styles.rowDivider,
                            ]}
                            onPress={() => {
                              if (isRemoveMode) {
                                setSavedAccounts(savedAccounts.filter((a) => a.id !== acc.id));
                              } else {
                                validateAndProceedToRoleSelection(acc.email, acc.name);
                              }
                            }}
                            disabled={isSubmitting}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.avatarCircle,
                                { backgroundColor: acc.avatarBg },
                              ]}
                            >
                              <Text style={styles.avatarText}>{acc.initials}</Text>
                            </View>

                            <View style={styles.accountInfo}>
                              <Text style={styles.accountName}>{acc.name}</Text>
                              <Text style={styles.accountEmail}>{acc.email}</Text>
                            </View>

                            {isLoadingThis ? (
                              <ActivityIndicator size="small" color={Colors.primary} />
                            ) : isRemoveMode ? (
                              <Text style={styles.removeIcon}>❌</Text>
                            ) : (
                              <Text style={styles.statusBadge}>Signed out</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}

                      {/* Option Row: Use another account */}
                      <TouchableOpacity
                        style={[styles.optionRow, styles.topDivider]}
                        onPress={() => {
                          setShowCustomInput(true);
                          setErrorMsg('');
                        }}
                        disabled={isSubmitting}
                        activeOpacity={0.7}
                      >
                        <View style={styles.iconCircle}>
                          <Text style={{ fontSize: 16 }}>👤</Text>
                        </View>
                        <Text style={styles.optionLabel}>Use another account</Text>
                      </TouchableOpacity>

                      {/* Option Row: Remove an account */}
                      <TouchableOpacity
                        style={[styles.optionRow, styles.topDivider]}
                        onPress={() => setIsRemoveMode(!isRemoveMode)}
                        disabled={isSubmitting}
                        activeOpacity={0.7}
                      >
                        <View style={styles.iconCircle}>
                          <Text style={{ fontSize: 16 }}>⚙️</Text>
                        </View>
                        <Text style={styles.optionLabel}>
                          {isRemoveMode ? 'Done managing accounts' : 'Remove an account'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Google Credentials Form */
                    <View style={styles.customInputContainer}>
                      <Text style={styles.inputLabel}>Google Email Address</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="your.name@gmail.com"
                        placeholderTextColor={Colors.neutralLight}
                        value={emailInput}
                        onChangeText={(text) => {
                          setEmailInput(text);
                          if (errorMsg) setErrorMsg('');
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />

                      <Text style={styles.inputLabel}>Full Name (Optional)</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Sarah Connor"
                        placeholderTextColor={Colors.neutralLight}
                        value={nameInput}
                        onChangeText={setNameInput}
                        autoCapitalize="words"
                      />

                      {savedAccounts.length > 0 && (
                        <TouchableOpacity
                          style={styles.switchAccountsBtn}
                          onPress={() => {
                            setShowCustomInput(false);
                            setErrorMsg('');
                          }}
                        >
                          <Text style={styles.switchAccountsText}>
                            ‹ Back to saved accounts
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={() => validateAndProceedToRoleSelection(emailInput, nameInput)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.submitButtonText}>
                          Continue to Role Selection ➔
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )
                ) : (
                  /* Step 2: User Role Selection Feature Screen */
                  <View style={styles.roleSelectionContainer}>
                    <Text style={styles.roleSectionTitle}>Select Account Role</Text>
                    <Text style={styles.roleSectionSubtitle}>
                      Choose your access level on FreelanceFlow:
                    </Text>

                    {/* Role Option 1: Freelancer (Top Option) */}
                    <TouchableOpacity
                      style={[
                        styles.roleCard,
                        selectedRole === 'FREELANCER' && styles.roleCardActive,
                      ]}
                      onPress={() => setSelectedRole('FREELANCER')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.roleEmoji}>👨‍💻</Text>
                      <View style={styles.roleCardText}>
                        <Text style={styles.roleTitle}>Freelancer</Text>
                        <Text style={styles.roleDesc}>
                          Find freelance contracts, submit deliverables & receive escrow payouts.
                        </Text>
                      </View>
                      {selectedRole === 'FREELANCER' && (
                        <Text style={styles.roleCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>

                    {/* Role Option 2: Client */}
                    <TouchableOpacity
                      style={[
                        styles.roleCard,
                        selectedRole === 'CLIENT' && styles.roleCardActive,
                      ]}
                      onPress={() => setSelectedRole('CLIENT')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.roleEmoji}>👨‍💼</Text>
                      <View style={styles.roleCardText}>
                        <Text style={styles.roleTitle}>Client / Employer</Text>
                        <Text style={styles.roleDesc}>
                          Post projects, hire top freelancers & manage secure escrow funding.
                        </Text>
                      </View>
                      {selectedRole === 'CLIENT' && (
                        <Text style={styles.roleCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>

                    {/* Role Option 3: Administrator */}
                    <TouchableOpacity
                      style={[
                        styles.roleCard,
                        selectedRole === 'ADMIN' && styles.roleCardActive,
                      ]}
                      onPress={() => setSelectedRole('ADMIN')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.roleEmoji}>🛡️</Text>
                      <View style={styles.roleCardText}>
                        <Text style={styles.roleTitle}>Administrator</Text>
                        <Text style={styles.roleDesc}>
                          Platform oversight, IP security blocking, dispute resolution & audits.
                        </Text>
                      </View>
                      {selectedRole === 'ADMIN' && (
                        <Text style={styles.roleCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>

                    {/* Role Option 4: Payment Staff */}
                    <TouchableOpacity
                      style={[
                        styles.roleCard,
                        selectedRole === 'PAYMENT_STAFF' && styles.roleCardActive,
                      ]}
                      onPress={() => setSelectedRole('PAYMENT_STAFF')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.roleEmoji}>💳</Text>
                      <View style={styles.roleCardText}>
                        <Text style={styles.roleTitle}>Payment Staff</Text>
                        <Text style={styles.roleDesc}>
                          Financial transaction verification & escrow fund release management.
                        </Text>
                      </View>
                      {selectedRole === 'PAYMENT_STAFF' && (
                        <Text style={styles.roleCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>

                    {/* Role Selection Actions */}
                    <View style={styles.roleActionsRow}>
                      <TouchableOpacity
                        style={styles.backBtnAction}
                        onPress={() => setStep(1)}
                        disabled={isSubmitting}
                      >
                        <Text style={styles.backBtnActionText}>‹ Change Email</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.roleSubmitButton,
                          isSubmitting && styles.btnDisabled,
                        ]}
                        onPress={completeGoogleAuth}
                        disabled={isSubmitting}
                        activeOpacity={0.85}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color={Colors.surface} size="small" />
                        ) : (
                          <Text style={styles.submitButtonText}>
                            Complete Google Sign-In 🚀
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Bottom Authentic Google Footer */}
              <View style={styles.footerContainer}>
                <TouchableOpacity style={styles.langSelector}>
                  <Text style={styles.footerText}>English (United States)</Text>
                  <Text style={styles.dropdownArrow}> ▾</Text>
                </TouchableOpacity>

                <View style={styles.footerLinksRow}>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}>Help</Text>
                  </TouchableOpacity>
                  <Text style={styles.footerDot}>•</Text>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}>Privacy</Text>
                  </TouchableOpacity>
                  <Text style={styles.footerDot}>•</Text>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}>Terms</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.md + 4,
    ...Theme.shadows.modal,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: Theme.spacing.md,
    right: Theme.spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 14,
    color: Colors.neutralMedium,
    fontWeight: '700',
  },
  headerArea: {
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
    paddingRight: 30,
  },
  googleGContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
    ...Theme.shadows.card,
  },
  googleLetterG: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  googleTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark,
    letterSpacing: -0.5,
  },
  googleSubtitle: {
    fontSize: 12.5,
    color: Colors.neutralMedium,
    marginTop: 2,
    lineHeight: 16,
  },
  errorBanner: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm + 2,
    marginBottom: Theme.spacing.sm,
  },
  errorBannerText: {
    color: Colors.errorText,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  removeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm + 2,
    marginBottom: Theme.spacing.sm,
  },
  removeBannerText: {
    color: Colors.warningText,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  doneBtnText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  scrollArea: {
    maxHeight: 460,
  },
  accountsListContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Colors.surface,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.dark,
  },
  accountEmail: {
    fontSize: 11.5,
    color: Colors.neutralMedium,
    marginTop: 1,
  },
  statusBadge: {
    fontSize: 11.5,
    color: Colors.neutralLight,
    fontWeight: '500',
  },
  removeIcon: {
    fontSize: 13,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Colors.surface,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  optionLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.dark,
  },
  customInputContainer: {
    paddingVertical: 2,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    height: 44,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    fontSize: 13.5,
    color: Colors.dark,
  },
  switchAccountsBtn: {
    marginTop: Theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  switchAccountsText: {
    fontSize: 12.5,
    color: Colors.primary,
    fontWeight: '600',
  },
  roleSelectionContainer: {
    paddingVertical: 2,
  },
  roleSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 2,
  },
  roleSectionSubtitle: {
    fontSize: 12,
    color: Colors.neutralMedium,
    marginBottom: Theme.spacing.xs + 4,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    marginBottom: 8,
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '40',
  },
  roleEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  roleCardText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.dark,
  },
  roleDesc: {
    fontSize: 11.5,
    color: Colors.neutralMedium,
    marginTop: 1,
    lineHeight: 15,
  },
  roleCheckmark: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
    marginLeft: 6,
  },
  roleActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: Theme.spacing.md,
    width: '100%',
  },
  backBtnAction: {
    height: 48,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
  },
  roleSubmitButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    ...Theme.shadows.card,
  },
  submitButton: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  submitButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.surface,
    textAlign: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexWrap: 'wrap',
    gap: 6,
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11.5,
    color: Colors.neutralMedium,
  },
  dropdownArrow: {
    fontSize: 11.5,
    color: Colors.neutralMedium,
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLink: {
    fontSize: 11.5,
    color: Colors.neutralMedium,
    fontWeight: '500',
  },
  footerDot: {
    fontSize: 11.5,
    color: Colors.neutralLight,
  },
});

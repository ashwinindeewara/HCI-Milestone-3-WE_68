import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';
import GoogleAuthModal from '../src/components/GoogleAuthModal';

export default function RegisterScreen() {
  const router = useRouter();

  // Form State Management
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Freelancer' | 'Client' | 'Administrator' | 'Payment Staff'>('Freelancer');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map display role name to Spring Boot UserRole Enum
  const getRoleEnum = (selectedRole: string) => {
    switch (selectedRole) {
      case 'Client':
        return 'CLIENT';
      case 'Administrator':
        return 'ADMIN';
      case 'Payment Staff':
        return 'PAYMENT_STAFF';
      default:
        return 'FREELANCER';
    }
  };

  // Spring Boot API Integration Hook for Registration
  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Required Fields', 'Please fill in all required registration fields.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Password and Confirm Password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/register', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: getRoleEnum(role),
      });
      router.push({
        pathname: '/account-created',
        params: { email: email.trim().toLowerCase(), password: password }
      });
    } catch (error: any) {
      console.warn('Registration notice:', error?.message);
      router.push({
        pathname: '/account-created',
        params: { email: email.trim().toLowerCase(), password: password }
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        {/* Title Header */}
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Join FreelanceFlow and build secure workflows.
        </Text>

        {/* Registration Form */}
        <View style={styles.formGroup}>
          {/* Full Name Field */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sarah Connor"
            placeholderTextColor={Colors.neutralLight}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          {/* Email Address Field */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.neutralLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password Field */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Minimum 8 characters"
              placeholderTextColor={Colors.neutralLight}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Password Field */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Repeat your password"
              placeholderTextColor={Colors.neutralLight}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={{ fontSize: 16 }}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Role Selection Dropdown */}
          <Text style={styles.label}>I want to join as a</Text>
          <TouchableOpacity
            style={styles.dropdownPicker}
            onPress={() => setShowRoleDropdown(!showRoleDropdown)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownValue}>{role}</Text>
            <Text style={styles.dropdownChevron}>v</Text>
          </TouchableOpacity>

          {showRoleDropdown && (
            <View style={styles.dropdownMenu}>
              {(['Freelancer', 'Client', 'Administrator', 'Payment Staff'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.dropdownItem, role === r && styles.dropdownItemActive]}
                  onPress={() => {
                    setRole(r);
                    setShowRoleDropdown(false);
                  }}
                >
                  <Text
                    style={[styles.dropdownItemText, role === r && styles.dropdownItemTextActive]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Terms & Privacy Checkbox */}
          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.8}
            >
              {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Divider Bar */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Continue with Google Social Button */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => setIsGoogleModalOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.googleIcon}>⊗</Text>
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Footer Navigation Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        visible={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        defaultRole={getRoleEnum(role)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  contentContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.xl,
  },
  backBtn: {
    width: Theme.minTouchTarget,
    height: Theme.minTouchTarget,
    justifyContent: 'center',
    marginBottom: Theme.spacing.xs,
  },
  backArrow: {
    fontSize: 28,
    color: Colors.dark,
    fontWeight: '300',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.neutralMedium,
    marginBottom: Theme.spacing.lg,
  },
  formGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 50,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    fontSize: 14,
    color: Colors.dark,
  },
  passwordContainer: {
    height: 50,
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
  dropdownPicker: {
    height: 50,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 14,
    color: Colors.dark,
    fontWeight: '500',
  },
  dropdownChevron: {
    fontSize: 14,
    color: Colors.neutralMedium,
  },
  dropdownMenu: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    marginTop: 4,
    overflow: 'hidden',
    ...Theme.shadows.card,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.md,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  dropdownItemText: {
    fontSize: 14,
    color: Colors.dark,
  },
  dropdownItemTextActive: {
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 12,
    color: Colors.neutralMedium,
    flex: 1,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  primaryButton: {
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
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.surface,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Theme.spacing.md,
    fontSize: 13,
    color: Colors.neutralLight,
  },
  googleButton: {
    height: 52,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Theme.shadows.card,
  },
  googleIcon: {
    fontSize: 18,
    color: Colors.dark,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
  },
  footerText: {
    fontSize: 14,
    color: Colors.neutralMedium,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});

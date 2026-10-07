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
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';
import { saveUserSession } from '../src/services/storage';
import { saveAuthSession } from '../src/services/authService';

import ContactSupportModal from '../src/components/ContactSupportModal';
import ForgotPasswordModal from '../src/components/ForgotPasswordModal';
import GoogleAuthModal from '../src/components/GoogleAuthModal';

export default function LoginScreen() {
  const router = useRouter();
  const { email: paramEmail, password: paramPassword } = useLocalSearchParams<{ email?: string, password?: string }>();

  // Form State Management
  const [email, setEmail] = useState(paramEmail || 'hello@design.com');
  const [password, setPassword] = useState(paramPassword || 'supersecret');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input Validation Error States
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Support & Auth Modals State
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState('General Inquiry');
  const [supportSubject, setSupportSubject] = useState('');

  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const openSupportModal = (category: string = 'General Inquiry', subject: string = '') => {
    setSupportCategory(category);
    setSupportSubject(subject);
    setIsSupportModalOpen(true);
  };

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email address is required.');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('Please enter a valid email address.');
        isValid = false;
      }
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      isValid = false;
    }

    return isValid;
  };

  // Spring Boot Authentication Endpoint Hook
  const handleLogin = async () => {
    let trimmedEmail = email.trim().toLowerCase();

    // Automatically normalize legacy inputs like 'chathuniimalsha.com' -> 'chathuni@design.com'
    if (trimmedEmail === 'chathuniimalsha.com') {
      trimmedEmail = 'chathuni@design.com';
    } else if (trimmedEmail && !trimmedEmail.includes('@')) {
      trimmedEmail = `${trimmedEmail}@design.com`;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setGeneralError('');
    try {
      const response = await apiClient.post('/auth/login', {
        email: trimmedEmail,
        password: password,
      });

      // Save auth session (JWT token & profile details)
      if (response.data?.token) {
        saveAuthSession(response.data.token, response.data);
      }

      const userRole = response.data?.role;

      // Save user session credentials for profile modal
      saveUserSession({
        id: response.data?.id,
        fullName: response.data?.fullName || (email.includes('admin') ? 'System Admin' : 'User Account'),
        email: response.data?.email || email.trim(),
        role: userRole || 'ADMIN',
        token: response.data?.token,
      });

      // Role-based dynamic routing from returned AuthResponse
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
      const errorMessage =
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : null) ||
        error.message ||
        'Invalid email address or password. Please try again.';
      setGeneralError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Google Sign In', 'Connecting to Google OAuth 2.0...');
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
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Please enter your details to sign in.</Text>

        {/* Global Error Banner */}
        {generalError ? (
          <View style={styles.generalErrorBanner}>
            <Text style={styles.generalErrorText}>⚠️ {generalError}</Text>
            {generalError.toLowerCase().includes('contact support') || generalError.toLowerCase().includes('suspended') ? (
              <TouchableOpacity
                style={styles.supportBannerActionBtn}
                onPress={() => openSupportModal('🚫 Account Suspension Appeal', `Account Suspension Appeal for ${email}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.supportBannerActionText}>🎧 Contact Support Team</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={styles.formGroup}>
          {/* Email Field */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="you@example.com"
            placeholderTextColor={Colors.neutralLight}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
              if (generalError) setGeneralError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? <Text style={styles.fieldErrorText}>⚠️ {emailError}</Text> : null}

          {/* Password Field */}
          <Text style={styles.label}>Password</Text>
          <View style={[styles.passwordContainer, passwordError ? styles.inputError : null]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor={Colors.neutralLight}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
                if (generalError) setGeneralError('');
              }}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.fieldErrorText}>⚠️ {passwordError}</Text> : null}

          {/* Remember Me & Forgot Password Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsForgotPasswordModalOpen(true)}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary Log In Button */}
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
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
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.footerLink}>Create account</Text>
          </TouchableOpacity>
        </View>

        {/* Dedicated Support Footer Link */}
        <View style={[styles.footerRow, { marginTop: Theme.spacing.md }]}>
          <TouchableOpacity onPress={() => openSupportModal('❓ General Inquiry', '')} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.footerText}>Need assistance? </Text>
            <Text style={styles.footerLink}>Contact Help Desk 🎧</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Contact Support Modal */}
      <ContactSupportModal
        visible={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        initialEmail={email}
        initialCategory={supportCategory}
        initialSubject={supportSubject}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        visible={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        initialEmail={email}
      />

      {/* Google Sign-In Modal */}
      <GoogleAuthModal
        visible={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        defaultRole="FREELANCER"
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
  rememberText: {
    fontSize: 13,
    color: Colors.dark,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
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
    marginTop: Theme.spacing.xl,
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
  generalErrorBanner: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  generalErrorText: {
    color: Colors.errorText,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  supportBannerActionBtn: {
    marginTop: Theme.spacing.sm,
    backgroundColor: Colors.errorText,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 3,
    borderRadius: Theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  supportBannerActionText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg + '30',
  },
  fieldErrorText: {
    color: Colors.errorText,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

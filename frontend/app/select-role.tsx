import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';

export type UserRole = 'FREELANCER' | 'CLIENT' | 'ADMIN' | 'PAYMENT_STAFF';

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'FREELANCER',
    title: 'Freelancer',
    description: 'I want to find work and get paid securely.',
    icon: '🧳',
  },
  {
    id: 'CLIENT',
    title: 'Client',
    description: 'I want to hire freelancers and manage projects.',
    icon: '👤',
  },
  {
    id: 'ADMIN',
    title: 'Administrator',
    description: 'I can prevent fraudulent activities and maintain platform security.',
    icon: '⚙️',
  },
  {
    id: 'PAYMENT_STAFF',
    title: 'Payment Staff',
    description: 'The faster payments are verified, the faster freelancers receive their money.',
    icon: '🕴️',
  },
];

export default function SelectRoleScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('FREELANCER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Fix 2: Direct Role Navigation Handler
   * Navigates directly to the Freelancer Workspace Dashboard
   */
  const handleConfirmRole = async () => {
    setIsSubmitting(true);
    try {
      // Spring Boot backend POST role selection
      await apiClient.post('/users/role', { role: selectedRole });
    } catch {
      // Fallback for offline API state
    } finally {
      setIsSubmitting(false);
      if (selectedRole === 'ADMIN') {
        router.replace('/admin-dashboard');
      } else if (selectedRole === 'PAYMENT_STAFF') {
        router.replace('/staff-dashboard');
      } else {
        router.replace({
          pathname: '/(tabs)/dashboard',
          params: { role: selectedRole },
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header Title & Subtitle */}
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>
          Admin and Payment Staff use role-based secure login to manage the platform.
        </Text>

        {/* Role Options Cards List */}
        <View style={styles.roleList}>
          {ROLE_OPTIONS.map((option) => {
            const isSelected = selectedRole === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.roleCard,
                  isSelected && styles.roleCardSelected,
                ]}
                onPress={() => setSelectedRole(option.id)}
                activeOpacity={0.85}
              >
                {/* Icon Container */}
                <View
                  style={[
                    styles.iconBox,
                    isSelected ? styles.iconBoxSelected : styles.iconBoxNormal,
                  ]}
                >
                  <Text style={styles.iconText}>{option.icon}</Text>
                </View>

                {/* Text Details */}
                <View style={styles.textDetails}>
                  <Text style={styles.roleTitle}>{option.title}</Text>
                  <Text style={styles.roleDescription}>{option.description}</Text>
                </View>

                {/* Radio Button Indicator */}
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.btnDisabled]}
          onPress={handleConfirmRole}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>
              Continue as {ROLE_OPTIONS.find((r) => r.id === selectedRole)?.title}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.neutralMedium,
    lineHeight: 20,
    marginBottom: Theme.spacing.lg,
  },
  roleList: {
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    minHeight: 84,
  },
  roleCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.primary,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  iconBoxNormal: {
    backgroundColor: Colors.background,
  },
  iconBoxSelected: {
    backgroundColor: Colors.primaryLight,
  },
  iconText: {
    fontSize: 22,
  },
  textDetails: {
    flex: 1,
    paddingRight: Theme.spacing.xs,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 12,
    color: Colors.neutralMedium,
    lineHeight: 17,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
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
});

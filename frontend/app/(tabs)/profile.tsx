import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';
import StatusBadge from '../../src/components/StatusBadge';
import { getUserSession, clearUserSession } from '../../src/services/storage';

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('Chathuni Imalsha');
  const [userEmail, setUserEmail] = useState('user@freelance.com');
  const [userRole, setUserRole] = useState('Freelancer');

  useEffect(() => {
    const session = getUserSession();
    if (session) {
      if (session.fullName) setUserName(session.fullName);
      if (session.email) setUserEmail(session.email);
      if (session.role) {
        const r = session.role.toUpperCase();
        if (r === 'CLIENT') setUserRole('Client');
        else if (r === 'ADMIN') setUserRole('Administrator');
        else if (r === 'PAYMENT_STAFF') setUserRole('Payment Staff');
        else setUserRole('Freelancer');
      }
    }
  }, []);

  const handleSwitchRole = () => {
    router.push('/select-role');
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of FreelanceFlow?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          clearUserSession();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>

        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>

        <View style={styles.roleBadgeContainer}>
          <StatusBadge status="ACTIVE" />
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>Role: {userRole}</Text>
          </View>
        </View>
      </View>

      {/* Account Settings List */}
      <Text style={styles.sectionHeader}>Account & Preferences</Text>
      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuRow} onPress={handleSwitchRole} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>👥</Text>
          <View style={styles.menuTextContent}>
            <Text style={styles.menuTitle}>Switch User Role</Text>
            <Text style={styles.menuSub}>Freelancer, Client, Admin, Payment Staff</Text>
          </View>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/(tabs)/contracts')} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>📑</Text>
          <View style={styles.menuTextContent}>
            <Text style={styles.menuTitle}>Contract & Milestone Settings</Text>
            <Text style={styles.menuSub}>Deliverable formats & auto-reminders</Text>
          </View>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/(tabs)/escrow')} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>🛡️</Text>
          <View style={styles.menuTextContent}>
            <Text style={styles.menuTitle}>Escrow Payment Security</Text>
            <Text style={styles.menuSub}>Bank payout methods & escrow protection</Text>
          </View>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Action Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.md,
  },
  profileHeaderCard: {
    backgroundColor: Colors.dark,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.surface,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.surface,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.neutralLight,
    marginBottom: Theme.spacing.md,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  roleTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Theme.spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
  },
  roleTagText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: Theme.spacing.sm,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: Theme.spacing.md,
  },
  menuTextContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  menuSub: {
    fontSize: 11,
    color: Colors.neutralLight,
    marginTop: 2,
  },
  menuChevron: {
    fontSize: 18,
    color: Colors.neutralLight,
    fontWeight: '600',
  },
  logoutBtn: {
    minHeight: 50,
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  logoutText: {
    color: Colors.errorText,
    fontSize: 15,
    fontWeight: '700',
  },
});

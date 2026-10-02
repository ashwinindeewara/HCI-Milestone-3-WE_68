import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';

export default function StaffProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out of Payment Staff account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => router.replace('/login'),
      },
    ]);
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Staff Profile', 'Opening administrative profile settings.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Title & Logout Button */}
        <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>Staff Profile</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={{ fontSize: 18 }}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Main User Card */}
        <View style={styles.userCard}>
          {/* Avatar with Verified Badge */}
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }}
              style={styles.avatarImage}
            />
            <View style={styles.verifiedBadge}>
              <Text style={{ fontSize: 10, color: '#FFF' }}>✓</Text>
            </View>
          </View>

          {/* User Name & Info */}
          <Text style={styles.userName}>Dasun Geeneth</Text>
          <Text style={styles.userLocation}>Colombo, Sri Lanka</Text>

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <Text style={{ fontSize: 14 }}>⭐</Text>
            <Text style={styles.ratingText}>4.9 (18 Reviews)</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MEMBER SINCE</Text>
            <Text style={styles.statValue}>2024</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>COMPANY</Text>
            <Text style={styles.statValue}>FreelanceFlow</Text>
          </View>

          <View style={[styles.statBox, styles.statBoxGreen]}>
            <Text style={[styles.statLabel, { color: Colors.primaryDark }]}>EXPERIENCE</Text>
            <Text style={[styles.statValue, { color: Colors.primaryDark }]}>4+ Years</Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Experienced payment administrator responsible for managing client payments, escrow
            transactions, payment verification, refunds, and transaction support.
          </Text>
        </View>

        {/* Specialization Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>SPECIALIZATION</Text>
          <View style={styles.chipsWrap}>
            <View style={styles.specChip}>
              <Text style={styles.specChipText}>Payment Processing</Text>
            </View>
            <View style={styles.specChip}>
              <Text style={styles.specChipText}>Escrow Management</Text>
            </View>
            <View style={styles.specChip}>
              <Text style={styles.specChipText}>Transaction Verification</Text>
            </View>
            <View style={styles.specChip}>
              <Text style={styles.specChipText}>Refund Management</Text>
            </View>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Staff Bottom Tab Bar */}
      <View style={styles.staffTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-dashboard')}>
          <Text style={styles.tabIcon}>🟢</Text>
          <Text style={styles.tabLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-transactions')}>
          <Text style={styles.tabIcon}>⬛</Text>
          <Text style={styles.tabLabel}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-reconcile')}>
          <Text style={styles.tabIcon}>🔄</Text>
          <Text style={styles.tabLabel}>Reconcile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-reports')}>
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={styles.tabLabel}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/staff-profile')}>
          <Text style={[styles.tabIcon, styles.tabIconActive]}>👤</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Profile</Text>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Theme.spacing.sm,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 13,
    color: Colors.neutralMedium,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutralMedium,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statBoxGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.primaryLight,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.neutralMedium,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
  },
  sectionContainer: {
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: Theme.spacing.xs,
    letterSpacing: 0.5,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.neutralMedium,
    lineHeight: 20,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
  },
  specChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
  },
  specChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark,
  },
  editButton: {
    height: 48,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  staffTabBar: {
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

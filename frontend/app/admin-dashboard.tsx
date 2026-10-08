import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import AdminTabBar from '../src/components/AdminTabBar';
import AdminToast, { ToastType } from '../src/components/AdminToast';
import SkeletonCard from '../src/components/SkeletonCard';
import { useQuery } from '@tanstack/react-query';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';
import { getUserSession, saveUserSession, clearUserSession } from '../src/services/storage';
import { clearAuthSession } from '../src/services/authService';

export default function AdminDashboardScreen() {
  const router = useRouter();

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });
  const showToast = (message: string, type: ToastType = 'info') => setToast({ visible: true, message, type });

  // Profile & Settings Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [adminName, setAdminName] = useState('System Administrator');
  const [adminEmail, setAdminEmail] = useState('admin@freelance.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Fetch saved user credentials from login session
  useEffect(() => {
    const session = getUserSession();
    if (session) {
      if (session.fullName) setAdminName(session.fullName);
      if (session.email) setAdminEmail(session.email);
    }
  }, []);

  const { data: kpisData, isLoading: isLoadingKpis } = useQuery({
    queryKey: ['adminKpis'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/admin/dashboard/kpis');
        return response.data;
      } catch (error) {
        console.warn('[AdminDashboard] KPIs endpoint connection error:', error);
        return {
          totalUsers: 6,
          activeFreelancers: 2,
          activeClients: 2,
          totalVolumeEscrow: 16950,
          disputesPending: 2,
          securityAlertsCritical: 1
        };
      }
    },
  });

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['adminRecentActivity'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/admin/dashboard/recent-activity');
        return {
          transactions: response.data.transactions || [],
          alerts: response.data.alerts || [],
        };
      } catch (error) {
        console.warn('[AdminDashboard] Recent activity endpoint connection error:', error);
        return { transactions: [], alerts: [] };
      }
    },
  });

  const kpis = kpisData || {
    totalUsers: 0,
    activeFreelancers: 0,
    activeClients: 0,
    totalVolumeEscrow: 0,
    disputesPending: 0,
    securityAlertsCritical: 0
  };

  const recentActivity = activityData || { transactions: [], alerts: [] };

  const handleAlertReview = (alert: any) => {
    if (alert.type === 'security') {
      router.push('/admin-security');
    } else if (alert.type === 'dispute') {
      router.push('/admin-disputes');
    } else {
      showToast('System operational: No critical actions required', 'success');
    }
  };

  const handleUpdateProfile = async () => {
    if (!adminName.trim() || !adminEmail.trim()) {
      showToast('Full name and email address are required.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail.trim())) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (adminPassword && adminPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    const currentSession = getUserSession() || {};
    setIsUpdatingProfile(true);

    try {
      const payload: any = {
        id: currentSession.id,
        oldEmail: currentSession.email || adminEmail.trim().toLowerCase(),
        fullName: adminName.trim(),
        email: adminEmail.trim().toLowerCase(),
      };
      if (adminPassword.trim()) {
        payload.password = adminPassword.trim();
      }

      await apiClient.put('/admin/profile', payload);

      saveUserSession({
        ...currentSession,
        fullName: adminName.trim(),
        email: adminEmail.trim().toLowerCase(),
      });

      setAdminPassword('');
      showToast('Admin profile & password updated successfully!', 'success');
      setIsProfileModalOpen(false);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to save admin profile changes.';
      showToast(msg, 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    setIsProfileModalOpen(false);
    clearAuthSession();
    clearUserSession();
    showToast('Logged out successfully. Redirecting...', 'info');
    setTimeout(() => {
      router.replace('/login');
    }, 400);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Title & Admin Avatar (Clickable Profile Settings) */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <TouchableOpacity
            style={styles.avatarRow}
            onPress={() => setIsProfileModalOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.verifiedIcon}>
              <Text style={{ fontSize: 14, color: Colors.successText }}>✓</Text>
            </View>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>
                {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 6 KPI Metric Cards Grid (2x3 Layout) */}
        {isLoadingKpis ? (
          <>
            <SkeletonCard height={80} />
            <SkeletonCard height={80} />
            <SkeletonCard height={80} />
          </>
        ) : (
          <>
            <View style={styles.gridRow}>
              <View style={styles.gridCard}>
                <Text style={styles.cardLabel}>Total Users</Text>
                <Text style={styles.cardValue}>{kpis.totalUsers}</Text>
              </View>

              <View style={[styles.gridCard, styles.cardLightGreen]}>
                <Text style={styles.cardLabelGreen}>Active Freelancers</Text>
                <Text style={styles.cardValue}>{kpis.activeFreelancers}</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridCard}>
                <Text style={styles.cardLabel}>Active Clients</Text>
                <Text style={styles.cardValue}>{kpis.activeClients}</Text>
              </View>

              <View style={[styles.gridCard, styles.cardLightGreen]}>
                <Text style={styles.cardLabelGreen}>Total Vol</Text>
                <Text style={styles.cardValue}>${kpis.totalVolumeEscrow?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={[styles.gridCard, styles.cardYellow]}>
                <Text style={styles.cardLabelYellow}>Disputes Pending</Text>
                <Text style={styles.cardValueYellow}>{kpis.disputesPending}</Text>
              </View>

              <View style={[styles.gridCard, styles.cardRed]}>
                <View style={styles.criticalHeader}>
                  <Text style={styles.cardLabelRed}>Security Alerts</Text>
                  <View style={styles.criticalBadge}>
                    <Text style={styles.criticalText}>Critical</Text>
                  </View>
                </View>
                <Text style={styles.cardValueRed}>{kpis.securityAlertsCritical}</Text>
              </View>
            </View>
          </>
        )}

        {/* Recent Transactions Log Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/admin-transactions')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {isLoadingActivity ? (
          <>
            <SkeletonCard height={70} />
            <SkeletonCard height={70} />
          </>
        ) : recentActivity.transactions.map((txn: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.txnCard}
            onPress={() => router.push('/admin-transactions')}
          >
            <View style={styles.txnIconBox}>
              <Text style={{ fontSize: 16 }}>💵</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txnId}>#{txn.id}</Text>
              <Text style={styles.txnSub}>{txn.title}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.txnAmount}>{txn.amount}</Text>
              <View style={txn.status === 'Escrow' ? styles.tagEscrow : styles.tagReleased}>
                <Text style={txn.status === 'Escrow' ? styles.tagTextEscrow : styles.tagTextReleased}>{txn.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Urgent Security & Dispute Alerts Section */}
        <Text style={styles.sectionTitle}>Urgent Alerts</Text>

        {isLoadingActivity ? (
          <>
            <SkeletonCard height={70} />
            <SkeletonCard height={70} />
          </>
        ) : recentActivity.alerts.map((alert: any, index: number) => {
          if (alert.type === 'security') {
            return (
              <TouchableOpacity
                key={index}
                style={styles.alertCardRed}
                onPress={() => handleAlertReview(alert)}
              >
                <View style={styles.alertIconRed}>
                  <Text style={{ fontSize: 16 }}>🛡️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitleRed}>{alert.title}</Text>
                  <Text style={styles.alertSubRed}>{alert.description}</Text>
                </View>
              </TouchableOpacity>
            );
          } else if (alert.type === 'dispute') {
            return (
              <TouchableOpacity
                key={index}
                style={styles.alertCardYellow}
                onPress={() => handleAlertReview(alert)}
              >
                <View style={styles.alertIconYellow}>
                  <Text style={{ fontSize: 16 }}>⚖️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitleYellow}>{alert.title}</Text>
                  <Text style={styles.alertSubYellow}>{alert.description}</Text>
                </View>
              </TouchableOpacity>
            );
          } else {
            return (
              <TouchableOpacity
                key={index}
                style={styles.alertCardGreen}
                onPress={() => handleAlertReview(alert)}
              >
                <View style={styles.alertIconGreen}>
                  <Text style={{ fontSize: 16 }}>✅</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitleGreen}>{alert.title}</Text>
                  <Text style={styles.alertSubGreen}>{alert.description}</Text>
                </View>
              </TouchableOpacity>
            );
          }
        })}
      </ScrollView>

      {/* ADMIN PROFILE & LOGOUT MODAL */}
      <Modal
        visible={isProfileModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsProfileModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👤 Admin Profile & Settings</Text>
              <TouchableOpacity onPress={() => setIsProfileModalOpen(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }}>
              <View style={styles.profileAvatarBox}>
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeAvatarText}>
                    {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
                  </Text>
                </View>
                <Text style={styles.profileName}>{adminName}</Text>
                <Text style={styles.profileEmail}>{adminEmail}</Text>
                <View style={styles.adminRoleBadge}>
                  <Text style={styles.adminRoleBadgeText}>⚡ SYSTEM ADMIN</Text>
                </View>
              </View>

              <Text style={styles.sectionHeaderTitle}>Edit Profile Details</Text>

              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="System Admin"
                placeholderTextColor={Colors.neutralLight}
                value={adminName}
                onChangeText={setAdminName}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="admin@freelance.com"
                placeholderTextColor={Colors.neutralLight}
                keyboardType="email-address"
                autoCapitalize="none"
                value={adminEmail}
                onChangeText={setAdminEmail}
              />

              <Text style={styles.inputLabel}>New Password (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Leave blank to keep current password"
                placeholderTextColor={Colors.neutralLight}
                secureTextEntry
                value={adminPassword}
                onChangeText={setAdminPassword}
              />

              <TouchableOpacity
                style={[styles.saveProfileBtn, isUpdatingProfile && { opacity: 0.7 }]}
                onPress={handleUpdateProfile}
                disabled={isUpdatingProfile}
                activeOpacity={0.8}
              >
                {isUpdatingProfile ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <Text style={styles.saveProfileBtnText}>💾 Save Profile Changes</Text>
                )}
              </TouchableOpacity>

              <View style={styles.modalDivider} />

              <Text style={styles.sectionHeaderTitle}>Session Controls</Text>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutBtnText}>🚪 Sign Out / Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AdminTabBar activeTab="dashboard" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: 80,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.successBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.surface,
    fontWeight: '800',
    fontSize: 14,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  cardLightGreen: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.primaryLight,
  },
  cardYellow: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warning,
  },
  cardRed: {
    backgroundColor: Colors.errorBg,
    borderColor: Colors.error,
  },
  cardLabel: { fontSize: 12, color: Colors.neutralMedium, fontWeight: '500', marginBottom: 4 },
  cardLabelGreen: { fontSize: 12, color: Colors.primaryDark, fontWeight: '600', marginBottom: 4 },
  cardLabelYellow: { fontSize: 12, color: Colors.warningText, fontWeight: '600', marginBottom: 4 },
  cardLabelRed: { fontSize: 12, color: Colors.errorText, fontWeight: '600' },
  cardValue: { fontSize: 22, fontWeight: '800', color: Colors.dark },
  cardValueYellow: { fontSize: 22, fontWeight: '800', color: Colors.warningText },
  cardValueRed: { fontSize: 22, fontWeight: '800', color: Colors.errorText },
  criticalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  criticalBadge: { backgroundColor: Colors.error, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  criticalText: { color: Colors.surface, fontSize: 9, fontWeight: '800' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Theme.spacing.md, marginBottom: Theme.spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark, marginVertical: Theme.spacing.xs },
  seeAllText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  txnCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  txnIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.successBg, justifyContent: 'center', alignItems: 'center', marginRight: Theme.spacing.sm },
  txnId: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  txnSub: { fontSize: 11, color: Colors.neutralMedium, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '800', color: Colors.dark, marginBottom: 2 },
  tagEscrow: { backgroundColor: Colors.successBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagTextEscrow: { fontSize: 10, fontWeight: '700', color: Colors.primaryDark },
  tagReleased: { backgroundColor: Colors.infoBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagTextReleased: { fontSize: 10, fontWeight: '700', color: Colors.infoText },
  alertCardRed: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  alertIconRed: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.errorBg, justifyContent: 'center', alignItems: 'center', marginRight: Theme.spacing.sm },
  alertTitleRed: { fontSize: 14, fontWeight: '700', color: Colors.errorText },
  alertSubRed: { fontSize: 11, color: Colors.errorText, marginTop: 2 },
  alertCardYellow: {
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  alertIconYellow: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.warningBg, justifyContent: 'center', alignItems: 'center', marginRight: Theme.spacing.sm },
  alertTitleYellow: { fontSize: 14, fontWeight: '700', color: Colors.warningText },
  alertSubYellow: { fontSize: 11, color: Colors.warningText, marginTop: 2 },
  alertCardGreen: {
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  alertIconGreen: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.successBg, justifyContent: 'center', alignItems: 'center', marginRight: Theme.spacing.sm },
  alertTitleGreen: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  alertSubGreen: { fontSize: 11, color: Colors.primaryDark, marginTop: 2 },
  tabIconActive: { opacity: 1, transform: [{ scale: 1.1 }] },

  // Profile Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 460,
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
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark },
  closeIcon: { fontSize: 18, fontWeight: '700', color: Colors.neutralMedium },
  profileAvatarBox: { alignItems: 'center', marginVertical: Theme.spacing.sm },
  largeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  largeAvatarText: { color: Colors.surface, fontSize: 24, fontWeight: '800' },
  profileName: { fontSize: 18, fontWeight: '800', color: Colors.dark },
  profileEmail: { fontSize: 13, color: Colors.neutralMedium, marginTop: 2 },
  adminRoleBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    marginTop: Theme.spacing.xs,
  },
  adminRoleBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.primaryDark },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  inputLabel: { fontSize: 12, fontWeight: '700', color: Colors.neutralMedium, marginTop: Theme.spacing.xs, marginBottom: 4 },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    fontSize: 14,
    color: Colors.dark,
    backgroundColor: Colors.background,
  },
  saveProfileBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Theme.spacing.sm + 4,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  saveProfileBtnText: { color: Colors.surface, fontSize: 14, fontWeight: '700' },
  modalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Theme.spacing.md },
  logoutBtn: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: Theme.spacing.sm + 4,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginTop: Theme.spacing.xs,
  },
  logoutBtnText: { color: Colors.errorText, fontSize: 14, fontWeight: '800' },
});

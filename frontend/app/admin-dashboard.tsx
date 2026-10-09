import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableOpacityProps,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import AdminTabBar from '../src/components/AdminTabBar';
import AdminToast, { ToastType } from '../src/components/AdminToast';
import SkeletonCard from '../src/components/SkeletonCard';
import { useQuery } from '@tanstack/react-query';
import apiClient, { API_BASE_URL } from '../src/services/api';
import { formatAdminMoney } from '../src/services/moneyFormat';
import { getUserSession, saveUserSession, clearUserSession } from '../src/services/storage';
import { clearAuthSession } from '../src/services/authService';
import {
  AdminIcon,
  AdminCard,
  AdminScreenHeader,
  AdminSectionHeader,
  AdminStatCard,
  StatusPill,
  AdminEmptyState,
  AdminButton,
  AdminIconName,
} from '../src/components/AdminUI';
import AdminModal, { AdminField, AdminSectionTitle, AdminActionList, AdminActionRow } from '../src/components/AdminModal';
import { Tone, toneColors, adminLayout, adminSpace, adminType, adminRadius, MUTED_TEXT } from '../src/constants/adminTheme';

const MAX_PICTURE_BYTES = 5 * 1024 * 1024;
const MAX_PICTURE_SIDE = 2048;

// Web only: scale a chosen photo down to a small JPEG so large camera photos upload reliably.
// Falls back to the original file if the browser can't process it.
const shrinkPictureOnWeb = async (file: File): Promise<File> => {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_PICTURE_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) return file;
    const baseName = (file.name || 'admin-photo').replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
};

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

  // Profile picture state (image bytes are stored in the database by the backend)
  const [pictureVersion, setPictureVersion] = useState(() => Date.now());
  const [pictureFailed, setPictureFailed] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [adminId, setAdminId] = useState<string | number | undefined>(undefined);

  // Fetch saved user credentials from login session
  useEffect(() => {
    const session = getUserSession();
    if (session) {
      if (session.fullName) setAdminName(session.fullName);
      if (session.email) setAdminEmail(session.email);
      if (session.id !== undefined && session.id !== null) setAdminId(session.id);
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
        throw error;
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

  const pictureUri = adminId !== undefined && !pictureFailed
    ? `${API_BASE_URL}/admin/profile/picture/${adminId}?v=${pictureVersion}`
    : null;

  const readErrorMessage = async (res: Response, fallback: string) => {
    try {
      const body = await res.json();
      return body?.message || fallback;
    } catch {
      return fallback;
    }
  };

  const handleChoosePicture = async () => {
    if (adminId === undefined) {
      showToast('Please sign in again to change your profile picture.', 'error');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setIsUploadingPicture(true);

      const formData = new FormData();
      formData.append('id', String(adminId));
      if (Platform.OS === 'web' && asset.file) {
        // Web: the picker hands back a real File object; shrink big photos before sending
        const prepared = await shrinkPictureOnWeb(asset.file);
        if (prepared.size > MAX_PICTURE_BYTES) {
          showToast('Image is too large. Please choose a smaller photo (max 5 MB).', 'error');
          return;
        }
        formData.append('file', prepared);
      } else {
        if (asset.fileSize && asset.fileSize > MAX_PICTURE_BYTES) {
          showToast('Image is too large. Please choose a smaller photo (max 5 MB).', 'error');
          return;
        }
        const name = asset.fileName || `admin-${adminId}.jpg`;
        formData.append('file', { uri: asset.uri, name, type: asset.mimeType || 'image/jpeg' } as any);
      }

      const res = await fetch(`${API_BASE_URL}/admin/profile/picture`, { method: 'POST', body: formData });
      if (!res.ok) {
        showToast(await readErrorMessage(res, 'Failed to upload profile picture.'), 'error');
        return;
      }
      setPictureFailed(false);
      setPictureVersion(Date.now());
      showToast('Profile picture updated successfully!', 'success');
    } catch (error) {
      console.warn('[AdminDashboard] Profile picture upload error:', error);
      showToast('Could not upload the picture. Check your connection and try again.', 'error');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleRemovePicture = async () => {
    if (adminId === undefined) return;
    setIsUploadingPicture(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/profile/picture/${adminId}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast(await readErrorMessage(res, 'Failed to remove profile picture.'), 'error');
        return;
      }
      setPictureFailed(true);
      showToast('Profile picture removed.', 'success');
    } catch (error) {
      console.warn('[AdminDashboard] Profile picture remove error:', error);
      showToast('Could not remove the picture. Please try again.', 'error');
    } finally {
      setIsUploadingPicture(false);
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
        <View style={adminLayout.content}>
          {/* Header Title & Admin Avatar (Clickable Profile Settings) */}
          <AdminScreenHeader
            title="Admin Dashboard"
            subtitle="Platform overview"
            right={
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => setIsProfileModalOpen(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open profile and settings"
              >
                <View style={styles.avatarBox}>
                  {pictureUri ? (
                    <Image
                      source={{ uri: pictureUri }}
                      style={styles.avatarImage}
                      onError={() => setPictureFailed(true)}
                    />
                  ) : (
                    <Text style={styles.avatarText}>{initialOf(adminName)}</Text>
                  )}
                </View>
                <View style={styles.verifiedBadge}>
                  <AdminIcon name="checkmark" size={10} color={Colors.surface} />
                </View>
              </TouchableOpacity>
            }
          />

          {/* 6 KPI Metric Cards */}
          {isLoadingKpis ? (
            <>
              <SkeletonCard height={80} />
              <SkeletonCard height={80} />
              <SkeletonCard height={80} />
            </>
          ) : (
            <View style={styles.statGrid}>
              <AdminStatCard style={styles.statItem} label="Total Users" value={kpis.totalUsers} icon="people-outline" tone="info" />
              <AdminStatCard style={styles.statItem} label="Active Freelancers" value={kpis.activeFreelancers} icon="briefcase-outline" tone="success" />
              <AdminStatCard style={styles.statItem} label="Active Clients" value={kpis.activeClients} icon="business-outline" tone="info" />
              <AdminStatCard
                style={styles.statItem}
                label="Total Vol"
                value={<Text style={styles.statValueLong}>{`$${kpis.totalVolumeEscrow?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>}
                icon="wallet-outline"
                tone="success"
              />
              <AdminStatCard style={styles.statItem} label="Disputes Pending" value={kpis.disputesPending} icon="scale-outline" tone="warning" />
              <AdminStatCard
                style={styles.statItem}
                label="Security Alerts"
                value={kpis.securityAlertsCritical}
                icon="shield-checkmark-outline"
                tone="danger"
                badge="Critical"
              />
            </View>
          )}

          {/* Recent Transactions Log Section */}
          <View style={styles.sectionRow}>
            <Text style={adminType.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity
              onPress={() => router.push('/admin-transactions')}
              style={styles.seeAllBtn}
              accessibilityRole="button"
            >
              <Text style={styles.seeAllText}>See All</Text>
              <AdminIcon name="chevron-forward" size={14} color={Colors.primaryDark} />
            </TouchableOpacity>
          </View>

          {isLoadingActivity ? (
            <>
              <SkeletonCard height={70} />
              <SkeletonCard height={70} />
            </>
          ) : recentActivity.transactions.length === 0 ? (
            <AdminCard>
              <AdminEmptyState icon="receipt-outline" title="No recent transactions" />
            </AdminCard>
          ) : (
            <View style={styles.rowList}>
              {recentActivity.transactions.map((txn: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.85}
                  style={styles.rowCard}
                  onPress={() => router.push('/admin-transactions')}
                >
                  <View style={[styles.iconTile, { backgroundColor: toneColors.success.bg }]}>
                    <AdminIcon name="cash-outline" size={20} color={toneColors.success.fg} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={adminType.cardTitle} numberOfLines={1}>#{txn.id}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>{txn.title}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.amount}>{formatAdminMoney(txn.amount)}</Text>
                    <StatusPill label={txn.status} tone={txn.status === 'Escrow' ? 'success' : 'info'} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Urgent Security & Dispute Alerts Section */}
          <AdminSectionHeader title="Urgent Alerts" />

          {isLoadingActivity ? (
            <>
              <SkeletonCard height={70} />
              <SkeletonCard height={70} />
            </>
          ) : recentActivity.alerts.length === 0 ? (
            <AdminCard>
              <AdminEmptyState icon="checkmark-circle-outline" title="No urgent alerts" />
            </AdminCard>
          ) : (
            <View style={styles.rowList}>
              {recentActivity.alerts.map((alert: any, index: number) => {
                if (alert.type === 'security') {
                  return (
                    <AlertRow
                      key={index}
                      tone="danger"
                      icon="shield-checkmark-outline"
                      title={alert.title}
                      description={alert.description}
                      onPress={() => handleAlertReview(alert)}
                    />
                  );
                } else if (alert.type === 'dispute') {
                  return (
                    <AlertRow
                      key={index}
                      tone="warning"
                      icon="scale-outline"
                      title={alert.title}
                      description={alert.description}
                      onPress={() => handleAlertReview(alert)}
                    />
                  );
                } else {
                  return (
                    <AlertRow
                      key={index}
                      tone="success"
                      icon="checkmark-circle-outline"
                      title={alert.title}
                      description={alert.description}
                      onPress={() => handleAlertReview(alert)}
                    />
                  );
                }
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ADMIN PROFILE & LOGOUT MODAL */}
      <AdminModal
        visible={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Admin Profile & Settings"
        icon="person-circle-outline"
        tone="neutral"
        footer={
          <>
            <AdminButton
              label="Close"
              variant="secondary"
              onPress={() => setIsProfileModalOpen(false)}
            />
            <AdminButton
              label="Save Profile Changes"
              icon="save-outline"
              onPress={handleUpdateProfile}
              loading={isUpdatingProfile}
            />
          </>
        }
      >
        <View style={styles.profileHero}>
          <TouchableOpacity
            style={styles.largeAvatarWrap}
            onPress={handleChoosePicture}
            disabled={isUploadingPicture}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            <View style={styles.largeAvatar}>
              {pictureUri ? (
                <Image
                  source={{ uri: pictureUri }}
                  style={styles.largeAvatarImage}
                  onError={() => setPictureFailed(true)}
                />
              ) : (
                <Text style={styles.largeAvatarText}>{initialOf(adminName)}</Text>
              )}
              {isUploadingPicture && (
                <View style={styles.avatarUploadingOverlay}>
                  <ActivityIndicator color={Colors.surface} size="small" />
                </View>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <AdminIcon name="camera-outline" size={14} color={Colors.surface} />
            </View>
          </TouchableOpacity>
          <View style={styles.pictureActionsRow}>
            <TouchableOpacity
              onPress={handleChoosePicture}
              disabled={isUploadingPicture}
              style={styles.pictureAction}
              accessibilityRole="button"
            >
              <AdminIcon name="camera-outline" size={14} color={Colors.primaryDark} />
              <Text style={styles.pictureActionText}>
                {pictureUri ? 'Change Photo' : 'Upload Photo'}
              </Text>
            </TouchableOpacity>
            {pictureUri ? (
              <TouchableOpacity
                onPress={handleRemovePicture}
                disabled={isUploadingPicture}
                style={styles.pictureAction}
                accessibilityRole="button"
              >
                <AdminIcon name="trash-outline" size={14} color={Colors.errorText} />
                <Text style={[styles.pictureActionText, { color: Colors.errorText }]}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.profileName}>{adminName}</Text>
          <Text style={styles.profileEmail}>{adminEmail}</Text>
          <View style={styles.roleBadge}>
            <AdminIcon name="flash-outline" size={12} color={Colors.primaryDark} />
            <Text style={styles.roleBadgeText}>SYSTEM ADMIN</Text>
          </View>
        </View>

        <AdminSectionTitle>Edit Profile Details</AdminSectionTitle>

        <AdminField
          label="Full Name"
          placeholder="System Admin"
          value={adminName}
          onChangeText={setAdminName}
        />

        <AdminField
          label="Email Address"
          placeholder="admin@freelance.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={adminEmail}
          onChangeText={setAdminEmail}
        />

        <AdminField
          label="New Password (Optional)"
          placeholder="Leave blank to keep current password"
          secureTextEntry
          value={adminPassword}
          onChangeText={setAdminPassword}
        />

        <AdminSectionTitle>Session Controls</AdminSectionTitle>
        <AdminActionList>
          <AdminActionRow icon="log-out-outline" label="Sign Out / Logout" tone="danger" onPress={handleLogout} last />
        </AdminActionList>
      </AdminModal>

      <AdminTabBar activeTab="dashboard" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  contentContainer: {
    padding: adminSpace.lg,
    paddingTop: adminSpace.xl,
    paddingBottom: adminLayout.bottomClearance,
  },
  avatarButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatarImage: { width: 44, height: 44 },
  avatarText: { color: Colors.surface, fontWeight: '800', fontSize: 16 },
  verifiedBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.md },
  statItem: { flexBasis: '31%', flexGrow: 1, minWidth: 150 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpace.xl,
    marginBottom: adminSpace.md,
  },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44, justifyContent: 'center' },
  seeAllText: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  statValueLong: { fontSize: 17, fontWeight: '800', color: Colors.dark, letterSpacing: -0.3 },
  rowList: { gap: adminSpace.sm },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpace.md,
    minHeight: 64,
    padding: adminSpace.md + 2,
    backgroundColor: Colors.surface,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowSub: { ...adminType.caption, fontSize: 12, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 15, fontWeight: '800', color: Colors.dark },

  // Profile modal
  profileHero: { alignItems: 'center', paddingBottom: adminSpace.sm },
  largeAvatarWrap: { width: 84, height: 84, marginBottom: adminSpace.sm },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  largeAvatarImage: { width: 80, height: 80 },
  largeAvatarText: { color: Colors.surface, fontSize: 30, fontWeight: '800' },
  avatarUploadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(16,24,39,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pictureActionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: adminSpace.sm },
  pictureAction: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: adminSpace.sm },
  pictureActionText: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  profileName: { fontSize: 18, fontWeight: '800', color: Colors.dark, marginTop: adminSpace.xs },
  profileEmail: { fontSize: 13, color: MUTED_TEXT, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.successBg,
    paddingHorizontal: adminSpace.md,
    paddingVertical: 5,
    borderRadius: adminRadius.pill,
    marginTop: adminSpace.sm,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: Colors.primaryDark },
});

const initialOf = (name: string) => (name ? name.charAt(0).toUpperCase() : 'A');

function AlertRow({
  tone,
  icon,
  title,
  description,
  ...touchProps
}: TouchableOpacityProps & {
  tone: Tone;
  icon: AdminIconName;
  title: string;
  description: string;
}) {
  const t = toneColors[tone];
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.rowCard, { borderLeftWidth: 4, borderLeftColor: t.solid }]}
      {...touchProps}
    >
      <View style={[styles.iconTile, { backgroundColor: t.bg }]}>
        <AdminIcon name={icon} size={20} color={t.fg} />
      </View>
      <View style={styles.rowText}>
        <Text style={adminType.cardTitle}>{title}</Text>
        <Text style={styles.rowSub}>{description}</Text>
      </View>
      <AdminIcon name="chevron-forward" size={16} color={MUTED_TEXT} />
    </TouchableOpacity>
  );
}

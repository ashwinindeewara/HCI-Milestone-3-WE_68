import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';
import { performLogout, getSavedUserData, updateSavedUserData } from '../src/services/authService';

export interface ProfileState {
  id: number;
  fullName: string;
  email: string;
  location: string;
  company: string;
  experience: string;
  about: string;
}

export default function StaffProfileScreen() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // General user profile details state
  const [profile, setProfile] = useState<ProfileState>(() => {
    const saved = getSavedUserData();
    return {
      id: saved?.userId || saved?.id || 1,
      fullName: saved?.fullName || 'Dasun Geeneth',
      email: saved?.email || 'chathuniimalsha.com',
      location: saved?.location || 'Colombo, Sri Lanka',
      company: saved?.company || 'FreelanceFlow Systems',
      experience: saved?.experience || '4+ Years',
      about: saved?.about || 'Experienced payment administrator responsible for managing client payments, escrow transactions, payment verification, refunds, and transaction support.',
    };
  });

  // Edit form state
  const [editForm, setEditForm] = useState<ProfileState>({ ...profile });

  // Fetch latest general user profile from Spring Boot & Neon PostgreSQL backend
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const savedUser = getSavedUserData();
      const targetId = savedUser?.userId || savedUser?.id || profile.id;
      const response = targetId 
        ? await apiClient.get(`/profile/${targetId}`)
        : (savedUser?.email ? await apiClient.get(`/profile/email/${savedUser.email}`) : await apiClient.get('/profile/1'));

      if (response.data) {
        setProfile((prev) => ({
          ...prev,
          ...response.data,
          fullName: response.data.fullName || prev.fullName,
          location: response.data.location || prev.location,
          company: response.data.company || prev.company,
          experience: response.data.experience || prev.experience,
          about: response.data.about || prev.about,
        }));
        updateSavedUserData(response.data);
      }
    } catch {
      // Fallback to local default profile state if API is offline
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditForm({ ...profile });
    setShowEditModal(true);
  };

  /**
   * Sends PUT /api/v1/profile/{id} request to update general user details in users table
   */
  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim()) {
      Alert.alert('Validation Error', 'Full Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const savedUser = getSavedUserData();
      const targetId = savedUser?.userId || savedUser?.id || profile.id;

      const payload = {
        fullName: editForm.fullName.trim(),
        location: editForm.location.trim(),
        company: editForm.company.trim(),
        experience: editForm.experience.trim(),
        about: editForm.about.trim(),
      };

      const response = await apiClient.put(`/profile/${targetId}`, payload);

      if (response.data) {
        setProfile((prev) => ({
          ...prev,
          ...response.data,
        }));
        updateSavedUserData(response.data);
      } else {
        setProfile({ ...editForm });
        updateSavedUserData({ ...editForm });
      }

      setShowEditModal(false);
      setStatusMessage('✓ Profile details saved to users table in Neon database!');
      setTimeout(() => setStatusMessage(null), 5000);
    } catch {
      // Fallback save in case of connectivity issues
      setProfile({ ...editForm });
      updateSavedUserData({ ...editForm });
      setShowEditModal(false);
      setStatusMessage('✓ Profile updated locally.');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    performLogout(router);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Title & Logout Button */}
        <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>Staff Profile</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress} activeOpacity={0.7}>
            <Text style={{ fontSize: 18 }}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Status Toast Banner */}
        {statusMessage && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastText}>{statusMessage}</Text>
          </View>
        )}

        {/* Main User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }}
              style={styles.avatarImage}
            />
            <View style={styles.verifiedBadge}>
              <Text style={{ fontSize: 10, color: '#FFF' }}>✓</Text>
            </View>
          </View>

          <Text style={styles.userName}>{profile.fullName}</Text>
          <Text style={styles.userLocation}>{profile.location || 'Colombo, Sri Lanka'}</Text>
          <Text style={styles.userEmailText}>✉️ {profile.email}</Text>

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
            <Text style={styles.statValue}>{profile.company || 'FreelanceFlow'}</Text>
          </View>

          <View style={[styles.statBox, styles.statBoxGreen]}>
            <Text style={[styles.statLabel, { color: Colors.primaryDark }]}>EXPERIENCE</Text>
            <Text style={[styles.statValue, { color: Colors.primaryDark }]}>{profile.experience || '4+ Years'}</Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{profile.about}</Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.editButton} onPress={handleOpenEditModal} activeOpacity={0.8}>
          <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fullLogoutBtn} onPress={handleLogoutPress} activeOpacity={0.85}>
          <Text style={styles.fullLogoutText}>Sign Out of Staff Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Dialog Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalScrollSafeArea}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.editCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeaderTitle}>Edit Profile Information</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Text style={{ fontSize: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>
                General user details are persisted in the core users table in Neon PostgreSQL.
              </Text>

              {/* Input 1: Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.fullName}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, fullName: text }))}
                  placeholder="e.g. Dasun Geeneth"
                />
              </View>

              {/* Input 2: Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.location}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, location: text }))}
                  placeholder="e.g. Colombo, Sri Lanka"
                />
              </View>

              {/* Input 3: Company */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Company / Organization</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.company}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, company: text }))}
                  placeholder="e.g. FreelanceFlow Systems"
                />
              </View>

              {/* Input 4: Experience */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Experience</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.experience}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, experience: text }))}
                  placeholder="e.g. 4+ Years"
                />
              </View>

              {/* Input 5: About Bio */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>About Bio</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput]}
                  value={editForm.about}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, about: text }))}
                  placeholder="Describe your role and background..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Modal Buttons */}
              <View style={styles.editModalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowEditModal(false)}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Profile</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Cross-Platform Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalSub}>
              Are you sure you want to sign out of Payment Staff account?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalLogoutBtn}
                onPress={handleConfirmLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.modalLogoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  toastBanner: {
    backgroundColor: '#DCFCE7',
    borderColor: '#166534',
    borderWidth: 1,
    padding: Theme.spacing.sm + 2,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  toastText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
    marginBottom: 4,
  },
  userEmailText: {
    fontSize: 12,
    color: Colors.neutralMedium,
    marginBottom: 8,
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
  editButton: {
    height: 48,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  fullLogoutBtn: {
    height: 48,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  fullLogoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.errorText,
  },

  /* Edit Modal Styles */
  modalScrollSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Theme.spacing.md,
    justifyContent: 'center',
  },
  editCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.neutralMedium,
    marginBottom: Theme.spacing.md,
  },
  inputGroup: {
    marginBottom: Theme.spacing.sm + 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.sm + 4,
    backgroundColor: Colors.background,
    fontSize: 14,
    color: Colors.dark,
  },
  textAreaInput: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: Theme.spacing.sm,
  },
  editModalActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  saveBtn: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Logout Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    ...Theme.shadows.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: Colors.neutralMedium,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  modalLogoutBtn: {
    flex: 1,
    height: 44,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLogoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.surface,
  },

  /* Bottom Tab Bar */
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

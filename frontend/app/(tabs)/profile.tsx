import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';
import StatusBadge from '../../src/components/StatusBadge';
import apiClient from '../../src/services/api';
import { performLogout, getSavedUserData, updateSavedUserData } from '../../src/services/authService';

export interface UserProfileData {
  id: number;
  fullName: string;
  email: string;
  location: string;
  company: string;
  experience: string;
  about: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfileData>(() => {
    const saved = getSavedUserData();
    return {
      id: saved?.userId || saved?.id || 1,
      fullName: saved?.fullName || 'Chathuni Imalsha',
      email: saved?.email || 'it23662278@my.sliit.lk',
      location: saved?.location || 'Colombo, Sri Lanka',
      company: saved?.company || 'FreelanceFlow Systems',
      experience: saved?.experience || '3+ Years',
      about: saved?.about || 'Passionate software engineer building full-stack web and mobile applications.',
    };
  });

  const [editForm, setEditForm] = useState<UserProfileData>({ ...profile });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
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
      // Fallback to local defaults if server unavailable
    }
  };

  const handleOpenEdit = () => {
    setEditForm({ ...profile });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim()) {
      Alert.alert('Error', 'Full Name is required.');
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
      setStatusMessage('✓ Profile information updated in users table!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch {
      setProfile({ ...editForm });
      updateSavedUserData({ ...editForm });
      setShowEditModal(false);
      setStatusMessage('✓ Profile updated locally.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchRole = () => {
    router.push('/select-role');
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    performLogout(router);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Toast Notification Banner */}
      {statusMessage && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{statusMessage}</Text>
        </View>
      )}

      {/* Profile Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {profile.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2) || 'CI'}
          </Text>
        </View>

        <Text style={styles.userName}>{profile.fullName}</Text>
        <Text style={styles.userEmail}>{profile.email}</Text>
        <Text style={styles.userMetaText}>📍 {profile.location || 'Colombo, Sri Lanka'} • {profile.company || 'FreelanceFlow'}</Text>

        <View style={styles.roleBadgeContainer}>
          <StatusBadge status="ACTIVE" />
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>Role: Freelancer</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerEditBtn} onPress={handleOpenEdit} activeOpacity={0.8}>
          <Text style={styles.headerEditBtnText}>✏️ Edit Profile Details</Text>
        </TouchableOpacity>
      </View>

      {/* Account Settings List */}
      <Text style={styles.sectionHeader}>Account & Preferences</Text>
      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuRow} onPress={handleOpenEdit} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>👤</Text>
          <View style={styles.menuTextContent}>
            <Text style={styles.menuTitle}>Edit Personal Information</Text>
            <Text style={styles.menuSub}>Full Name, Location, Company & About Bio</Text>
          </View>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>

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
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal Form */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.editCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeaderTitle}>Edit Profile Information</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Text style={{ fontSize: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>
                Updates are persisted in the core users table in Neon PostgreSQL.
              </Text>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.fullName}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, fullName: text }))}
                  placeholder="Full Name"
                />
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.location}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, location: text }))}
                  placeholder="e.g. Colombo, Sri Lanka"
                />
              </View>

              {/* Company */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Company / Organization</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.company}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, company: text }))}
                  placeholder="e.g. FreelanceFlow Systems"
                />
              </View>

              {/* Experience */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Experience</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.experience}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, experience: text }))}
                  placeholder="e.g. 3+ Years"
                />
              </View>

              {/* About Bio */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>About Bio</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput]}
                  value={editForm.about}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, about: text }))}
                  placeholder="Tell us about your background..."
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
              Are you sure you want to log out of FreelanceFlow?
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
                style={styles.modalConfirmLogoutBtn}
                onPress={handleConfirmLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmLogoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 4,
  },
  userMetaText: {
    color: Colors.neutralLight,
    fontSize: 12,
    marginBottom: Theme.spacing.md,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
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
  headerEditBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.md,
  },
  headerEditBtnText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
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

  /* Edit Modal Styles */
  modalSafeArea: {
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
  modalConfirmLogoutBtn: {
    flex: 1,
    height: 44,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmLogoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.surface,
  },
});

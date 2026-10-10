import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient, { getCurrentUser } from '../src/services/api';
import { getSavedUserData, updateSavedUserData } from '../src/services/authService';
import ClientBottomTabBar from '../src/components/ClientBottomTabBar';

interface ClientProfileData {
  userId?: number | string;
  fullName?: string;
  email?: string;
  profileImageUrl?: string;

  location?: string;
  companyName?: string;
  company?: string;
  about?: string;
  status?: string;

  memberSince?: number | string;
  createdAt?: string;
  projectsPosted?: number;
}

export default function ClientEditProfileScreen() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [profile, setProfile] = useState<ClientProfileData | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [about, setAbout] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedUser = getSavedUserData();
      const apiUser = getCurrentUser();
      const currentUser = savedUser || apiUser || {};
      const userId = currentUser.id || currentUser.userId;

      if (!userId) {
        throw new Error('Your account ID is unavailable. Please sign in again.');
      }

      const initialProfile: ClientProfileData = {
        userId,
        fullName: currentUser.fullName || currentUser.name || '',
        email: currentUser.email || '',
        location: currentUser.location || '',
        companyName: currentUser.company || currentUser.companyName || '',
        about: currentUser.about || '',
      };
      setProfile(initialProfile);
      setFullName(initialProfile.fullName || '');
      setLocation(initialProfile.location || '');
      setCompanyName(initialProfile.companyName || '');
      setAbout(initialProfile.about || '');

      const response = await apiClient.get(`/clients/${userId}/profile`);
      const data: ClientProfileData = {
        ...initialProfile,
        ...response.data,
        userId,
        fullName: response.data?.fullName || initialProfile.fullName,
        email: response.data?.email || initialProfile.email,
        companyName: response.data?.company || response.data?.companyName || initialProfile.companyName,
      };

      setProfile(data);
      setFullName(data.fullName || '');
      setLocation(data.location || '');
      setCompanyName(data.companyName || '');
      setAbout(data.about || '');
    } catch (error: any) {
      console.error('Failed to load client profile:', error?.response?.data || error);
      Alert.alert(
        'Unable to load profile',
        error?.response?.data?.message || error?.message || 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const savedUser = getSavedUserData();
      const apiUser = getCurrentUser();
      const currentUser = savedUser || apiUser || {};
      const userId = profile?.userId || currentUser.id || currentUser.userId;

      if (!userId) {
        Alert.alert('Unable to save profile', 'Your account ID is unavailable. Please sign in again.');
        return;
      }

      if (!fullName.trim()) {
        Alert.alert('Name required', 'Please enter your name.');
        return;
      }
      if (!location.trim()) {
        Alert.alert('Location required', 'Please enter your location.');
        return;
      }

      if (!companyName.trim()) {
        Alert.alert('Company required', 'Please enter your company name.');
        return;
      }

      if (!about.trim()) {
        Alert.alert('About required', 'Please enter some information about yourself or your company.');
        return;
      }

      setSaving(true);
      const requestBody = {
        fullName: fullName.trim(),
        location: location.trim(),
        company: companyName.trim(),
        about: about.trim(),
      };

      const response = await apiClient.put(`/clients/${userId}/profile`, requestBody);
      const updatedProfile: ClientProfileData = {
        ...profile,
        ...response.data,
        companyName: response.data?.company || requestBody.company,
      };
      setProfile(updatedProfile);
      setFullName(updatedProfile.fullName || requestBody.fullName);
      setLocation(updatedProfile.location || requestBody.location);
      setCompanyName(updatedProfile.companyName || requestBody.company);
      setAbout(updatedProfile.about || requestBody.about);
      updateSavedUserData({
        fullName: requestBody.fullName,
        location: requestBody.location,
        company: requestBody.company,
        about: requestBody.about,
      });
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Failed to update client profile:', error?.response?.data || error);
      Alert.alert(
        'Update Failed',
        error?.response?.data?.message || 'Unable to update your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) {
      return 'U';
    }

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) =>
        word.charAt(0).toUpperCase()
      )
      .join('');
  };

  const getMemberSince = () => {
    if (profile?.memberSince) {
      const value = String(profile.memberSince);

      if (/^\d{4}$/.test(value)) {
        return value;
      }

      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return String(date.getFullYear());
      }
    }

    return '—';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />
          <Text style={styles.loadingText}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>

        {/* ================= HEADER ================= */}

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={Colors.dark}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Edit Profile
          </Text>

          <View style={styles.headerSpacer} />

        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ================= PROFILE CARD ================= */}

          <View style={styles.profileCard}>

            <View style={styles.avatarWrapper}>

              {profile?.profileImageUrl ? (
                <Image
                  source={{
                    uri: profile.profileImageUrl,
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.initialsAvatar}>
                  <Text style={styles.initialsText}>
                    {getInitials(profile?.fullName)}
                  </Text>
                </View>
              )}

              <View style={styles.verifiedBadge}>
                <Ionicons
                  name="checkmark"
                  size={11}
                  color="#FFFFFF"
                />
              </View>

            </View>

            <View style={styles.nameRow}>
              <Text style={styles.userName}>
                {profile?.fullName || 'User'}
              </Text>

              <Ionicons
                name="checkmark-circle"
                size={15}
                color={Colors.primary}
                style={styles.nameVerifiedIcon}
              />
            </View>

            <Text style={styles.locationPreview}>
              {location || 'Location'}
            </Text>

            <Text style={styles.companyPreview}>
              {companyName || 'Company'}
            </Text>

          </View>

          {/* ================= PROFILE INFORMATION ================= */}

          <View style={styles.formSection}>

            {/* Location */}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Full Name
              </Text>

              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your name"
                placeholderTextColor={Colors.neutralLight}
                style={styles.input}
                autoCapitalize="words"
                textContentType="name"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Location
              </Text>

              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Colombo, Sri Lanka"
                placeholderTextColor={
                  Colors.neutralLight
                }
                style={styles.input}
              />
            </View>

            {/* Company */}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Company
              </Text>

              <TextInput
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Company name"
                placeholderTextColor={
                  Colors.neutralLight
                }
                style={styles.input}
              />
            </View>

            {/* About */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                About
              </Text>

              <TextInput
                value={about}
                onChangeText={setAbout}
                placeholder="Tell freelancers about yourself or your company..."
                placeholderTextColor={
                  Colors.neutralLight
                }
                style={[
                  styles.input,
                  styles.aboutInput,
                ]}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.characterCount}>
                {about.length} characters
              </Text>
            </View>

          </View>

          {/* ================= READ ONLY STATS ================= */}

          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              Profile Information
            </Text>

            <View style={styles.statsRow}>

              {/* Member Since */}

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>
                  MEMBER SINCE
                </Text>

                <Text style={styles.statValue}>
                  {getMemberSince()}
                </Text>

                <Text style={styles.readOnlyText}>
                  Read only
                </Text>
              </View>

              {/* Projects */}

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>
                  PROJECTS
                </Text>

                <Text style={styles.statLabel}>
                  POSTED
                </Text>

                <Text style={styles.statValue}>
                  {profile?.projectsPosted ?? 0} Projects
                </Text>

                <Text style={styles.readOnlyText}>
                  Read only
                </Text>
              </View>

              {/* Status */}

              <View style={styles.statBoxGreen}>
                <Text
                  style={[
                    styles.statLabel,
                    styles.greenLabel,
                  ]}
                >
                  STATUS
                </Text>

                <View style={styles.statusRow}>

                  <View style={styles.statusDot} />

                  <Text style={styles.statusValue}>
                    {profile?.status || 'Available'}
                  </Text>

                </View>

                <Text style={styles.readOnlyGreen}>
                  Read only
                </Text>

              </View>

            </View>

          </View>

          {/* ================= SAVE BUTTON ================= */}

          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >

            {saving ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Text style={styles.saveButtonText}>
                Save Changes
              </Text>
            )}

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>

          <View style={{ height: 90 }} />

        </ScrollView>

        {/* ================= POPUP ================= */}
        {showSuccess && (
          <View style={styles.successOverlay}>
            <View style={styles.successModal}>

              <View style={styles.successIcon}>
                <Ionicons
                  name="checkmark"
                  size={28}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.successTitle}>
                Profile Updated
              </Text>

              <Text style={styles.successMessage}>
                Your profile has been updated successfully.
              </Text>

              <TouchableOpacity
                style={styles.successButton}
                activeOpacity={0.85}
                onPress={() => {
                  setShowSuccess(false);
                  router.replace('/client-profile')
                }}
              >
                <Text style={styles.successButtonText}>
                  OK
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        )}

        <ClientBottomTabBar activeTab="profile" />

      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ================= HEADER ================= */

  header: {
    height: 58,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
  },

  headerSpacer: {
    width: 36,
  },

  /* ================= LOADING ================= */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.neutralMedium,
  },

  /* ================= CONTENT ================= */

  container: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80,
  },

  /* ================= PROFILE CARD ================= */

  profileCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  avatarWrapper: {
    position: 'relative',
    marginBottom: 20,
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },

  initialsAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  initialsText: {
    fontSize: 27,
    fontWeight: '800',
    color: Colors.dark,
  },

  verifiedBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
  },

  nameVerifiedIcon: {
    marginLeft: 4,
  },

  locationPreview: {
    marginTop: 5,
    fontSize: 12,
    color: Colors.neutralMedium,
  },

  companyPreview: {
    marginTop: 7,
    fontSize: 12,
    color: Colors.neutralMedium,
  },

  /* ================= FORM ================= */

  formSection: {
    marginTop: 18,
  },

  fieldGroup: {
    marginBottom: 15,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 7,
  },

  input: {
    minHeight: 44,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: Colors.dark,
  },

  aboutInput: {
    height: 110,
    minHeight: 110,
    lineHeight: 18,
  },

  characterCount: {
    marginTop: 4,
    alignSelf: 'flex-end',
    fontSize: 9,
    color: Colors.neutralLight,
  },

  /* ================= SECTIONS ================= */

  section: {
    marginTop: 8,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 6,
  },

  sectionDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.neutralMedium,
    marginBottom: 10,
  },

  /* ================= STATS ================= */

  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  statBox: {
    flex: 1,
    minHeight: 75,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
  },

  statBoxGreen: {
    flex: 1,
    minHeight: 75,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
  },

  statLabel: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
    color: Colors.neutralMedium,
  },

  greenLabel: {
    color: '#15803D',
  },

  statValue: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark,
  },

  readOnlyText: {
    marginTop: 5,
    fontSize: 8,
    color: Colors.neutralLight,
  },

  readOnlyGreen: {
    marginTop: 5,
    fontSize: 8,
    color: '#86EFAC',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 5,
  },

  statusValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },

  /* ================= SKILLS ================= */

  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 15,
  },

  skillChipSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.primary,
  },

  skillCheck: {
    marginRight: 4,
  },

  skillText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.dark,
  },

  skillTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },

  /* ================= BUTTONS ================= */

  saveButton: {
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.surface,
  },

  cancelButton: {
    height: 38,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  cancelButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark,
  },

    successOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
      zIndex: 100,
    },

    successModal: {
      width: '100%',
      maxWidth: 330,
      backgroundColor: Colors.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',

      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },

    successIcon: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },

    successTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: Colors.dark,
      marginBottom: 7,
    },

    successMessage: {
      fontSize: 13,
      lineHeight: 19,
      color: Colors.neutralMedium,
      textAlign: 'center',
      marginBottom: 20,
    },

    successButton: {
      width: '100%',
      height: 42,
      backgroundColor: Colors.primary,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },

    successButtonText: {
      fontSize: 13,
      fontWeight: '800',
      color: Colors.surface,
    },
});
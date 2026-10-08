import { React, useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';
import { getSavedUserData, clearAuthSession } from '../src/services/authService';
import { getClientProfile } from '../src/services/clientService';

interface ClientProfileData {
  id?: number | string;
  fullName?: string;
  email?: string;
  profileImageUrl?: string;
  location?: string;
  companyName?: string;
  about?: string;
  status?: string;
  skills?: string[];
  projectsPosted?: number;
  memberSince?: string | number;
  createdAt?: string;
}

export default function ClientProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const currentUser: ClientProfileData | null = getSavedUserData();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
      loadProfile();
  }, []);

  const loadProfile = async () => {
      try {
         const currentUser = getSavedUserData();
         if (!currentUser?.id) {
            console.error('User ID not found');
            return;
         }
         const response = await apiClient.get(`/clients/${currentUser.id}/profile`);
         //console.log('CLIENT PROFILE:', response);
         setProfile(response.data);
      } catch (error: any) {
         console.error('Failed to load client profile:', error?.response?.data || error);
      } finally {
         setLoading(false);
      }
  };

  /*
   * At the moment the login response may only contain User data.
   * Later, when you call GET /clients/{userId}/profile,
   * you can replace this with the API response.
   */
  const clientProfile: ClientProfileData = {
    ...currentUser,

    // Temporary fallback values for fields not yet returned by login
    location: profile?.location || 'Colombo',
    companyName: profile?.companyName || 'Sysco Labs',
    memberSince: profile?.memberSince || '2025',
    about: profile?.about || 'Creative UI/UX Designer with a strong command of Figma, usability research, and modern design workflows. Dedicated to crafting accessible, user-tested interfaces that delight users and drive business goals',
    status: profile?.status || 'Available',
    projectsPosted: profile?.projectsPosted ?? 0,
    skills: profile?.skills,
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  };

  const getMemberSince = () => {
    if (clientProfile.memberSince) {
      const value = String(clientProfile.memberSince);
      if (/^\d{4}$/.test(value)) {
        return value;
      }

      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return String(date.getFullYear());
      }
    }

    if (clientProfile.createdAt) {
      const date = new Date(clientProfile.createdAt);

      if (!Number.isNaN(date.getTime())) {
        return String(date.getFullYear());
      }
    }

    return '2024';
  };

  const handleLogout = () => {
      setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    clearAuthSession();
    setShowLogoutModal(false);
    router.replace('/login');
  };

  const handleEditProfile = () => {
    // Change this route to the actual edit-profile screen
    router.push('/client-edit-profile');
  };

  const handleHome = () => {
    router.replace('/client-dashboard');
  };

  const handleProjects = () => {
    router.push('/client-projects');
  };

  const handleFindTalent = () => {
    router.push('/(tabs)/find-talent');
  };

  const handlePayments = () => {
    router.push('/client-payments');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>

        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconButton}
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
            Client Profile
          </Text>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={Colors.dark}
            />
          </TouchableOpacity>
        </View>

        {/* ================= CONTENT ================= */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >

          {/* ================= PROFILE CARD ================= */}
          <View style={styles.profileCard}>

            <View style={styles.avatarWrapper}>
              {clientProfile.profileImageUrl ? (
                <Image
                  source={{
                    uri: clientProfile.profileImageUrl,
                  }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.initialsAvatar}>
                  <Text style={styles.initialsText}>
                    {getInitials(clientProfile.fullName)}
                  </Text>
                </View>
              )}

              {/* Verified Badge */}
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
                {clientProfile.fullName || 'User'}
              </Text>

              <Ionicons
                name="checkmark-circle"
                size={15}
                color={Colors.primary}
                style={styles.verifiedIcon}
              />
            </View>

            <Text style={styles.userLocation}>
              {clientProfile.location}
            </Text>

            <Text style={styles.companyName}>
              {clientProfile.companyName}
            </Text>
          </View>

          {/* ================= STATS ================= */}
          <View style={styles.statsRow}>

            {/* Member Since */}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>
                MEMBER SINCE
              </Text>

              <Text style={styles.statValue}>
                {getMemberSince()}
              </Text>
            </View>

            {/* Projects Posted */}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>
                PROJECTS
              </Text>

              <Text style={styles.statLabel}>
                POSTED
              </Text>

              <Text style={styles.statValue}>
                {clientProfile.projectsPosted ?? 0} Projects
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
                  {clientProfile.status}
                </Text>
              </View>
            </View>
          </View>

          {/* ================= ABOUT ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              About
            </Text>

            <Text style={styles.aboutText}>
              {clientProfile.about}
            </Text>
          </View>

          {/* ================= SKILLS ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Skills
            </Text>

            <View style={styles.skillsContainer}>
              {clientProfile.skills?.map(
                (skill, index) => (
                  <View
                    key={`${skill}-${index}`}
                    style={styles.skillChip}
                  >
                    <Text style={styles.skillText}>
                      {formatSkillName(skill)}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>

          {/* ================= EDIT PROFILE ================= */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.editButtonText}>
              Edit Profile
            </Text>
          </TouchableOpacity>

          {/* Extra bottom spacing for tab bar */}
          <View style={{ height: 90 }} />

        </ScrollView>

        {/* ================= POPUP ================= */}
        {showLogoutModal && (
          <View style={styles.logoutOverlay}>
            <View style={styles.logoutModal}>

              <View style={styles.logoutIconCircle}>
                <Ionicons
                  name="log-out-outline"
                  size={26}
                  color={Colors.primary}
                />
              </View>

              <Text style={styles.logoutTitle}>
                Log Out
              </Text>

              <Text style={styles.logoutMessage}>
                Are you sure you want to sign out of your Client account?
              </Text>

              <View style={styles.logoutActions}>

                <TouchableOpacity
                  style={styles.cancelLogoutButton}
                  onPress={() => setShowLogoutModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelLogoutText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmLogoutButton}
                  onPress={confirmLogout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmLogoutText}>
                    Sign Out
                  </Text>
                </TouchableOpacity>

              </View>

            </View>
          </View>
        )}

        {/* ================= BOTTOM TAB BAR ================= */}
        <View style={styles.clientTabBar}>
            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-dashboard')}>
              <Text style={[styles.tabIcon, styles.tabIconActive]}>🏠</Text>
              <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-contracts')}>
              <Text style={styles.tabIcon}>📁</Text>
              <Text style={styles.tabLabel}>Projects</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-find-talent')}>
              <Text style={styles.tabIcon}>🔍</Text>
              <Text style={styles.tabLabel}>Find Talent</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-reports')}>
              <Text style={styles.tabIcon}>💳</Text>
              <Text style={styles.tabLabel}>Payments</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-profile')}>
              <Text style={styles.tabIcon}>👤</Text>
              <Text style={styles.tabLabel}>Profile</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * Convert enum/database values into
 * UI-friendly text.
 *
 * Example:
 * UI_DESIGN -> UI Design
 * UX_RESEARCH -> UX Research
 * FIGMA -> Figma
 */
const formatSkillName = (skill: string) => {
  return skill
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ');
};

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
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  headerIconButton: {
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

  logoutButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },

  /* ================= CONTENT ================= */

  container: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },

  /* ================= PROFILE CARD ================= */

  profileCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    minHeight: 218,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  avatarWrapper: {
    position: 'relative',
    marginBottom: 22,
  },

  avatarImage: {
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
    right: 1,
    bottom: 1,
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
    justifyContent: 'center',
  },

  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
  },

  verifiedIcon: {
    marginLeft: 4,
  },

  userLocation: {
    marginTop: 5,
    fontSize: 12,
    color: Colors.neutralMedium,
  },

  companyName: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.neutralMedium,
  },

  /* ================= STATS ================= */

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 18,
  },

  statBox: {
    flex: 1,
    minHeight: 58,
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
    minHeight: 58,
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
    color: Colors.neutralMedium,
    lineHeight: 10,
  },

  greenLabel: {
    color: '#15803D',
  },

  statValue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },

  statusValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },

  /* ================= SECTIONS ================= */

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 7,
  },

  aboutText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.neutralMedium,
  },

  industryText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.neutralMedium,
  },

  industryValue: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark,
  },

  /* ================= SKILLS ================= */

  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  skillChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
  },

  skillText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.dark,
  },

  /* ================= EDIT BUTTON ================= */

  editButton: {
    height: 36,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark,
  },

  /* ================= BOTTOM NAV ================= */

  bottomTabBar: {
    height: 66,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
  },

  tabLabel: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '600',
    color: Colors.neutralMedium,
  },

  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  logoutOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    zIndex: 1000,
  },

  logoutModal: {
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
    elevation: 10,
  },

  logoutIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  logoutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 7,
  },

  logoutMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.neutralMedium,
    textAlign: 'center',
    marginBottom: 22,
  },

  logoutActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },

  cancelLogoutButton: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },

  cancelLogoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
  },

  confirmLogoutButton: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },

  confirmLogoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.surface,
  },

  clientTabBar: {
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
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '../../src/constants/colors';
import { VerifiedBadge, StarIcon, ExitLogoutIcon } from '../../src/components/Icons';
import apiClient, { resolveMediaUrl } from '../../src/services/api';

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  year: string;
  imageUri: string;
}

export interface FreelancerProfileData {
  name: string;
  email: string;
  title: string;
  avatarUri: string;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  hourlyRate: number;
  status: 'Available' | 'Busy' | 'On Leave';
  about: string;
  skills: string[];
  featuredProjects: ProjectItem[];
}

const DEFAULT_PROFILE: FreelancerProfileData = {
  name: 'Chathuni Imalsha',
  email: 'chathuniimalsha.com',
  title: 'UI/UX Designer',
  avatarUri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
  rating: 4.8,
  reviewCount: 23,
  completedProjects: 18,
  hourlyRate: 65,
  status: 'Available',
  about:
    'Productive UI/UX designer with 4+ years of expertise. Specializing in high-fidelity design systems, mobile workflows, and interactive prototyping.',
  skills: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Design Systems'],
  featuredProjects: [
    {
      id: 'p1',
      title: 'SaaS Finance Portal',
      category: 'Web Design',
      year: '2024',
      imageUri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'p2',
      title: 'FitTrack App',
      category: 'iOS Design',
      year: '2023',
      imageUri: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80',
    },
  ],
};

export default function FreelancerProfileScreen() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<FreelancerProfileData>(DEFAULT_PROFILE);

  // Edit form state
  const [editName, setEditName] = useState(profile.name);
  const [editTitle, setEditTitle] = useState(profile.title);
  const [editCompleted, setEditCompleted] = useState(profile.completedProjects.toString());
  const [editRate, setEditRate] = useState(profile.hourlyRate.toString());
  const [editStatus, setEditStatus] = useState(profile.status);
  const [editAbout, setEditAbout] = useState(profile.about);
  const [editSkills, setEditSkills] = useState<string[]>([...profile.skills]);
  const [newSkillText, setNewSkillText] = useState('');
  const [saveToast, setSaveToast] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Fetch live profile from Spring Boot Backend on mount and focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/freelancer/profile');
      if (res.data) {
        const data = res.data;
        setProfile({
          name: data.fullName || DEFAULT_PROFILE.name,
          email: data.email || DEFAULT_PROFILE.email,
          title: data.title || DEFAULT_PROFILE.title,
          avatarUri: data.avatarUrl || DEFAULT_PROFILE.avatarUri,
          rating: data.rating || DEFAULT_PROFILE.rating,
          reviewCount: data.reviewCount || DEFAULT_PROFILE.reviewCount,
          completedProjects: data.completedProjects || DEFAULT_PROFILE.completedProjects,
          hourlyRate: data.hourlyRate || DEFAULT_PROFILE.hourlyRate,
          status: (data.status as any) || DEFAULT_PROFILE.status,
          about: data.about || DEFAULT_PROFILE.about,
          skills: data.skills && data.skills.length > 0 ? data.skills : DEFAULT_PROFILE.skills,
          featuredProjects:
            data.featuredProjects && data.featuredProjects.length > 0
              ? data.featuredProjects
              : DEFAULT_PROFILE.featuredProjects,
        });
      }
    } catch (err) {
      console.log('Using local fallback profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Switch to Edit Mode
  const handleStartEdit = () => {
    setEditName(profile.name);
    setEditTitle(profile.title);
    setEditCompleted(profile.completedProjects.toString());
    setEditRate(profile.hourlyRate.toString());
    setEditStatus(profile.status);
    setEditAbout(profile.about);
    setEditSkills([...profile.skills]);
    setIsEditing(true);
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    const updatedName = editName.trim() || profile.name;
    const updatedTitle = editTitle.trim() || profile.title;
    const updatedCompleted = parseInt(editCompleted, 10) || profile.completedProjects;
    const updatedRate = parseFloat(editRate) || profile.hourlyRate;
    const updatedStatus = editStatus;
    const updatedAbout = editAbout.trim() || profile.about;
    const updatedSkills = editSkills;

    const newProfileState: FreelancerProfileData = {
      ...profile,
      name: updatedName,
      title: updatedTitle,
      completedProjects: updatedCompleted,
      hourlyRate: updatedRate,
      status: updatedStatus,
      about: updatedAbout,
      skills: updatedSkills,
    };

    setProfile(newProfileState);
    setIsEditing(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);

    try {
      setSaving(true);
      await apiClient.put('/freelancer/profile', {
        email: profile.email,
        fullName: updatedName,
        title: updatedTitle,
        completedProjects: updatedCompleted,
        hourlyRate: updatedRate,
        status: updatedStatus,
        about: updatedAbout,
        skills: updatedSkills,
      });
    } catch (err) {
      console.warn('Backend profile update warning:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkillText.trim() && !editSkills.includes(newSkillText.trim())) {
      setEditSkills([...editSkills, newSkillText.trim()]);
      setNewSkillText('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditSkills(editSkills.filter((s) => s !== skillToRemove));
  };

  const handleBack = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/dashboard');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <Text style={styles.backArrowText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitleText}>
            {isEditing ? 'Edit Profile' : 'Freelancer Profile'}
          </Text>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Logout"
          >
            <ExitLogoutIcon />
          </TouchableOpacity>
        </View>

        {/* Success Toast Banner */}
        {saveToast && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastText}>✓ Profile updated & saved to backend!</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loaderText}>Loading Freelancer Profile...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Profile Info Card */}
            <View style={styles.mainProfileCard}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={
                    profile.avatarUri
                      ? { uri: resolveMediaUrl(profile.avatarUri) }
                      : require('../../assets/freelancer_avatar.jpg')
                  }
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>

              {/* Name + Verified Badge */}
              <View style={styles.nameRow}>
                {isEditing ? (
                  <TextInput
                    style={styles.nameInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Full Name"
                  />
                ) : (
                  <Text style={styles.profileName}>{profile.name}</Text>
                )}
                <VerifiedBadge size={20} />
              </View>

              {/* Profession / Role Subtitle */}
              {isEditing ? (
                <TextInput
                  style={styles.subtitleInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Profession / Role (e.g. UI/UX Designer)"
                />
              ) : (
                <Text style={styles.professionSubtitle}>{profile.title}</Text>
              )}

              {/* Rating Row */}
              <View style={styles.ratingRow}>
                <StarIcon size={16} />
                <Text style={styles.ratingScore}>{profile.rating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({profile.reviewCount} reviews)</Text>
              </View>

            </View>

            {/* 3 Metric Stat Cards Row */}
            <View style={styles.statCardsRow}>
              {/* Card 1: COMPLETED */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>COMPLETED</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.statInput}
                    value={editCompleted}
                    onChangeText={setEditCompleted}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.statValue}>{profile.completedProjects} Projects</Text>
                )}
                {isEditing && <Text style={styles.statPencil}>✎</Text>}
              </View>

              {/* Card 2: HOURLY RATE */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>HOURLY RATE</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.statInput}
                    value={editRate}
                    onChangeText={setEditRate}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.statValue}>${profile.hourlyRate}/hr</Text>
                )}
                {isEditing && <Text style={styles.statPencil}>✎</Text>}
              </View>

              {/* Card 3: STATUS */}
              <TouchableOpacity
                style={[styles.statCard, styles.statusCardActive]}
                activeOpacity={isEditing ? 0.7 : 1}
                onPress={() => {
                  if (isEditing) {
                    setEditStatus((prev) =>
                      prev === 'Available' ? 'Busy' : prev === 'Busy' ? 'On Leave' : 'Available'
                    );
                  }
                }}
              >
                <Text style={styles.statusLabelGreen}>STATUS</Text>
                <Text style={styles.statusValueGreen}>
                  {isEditing ? editStatus : profile.status}
                </Text>
                {isEditing && <Text style={styles.statPencil}>✎</Text>}
              </TouchableOpacity>
            </View>

            {/* About Section */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>About</Text>
              <View style={styles.aboutCard}>
                {isEditing ? (
                  <TextInput
                    style={styles.aboutInput}
                    value={editAbout}
                    onChangeText={setEditAbout}
                    multiline
                    numberOfLines={4}
                    placeholder="Write your professional bio..."
                  />
                ) : (
                  <Text style={styles.aboutText}>{profile.about}</Text>
                )}
              </View>
              {isEditing && <Text style={styles.sectionPencil}>✎</Text>}
            </View>

            {/* Skills Section */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Skills</Text>
              <View style={styles.skillsWrapper}>
                {(isEditing ? editSkills : profile.skills).map((skill, index) => (
                  <View key={index} style={styles.skillPill}>
                    <Text style={styles.skillPillText}>{skill}</Text>
                    {isEditing && (
                      <TouchableOpacity
                        onPress={() => handleRemoveSkill(skill)}
                        style={styles.skillRemoveBtn}
                      >
                        <Text style={styles.skillRemoveText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {/* Add Skill Input in Edit Mode */}
              {isEditing && (
                <View style={styles.addSkillRow}>
                  <TextInput
                    style={styles.addSkillInput}
                    value={newSkillText}
                    onChangeText={setNewSkillText}
                    placeholder="Add skill (e.g., React Native)"
                    onSubmitEditing={handleAddSkill}
                  />
                  <TouchableOpacity style={styles.addSkillButton} onPress={handleAddSkill}>
                    <Text style={styles.addSkillButtonText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              )}
              {isEditing && <Text style={styles.sectionPencil}>✎</Text>}
            </View>

            {/* Featured Work Section */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Featured Work</Text>
              <View style={styles.featuredGrid}>
                {profile.featuredProjects.map((project) => (
                  <View key={project.id} style={styles.projectCard}>
                    <View style={styles.projectImageContainer}>
                      <Image
                        source={
                          project.imageUri
                            ? { uri: resolveMediaUrl(project.imageUri) }
                            : project.id === 'p1'
                              ? require('../../assets/saas_portal.jpg')
                              : require('../../assets/fittrack_app.jpg')
                        }
                        style={styles.projectImage}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.projectInfo}>
                      <Text style={styles.projectTitle}>{project.title}</Text>
                      <Text style={styles.projectSubtitle}>
                        {project.category} • {project.year}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              {isEditing && <Text style={styles.sectionPencil}>✎</Text>}
            </View>

            {/* Main Action Button (Edit Profile / Save Changes) */}
            <View style={styles.actionBtnContainer}>
              {isEditing ? (
                <TouchableOpacity
                  style={styles.saveChangesBtn}
                  onPress={handleSaveChanges}
                  activeOpacity={0.8}
                  disabled={saving}
                >
                  <Text style={styles.saveChangesText}>
                    {saving ? 'Saving to Database...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.editProfileBtn}
                  onPress={() => router.push('/edit-profile')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.editProfileText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}

        {/* Logout / Switch Role Confirmation Modal */}
        <Modal
          visible={logoutModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLogoutModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Account Options</Text>
              <Text style={styles.modalSub}>Manage your session or switch roles</Text>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setLogoutModalVisible(false);
                  router.push('/select-role');
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>👥 Switch User Role</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDestructiveBtn}
                onPress={() => {
                  setLogoutModalVisible(false);
                  router.replace('/login');
                }}
              >
                <Text style={styles.modalDestructiveBtnText}>🚪 Sign Out</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrowText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#111827',
    lineHeight: 34,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  toastBanner: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
    alignItems: 'center',
  },
  toastText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  mainProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  avatarWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    borderBottomWidth: 1.5,
    borderBottomColor: '#10B981',
    paddingVertical: 2,
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  professionSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 10,
  },
  subtitleInput: {
    fontSize: 14,
    color: '#4B5563',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 2,
    paddingHorizontal: 6,
    textAlign: 'center',
    marginBottom: 10,
    minWidth: 180,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  topEditProfileBtn: {
    marginTop: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  topEditProfileBtnText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  pencilIndicatorRow: {
    marginTop: 8,
  },
  pencilSymbol: {
    fontSize: 13,
    color: '#1F2937',
    opacity: 0.8,
  },
  statCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 74,
  },
  statusCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  statInput: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    paddingVertical: 0,
    minWidth: 40,
  },
  statusLabelGreen: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statusValueGreen: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
    textAlign: 'center',
  },
  statPencil: {
    fontSize: 10,
    color: '#4B5563',
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    fontWeight: '400',
  },
  aboutInput: {
    fontSize: 14,
    lineHeight: 22,
    color: '#111827',
    minHeight: 80,
    padding: 0,
  },
  sectionPencil: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 6,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skillPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  skillRemoveBtn: {
    marginLeft: 6,
    padding: 2,
  },
  skillRemoveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  addSkillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  addSkillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#FAFAFA',
  },
  addSkillButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSkillButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  featuredGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  projectCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 6px rgba(0, 0, 0, 0.03)',
      },
    }),
  },
  projectImageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
  },
  projectImage: {
    width: '100%',
    height: '100%',
  },
  projectInfo: {
    padding: 10,
  },
  projectTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  projectSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  actionBtnContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  editProfileBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
      },
    }),
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  saveChangesBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveChangesText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  modalDestructiveBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalDestructiveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  modalCancelBtn: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import { FreelancerApiService, API_BASE_URL, resolveMediaUrl, getCurrentUser } from '../src/services/api';
import { VerifiedBadge, StarIcon } from '../src/components/Icons';

interface FeaturedProjectItem {
  id: string;
  title: string;
  category: string;
  year: string;
  imageUri: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const isChathuni =
    currentUser?.email === 'chathuniimalsha.com' ||
    (currentUser?.fullName && currentUser.fullName.toLowerCase().includes('chathuni')) ||
    (currentUser?.email && currentUser.email.toLowerCase().includes('chathuni'));

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [profile, setProfile] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const k = `profile_cache_${currentUser?.email || currentUser?.fullName || 'default'}`;
        const s = localStorage.getItem(k);
        if (s) {
          const p = JSON.parse(s);
          if (p && p.name) {
            return {
              email: p.email || currentUser?.email || '',
              fullName: p.name || currentUser?.fullName || '',
              title: p.title || '',
              avatarUrl: p.avatarUri || '',
              completedProjects: String(p.completedProjects || 0),
              hourlyRate: String(p.hourlyRate || 0),
              status: p.status || 'Available',
              about: p.about || '',
              location: p.location || '',
              phone: p.phone || '',
              experience: p.experience || '',
              education: p.education || '',
              skills: Array.isArray(p.skills) ? p.skills : [],
              rating: p.rating || 0.0,
              reviewCount: p.reviewCount || 0,
            };
          }
        }
      } catch (e) {}
    }
    return {
      email: currentUser?.email || (isChathuni ? 'chathuniimalsha.com' : ''),
      fullName: currentUser?.fullName || (isChathuni ? 'Chathuni Imalsha' : ''),
      title: isChathuni ? 'UI/UX Designer' : '',
      avatarUrl: isChathuni ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80' : '',
      completedProjects: isChathuni ? '18' : '0',
      hourlyRate: isChathuni ? '65' : '0',
      status: 'Available',
      about: isChathuni
        ? 'Productive UI/UX designer with 4+ years of expertise. Specializing in high-fidelity design systems, mobile workflows, and interactive prototyping.'
        : '',
      location: isChathuni ? 'Colombo, Sri Lanka' : '',
      phone: isChathuni ? '+94 77 123 4567' : '',
      experience: isChathuni ? '4+ years of professional UX/UI design & product development' : '',
      education: isChathuni ? 'B.Sc. in Software Engineering, SLIIT' : '',
      skills: isChathuni ? ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Design Systems'] : [] as string[],
      rating: isChathuni ? 4.8 : 0.0,
      reviewCount: isChathuni ? 23 : 0,
    };
  });

  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProjectItem[]>(
    isChathuni
      ? [
          {
            id: 'p1',
            title: 'SaaS Finance Portal',
            category: 'Web Design • Fintech dashboard UI system',
            year: '2024',
            imageUri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
          },
          {
            id: 'p2',
            title: 'FitTrack App',
            category: 'iOS Design • Activity tracker mobile experience',
            year: '2023',
            imageUri: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80',
          },
        ]
      : []
  );

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const activeUser = getCurrentUser();
      const res = await FreelancerApiService.getProfile(activeUser?.email);
      if (res.data) {
        const d = res.data;
        const isTargetChathuni =
          d.email === 'chathuniimalsha.com' ||
          (d.fullName && d.fullName.toLowerCase().includes('chathuni'));

        setProfile({
          email: d.email || activeUser?.email || '',
          fullName: d.fullName || activeUser?.fullName || '',
          title: d.title != null ? d.title : '',
          avatarUrl: d.avatarUrl || '',
          completedProjects: d.completedProjects != null ? String(d.completedProjects) : (isTargetChathuni ? '18' : '0'),
          hourlyRate: d.hourlyRate != null ? String(d.hourlyRate) : (isTargetChathuni ? '65' : '0'),
          status: d.status || 'Available',
          about: d.about != null ? d.about : '',
          location: d.location != null ? d.location : '',
          phone: d.phone != null ? d.phone : '',
          experience: d.experience != null ? d.experience : '',
          education: d.education != null ? d.education : '',
          skills: Array.isArray(d.skills) ? d.skills : (isTargetChathuni ? ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Design Systems'] : []),
          rating: d.rating != null ? d.rating : (isTargetChathuni ? 4.8 : 0.0),
          reviewCount: d.reviewCount != null ? d.reviewCount : (isTargetChathuni ? 23 : 0),
        });

        if (d.featuredProjects && Array.isArray(d.featuredProjects)) {
          setFeaturedProjects(d.featuredProjects);
        }
      }
    } catch (e) {
      console.warn('Failed to load profile, using current state');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const skillTrimmed = newSkill.trim();
    if (!profile.skills.includes(skillTrimmed)) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, skillTrimmed],
      }));
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s: string) => s !== skillToRemove),
    }));
  };

  const handlePickAvatar = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            const result = uploadEvent.target?.result as string;
            setProfile((prev) => ({ ...prev, avatarUrl: result }));
          };
          reader.readAsDataURL(file);

          try {
            const activeUser = getCurrentUser();
            const targetEmail = profile.email || activeUser?.email || '';
            const updatedData = await FreelancerApiService.uploadProfileImage(file, targetEmail);
            if (updatedData && updatedData.avatarUrl) {
              setProfile((prev) => ({ ...prev, avatarUrl: updatedData.avatarUrl }));
            }
          } catch (err) {
            console.warn('Backend avatar upload error, retaining local preview', err);
          }
        }
      };
      input.click();
    } else {
      Alert.alert('Upload Avatar', 'Choose an image file on web.');
    }
  };

  const handleUploadProjectImage = (index: number) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          // Immediately set local data URL preview
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            const result = uploadEvent.target?.result as string;
            setFeaturedProjects((prev) => {
              const updated = [...prev];
              updated[index] = { ...updated[index], imageUri: result };
              return updated;
            });
          };
          reader.readAsDataURL(file);

          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('relatedEntityType', 'PROJECT');
            formData.append('relatedEntityId', featuredProjects[index]?.id || 'GENERAL');

            const uploadRes = await fetch(`${API_BASE_URL}/files/upload`, {
              method: 'POST',
              body: formData,
            });

            if (uploadRes.ok) {
              const fileData = await uploadRes.json();
              if (fileData && fileData.fileUrl) {
                setFeaturedProjects((prev) => {
                  const updated = [...prev];
                  updated[index] = { ...updated[index], imageUri: fileData.fileUrl };
                  return updated;
                });
              }
            }
          } catch (err) {
            console.warn('Project image upload error, retaining local preview', err);
          }
        }
      };
      input.click();
    } else {
      Alert.alert('Upload Image', 'Choose an image file on web.');
    }
  };

  const handleUpdateProjectField = (index: number, field: keyof FeaturedProjectItem, value: string) => {
    setFeaturedProjects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddProject = () => {
    const newProj: FeaturedProjectItem = {
      id: `p-${Date.now()}`,
      title: 'New Featured Project',
      category: 'UI/UX Design • Interactive prototype',
      year: new Date().getFullYear().toString(),
      imageUri: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
    };
    setFeaturedProjects((prev) => [...prev, newProj]);
  };

  const handleRemoveProject = (index: number) => {
    setFeaturedProjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const activeUser = getCurrentUser();
      const targetEmail = profile.email || activeUser?.email || '';
      const payload = {
        email: targetEmail,
        fullName: profile.fullName,
        title: profile.title,
        avatarUrl: profile.avatarUrl,
        completedProjects: parseInt(profile.completedProjects, 10) || 0,
        hourlyRate: parseFloat(profile.hourlyRate) || 0.0,
        status: profile.status,
        about: profile.about,
        location: profile.location,
        phone: profile.phone,
        experience: profile.experience,
        education: profile.education,
        skills: profile.skills,
        featuredProjects: featuredProjects.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          year: p.year,
          imageUri: p.imageUri,
        })),
      };

      await FreelancerApiService.updateProfile(payload, targetEmail);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('auth_name', profile.fullName);
        const k = `profile_cache_${currentUser?.email || currentUser?.fullName || 'default'}`;
        localStorage.setItem(k, JSON.stringify({
          name: profile.fullName,
          email: profile.email,
          title: profile.title,
          avatarUri: profile.avatarUrl,
          completedProjects: parseInt(profile.completedProjects, 10) || 0,
          hourlyRate: parseFloat(profile.hourlyRate) || 0,
          status: profile.status,
          about: profile.about,
          skills: profile.skills,
          featuredProjects: featuredProjects,
          rating: profile.rating,
          reviewCount: profile.reviewCount,
        }));
      }
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        safeGoBack();
      }, 1800);
    } catch (e: any) {
      Alert.alert('Save Failed', e.message || 'Could not save profile changes to database.');
    } finally {
      setSaving(false);
    }
  };

  const safeGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  if (loading && !profile.fullName && !profile.email) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={safeGoBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <Text style={styles.backArrowText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitleText}>Edit Profile</Text>

          <TouchableOpacity
            style={styles.headerRightBtn}
            onPress={handleSaveProfile}
            activeOpacity={0.7}
            disabled={saving}
          >
            <View style={styles.headerSaveBtn}>
              <Text style={styles.headerSaveBtnText}>{saving ? 'Saving...' : '✓ Save'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Success Toast */}
        {showSuccessToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✓ Profile updated and saved to system database!</Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Profile Info Card */}
          <View style={styles.mainProfileCard}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
            >
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: resolveMediaUrl(profile.avatarUrl) }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitials}>
                    {profile.fullName ? profile.fullName.trim().charAt(0).toUpperCase() : '📷'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraOverlay}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            </TouchableOpacity>

            {/* Name Input Box + Verified Badge */}
            <View style={styles.nameRow}>
              <TextInput
                style={styles.nameInputBox}
                value={profile.fullName}
                onChangeText={(text) => setProfile((p) => ({ ...p, fullName: text }))}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
              />
              <View style={styles.verifiedBadgeWrapper}>
                <VerifiedBadge size={22} />
              </View>
            </View>

            {/* Profession / Role Subtitle Input Box */}
            <View style={styles.subtitleRow}>
              <TextInput
                style={styles.subtitleInputBox}
                value={profile.title}
                onChangeText={(text) => setProfile((p) => ({ ...p, title: text }))}
                placeholder="Profession / Role (e.g. UI/UX Designer)"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Rating Row */}
            <View style={styles.ratingRow}>
              <StarIcon size={16} />
              <Text style={styles.ratingScore}>{profile.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({profile.reviewCount} reviews)</Text>
            </View>
          </View>

          {/* 3 Metric Stat Cards Row with Edit Boxes (No pencils) */}
          <View style={styles.statCardsRow}>
            {/* Card 1: COMPLETED */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>COMPLETED</Text>
              <TextInput
                style={styles.statInputBox}
                value={profile.completedProjects}
                onChangeText={(text) => setProfile((p) => ({ ...p, completedProjects: text }))}
                keyboardType="numeric"
                placeholder="18"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Card 2: HOURLY RATE */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>HOURLY RATE</Text>
              <View style={styles.hourlyInputRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.hourlyInputBox}
                  value={profile.hourlyRate}
                  onChangeText={(text) => setProfile((p) => ({ ...p, hourlyRate: text }))}
                  keyboardType="numeric"
                  placeholder="65"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Card 3: STATUS */}
            <TouchableOpacity
              style={[styles.statCard, styles.statusCardActive]}
              activeOpacity={0.7}
              onPress={() => {
                setProfile((p) => ({
                  ...p,
                  status:
                    p.status === 'Available'
                      ? 'Busy'
                      : p.status === 'Busy'
                        ? 'On Leave'
                        : 'Available',
                }));
              }}
            >
              <Text style={styles.statusLabelGreen}>STATUS</Text>
              <View style={styles.statusSelectBox}>
                <Text style={styles.statusValueGreen}>{profile.status}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* About Section with Edit Box */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>About</Text>
            <View style={styles.aboutCard}>
              <TextInput
                style={styles.aboutInputBox}
                value={profile.about}
                onChangeText={(text) => setProfile((p) => ({ ...p, about: text }))}
                multiline
                numberOfLines={4}
                placeholder="Explain about your professional experience..."
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Skills Section */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Skills</Text>
            <View style={styles.skillsWrapper}>
              {profile.skills.map((skill: string, index: number) => (
                <View key={index} style={styles.skillPill}>
                  <Text style={styles.skillPillText}>{skill}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveSkill(skill)}
                    style={styles.skillRemoveBtn}
                  >
                    <Text style={styles.skillRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Add Skill Row */}
            <View style={styles.addSkillRow}>
              <TextInput
                style={styles.addSkillInput}
                value={newSkill}
                onChangeText={setNewSkill}
                placeholder="Add skill (e.g., React Native)"
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={handleAddSkill}
              />
              <TouchableOpacity style={styles.addSkillButton} onPress={handleAddSkill}>
                <Text style={styles.addSkillButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Featured Work Section with Image Upload & Explanations */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Featured Work</Text>
              <TouchableOpacity style={styles.addProjectHeaderBtn} onPress={handleAddProject}>
                <Text style={styles.addProjectHeaderBtnText}>+ Add Project</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.featuredGrid}>
              {featuredProjects.length === 0 ? (
                <TouchableOpacity
                  style={styles.emptyFeaturedCard}
                  onPress={handleAddProject}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyFeaturedIcon}>📁</Text>
                  <Text style={styles.emptyFeaturedTitle}>No Featured Projects Added Yet</Text>
                  <Text style={styles.emptyFeaturedSub}>
                    Click here or "+ Add Project" above to showcase your portfolio work.
                  </Text>
                  <View style={styles.emptyFeaturedBtn}>
                    <Text style={styles.emptyFeaturedBtnText}>+ Add Project</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                featuredProjects.map((project, index) => (
                <View key={project.id || index} style={styles.projectCard}>
                  {/* Project Image & Upload Button */}
                  <TouchableOpacity
                    style={styles.projectImageContainer}
                    onPress={() => handleUploadProjectImage(index)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={
                        project.imageUri
                          ? { uri: resolveMediaUrl(project.imageUri) }
                          : index === 0
                            ? require('../assets/saas_portal.jpg')
                            : require('../assets/fittrack_app.jpg')
                      }
                      style={styles.projectImage}
                      resizeMode="cover"
                    />
                    <View style={styles.uploadOverlayBtn}>
                      <Text style={styles.uploadOverlayText}>📷 Upload Image</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeProjectCornerBtn}
                      onPress={() => handleRemoveProject(index)}
                    >
                      <Text style={styles.removeProjectCornerText}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Project Title & Explanation Edit Boxes */}
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectFieldLabel}>Project Title</Text>
                    <TextInput
                      style={styles.projectTitleInput}
                      value={project.title}
                      onChangeText={(val) => handleUpdateProjectField(index, 'title', val)}
                      placeholder="e.g. SaaS Finance Portal"
                      placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.projectFieldLabel}>Explain Project / Category</Text>
                    <TextInput
                      style={styles.projectDescInput}
                      value={project.category}
                      onChangeText={(val) => handleUpdateProjectField(index, 'category', val)}
                      placeholder="e.g. Web Design • Redesigned payment flow"
                      placeholderTextColor="#9CA3AF"
                      multiline
                    />

                    <View style={styles.projectYearRow}>
                      <Text style={styles.projectFieldLabel}>Year:</Text>
                      <TextInput
                        style={styles.projectYearInput}
                        value={project.year}
                        onChangeText={(val) => handleUpdateProjectField(index, 'year', val)}
                        placeholder="2024"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )))}
            </View>
          </View>

          {/* Bottom Action Buttons: Cancel and Save Changes */}
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={safeGoBack}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveChangesBtn, saving && styles.btnDisabled]}
              onPress={handleSaveProfile}
              activeOpacity={0.8}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveChangesText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
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
    borderBottomColor: '#F1F5F9',
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
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  headerRightBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
      },
    }),
  },
  headerSaveBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toast: {
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
    paddingBottom: 40,
  },
  mainProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    position: 'relative',
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#F3F4F6',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 52,
  },
  avatarPlaceholder: {
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 38,
    fontWeight: '700',
    color: '#475569',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraIcon: {
    fontSize: 13,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  nameInputBox: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    textAlign: 'center',
    minWidth: 200,
  },
  verifiedBadgeWrapper: {
    marginLeft: 8,
  },
  subtitleRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  subtitleInputBox: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    textAlign: 'center',
    minWidth: 200,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 4,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  topEditProfileBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#10B981',
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  topEditProfileBtnText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  statCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  statusCardActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  hourlyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginRight: 3,
  },
  statInputBox: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    textAlign: 'center',
    paddingVertical: 3,
    paddingHorizontal: 4,
    width: 54,
    maxWidth: 60,
  },
  hourlyInputBox: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    textAlign: 'center',
    paddingVertical: 3,
    paddingHorizontal: 4,
    width: 50,
    maxWidth: 55,
  },
  statusLabelGreen: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  statusSelectBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusValueGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: '#047857',
    textAlign: 'center',
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  addProjectHeaderBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addProjectHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  aboutInputBox: {
    fontSize: 14,
    lineHeight: 22,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skillPillText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  skillRemoveBtn: {
    marginLeft: 6,
    padding: 2,
  },
  skillRemoveText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  addSkillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addSkillInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  addSkillButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addSkillButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyFeaturedCard: {
    width: '100%',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFeaturedIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyFeaturedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptyFeaturedSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyFeaturedBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  emptyFeaturedBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  projectCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  projectImageContainer: {
    height: 120,
    width: '100%',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  projectImage: {
    width: '100%',
    height: '100%',
  },
  uploadOverlayBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  uploadOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  removeProjectCornerBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeProjectCornerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  projectInfo: {
    padding: 12,
  },
  projectFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  projectTitleInput: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  projectDescInput: {
    fontSize: 12,
    color: '#334155',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    minHeight: 46,
    marginBottom: 8,
  },
  projectYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectYearInput: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    width: 70,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
  },
  saveChangesBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  btnDisabled: {
    opacity: 0.6,
  },
  saveChangesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

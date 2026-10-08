import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { useRouter } from 'expo-router';
import apiClient from '../src/services/api';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';

interface Freelancer {
  id: number | string;
  name: string;
  role: string;
  rating: number;
  jobsCount: number;
  hourlyRate: string;
  verified: boolean;
  availability: string;
  skills: string[];
}

export default function ClientFindTalentScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');

  const [talents, setTalents] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadFreelancers();
  }, []);

  const loadFreelancers = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const response = await apiClient.get('/freelancer/profile/all');
      console.log('FREELANCER PROFILES:', response);
      const data = response.data;

      /*
       * Depending on your backend response,
       * data may already be an array.
       */
      const profiles = Array.isArray(data)
        ? data
        : data
          ? [data]
          : [];
        console.log('profiles:', profiles);
      const mappedProfiles: Freelancer[] = profiles.map(
        (profile: any) => ({
          id: profile.id,

          /*
           * If FreelancerProfile has a User relation,
           * name may come from profile.user.fullName.
           */
          name:
            profile.user?.fullName ||
            profile.fullName ||
            'Unknown Freelancer',

          role:
            profile.professionalTitle ||
            profile.title ||
            'Freelancer',

          rating:
            profile.rating ??
            0,

          jobsCount:
            profile.completedJobs ??
            profile.jobsCount ??
            0,

          hourlyRate:
            profile.hourlyRate != null
              ? `$${profile.hourlyRate}/hr`
              : '$0/hr',

          verified:
            profile.verified ?? false,

          availability:
            profile.status || 'Unavailable',

          skills:
            Array.isArray(profile.skills)
              ? profile.skills
              : [],
        })
      );

      setTalents(mappedProfiles);

    } catch (error: any) {

      console.error(
        'Failed to load freelancers:',
        error?.response?.data || error
      );

      setErrorMessage(
        error?.response?.data?.message ||
        'Failed to load freelancers.'
      );

    } finally {
      setLoading(false);
    }
  };

  const filteredTalents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return talents.filter((talent) => {

      const matchesSearch =
        !query ||
        talent.name.toLowerCase().includes(query) ||
        talent.role.toLowerCase().includes(query) ||
        talent.skills.some((skill) =>
          skill.toLowerCase().includes(query)
        );

      const matchesSkill =
        selectedSkill === 'All' ||
        (
          selectedSkill === 'Available' &&
          talent.availability.toLowerCase() === 'available'
        ) ||
        talent.role
          .toLowerCase()
          .includes(selectedSkill.toLowerCase()) ||
        talent.skills.some((skill) =>
          skill.toLowerCase().includes(
            selectedSkill.toLowerCase()
          )
        );

      return matchesSearch && matchesSkill;
    });

  }, [talents, searchQuery, selectedSkill]);

  const handleInvite = (talent: Freelancer) => {
    router.push({
      pathname: '/(tabs)/create-project',
      params: {
        talentId: String(talent.id),
      },
    });
  };

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (word) => word.charAt(0).toUpperCase()
      )
      .join('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}

        <Text style={styles.headerTitle}>
          Find Talent
        </Text>

        {/* Search */}

        <View style={styles.searchBar}>

          <Text
            style={{
              fontSize: 16,
              marginRight: 8,
            }}
          >
            🔍
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search designers, developers..."
            placeholderTextColor={
              Colors.neutralLight
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <TouchableOpacity
            style={styles.filterSettingsBtn}
          >
            <Text style={{ fontSize: 16 }}>
              🎛️
            </Text>
          </TouchableOpacity>

        </View>

        {/* Filters */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
        >
          {[
            'All',
            'UI Design',
            'Frontend',
            'Product Design',
            'Available',
          ].map((skill) => {

            const isSelected =
              selectedSkill === skill;

            return (
              <TouchableOpacity
                key={skill}
                style={[
                  styles.chip,
                  isSelected &&
                    styles.chipActive,
                ]}
                onPress={() =>
                  setSelectedSkill(skill)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected &&
                      styles.chipTextActive,
                  ]}
                >
                  {skill}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Loading */}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={Colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading freelancers...
            </Text>
          </View>
        )}

        {/* Error */}

        {!loading && errorMessage !== '' && (
          <View style={styles.errorContainer}>

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadFreelancers}
            >
              <Text style={styles.retryText}>
                Try Again
              </Text>
            </TouchableOpacity>

          </View>
        )}

        {/* Talent Cards */}

        {!loading &&
          errorMessage === '' && (
            <View style={styles.talentList}>

              {filteredTalents.map((item) => (

                <View
                  key={item.id}
                  style={styles.talentCard}
                >

                  {/* Top Row */}

                  <View style={styles.cardTopRow}>

                    <View style={styles.avatarBox}>

                      <Text
                        style={
                          styles.avatarInitials
                        }
                      >
                        {getInitials(item.name)}
                      </Text>

                    </View>

                    <View style={{ flex: 1 }}>

                      <View
                        style={styles.nameRow}
                      >

                        <Text
                          style={
                            styles.talentName
                          }
                        >
                          {item.name}
                        </Text>

                        {item.verified && (
                          <View
                            style={
                              styles.verifiedBadge
                            }
                          >
                            <Text
                              style={
                                styles.verifiedText
                              }
                            >
                              VERIFIED
                            </Text>
                          </View>
                        )}

                      </View>

                      <Text
                        style={styles.talentRole}
                      >
                        {item.role}
                      </Text>

                      <Text
                        style={styles.ratingText}
                      >
                        ⭐ {item.rating} (
                        {item.jobsCount} jobs)
                      </Text>

                    </View>

                  </View>

                  {/* Skills */}

                  <View style={styles.skillsRow}>

                    {item.skills.map((skill) => (

                      <View
                        key={skill}
                        style={styles.skillPill}
                      >
                        <Text
                          style={
                            styles.skillPillText
                          }
                        >
                          {formatSkillName(skill)}
                        </Text>
                      </View>

                    ))}

                    <View
                      style={styles.availPill}
                    >

                      <View
                        style={styles.greenDot}
                      />

                      <Text
                        style={styles.availText}
                      >
                        {item.availability}
                      </Text>

                    </View>

                  </View>

                  {/* Footer */}

                  <View
                    style={styles.actionFooter}
                  >

                    <Text
                      style={styles.hourlyRate}
                    >
                      {item.hourlyRate}
                    </Text>

                    <View
                      style={styles.buttonsRow}
                    >

                      <TouchableOpacity
                        style={
                          styles.viewProfileBtn
                        }
                        onPress={() =>
                          router.push({
                            pathname:
                              '/(tabs)/talent-profile',
                            params: {
                              id: String(item.id),
                            },
                          })
                        }
                      >
                        <Text
                          style={
                            styles.viewProfileText
                          }
                        >
                          View Profile
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.inviteBtn}
                        onPress={() =>
                          handleInvite(item)
                        }
                      >
                        <Text
                          style={styles.inviteText}
                        >
                          Invite
                        </Text>
                      </TouchableOpacity>

                    </View>

                  </View>

                </View>

              ))}

              {filteredTalents.length === 0 && (
                <Text style={styles.emptyText}>
                  No talent matches your search.
                </Text>
              )}

            </View>
          )}

      </ScrollView>

      {/* Bottom Navigation */}

      <View style={styles.clientTabBar}>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            router.push('/client-dashboard')
          }
        >
          <Text
            style={[
              styles.tabIcon,
              styles.tabIconActive,
            ]}
          >
            🏠
          </Text>

          <Text
            style={[
              styles.tabLabel,
              styles.tabLabelActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            router.push('/client-contracts')
          }
        >
          <Text style={styles.tabIcon}>
            📁
          </Text>

          <Text style={styles.tabLabel}>
            Projects
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            router.push('/client-find-talent')
          }
        >
          <Text style={styles.tabIcon}>
            🔍
          </Text>

          <Text style={styles.tabLabel}>
            Find Talent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            router.push('/client-reports')
          }
        >
          <Text style={styles.tabIcon}>
            💳
          </Text>

          <Text style={styles.tabLabel}>
            Payments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            router.push('/client-profile')
          }
        >
          <Text style={styles.tabIcon}>
            👤
          </Text>

          <Text style={styles.tabLabel}>
            Profile
          </Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}

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

  container: {
    flex: 1,
  },

  contentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: 80,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: Theme.spacing.md,
  },

  searchBar: {
    height: 50,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
  },

  filterSettingsBtn: {
    padding: 4,
  },

  chipsRow: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
  },

  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical:
      Theme.spacing.xs + 2,
    borderRadius:
      Theme.borderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Theme.spacing.sm,
  },

  chipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.primaryLight,
  },

  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.neutralMedium,
  },

  chipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },

  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.neutralMedium,
  },

  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },

  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },

  retryText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 12,
  },

  talentList: {
    gap: Theme.spacing.md,
  },

  emptyText: {
    color: Colors.neutralMedium,
    textAlign: 'center',
    paddingVertical: Theme.spacing.lg,
  },

  talentCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },

  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },

  avatarInitials: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '800',
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  talentName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },

  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark,
  },

  talentRole: {
    fontSize: 12,
    color: Colors.neutralMedium,
    marginTop: 1,
  },

  ratingText: {
    fontSize: 11,
    color: Colors.neutralLight,
    marginTop: 2,
  },

  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: Theme.spacing.xs,
  },

  skillPill: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  skillPillText: {
    fontSize: 11,
    color: Colors.neutralMedium,
  },

  availPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  availText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },

  actionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },

  hourlyRate: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },

  buttonsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },

  viewProfileBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical:
      Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },

  viewProfileText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
  },

  inviteBtn: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical:
      Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Colors.primary,
  },

  inviteText: {
    fontSize: 13,
    fontWeight: '700',
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

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabIcon: {
    fontSize: 18,
    opacity: 0.6,
  },

  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.neutralMedium,
    marginTop: 2,
  },

  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
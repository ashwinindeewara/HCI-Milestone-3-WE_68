import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';

interface PortfolioItem {
  title: string;
  imageUrl?: string;
}

interface ReviewItem {
  company: string;
  date: string;
  quote: string;
}

interface TalentProfileViewModel {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  rating: number;
  jobsCount: number;
  hourlyRate: string;
  verified: boolean;
  availability: string;
  bio: string;
  skills: string[];
  portfolio: PortfolioItem[];
  review: ReviewItem | null;
}

const EMPTY_PROFILE: TalentProfileViewModel = {
  id: '',
  name: 'Freelancer',
  role: 'Freelancer',
  avatarUrl: undefined,
  rating: 0,
  jobsCount: 0,
  hourlyRate: '$0/hr',
  verified: false,
  availability: 'Unavailable',
  bio: 'No profile description available.',
  skills: [],
  portfolio: [],
  review: null,
};

const toNumber = (value: any, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toStringArray = (value: any): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item?.name) return String(item.name);
      if (item?.skill) return String(item.skill);
      if (item?.label) return String(item.label);
      return '';
    })
    .filter(Boolean);
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function TalentProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [profile, setProfile] = useState<TalentProfileViewModel>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [avatarUnavailable, setAvatarUnavailable] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    setAvatarUnavailable(false);

    try {
      console.log('========== TALENT PROFILE ==========', id);
      console.log('Loading freelancer profiles...');

      const response = await apiClient.get('/freelancer/profile', {
        params: {  id: id, },
        timeout: 10000,
      });

      console.log('Freelancer API status:', response.status);
      console.log('Freelancer API response:', response.data);

      const rawProfiles = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.profiles)
          ? response.data.profiles
          : response.data
            ? [response.data]
            : [];

      console.log('Profiles returned:', rawProfiles.length);

      const rawProfile = rawProfiles.find(
        (item: any) =>
          String(item?.id ?? '') === String(id ?? '') ||
          String(item?.user?.id ?? '') === String(id ?? '') ||
          String(item?.userId ?? '') === String(id ?? '')
      );

      console.log('Selected raw profile:', rawProfile);

      if (!rawProfile) {
        throw new Error(`Freelancer profile not found for id: ${id}`);
      }

      const skills = toStringArray(
        rawProfile.skills ??
          rawProfile.coreSkills ??
          rawProfile.skillTypes
      );

      const rawPortfolio =
        rawProfile.portfolio ??
        rawProfile.selectedWork ??
        rawProfile.portfolioItems ??
        [];

      const portfolio: PortfolioItem[] = Array.isArray(rawPortfolio)
        ? rawPortfolio
            .map((work: any, index: number) => ({
              title:
                work?.title ??
                work?.name ??
                `Selected work ${index + 1}`,
              imageUrl:
                work?.imageUrl ??
                work?.image ??
                work?.thumbnailUrl,
            }))
            .filter((work) => Boolean(work.imageUrl))
        : [];

      const rawReview =
        rawProfile.review ??
        (Array.isArray(rawProfile.clientReviews)
          ? rawProfile.clientReviews[0]
          : null);

      const normalizedReview: ReviewItem | null = rawReview
        ? {
            company:
              rawReview.company ??
              rawReview.companyName ??
              rawReview.clientName ??
              'Client',
            date: rawReview.date ?? rawReview.createdAt ?? '',
            quote:
              rawReview.quote ??
              rawReview.comment ??
              rawReview.review ??
              '',
          }
        : null;

      const hourlyRateValue =
        rawProfile.hourlyRate ??
        rawProfile.ratePerHour ??
        rawProfile.hourly_rate;

      const normalized: TalentProfileViewModel = {
        id: String(rawProfile.id ?? rawProfile.user?.id ?? id ?? ''),
        name:
          rawProfile.user?.fullName ??
          rawProfile.fullName ??
          rawProfile.name ??
          'Unknown Freelancer',
        role:
          rawProfile.professionalTitle ??
          rawProfile.title ??
          rawProfile.role ??
          'Freelancer',
        avatarUrl:
          rawProfile.avatarUrl ??
          rawProfile.profileImageUrl ??
          rawProfile.user?.profileImageUrl,
        rating: toNumber(rawProfile.rating, 0),
        jobsCount: toNumber(
          rawProfile.completedJobs ?? rawProfile.jobsCount,
          0
        ),
        hourlyRate:
          hourlyRateValue !== null && hourlyRateValue !== undefined && hourlyRateValue !== ''
            ? `$${hourlyRateValue}/hr`
            : '$0/hr',
        verified: Boolean(rawProfile.verified ?? rawProfile.isVerified),
        availability:
          rawProfile.availability ??
          rawProfile.availabilityStatus ??
          'Unavailable',
        bio:
          rawProfile.bio ??
          rawProfile.about ??
          rawProfile.description ??
          'No profile description available.',
        skills,
        portfolio,
        review: normalizedReview,
      };

      console.log('Mapped talent profile:', normalized);
      setProfile(normalized);
    } catch (error: any) {
      console.error('Failed to load freelancer profile:', error);
      console.error('Error message:', error?.message);
      console.error('Error URL:', error?.config?.url);
      console.error('Error baseURL:', error?.config?.baseURL);

      setErrorMessage(
        error?.response?.data?.message ??
          error?.message ??
          'Unable to load freelancer profile.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const initials = useMemo(
    () => getInitials(profile.name || 'Freelancer'),
    [profile.name]
  );

  const openInvite = () => {
    router.push({
      pathname: '/client-create-project',
      params: { talentId: profile.id },
    });
  };

  const goBack = () => {
    router.replace('/client-find-talent');
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.stateText}>Loading freelancer profile...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorTitle}>Unable to load profile</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={goBack}>
          <Text style={styles.backLinkText}>Back to Find Talent</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back to talent search"
          >
            <Text style={styles.backGlyph}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Freelancer Profile</Text>

          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.profileIntro}>
          {avatarUnavailable || !profile.avatarUrl ? (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatar}
              onError={() => setAvatarUnavailable(true)}
            />
          )}

          <View style={styles.profileIdentity}>
            <View style={styles.nameLine}>
              <Text numberOfLines={1} style={styles.name}>
                {profile.name}
              </Text>

              {profile.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>VERIFIED</Text>
                </View>
              )}
            </View>

            <Text numberOfLines={1} style={styles.role}>
              {profile.role}
            </Text>

            <View style={styles.ratingLine}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.rating}>{profile.rating.toFixed(1)}</Text>
              <Text style={styles.dot}>•</Text>
              <View style={styles.availableDot} />
              <Text style={styles.availableText}>
                {profile.availability}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>
              {profile.jobsCount} Projects
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Hourly Rate</Text>
            <Text style={styles.statValue}>{profile.hourlyRate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bodyText}>{profile.bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Core Skills</Text>

          {profile.skills.length > 0 ? (
            <View style={styles.skillsGrid}>
              {profile.skills.map((skill, index) => (
                <View key={`${skill}-${index}`} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptySectionText}>
              No skills added yet.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Work</Text>

          {profile.portfolio.length > 0 ? (
            <View style={styles.portfolioRow}>
              {profile.portfolio.slice(0, 3).map((work, index) => (
                <View key={`${work.title}-${index}`} style={styles.portfolioItem}>
                  {work.imageUrl ? (
                    <Image
                      source={{ uri: work.imageUrl }}
                      style={styles.portfolioImage}
                    />
                  ) : (
                    <View style={styles.portfolioPlaceholder} />
                  )}
                  <Text
                    numberOfLines={1}
                    style={styles.portfolioTitle}
                  >
                    {work.title}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptySectionText}>
              No selected work added yet.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Reviews</Text>

          {profile.review ? (
            <View style={styles.reviewBox}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewCompany}>
                  {profile.review.company}
                </Text>
                <Text style={styles.reviewDate}>
                  {profile.review.date}
                </Text>
              </View>

              {profile.review.quote ? (
                <Text style={styles.reviewQuote}>
                  “{profile.review.quote}”
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.reviewBox}>
              <Text style={styles.emptyReviewText}>
                No client reviews yet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.inviteButton} onPress={openInvite}>
          <Text style={styles.inviteButtonText}>Invite to Project</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setMessageModalVisible(true)}
          >
            <Text style={styles.secondaryButtonText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={openInvite}>
            <Text style={styles.secondaryButtonText}>Create Contract</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={messageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMessageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Messaging unavailable</Text>
            <Text style={styles.modalText}>
              Direct messaging is not connected yet.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setMessageModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
    backgroundColor: Colors.surface,
  },
  stateText: {
    marginTop: Theme.spacing.sm,
    color: Colors.neutralMedium,
    fontSize: 13,
  },
  errorTitle: {
    color: Colors.dark,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    marginTop: Theme.spacing.sm,
    color: Colors.neutralMedium,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  retryButton: {
    marginTop: Theme.spacing.md,
    minWidth: 110,
    minHeight: 44,
    paddingHorizontal: Theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  retryButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  backLink: {
    marginTop: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  backLinkText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  topBar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backGlyph: {
    color: Colors.dark,
    fontSize: 32,
    lineHeight: 34,
  },
  topBarTitle: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '800',
  },
  topBarSpacer: {
    width: 40,
  },
  profileIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.background,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark,
  },
  avatarInitials: {
    color: Colors.surface,
    fontSize: 22,
    fontWeight: '800',
  },
  profileIdentity: {
    flex: 1,
    gap: 3,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    flexShrink: 1,
    color: Colors.dark,
    fontSize: 17,
    fontWeight: '800',
  },
  verifiedBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  verifiedText: {
    color: Colors.primaryDark,
    fontSize: 8,
    fontWeight: '800',
  },
  role: {
    color: Colors.neutralMedium,
    fontSize: 12,
  },
  ratingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingStar: {
    color: '#F59E0B',
    fontSize: 16,
  },
  rating: {
    color: Colors.dark,
    fontSize: 11,
    fontWeight: '700',
  },
  dot: {
    color: Colors.neutralLight,
    marginHorizontal: 2,
  },
  availableDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  availableText: {
    color: Colors.primaryDark,
    fontSize: 10,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statBox: {
    flex: 1,
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.md,
  },
  statLabel: {
    color: Colors.neutralMedium,
    fontSize: 10,
  },
  statValue: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 7,
  },
  bodyText: {
    color: Colors.neutralMedium,
    fontSize: 11,
    lineHeight: 17,
  },
  emptySectionText: {
    color: Colors.neutralLight,
    fontSize: 11,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  skillChip: {
    backgroundColor: Colors.background,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skillText: {
    color: Colors.neutralMedium,
    fontSize: 9,
  },
  portfolioRow: {
    flexDirection: 'row',
    gap: 8,
  },
  portfolioItem: {
    flex: 1,
    minWidth: 0,
  },
  portfolioImage: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: 7,
    backgroundColor: Colors.background,
  },
  portfolioPlaceholder: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: 7,
    backgroundColor: Colors.background,
  },
  portfolioTitle: {
    color: Colors.neutralMedium,
    fontSize: 9,
    marginTop: 4,
  },
  reviewBox: {
    padding: 10,
    backgroundColor: Colors.background,
    borderRadius: 7,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  reviewCompany: {
    flex: 1,
    color: Colors.dark,
    fontSize: 10,
    fontWeight: '800',
  },
  reviewDate: {
    color: Colors.neutralLight,
    fontSize: 9,
  },
  reviewQuote: {
    color: Colors.neutralMedium,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  emptyReviewText: {
    color: Colors.neutralLight,
    fontSize: 10,
  },
  actionBar: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inviteButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  inviteButtonText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 7,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
  },
  secondaryButtonText: {
    color: Colors.dark,
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    padding: Theme.spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
  },
  modalTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  modalText: {
    color: Colors.neutralMedium,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
  modalButton: {
    marginTop: Theme.spacing.md,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  modalButtonText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '800',
  },
});

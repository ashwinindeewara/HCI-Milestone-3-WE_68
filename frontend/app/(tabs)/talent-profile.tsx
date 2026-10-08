import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';
import { TALENT_PROFILES } from '../../src/constants/talentProfiles';

export default function TalentProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const profile = TALENT_PROFILES.find((talent) => talent.id === id) || TALENT_PROFILES[0];
  const [avatarUnavailable, setAvatarUnavailable] = useState(false);

  const openInvite = () => {
    router.push({
      pathname: '/(tabs)/create-project',
      params: { talentId: profile.id },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/find-talent')}
            accessibilityRole="button"
            accessibilityLabel="Go back to talent search"
          >
            <Text style={styles.backGlyph}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Freelancer Profile</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.profileIntro}>
          {avatarUnavailable ? (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>
                {profile.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
              </Text>
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
              <Text style={styles.name}>{profile.name}</Text>
              {profile.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>VERIFIED</Text>
                </View>
              )}
            </View>
            <Text style={styles.role}>{profile.role}</Text>
            <View style={styles.ratingLine}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.rating}>{profile.rating.toFixed(1)}</Text>
              <Text style={styles.dot}>•</Text>
              <View style={styles.availableDot} />
              <Text style={styles.availableText}>{profile.availability}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>{profile.jobsCount} projects</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Hourly rate</Text>
            <Text style={styles.statValue}>{profile.hourlyRate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About me</Text>
          <Text style={styles.bodyText}>{profile.bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Core skills</Text>
          <View style={styles.skillsGrid}>
            {profile.skills.map((skill) => (
              <View key={skill} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected work</Text>
          <View style={styles.portfolioRow}>
            {profile.portfolio.map((work) => (
              <View key={work.title} style={styles.portfolioItem}>
                <Image source={{ uri: work.imageUrl }} style={styles.portfolioImage} />
                <Text numberOfLines={1} style={styles.portfolioTitle}>{work.title}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client review</Text>
          <View style={styles.reviewBox}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewCompany}>{profile.review.company}</Text>
              <Text style={styles.reviewDate}>{profile.review.date}</Text>
            </View>
            <Text style={styles.reviewQuote}>“{profile.review.quote}”</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.inviteButton} onPress={openInvite}>
          <Text style={styles.inviteButtonText}>Invite to project</Text>
        </TouchableOpacity>
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => Alert.alert('Messaging unavailable', 'Direct messaging is not connected yet.')}
          >
            <Text style={styles.secondaryButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={openInvite}>
            <Text style={styles.secondaryButtonText}>Create contract</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
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
    justifyContent: 'center',
  },
  backGlyph: {
    color: Colors.dark,
    fontSize: 32,
    lineHeight: 34,
  },
  topBarTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  topBarSpacer: {
    width: 40,
  },
  profileIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.background,
  },
  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark,
  },
  avatarInitials: {
    color: Colors.surface,
    fontSize: 23,
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
    gap: 7,
  },
  name: {
    color: Colors.dark,
    fontSize: 19,
    fontWeight: '800',
  },
  verifiedBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  verifiedText: {
    color: Colors.primaryDark,
    fontSize: 9,
    fontWeight: '800',
  },
  role: {
    color: Colors.neutralMedium,
    fontSize: 13,
  },
  ratingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  ratingStar: {
    color: '#F59E0B',
    fontSize: 17,
  },
  rating: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '700',
  },
  dot: {
    color: Colors.neutralLight,
    marginHorizontal: 3,
  },
  availableDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  availableText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    paddingBottom: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statBox: {
    flex: 1,
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.md,
  },
  statLabel: {
    color: Colors.neutralMedium,
    fontSize: 12,
  },
  statValue: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  section: {
    marginTop: Theme.spacing.lg,
  },
  sectionTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Theme.spacing.sm,
  },
  bodyText: {
    color: Colors.neutralMedium,
    fontSize: 14,
    lineHeight: 21,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
  },
  skillChip: {
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs + 2,
  },
  skillText: {
    color: Colors.neutralMedium,
    fontSize: 12,
  },
  portfolioRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  portfolioItem: {
    flex: 1,
    minWidth: 0,
  },
  portfolioImage: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.background,
  },
  portfolioTitle: {
    color: Colors.neutralMedium,
    fontSize: 11,
    marginTop: 5,
  },
  reviewBox: {
    padding: Theme.spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Theme.spacing.xs,
  },
  reviewCompany: {
    flex: 1,
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '800',
  },
  reviewDate: {
    color: Colors.neutralLight,
    fontSize: 11,
  },
  reviewQuote: {
    color: Colors.neutralMedium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: Theme.spacing.sm,
  },
  actionBar: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inviteButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  inviteButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
  },
  secondaryButtonText: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '700',
  },
});
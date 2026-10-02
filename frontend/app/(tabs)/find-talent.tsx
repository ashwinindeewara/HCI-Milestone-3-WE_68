import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';

export default function FindTalentScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('Figma');

  const talents = [
    {
      id: '1',
      name: 'Amaya Perera',
      verified: true,
      role: 'UI/UX Designer',
      rating: 4.8,
      jobsCount: 18,
      hourlyRate: '$65/hr',
      skills: ['Figma', 'UI Design', 'UX'],
      availability: 'Available',
    },
    {
      id: '2',
      name: 'Vihaga Edirisinghe',
      verified: true,
      role: 'Frontend Developer',
      rating: 4.9,
      jobsCount: 32,
      hourlyRate: '$80/hr',
      skills: ['Figma', 'UI Design', 'UX'],
      availability: 'Available',
    },
    {
      id: '3',
      name: 'Piyumi Kavindya',
      verified: true,
      role: 'Product Designer',
      rating: 4.7,
      jobsCount: 15,
      hourlyRate: '$70/hr',
      skills: ['Figma', 'UI Design', 'UX'],
      availability: 'Available',
    },
  ];

  const handleInvite = (name: string) => {
    Alert.alert('Invite Talent', `Invitation sent to ${name} for your project contract.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Title Header */}
      <Text style={styles.headerTitle}>Find Talent</Text>

      {/* Search Input Bar with Filter Icon */}
      <View style={styles.searchBar}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search designers, developers..."
          placeholderTextColor={Colors.neutralLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterSettingsBtn}>
          <Text style={{ fontSize: 16 }}>🎛️</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Skill Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {['Figma', 'UI Design', 'Available', 'React', 'Rating'].map((skill) => {
          const isSelected = selectedSkill === skill;
          return (
            <TouchableOpacity
              key={skill}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => setSelectedSkill(skill)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {skill}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Talent Cards List (Matching Screenshot 3) */}
      <View style={styles.talentList}>
        {talents.map((item) => (
          <View key={item.id} style={styles.talentCard}>
            {/* Top Info Row */}
            <View style={styles.cardTopRow}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarInitials}>{item.name.charAt(0)}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.talentName}>{item.name}</Text>
                  {item.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>VERIFIED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.talentRole}>{item.role}</Text>
                <Text style={styles.ratingText}>
                  ⭐ {item.rating} ({item.jobsCount} jobs)
                </Text>
              </View>
            </View>

            {/* Skill Badges & Availability Pill */}
            <View style={styles.skillsRow}>
              {item.skills.map((sk) => (
                <View key={sk} style={styles.skillPill}>
                  <Text style={styles.skillPillText}>{sk}</Text>
                </View>
              ))}
              <View style={styles.availPill}>
                <View style={styles.greenDot} />
                <Text style={styles.availText}>{item.availability}</Text>
              </View>
            </View>

            {/* Rate & Action Buttons Row */}
            <View style={styles.actionFooter}>
              <Text style={styles.hourlyRate}>{item.hourlyRate}</Text>
              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={styles.viewProfileBtn}
                  onPress={() => Alert.alert('Talent Profile', `Viewing ${item.name}'s portfolio.`)}
                >
                  <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.inviteBtn}
                  onPress={() => handleInvite(item.name)}
                >
                  <Text style={styles.inviteText}>Invite</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
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
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.full,
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
  talentList: {
    gap: Theme.spacing.md,
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
    fontSize: 18,
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
    paddingVertical: Theme.spacing.xs + 2,
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
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Colors.primary,
  },
  inviteText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.surface,
  },
});

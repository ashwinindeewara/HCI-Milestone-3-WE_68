import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';

export default function ContractsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const projects = [
    {
      id: '1',
      title: 'E-Commerce Redesign',
      client: 'TechVentures Inc.',
      milestone: 'UI Design Phase',
      progress: 65,
      escrowTag: '$2,400 In Escrow',
      dueDate: 'Due Oct 15, 2024',
      status: 'Active',
    },
    {
      id: '2',
      title: 'Mobile App Contract',
      client: 'Global Retail Corp',
      milestone: 'API Integration',
      progress: 30,
      escrowTag: '$3,800 In Escrow',
      dueDate: 'Due Nov 01, 2024',
      status: 'Active',
    },
    {
      id: '3',
      title: 'Marketing Brand Strategy',
      client: 'Apex Ventures',
      milestone: 'Final Assets Handover',
      progress: 100,
      escrowTag: 'Completed & Paid',
      dueDate: 'Due Sep 30, 2024',
      status: 'Completed',
    },
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesFilter =
      activeFilter === 'All' || p.status.toLowerCase() === activeFilter.toLowerCase();
    const matchesQuery =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Title Header */}
        <Text style={styles.headerTitle}>My Projects</Text>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor={Colors.neutralLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsRow}>
          {['All', 'Active', 'Completed', 'Pending'].map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                  filter === 'Active' && !isSelected && styles.filterChipActiveBg,
                ]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                    filter === 'Active' && !isSelected && styles.filterChipTextGreen,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Project Cards List */}
        <View style={styles.projectList}>
          {filteredProjects.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.projectCard}
              onPress={() => router.push('/(tabs)/files')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.projectTitle}>{item.title}</Text>
                  <Text style={styles.clientName}>{item.client}</Text>
                </View>

                <View
                  style={[
                    styles.tagBox,
                    item.status === 'Completed' ? styles.tagCompleted : styles.tagActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      item.status === 'Completed' ? styles.tagTextCompleted : styles.tagTextActive,
                    ]}
                  >
                    {item.escrowTag}
                  </Text>
                </View>
              </View>

              <View style={styles.progressRow}>
                <Text style={styles.milestoneText}>Milestone: {item.milestone}</Text>
                <Text style={styles.progressPercent}>{item.progress}%</Text>
              </View>

              {/* Green Progress Bar */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.dueDate}>📅 {item.dueDate}</Text>
                <Text style={styles.viewDetails}>View Details ›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
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
    height: 48,
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
  filterChipsRow: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Theme.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipActiveBg: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.primaryLight,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.neutralMedium,
  },
  filterChipTextActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  filterChipTextGreen: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  projectList: {
    gap: Theme.spacing.md,
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  clientName: {
    fontSize: 12,
    color: Colors.neutralMedium,
    marginTop: 2,
  },
  tagBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  tagActive: {
    backgroundColor: '#DCFCE7',
  },
  tagCompleted: {
    backgroundColor: '#E0F2FE',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tagTextActive: {
    color: Colors.primaryDark,
  },
  tagTextCompleted: {
    color: '#0369A1',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 4,
  },
  milestoneText: {
    fontSize: 12,
    color: Colors.neutralMedium,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Theme.spacing.xs + 2,
  },
  dueDate: {
    fontSize: 12,
    color: Colors.neutralLight,
  },
  viewDetails: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});

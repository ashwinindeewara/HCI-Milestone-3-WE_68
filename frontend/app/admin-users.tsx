import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';

export default function AdminUserManagementScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [users, setUsers] = useState([
    {
      id: '1',
      name: 'Chathuni Imalsha',
      email: 'chathuniimalsha.com',
      role: 'Freelancer',
      status: 'Active',
      joined: 'Joined Oct 2023',
    },
    {
      id: '2',
      name: 'Ruwan Sadeepa',
      email: 'ruwansadeepa67@gmail.com',
      role: 'Client',
      status: 'Active',
      joined: 'Joined Jan 2024',
    },
    {
      id: '3',
      name: 'Amaya Perera',
      email: 'amayaperera2003@gmail.com',
      role: 'Freelancer',
      status: 'Suspended',
      joined: 'Joined Jul 2023',
    },
    {
      id: '4',
      name: 'Akila Deshan',
      email: 'akiladesh99@gmail.com',
      role: 'Client',
      status: 'Active',
      joined: 'Joined Dec 2022',
    },
  ]);

  const handleToggleStatus = (id: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    Alert.alert(
      'User Status Action',
      `Are you sure you want to change ${name}'s status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setUsers((prev) =>
              prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
            );
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Freelancers' && u.role === 'Freelancer') ||
      (activeFilter === 'Clients' && u.role === 'Client') ||
      (activeFilter === 'Alerts' && u.status === 'Suspended');
    const matchesQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Title Header */}
        <Text style={styles.headerTitle}>User Management</Text>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search email, name or ID..."
            placeholderTextColor={Colors.neutralLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsRow}>
          {['All', 'Freelancers', 'Clients', 'Alerts'].map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* User Cards List (Matching Screenshot 2) */}
        <View style={styles.userList}>
          {filteredUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>

                <View style={styles.badgesCol}>
                  <View
                    style={[
                      styles.roleTag,
                      user.role === 'Freelancer' ? styles.tagGreen : styles.tagBlue,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        user.role === 'Freelancer' ? styles.textGreen : styles.textBlue,
                      ]}
                    >
                      {user.role}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusTag,
                      user.status === 'Active' ? styles.tagActive : styles.tagSuspended,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        user.status === 'Active' ? styles.textActive : styles.textSuspended,
                      ]}
                    >
                      {user.status}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.joinedText}>{user.joined}</Text>
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.manageBtn}
                    onPress={() => Alert.alert('User Details', `Managing account for ${user.name}`)}
                  >
                    <Text style={styles.manageText}>Manage</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusActionBtn,
                      user.status === 'Active' ? styles.suspendBtn : styles.activateBtn,
                    ]}
                    onPress={() => handleToggleStatus(user.id, user.status, user.name)}
                  >
                    <Text
                      style={
                        user.status === 'Active' ? styles.suspendText : styles.activateText
                      }
                    >
                      {user.status === 'Active' ? 'Suspend' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Admin Bottom Navigation Bar */}
      <View style={styles.adminTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-dashboard')}>
          <Text style={styles.tabIcon}>🎛️</Text>
          <Text style={styles.tabLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-users')}>
          <Text style={[styles.tabIcon, styles.tabIconActive]}>👥</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-transactions')}>
          <Text style={styles.tabIcon}>💵</Text>
          <Text style={styles.tabLabel}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-disputes')}>
          <Text style={styles.tabIcon}>⚠️</Text>
          <Text style={styles.tabLabel}>Disputes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-security')}>
          <Text style={styles.tabIcon}>•••</Text>
          <Text style={styles.tabLabel}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
  searchInput: { flex: 1, fontSize: 14, color: Colors.dark },
  filterChipsRow: { flexDirection: 'row', gap: Theme.spacing.xs, marginBottom: Theme.spacing.lg },
  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.neutralMedium, fontWeight: '500' },
  chipTextActive: { color: Colors.surface, fontWeight: '700' },
  userList: { gap: Theme.spacing.md },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.sm },
  avatarBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.dark, justifyContent: 'center', alignItems: 'center', marginRight: Theme.spacing.md },
  avatarText: { color: Colors.surface, fontSize: 16, fontWeight: '800' },
  userName: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  userEmail: { fontSize: 12, color: Colors.neutralMedium, marginTop: 1 },
  badgesCol: { alignItems: 'flex-end', gap: 4 },
  roleTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagGreen: { backgroundColor: '#DCFCE7' },
  tagBlue: { backgroundColor: '#EFF6FF' },
  roleText: { fontSize: 10, fontWeight: '700' },
  textGreen: { color: Colors.primaryDark },
  textBlue: { color: '#2563EB' },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagActive: { backgroundColor: '#DCFCE7' },
  tagSuspended: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 10, fontWeight: '700' },
  textActive: { color: Colors.primaryDark },
  textSuspended: { color: Colors.errorText },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Theme.spacing.sm },
  joinedText: { fontSize: 12, color: Colors.neutralLight },
  actionsRow: { flexDirection: 'row', gap: Theme.spacing.sm },
  manageBtn: { paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.xs, borderRadius: Theme.borderRadius.sm, borderWidth: 1, borderColor: Colors.border },
  manageText: { fontSize: 12, fontWeight: '700', color: Colors.dark },
  statusActionBtn: { paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.xs, borderRadius: Theme.borderRadius.sm },
  suspendBtn: { backgroundColor: '#FEE2E2' },
  suspendText: { fontSize: 12, fontWeight: '700', color: Colors.errorText },
  activateBtn: { backgroundColor: '#DCFCE7' },
  activateText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
  adminTabBar: {
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

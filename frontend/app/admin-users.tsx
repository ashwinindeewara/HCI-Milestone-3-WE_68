import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SkeletonCard from '../src/components/SkeletonCard';
import Colors from '../src/constants/colors';
import AdminTabBar from '../src/components/AdminTabBar';
import AdminToast, { ToastType } from '../src/components/AdminToast';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';

export default function AdminUserManagementScreen() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [visibleLimit, setVisibleLimit] = useState(4);

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as ToastType });
  const showToast = (message: string, type: ToastType = 'success') => setToast({ visible: true, message, type });

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form Field States
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('FREELANCER');
  const [formStatus, setFormStatus] = useState('Active');
  const [formPassword, setFormPassword] = useState('Password123!');

  // Fetch Users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/admin/users');
        if (Array.isArray(response.data) && response.data.length > 0) {
          return response.data.map((u: any) => ({
            ...u,
            id: u.id?.toString(),
            name: u.fullName || u.name || 'Unknown User',
            email: u.email || 'no-email@platform.com',
            role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1).toLowerCase() : 'Freelancer',
            rawRole: u.role || 'FREELANCER',
            status: u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1).toLowerCase() : 'Active',
            joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'
          }));
        }
      } catch (error) {
        console.warn('[AdminUsers] Users endpoint connection error:', error);
      }
      return [
        { id: '1', name: 'Chathuni Imalsha', email: 'chathuniimalsha.com', role: 'Freelancer', rawRole: 'FREELANCER', status: 'Active', joined: 'Sep 01, 2026' },
        { id: '2', name: 'Ruwan Sadeepa', email: 'ruwansadeepa67@gmail.com', role: 'Client', rawRole: 'CLIENT', status: 'Active', joined: 'Sep 05, 2026' },
        { id: '3', name: 'Amaya Perera', email: 'amayaperera2003@gmail.com', role: 'Freelancer', rawRole: 'FREELANCER', status: 'Suspended', joined: 'Sep 10, 2026' },
        { id: '4', name: 'Akila Deshan', email: 'akiladesh99@gmail.com', role: 'Client', rawRole: 'CLIENT', status: 'Active', joined: 'Sep 12, 2026' },
        { id: '5', name: 'System Admin', email: 'admin@freelance.com', role: 'Admin', rawRole: 'ADMIN', status: 'Active', joined: 'Aug 15, 2026' }
      ];
    },
    retry: 2,
    retryDelay: 1000,
  });

  const users = usersData || [];

  // CSV EXPORT FUNCTIONALITY
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      showToast('No user account records available to export.', 'error');
      return;
    }

    const headers = ['User ID', 'Full Name', 'Email Address', 'Role', 'Status', 'Joined Date'];
    const rows = filteredUsers.map((u: any) => [
      `"${u.id || ''}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${u.role || ''}"`,
      `"${u.status || ''}"`,
      `"${u.joined || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

    if (typeof window !== 'undefined' && window.document) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `user_accounts_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showToast(`Exported ${filteredUsers.length} user account records to CSV.`, 'success');
  };

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/admin/users', payload);
      return res.data;
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      setIsFormModalOpen(false);
      resetForm();
      showToast(`User ${newUser.fullName || newUser.email} created successfully!`, 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to create user account.', 'error');
    }
  });

  // Edit User Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await apiClient.put(`/admin/users/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      setIsFormModalOpen(false);
      setIsDetailModalOpen(false);
      resetForm();
      showToast('User account updated successfully!', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to update user account details.', 'error');
    }
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      await apiClient.put(`/admin/users/${id}/status`, { status: newStatus });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      if (selectedUser && selectedUser.id === variables.id) {
        setSelectedUser((prev: any) => ({ ...prev, status: variables.newStatus }));
      }
      showToast(`User status changed to ${variables.newStatus}.`, 'success');
    },
    onError: () => {
      showToast('Failed to change user status.', 'error');
    }
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      setIsDeleteModalOpen(false);
      setIsDetailModalOpen(false);
      showToast('User account permanently deleted.', 'info');
    },
    onError: () => {
      showToast('Failed to delete user account.', 'error');
    }
  });

  // Modal Triggers
  const openCreateModal = () => {
    setFormMode('create');
    setFormName('');
    setFormEmail('');
    setFormRole('FREELANCER');
    setFormStatus('Active');
    setFormPassword('Password123!');
    setIsFormModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setFormMode('edit');
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.rawRole || 'FREELANCER');
    setFormStatus(user.status);
    setIsDetailModalOpen(false);
    setIsFormModalOpen(true);
  };

  const openDetailModal = (user: any) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('FREELANCER');
    setFormStatus('Active');
    setFormPassword('');
    setSelectedUser(null);
  };

  const handleFormSubmit = () => {
    if (!formName.trim() || !formEmail.trim()) {
      showToast('Please fill in both full name and email.', 'error');
      return;
    }

    if (formMode === 'create') {
      createMutation.mutate({
        fullName: formName,
        email: formEmail,
        role: formRole,
        status: formStatus,
        password: formPassword || 'Password123!',
      });
    } else if (selectedUser) {
      updateMutation.mutate({
        id: selectedUser.id,
        payload: {
          fullName: formName,
          email: formEmail,
          role: formRole,
          status: formStatus,
        }
      });
    }
  };

  const filteredUsers = users.filter((u: any) => {
    const roleUpper = (u.rawRole || u.role || '').toUpperCase();
    const isFreelancer = roleUpper.includes('FREELANCER');
    const isClient = roleUpper.includes('CLIENT');
    const isAdminOrStaff = roleUpper.includes('ADMIN') || roleUpper.includes('STAFF') || roleUpper.includes('PAYMENT') || (!isFreelancer && !isClient);

    const statusUpper = (u.status || '').toUpperCase();
    const isActive = statusUpper === 'ACTIVE';
    const isSuspended = statusUpper === 'SUSPENDED';

    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Active' && isActive) ||
      (activeFilter === 'Suspended' && isSuspended) ||
      (activeFilter === 'Freelancers' && isFreelancer) ||
      (activeFilter === 'Clients' && isClient) ||
      (activeFilter === 'Admins & Staff' && isAdminOrStaff);

    const matchesQuery =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id?.includes(searchQuery);

    return matchesFilter && matchesQuery;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Title Header with Add User Button & Export CSV */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>User Management</Text>
            <Text style={styles.headerSubtitle}>{users.length} registered accounts</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Theme.spacing.xs, alignItems: 'center' }}>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV} activeOpacity={0.8}>
              <Text style={styles.exportBtnText}>📥 Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={openCreateModal} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+ Add New User</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or user ID..."
            placeholderTextColor={Colors.neutralLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: Colors.neutralMedium, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips Horizontal Scroll Container */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: Theme.spacing.lg }}
          contentContainerStyle={styles.filterChipsRow}
        >
          {['All', 'Active', 'Suspended', 'Freelancers', 'Clients', 'Admins & Staff'].map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => {
                  setActiveFilter(filter);
                  setVisibleLimit(4);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* User Cards List */}
        <View style={styles.userList}>
          {isLoading ? (
            <>
              <SkeletonCard height={120} />
              <SkeletonCard height={120} />
              <SkeletonCard height={120} />
            </>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptySub}>Try adjusting your search query or filter chip.</Text>
            </View>
          ) : (
            filteredUsers.slice(0, visibleLimit).map((user: any) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
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
                  <Text style={styles.joinedText}>Joined {user.joined}</Text>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.manageBtn}
                      onPress={() => openDetailModal(user)}
                    >
                      <Text style={styles.manageText}>⚙️ Manage</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusActionBtn,
                        user.status === 'Active' ? styles.suspendBtn : styles.activateBtn,
                      ]}
                      onPress={() =>
                        toggleStatusMutation.mutate({
                          id: user.id,
                          newStatus: user.status === 'Active' ? 'Suspended' : 'Active',
                        })
                      }
                      disabled={toggleStatusMutation.isPending}
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
            ))
          )}
        </View>

        {/* Load More Pagination Option for > 4 items */}
        {filteredUsers.length > 4 && (
          <View style={styles.loadMoreContainer}>
            {visibleLimit < filteredUsers.length ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => setVisibleLimit((prev) => prev + 4)}
                activeOpacity={0.8}
              >
                <Text style={styles.loadMoreText}>
                  Load More (+{filteredUsers.length - visibleLimit} remaining)
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.loadMoreBtnOutline}
                onPress={() => setVisibleLimit(4)}
                activeOpacity={0.8}
              >
                <Text style={styles.loadMoreTextOutline}>Show Less</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* CREATE / EDIT USER MODAL */}
      <Modal
        visible={isFormModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFormModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formMode === 'create' ? '➕ Create User Account' : '✏️ Edit User Account'}
              </Text>
              <TouchableOpacity onPress={() => setIsFormModalOpen(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Sarah Jenkins"
                placeholderTextColor={Colors.neutralLight}
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. sarah@example.com"
                placeholderTextColor={Colors.neutralLight}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formEmail}
                onChangeText={setFormEmail}
              />

              {formMode === 'create' && (
                <>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter default password"
                    placeholderTextColor={Colors.neutralLight}
                    secureTextEntry
                    value={formPassword}
                    onChangeText={setFormPassword}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.radioGroup}>
                {['FREELANCER', 'CLIENT', 'ADMIN', 'PAYMENT_STAFF'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.radioItem, formRole === r && styles.radioItemActive]}
                    onPress={() => setFormRole(r)}
                  >
                    <Text style={[styles.radioText, formRole === r && styles.radioTextActive]}>
                      {r.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Account Status</Text>
              <View style={styles.radioGroup}>
                {['Active', 'Suspended'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.radioItem, formStatus === s && styles.radioItemActive]}
                    onPress={() => setFormStatus(s)}
                  >
                    <Text style={[styles.radioText, formStatus === s && styles.radioTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setIsFormModalOpen(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleFormSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitModalText}>
                    {formMode === 'create' ? 'Create Account' : 'Save Changes'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* USER DETAILS & MANAGE MODAL */}
      <Modal
        visible={isDetailModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>User Account Profile</Text>
                  <TouchableOpacity onPress={() => setIsDetailModalOpen(false)}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailProfileBox}>
                  <View style={styles.detailAvatarBox}>
                    <Text style={styles.detailAvatarText}>
                      {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <Text style={styles.detailName}>{selectedUser.name}</Text>
                  <Text style={styles.detailEmail}>{selectedUser.email}</Text>
                  <Text style={styles.detailId}>User ID: {selectedUser.id}</Text>

                  <View style={styles.detailTagsRow}>
                    <View style={[styles.roleTag, selectedUser.role === 'Freelancer' ? styles.tagGreen : styles.tagBlue]}>
                      <Text style={[styles.roleText, selectedUser.role === 'Freelancer' ? styles.textGreen : styles.textBlue]}>
                        {selectedUser.role}
                      </Text>
                    </View>
                    <View style={[styles.statusTag, selectedUser.status === 'Active' ? styles.tagActive : styles.tagSuspended]}>
                      <Text style={[styles.statusText, selectedUser.status === 'Active' ? styles.textActive : styles.textSuspended]}>
                        {selectedUser.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailActionsContainer}>
                  <TouchableOpacity
                    style={styles.detailActionItem}
                    onPress={() => openEditModal(selectedUser)}
                  >
                    <Text style={styles.detailActionIcon}>✏️</Text>
                    <Text style={styles.detailActionLabel}>Edit User Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailActionItem}
                    onPress={() =>
                      toggleStatusMutation.mutate({
                        id: selectedUser.id,
                        newStatus: selectedUser.status === 'Active' ? 'Suspended' : 'Active',
                      })
                    }
                  >
                    <Text style={styles.detailActionIcon}>
                      {selectedUser.status === 'Active' ? '🚫' : '🟢'}
                    </Text>
                    <Text style={styles.detailActionLabel}>
                      {selectedUser.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailActionItem, { borderBottomWidth: 0 }]}
                    onPress={() => {
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <Text style={styles.detailActionIcon}>🗑️</Text>
                    <Text style={[styles.detailActionLabel, { color: Colors.errorText }]}>
                      Delete Account Permanently
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.closeDetailBtn}
                  onPress={() => setIsDetailModalOpen(false)}
                >
                  <Text style={styles.closeDetailText}>Close Profile</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        visible={isDeleteModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsDeleteModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.warningIconBox}>
                  <Text style={{ fontSize: 36 }}>⚠️</Text>
                </View>
                <Text style={styles.confirmTitle}>Delete Account?</Text>
                <Text style={styles.confirmSub}>
                  Are you sure you want to permanently delete{' '}
                  <Text style={{ fontWeight: '700', color: Colors.dark }}>{selectedUser.name}</Text> ({selectedUser.email})?
                  This action cannot be undone.
                </Text>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelModalBtn}
                    onPress={() => setIsDeleteModalOpen(false)}
                  >
                    <Text style={styles.cancelModalText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dangerModalBtn}
                    onPress={() => deleteMutation.mutate(selectedUser.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.dangerModalText}>Delete Permanently</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <AdminTabBar activeTab="users" />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.neutralMedium,
    marginTop: 2,
  },
  exportBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnText: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 4,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.card,
  },
  addBtnText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 13,
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
  filterChipsRow: { flexDirection: 'row', gap: Theme.spacing.xs, alignItems: 'center' },
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
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  emptySub: { fontSize: 13, color: Colors.neutralMedium, textAlign: 'center', marginTop: 4 },
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
  tagGreen: { backgroundColor: Colors.successBg },
  tagBlue: { backgroundColor: Colors.infoBg },
  roleText: { fontSize: 10, fontWeight: '700' },
  textGreen: { color: Colors.primaryDark },
  textBlue: { color: Colors.infoText },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagActive: { backgroundColor: Colors.successBg },
  tagSuspended: { backgroundColor: Colors.errorBg },
  statusText: { fontSize: 10, fontWeight: '700' },
  textActive: { color: Colors.primaryDark },
  textSuspended: { color: Colors.errorText },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Theme.spacing.sm },
  joinedText: { fontSize: 12, color: Colors.neutralLight },
  actionsRow: { flexDirection: 'row', gap: Theme.spacing.sm },
  manageBtn: { paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.xs, borderRadius: Theme.borderRadius.sm, borderWidth: 1, borderColor: Colors.border },
  manageText: { fontSize: 12, fontWeight: '700', color: Colors.dark },
  statusActionBtn: { paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.xs, borderRadius: Theme.borderRadius.sm },
  suspendBtn: { backgroundColor: Colors.errorBg },
  suspendText: { fontSize: 12, fontWeight: '700', color: Colors.errorText },
  activateBtn: { backgroundColor: Colors.successBg },
  activateText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Theme.spacing.sm,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark },
  closeIcon: { fontSize: 18, fontWeight: '700', color: Colors.neutralMedium },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.dark, marginTop: Theme.spacing.sm, marginBottom: 4 },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    fontSize: 14,
    color: Colors.dark,
    backgroundColor: Colors.background,
  },
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  radioItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  radioItemActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radioText: { fontSize: 12, fontWeight: '600', color: Colors.neutralMedium },
  radioTextActive: { color: Colors.surface, fontWeight: '700' },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.lg,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelModalBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 4,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelModalText: { fontSize: 13, fontWeight: '700', color: Colors.neutralMedium },
  submitModalBtn: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xs + 4,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.primary,
  },
  submitModalText: { fontSize: 13, fontWeight: '700', color: Colors.surface },
  dangerModalBtn: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xs + 4,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.errorText,
  },
  dangerModalText: { fontSize: 13, fontWeight: '700', color: Colors.surface },

  // Detail Modal specific
  detailProfileBox: { alignItems: 'center', marginVertical: Theme.spacing.md },
  detailAvatarBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.dark, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  detailAvatarText: { color: Colors.surface, fontSize: 24, fontWeight: '800' },
  detailName: { fontSize: 18, fontWeight: '800', color: Colors.dark },
  detailEmail: { fontSize: 13, color: Colors.neutralMedium, marginTop: 2 },
  detailId: { fontSize: 11, color: Colors.neutralLight, marginTop: 2 },
  detailTagsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  detailActionsContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.background,
    marginVertical: Theme.spacing.md,
  },
  detailActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailActionIcon: { fontSize: 16, marginRight: 12 },
  detailActionLabel: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  closeDetailBtn: {
    width: '100%',
    paddingVertical: Theme.spacing.sm + 2,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  closeDetailText: { fontSize: 14, fontWeight: '700', color: Colors.dark },

  // Confirm delete
  warningIconBox: { alignItems: 'center', marginVertical: 8 },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark, textAlign: 'center' },
  confirmSub: { fontSize: 13, color: Colors.neutralMedium, textAlign: 'center', marginVertical: 8, lineHeight: 18 },
  loadMoreContainer: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    alignItems: 'center',
  },
  loadMoreBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.sm + 4,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.card,
  },
  loadMoreText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
  loadMoreBtnOutline: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.sm + 4,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreTextOutline: {
    color: Colors.neutralMedium,
    fontWeight: '600',
    fontSize: 13,
  },
});

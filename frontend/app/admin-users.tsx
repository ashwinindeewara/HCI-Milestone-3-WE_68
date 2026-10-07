import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SkeletonCard from '../src/components/SkeletonCard';
import Colors from '../src/constants/colors';
import AdminTabBar from '../src/components/AdminTabBar';
import AdminToast, { ToastType } from '../src/components/AdminToast';
import UserAvatar from '../src/components/UserAvatar';
import apiClient from '../src/services/api';
import {
  AdminCard,
  AdminScreenHeader,
  AdminSearchBar,
  AdminChips,
  AdminButton,
  AdminEmptyState,
  AdminIcon,
  StatusPill,
} from '../src/components/AdminUI';
import AdminModal, {
  AdminField,
  AdminChoiceGroup,
  AdminTag,
  AdminActionList,
  AdminActionRow,
  AdminNotice,
} from '../src/components/AdminModal';
import { Tone, toneColors, adminLayout, adminRadius, adminSpace, adminType, MUTED_TEXT } from '../src/constants/adminTheme';

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
        throw error;
      }
      return [];
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
        <View style={adminLayout.content}>
          <ScreenHeaderWithActions title="User Management" subtitle={`${users.length} registered accounts`}>
            <AdminButton label="Export CSV" icon="download-outline" variant="secondary" onPress={handleExportCSV} />
            <AdminButton label="Add New User" icon="add" onPress={openCreateModal} />
          </ScreenHeaderWithActions>

          <AdminSearchBar
            placeholder="Search by name, email, or user ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <AdminChips
            style={styles.filters}
            options={FILTERS}
            value={activeFilter}
            onChange={(filter) => {
              setActiveFilter(filter);
              setVisibleLimit(4);
            }}
          />

          {isLoading ? (
            <ResponsiveGrid>
              <SkeletonCard height={120} />
              <SkeletonCard height={120} />
              <SkeletonCard height={120} />
            </ResponsiveGrid>
          ) : filteredUsers.length === 0 ? (
            <AdminCard>
              <AdminEmptyState
                icon="people-outline"
                title="No Users Found"
                message="Try adjusting your search query or filter chip."
              />
            </AdminCard>
          ) : (
            <ResponsiveGrid>
              {filteredUsers.slice(0, visibleLimit).map((user: any) => (
                <AdminCard key={user.id} style={styles.cell}>
                  <View style={styles.cardTopRow}>
                    <UserAvatar
                      userId={user.id}
                      name={user.name}
                      size={44}
                      hasPicture={String(user.rawRole).toUpperCase() === 'ADMIN'}
                      style={{ marginRight: adminSpace.md }}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                      <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                    </View>
                  </View>

                  <View style={styles.tagsRow}>
                    <AdminTag label={user.role} tone={roleTone(user.rawRole)} />
                    <StatusPill label={user.status} tone={user.status === 'Active' ? 'success' : 'danger'} />
                    <Text style={styles.joinedText}>Joined {user.joined}</Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <AdminButton
                      label="Manage"
                      icon="settings-outline"
                      variant="secondary"
                      style={styles.footerBtn}
                      onPress={() => openDetailModal(user)}
                    />
                    <SoftButton
                      label={user.status === 'Active' ? 'Suspend' : 'Activate'}
                      tone={user.status === 'Active' ? 'danger' : 'success'}
                      icon={user.status === 'Active' ? 'ban-outline' : 'checkmark-circle-outline'}
                      onPress={() =>
                        toggleStatusMutation.mutate({
                          id: user.id,
                          newStatus: user.status === 'Active' ? 'Suspended' : 'Active',
                        })
                      }
                      disabled={toggleStatusMutation.isPending}
                    />
                  </View>
                </AdminCard>
              ))}
            </ResponsiveGrid>
          )}

          {filteredUsers.length > 4 && (
            <View style={styles.loadMoreContainer}>
              {visibleLimit < filteredUsers.length ? (
                <AdminButton
                  label={`Load More (+${filteredUsers.length - visibleLimit} remaining)`}
                  onPress={() => setVisibleLimit((prev) => prev + 4)}
                />
              ) : (
                <AdminButton label="Show Less" variant="secondary" onPress={() => setVisibleLimit(4)} />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* CREATE / EDIT USER MODAL */}
      <AdminModal
        visible={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        icon={formMode === 'create' ? 'person-add-outline' : 'create-outline'}
        title={formMode === 'create' ? 'Create User Account' : 'Edit User Account'}
        footer={
          <>
            <AdminButton label="Cancel" variant="secondary" onPress={() => setIsFormModalOpen(false)} />
            <AdminButton
              label={formMode === 'create' ? 'Create Account' : 'Save Changes'}
              onPress={handleFormSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </>
        }
      >
        <AdminField
          label="Full Name"
          placeholder="e.g. Sarah Jenkins"
          value={formName}
          onChangeText={setFormName}
        />
        <AdminField
          label="Email Address"
          placeholder="e.g. sarah@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formEmail}
          onChangeText={setFormEmail}
        />
        {formMode === 'create' && (
          <AdminField
            label="Password"
            placeholder="Enter default password"
            secureTextEntry
            value={formPassword}
            onChangeText={setFormPassword}
          />
        )}
        <AdminChoiceGroup label="Role" options={ROLE_OPTIONS} value={formRole} onChange={setFormRole} />
        <AdminChoiceGroup label="Account Status" options={['Active', 'Suspended']} value={formStatus} onChange={setFormStatus} />
      </AdminModal>

      {/* USER DETAILS & MANAGE MODAL */}
      <AdminModal
        visible={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        icon="person-circle-outline"
        title="User Account Profile"
        footer={<AdminButton label="Close Profile" variant="secondary" onPress={() => setIsDetailModalOpen(false)} />}
      >
        {selectedUser && (
          <>
            <View style={styles.detailProfileBox}>
              <UserAvatar
                key={selectedUser.id}
                userId={selectedUser.id}
                name={selectedUser.name}
                size={64}
                hasPicture={String(selectedUser.rawRole).toUpperCase() === 'ADMIN'}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.detailName}>{selectedUser.name}</Text>
              <Text style={styles.detailEmail}>{selectedUser.email}</Text>
              <Text style={styles.detailId}>User ID: {selectedUser.id}</Text>
              <View style={styles.detailTagsRow}>
                <AdminTag label={selectedUser.role} tone={roleTone(selectedUser.rawRole)} />
                <StatusPill label={selectedUser.status} tone={selectedUser.status === 'Active' ? 'success' : 'danger'} />
              </View>
            </View>

            <AdminActionList>
              <AdminActionRow
                icon="create-outline"
                label="Edit User Details"
                onPress={() => openEditModal(selectedUser)}
              />
              <AdminActionRow
                icon={selectedUser.status === 'Active' ? 'ban-outline' : 'checkmark-circle-outline'}
                tone={selectedUser.status === 'Active' ? 'warning' : 'success'}
                label={selectedUser.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                onPress={() =>
                  toggleStatusMutation.mutate({
                    id: selectedUser.id,
                    newStatus: selectedUser.status === 'Active' ? 'Suspended' : 'Active',
                  })
                }
              />
              <AdminActionRow
                icon="trash-outline"
                tone="danger"
                label="Delete Account Permanently"
                last
                onPress={() => {
                  setIsDeleteModalOpen(true);
                }}
              />
            </AdminActionList>
          </>
        )}
      </AdminModal>

      {/* CONFIRM DELETE MODAL */}
      <AdminModal
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        size="sm"
        tone="danger"
        icon="warning-outline"
        title="Delete Account?"
        footer={
          <>
            <AdminButton label="Cancel" variant="secondary" onPress={() => setIsDeleteModalOpen(false)} />
            <AdminButton
              label="Delete Permanently"
              variant="danger"
              onPress={() => deleteMutation.mutate(selectedUser.id)}
              loading={deleteMutation.isPending}
              disabled={!selectedUser}
            />
          </>
        }
      >
        {selectedUser && (
          <AdminNotice tone="danger">
            Are you sure you want to permanently delete{' '}
            <Text style={{ fontWeight: '800' }}>{selectedUser.name}</Text> ({selectedUser.email})?
            This action cannot be undone.
          </AdminNotice>
        )}
      </AdminModal>

      <AdminTabBar activeTab="users" />
    </SafeAreaView>
  );
}

// Equal-width responsive columns (1 on phones, 2 on tablets, 3 on desktop); a last short row keeps card width.
function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const cols = width >= 1000 ? 3 : width >= 640 ? 2 : 1;
  const gap = adminSpace.md;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -gap / 2 }}>
      {React.Children.toArray(children).map((child, i) => (
        <View key={i} style={{ width: `${100 / cols}%`, padding: gap / 2 }}>
          {child}
        </View>
      ))}
    </View>
  );
}

const FILTERS = ['All', 'Active', 'Suspended', 'Freelancers', 'Clients', 'Admins & Staff'];
const ROLE_OPTIONS = ['FREELANCER', 'CLIENT', 'ADMIN', 'PAYMENT_STAFF'].map((r) => ({
  value: r,
  label: r.replace('_', ' '),
}));

const roleTone = (rawRole: any): Tone => {
  const r = String(rawRole || '').toUpperCase();
  if (r.includes('FREELANCER')) return 'success';
  if (r.includes('CLIENT')) return 'info';
  if (r.includes('PAYMENT') || r.includes('STAFF')) return 'warning';
  return 'neutral';
};

// Header with actions: sits on the right on wide screens, wraps below the title on phones.
function ScreenHeaderWithActions({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= 640;
  if (wide) {
    return <AdminScreenHeader title={title} subtitle={subtitle} right={children} />;
  }
  return (
    <View style={{ marginBottom: adminSpace.xl }}>
      <AdminScreenHeader title={title} subtitle={subtitle} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.sm, marginTop: -adminSpace.md }}>{children}</View>
    </View>
  );
}

// Soft tinted action button (status actions on cards).
function SoftButton({
  label,
  tone,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  tone: Tone;
  icon: React.ComponentProps<typeof AdminIcon>['name'];
  onPress: () => void;
  disabled?: boolean;
}) {
  const t = toneColors[tone];
  return (
    <TouchableOpacity
      {...{ onPress }}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.softBtn, { backgroundColor: t.bg, borderColor: t.border }, disabled && { opacity: 0.55 }]}
    >
      <AdminIcon name={icon} size={16} color={t.fg} />
      <Text style={[styles.softBtnText, { color: t.fg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  contentContainer: { padding: adminSpace.lg, paddingBottom: adminLayout.bottomClearance },
  filters: { marginTop: adminSpace.md, marginBottom: adminSpace.lg },
  cell: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  userName: adminType.cardTitle,
  userEmail: { fontSize: 12, color: MUTED_TEXT, marginTop: 2 },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: adminSpace.sm,
    marginTop: adminSpace.md,
  },
  joinedText: { fontSize: 12, color: MUTED_TEXT },
  cardFooter: {
    flexDirection: 'row',
    gap: adminSpace.sm,
    marginTop: adminSpace.lg,
    paddingTop: adminSpace.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerBtn: { flex: 1 },
  softBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: adminSpace.lg,
    borderRadius: adminRadius.md,
    borderWidth: 1,
  },
  softBtnText: { fontSize: 14, fontWeight: '700' },
  loadMoreContainer: { marginTop: adminSpace.xl, alignItems: 'center' },

  detailProfileBox: { alignItems: 'center', marginBottom: adminSpace.lg },
  detailName: { fontSize: 18, fontWeight: '800', color: Colors.dark },
  detailEmail: { fontSize: 13, color: MUTED_TEXT, marginTop: 2 },
  detailId: { fontSize: 11, color: MUTED_TEXT, marginTop: 2 },
  detailTagsRow: { flexDirection: 'row', gap: 8, marginTop: adminSpace.sm },
});

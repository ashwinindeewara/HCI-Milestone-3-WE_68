import React, { useState, useMemo } from 'react';
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

const ITEMS_PER_PAGE = 10;

export default function AdminSecurityScreen() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleLimit, setVisibleLimit] = useState(4);

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as ToastType });
  const showToast = (message: string, type: ToastType = 'success') => setToast({ visible: true, message, type });

  // Modal States
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  // Log Form Fields
  const [newAction, setNewAction] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newIpAddress, setNewIpAddress] = useState('');
  const [newSeverity, setNewSeverity] = useState('High');

  // Fetch Security Alerts — all data comes directly from the database via the backend API
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['adminSecurityAlerts'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/security-alerts');
      if (!Array.isArray(response.data)) return [];
      return response.data.map((a: any) => ({
        id: String(a.id ?? ''),
        title: a.title || 'Security Event Recorded',
        user: a.user || 'Unknown User',
        target: a.target || 'Unknown IP',
        severity: a.severity || 'Low',
        severityType: a.severityType || 'low',   // backend already maps REVIEWED → reviewed
        time: a.time || '',
      }));
    },
    retry: 2,
    retryDelay: 1000,
  });

  const alerts = alertsData || [];

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Blocked IPs
  const { data: blockedIpsData } = useQuery({
    queryKey: ['adminBlockedIps'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/admin/security/blocked-ips');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.warn('[AdminSecurity] Blocked IPs endpoint connection error:', error);
        return [];
      }
    },
    retry: 2,
  });

  const blockedIps = blockedIpsData || [];
  const blockedIpSet = useMemo(() => new Set(blockedIps.map((b: any) => b.ipAddress)), [blockedIps]);

  // Block IP Mutation
  const blockIpMutation = useMutation({
    mutationFn: async (payload: { ipAddress: string; reason: string }) => {
      const res = await apiClient.post('/admin/security/block-ip', payload);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminBlockedIps'] });
      queryClient.invalidateQueries({ queryKey: ['adminSecurityAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      showToast(`IP Address ${variables.ipAddress} blocked successfully!`, 'success');
    },
    onError: () => {
      showToast('Failed to block IP address.', 'error');
    }
  });

  // Unblock IP Mutation
  const unblockIpMutation = useMutation({
    mutationFn: async (ipAddress: string) => {
      const res = await apiClient.delete(`/admin/security/block-ip/${encodeURIComponent(ipAddress)}`);
      return res.data;
    },
    onSuccess: (_data, ipAddress) => {
      queryClient.invalidateQueries({ queryKey: ['adminBlockedIps'] });
      queryClient.invalidateQueries({ queryKey: ['adminSecurityAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      showToast(`IP Address ${ipAddress} unblocked successfully!`, 'info');
    },
    onError: () => {
      showToast('Failed to unblock IP address.', 'error');
    }
  });

  // Export CSV Function
  const handleExportCSV = () => {
    if (filteredAlerts.length === 0) {
      showToast('No security records available to export.', 'error');
      return;
    }

    const headers = ['Incident Title', 'Target User', 'Source IP', 'Severity', 'Time Recorded'];
    const rows = filteredAlerts.map((a: any) => [
      `"${(a.title || '').replace(/"/g, '""')}"`,
      `"${(a.user || '').replace(/"/g, '""')}"`,
      `"${(a.target || '').replace(/"/g, '""')}"`,
      `"${a.severity || ''}"`,
      `"${a.time || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

    if (typeof window !== 'undefined' && window.document) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `security_alerts_audit_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showToast(`Exported ${filteredAlerts.length} security incident records to CSV.`, 'success');
  };

  // Create Log Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/admin/security-alerts', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSecurityAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      setIsLogModalOpen(false);
      resetLogForm();
      showToast('Security incident logged successfully.', 'success');
    },
    onError: () => {
      showToast('Failed to log security incident.', 'error');
    }
  });

  // Review / Resolve Mutation
  const reviewMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.put(`/admin/security-alerts/${id}/review`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSecurityAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      setIsActionModalOpen(false);
      setSelectedAlert(null);
      showToast('Security incident reviewed and dismissed.', 'success');
    },
    onError: () => {
      showToast('Failed to review alert.', 'error');
    }
  });

  // Delete Alert Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/security-alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSecurityAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['adminKpis'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentActivity'] });
      setIsActionModalOpen(false);
      setSelectedAlert(null);
      showToast('Security alert record deleted.', 'info');
    },
    onError: () => {
      showToast('Failed to delete alert record.', 'error');
    }
  });

  const resetLogForm = () => {
    setNewAction('');
    setNewUserEmail('');
    setNewIpAddress('');
    setNewSeverity('High');
  };

  const handleOpenAction = (alert: any) => {
    setSelectedAlert(alert);
    setIsActionModalOpen(true);
  };

  const handleCreateLogSubmit = () => {
    if (!newAction.trim() || !newUserEmail.trim()) {
      showToast('Please enter both event title and user email.', 'error');
      return;
    }

    createMutation.mutate({
      action: newAction,
      userEmail: newUserEmail,
      ipAddress: newIpAddress,
      severity: newSeverity,
    });
  };

  const filteredAlerts = useMemo(() => {
    let result = alerts.filter((a: any) => {
      const matchesSearch =
        (a.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.user || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.target || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        (activeFilter === 'All' && a.severityType !== 'reviewed') ||
        (activeFilter === 'Critical' && (a.severityType === 'high' || a.severity === 'High')) ||
        (activeFilter === 'Medium' && (a.severityType === 'medium' || a.severity === 'Medium')) ||
        (activeFilter === 'Low' && (a.severityType === 'low' || a.severity === 'Low') && a.severityType !== 'reviewed') ||
        (activeFilter === 'Reviewed' && a.severityType === 'reviewed');

      return matchesSearch && matchesFilter;
    });

    const severityRank: Record<string, number> = { high: 4, medium: 3, low: 2, reviewed: 1 };
    return result.sort((a: any, b: any) => {
      const rA = severityRank[a.severityType] || 0;
      const rB = severityRank[b.severityType] || 0;
      return sortOrder === 'desc' ? rB - rA : rA - rB;
    });
  }, [alerts, searchQuery, activeFilter, sortOrder]);

  const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE) || 1;
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAlerts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAlerts, currentPage]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Title Header with Export CSV & Log Incident Buttons */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Security & Audit Logs</Text>
            <Text style={styles.headerSubtitle}>{alerts.length} security events monitored</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Theme.spacing.xs, alignItems: 'center' }}>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV} activeOpacity={0.8}>
              <Text style={styles.exportBtnText}>📥 Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setIsLogModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Log Incident</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search event title, user email, or IP address..."
            placeholderTextColor={Colors.neutralLight}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: Colors.neutralMedium, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filters & Sort Row */}
        <View style={styles.filterSortRow}>
          <View style={styles.filterChipsRow}>
            {['All', 'Critical', 'Medium', 'Low', 'Reviewed'].map((filter) => {
              const isSelected = activeFilter === filter;
              const isReviewedActive = isSelected && filter === 'Reviewed';
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.chip,
                    isSelected && (isReviewedActive ? styles.chipActiveReviewed : styles.chipActive),
                  ]}
                  onPress={() => {
                    setActiveFilter(filter);
                    setCurrentPage(1);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.chipText,
                    isSelected && (isReviewedActive ? styles.chipTextActiveReviewed : styles.chipTextActive),
                  ]}>
                    {filter === 'Reviewed' ? '✓ Reviewed' : filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.sortBtn, styles.sortBtnActive]}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Text style={styles.sortBtnTextActive}>
              Severity {sortOrder === 'desc' ? ' High → Low' : ' Low → High'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Alert Cards */}
        <View style={styles.alertsList}>
          {isLoading ? (
            <>
              <SkeletonCard height={110} />
              <SkeletonCard height={110} />
            </>
          ) : filteredAlerts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🛡️</Text>
              <Text style={styles.emptyTitle}>No Security Incidents</Text>
              <Text style={styles.emptySub}>No alert logs matching your selected filter level.</Text>
            </View>
          ) : (
            filteredAlerts.slice(0, visibleLimit).map((alert: any) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertUser}>User: {alert.user}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Text style={styles.alertTarget}>IP / Target: {alert.target}</Text>
                      {blockedIpSet.has(alert.target) && (
                        <View style={{ backgroundColor: Colors.errorBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: Colors.errorText }}>🚫 IP BLOCKED</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.severityTag,
                      alert.severityType === 'high' && styles.sevHigh,
                      alert.severityType === 'medium' && styles.sevMedium,
                      alert.severityType === 'low' && styles.sevLow,
                      alert.severityType === 'reviewed' && styles.sevReviewed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        alert.severityType === 'high' && styles.sevTextHigh,
                        alert.severityType === 'medium' && styles.sevTextMedium,
                        alert.severityType === 'low' && styles.sevTextLow,
                        alert.severityType === 'reviewed' && styles.sevTextReviewed,
                      ]}
                    >
                      {alert.severity}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.timeText}>🕒 {alert.time}</Text>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenAction(alert)}
                  >
                    <Text style={styles.actionBtnText}>🛡️ Investigate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Load More Pagination Option for > 4 items */}
        {filteredAlerts.length > 4 && (
          <View style={styles.loadMoreContainer}>
            {visibleLimit < filteredAlerts.length ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => setVisibleLimit((prev) => prev + 4)}
                activeOpacity={0.8}
              >
                <Text style={styles.loadMoreText}>
                  Load More (+{filteredAlerts.length - visibleLimit} remaining)
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

        {/* Active Blocked IP Addresses Management Section */}
        <View style={{ marginTop: Theme.spacing.lg }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.dark, marginBottom: 2 }}>
            🚫 Active Blocked IP Addresses ({blockedIps.length})
          </Text>
          <Text style={{ fontSize: 13, color: Colors.neutralMedium, marginBottom: Theme.spacing.md }}>
            IP addresses listed below are blocked by SecurityInterceptor and denied access to platform APIs.
          </Text>

          {blockedIps.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>✅</Text>
              <Text style={styles.emptyTitle}>No Blocked IP Addresses</Text>
              <Text style={styles.emptySub}>No client IP addresses are currently restricted by security firewall rules.</Text>
            </View>
          ) : (
            blockedIps.map((b: any) => (
              <View key={b.id || b.ipAddress} style={[styles.alertCard, { marginBottom: Theme.spacing.sm, borderLeftWidth: 4, borderLeftColor: Colors.error }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.dark }}>{b.ipAddress}</Text>
                      <View style={{ backgroundColor: Colors.errorBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: Colors.errorText }}>BLOCKED</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: Colors.neutralMedium, marginTop: 2 }}>Reason: {b.reason || 'Security threat detected'}</Text>
                    {b.blockedAt && (
                      <Text style={{ fontSize: 11, color: Colors.neutralLight, marginTop: 1 }}>
                        Blocked at: {new Date(b.blockedAt).toLocaleString()}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: Colors.primary, marginLeft: 10 }}
                    onPress={() => unblockIpMutation.mutate(b.ipAddress)}
                    disabled={unblockIpMutation.isPending}
                  >
                    <Text style={{ color: Colors.surface, fontSize: 12, fontWeight: '700' }}>🔓 Unblock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* CREATE LOG MODAL */}
      <Modal
        visible={isLogModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsLogModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚨 Log Security Incident</Text>
              <TouchableOpacity onPress={() => setIsLogModalOpen(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Event Action / Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Anomaly Login Attempt"
                placeholderTextColor={Colors.neutralLight}
                value={newAction}
                onChangeText={setNewAction}
              />

              <Text style={styles.inputLabel}>Target User Email</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. suspicious.user@domain.com"
                placeholderTextColor={Colors.neutralLight}
                keyboardType="email-address"
                autoCapitalize="none"
                value={newUserEmail}
                onChangeText={setNewUserEmail}
              />

              <Text style={styles.inputLabel}>Source IP Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 192.168.1.1"
                placeholderTextColor={Colors.neutralLight}
                value={newIpAddress}
                onChangeText={setNewIpAddress}
              />

              <Text style={styles.inputLabel}>Severity Level</Text>
              <View style={styles.radioGroup}>
                {['High', 'Medium', 'Low'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.radioItem, newSeverity === s && styles.radioItemActive]}
                    onPress={() => setNewSeverity(s)}
                  >
                    <Text style={[styles.radioText, newSeverity === s && styles.radioTextActive]}>
                      {s} Severity
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setIsLogModalOpen(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleCreateLogSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <Text style={styles.submitModalText}>Log Incident</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* INVESTIGATE / ACTION MODAL */}
      <Modal
        visible={isActionModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsActionModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAlert && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Security Incident Report</Text>
                  <TouchableOpacity onPress={() => setIsActionModalOpen(false)}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.incidentBox}>
                  <Text style={styles.incidentTitle}>{selectedAlert.title}</Text>
                  <Text style={styles.incidentMeta}>User: {selectedAlert.user}</Text>
                  <Text style={styles.incidentMeta}>IP Address: {selectedAlert.target}</Text>
                  <Text style={styles.incidentMeta}>Logged: {selectedAlert.time}</Text>
                  <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.dark }}>
                      Severity: {selectedAlert.severity}
                    </Text>
                    {blockedIpSet.has(selectedAlert.target) && (
                      <View style={{ backgroundColor: Colors.errorBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: Colors.errorText }}>🚫 IP BLOCKED</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.detailActionsContainer}>
                  {blockedIpSet.has(selectedAlert.target) ? (
                    <TouchableOpacity
                      style={[styles.detailActionItem, { backgroundColor: Colors.primary + '15' }]}
                      onPress={() => {
                        unblockIpMutation.mutate(selectedAlert.target);
                        setIsActionModalOpen(false);
                      }}
                      disabled={unblockIpMutation.isPending}
                    >
                      <Text style={styles.detailActionIcon}>🔓</Text>
                      <Text style={[styles.detailActionLabel, { color: Colors.primaryDark, fontWeight: '800' }]}>
                        Unblock Source IP Address
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.detailActionItem}
                      onPress={() => {
                        blockIpMutation.mutate({
                          ipAddress: selectedAlert.target,
                          reason: `Blocked via Incident Report: ${selectedAlert.title}`
                        });
                        setIsActionModalOpen(false);
                      }}
                      disabled={blockIpMutation.isPending}
                    >
                      <Text style={styles.detailActionIcon}>🚫</Text>
                      <Text style={styles.detailActionLabel}>Block Source IP Address</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.detailActionItem}
                    onPress={() => reviewMutation.mutate(selectedAlert.id)}
                  >
                    <Text style={styles.detailActionIcon}>✅</Text>
                    <Text style={styles.detailActionLabel}>Mark Reviewed & Dismiss</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailActionItem, { borderBottomWidth: 0 }]}
                    onPress={() => deleteMutation.mutate(selectedAlert.id)}
                  >
                    <Text style={styles.detailActionIcon}>🗑️</Text>
                    <Text style={[styles.detailActionLabel, { color: Colors.errorText }]}>
                      Delete Incident Record
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.closeDetailBtn}
                  onPress={() => setIsActionModalOpen(false)}
                >
                  <Text style={styles.closeDetailText}>Close Report</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <AdminTabBar activeTab="security" />
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
  filterSortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  filterChipsRow: { flexDirection: 'row', gap: Theme.spacing.xs },
  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipActiveReviewed: { backgroundColor: Colors.info, borderColor: Colors.info },
  chipText: { fontSize: 13, color: Colors.neutralMedium, fontWeight: '500' },
  chipTextActive: { color: Colors.surface, fontWeight: '700' },
  chipTextActiveReviewed: { color: Colors.surface, fontWeight: '700' },
  sortBtn: {
    paddingHorizontal: Theme.spacing.sm + 2,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  sortBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  sortBtnTextActive: { color: Colors.primary, fontSize: 11, fontWeight: '700' },
  alertsList: { gap: Theme.spacing.md },
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
  alertCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  alertTitle: { fontSize: 15, fontWeight: '800', color: Colors.dark },
  alertUser: { fontSize: 12, color: Colors.neutralMedium, marginTop: 2 },
  alertTarget: { fontSize: 11, color: Colors.neutralLight, marginTop: 1 },
  severityTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  sevHigh: { backgroundColor: Colors.errorBg },
  sevMedium: { backgroundColor: Colors.warningBg },
  sevLow: { backgroundColor: Colors.successBg },
  sevReviewed: { backgroundColor: Colors.infoBg },
  severityText: { fontSize: 10, fontWeight: '700' },
  sevTextHigh: { color: Colors.errorText },
  sevTextMedium: { color: Colors.warningText },
  sevTextLow: { color: Colors.primaryDark },
  sevTextReviewed: { color: Colors.infoText },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Theme.spacing.xs + 2,
    marginTop: Theme.spacing.xs + 2,
  },
  timeText: { fontSize: 11, color: Colors.neutralLight },
  actionBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Colors.dark,
  },
  actionBtnText: { color: Colors.surface, fontSize: 11, fontWeight: '700' },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xs,
  },
  pageBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 12, fontWeight: '700', color: Colors.dark },
  pageBtnTextDisabled: { color: Colors.neutralLight },
  pageIndicator: { fontSize: 12, fontWeight: '600', color: Colors.neutralMedium },

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

  // Incident Box
  incidentBox: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginVertical: Theme.spacing.sm,
  },
  incidentTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark },
  incidentMeta: { fontSize: 12, color: Colors.neutralMedium, marginTop: 2 },
  detailActionsContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.surface,
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

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SkeletonCard from '../src/components/SkeletonCard';
import Colors from '../src/constants/colors';
import AdminTabBar from '../src/components/AdminTabBar';
import AdminToast, { ToastType } from '../src/components/AdminToast';
import apiClient from '../src/services/api';
import { formatAdminDateTime } from '../src/services/dateFormat';
import {
  AdminIcon,
  AdminCard,
  AdminScreenHeader,
  AdminSectionHeader,
  AdminButton,
  AdminEmptyState,
  StatusPill,
} from '../src/components/AdminUI';
import AdminModal, {
  AdminField,
  AdminTag,
  AdminDetailList,
  AdminActionList,
  AdminActionRow,
} from '../src/components/AdminModal';
import {
  Tone,
  toneColors,
  adminLayout,
  adminRadius,
  adminSpace,
  adminType,
  MUTED_TEXT,
} from '../src/constants/adminTheme';

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
        <View style={adminLayout.content}>
          <AdminScreenHeader
            title="Security & Audit Logs"
            subtitle={`${alerts.length} security events monitored`}
          />

          <View style={styles.actionsRow}>
            <AdminButton label="Export CSV" icon="download-outline" variant="secondary" onPress={handleExportCSV} />
            <AdminButton label="Log Incident" icon="add" onPress={() => setIsLogModalOpen(true)} />
          </View>

          {/* Severity summary */}
          <View style={styles.summaryRow}>
            {([
              { label: 'High', tone: 'danger' as Tone, count: alerts.filter((a: any) => a.severityType === 'high').length },
              { label: 'Medium', tone: 'warning' as Tone, count: alerts.filter((a: any) => a.severityType === 'medium').length },
              { label: 'Low', tone: 'success' as Tone, count: alerts.filter((a: any) => a.severityType === 'low').length },
            ]).map((s) => (
              <AdminCard key={s.label} style={styles.summaryCard}>
                <View style={[styles.summaryDot, { backgroundColor: toneColors[s.tone].solid }]} />
                <View>
                  <Text style={styles.summaryCount}>{s.count}</Text>
                  <Text style={styles.summaryLabel}>{s.label}</Text>
                </View>
              </AdminCard>
            ))}
          </View>

          <View style={styles.searchBox}>
            <AdminIcon name="search-outline" size={18} color={MUTED_TEXT} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search event title, user email, or IP address..."
              placeholderTextColor={MUTED_TEXT}
              accessibilityLabel="Search security events"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setCurrentPage(1);
              }}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <AdminIcon name="close-circle" size={18} color={Colors.neutralLight} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.filterSortRow}>
            <View style={styles.chipRow}>
              {['All', 'Critical', 'Medium', 'Low', 'Reviewed'].map((filter) => {
                const isSelected = activeFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => {
                      setActiveFilter(filter);
                      setCurrentPage(1);
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{filter}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.sortBtn}
              onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Toggle severity sort order"
            >
              <AdminIcon name="swap-vertical-outline" size={16} color={Colors.dark} />
              <Text style={styles.sortBtnText}>
                Severity {sortOrder === 'desc' ? ' High → Low' : ' Low → High'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Alert Cards */}
          <View style={styles.alertsGrid}>
            {isLoading ? (
              <>
                <View style={styles.alertCell}><SkeletonCard height={110} /></View>
                <View style={styles.alertCell}><SkeletonCard height={110} /></View>
              </>
            ) : filteredAlerts.length === 0 ? (
              <AdminCard style={{ width: '100%' }}>
                <AdminEmptyState
                  icon="shield-checkmark-outline"
                  title="No Security Incidents"
                  message="No alert logs matching your selected filter level."
                />
              </AdminCard>
            ) : (
              filteredAlerts.slice(0, visibleLimit).map((alert: any) => {
                const tone = severityTone(alert.severityType, alert.severity);
                return (
                  <View key={alert.id} style={styles.alertCell}>
                    <AdminCard padded={false} style={[styles.alertCard, { borderLeftColor: toneColors[tone].solid }]}>
                      <View style={styles.alertBody}>
                        <View style={styles.cardTopRow}>
                          <Text style={styles.alertTitle}>{alert.title}</Text>
                          <StatusPill label={alert.severity} tone={tone} />
                        </View>

                        <View style={styles.metaRow}>
                          <AdminIcon name="person-outline" size={14} color={MUTED_TEXT} />
                          <Text style={styles.metaText} numberOfLines={1}>User: {alert.user}</Text>
                        </View>
                        <View style={styles.metaRow}>
                          <AdminIcon name="globe-outline" size={14} color={MUTED_TEXT} />
                          <Text style={styles.metaText} numberOfLines={1}>IP / Target: {alert.target}</Text>
                          {blockedIpSet.has(alert.target) && <AdminTag label="IP BLOCKED" tone="danger" />}
                        </View>

                        <View style={styles.cardFooter}>
                          <View style={[styles.metaRow, { flex: 1 }]}>
                            <AdminIcon name="time-outline" size={14} color={MUTED_TEXT} />
                            <Text style={styles.metaText}>{formatAdminDateTime(alert.time)}</Text>
                          </View>
                          <AdminButton
                            label="Investigate"
                            icon="shield-outline"
                            variant="secondary"
                            onPress={() => handleOpenAction(alert)}
                          />
                        </View>
                      </View>
                    </AdminCard>
                  </View>
                );
              })
            )}
          </View>

          {/* Load More Pagination Option for > 4 items */}
          {filteredAlerts.length > 4 && (
            <View style={styles.loadMoreContainer}>
              {visibleLimit < filteredAlerts.length ? (
                <AdminButton
                  label={`Load More (+${filteredAlerts.length - visibleLimit} remaining)`}
                  icon="chevron-down"
                  onPress={() => setVisibleLimit((prev) => prev + 4)}
                />
              ) : (
                <AdminButton
                  label="Show Less"
                  icon="chevron-up"
                  variant="secondary"
                  onPress={() => setVisibleLimit(4)}
                />
              )}
            </View>
          )}

          {/* Active Blocked IP Addresses Management Section */}
          <AdminSectionHeader title="Active Blocked IP Addresses" count={blockedIps.length} />
          <AdminCard>
            <Text style={[adminType.body, { marginBottom: adminSpace.md }]}>
              IP addresses listed below are blocked by SecurityInterceptor and denied access to platform APIs.
            </Text>

            {blockedIps.length === 0 ? (
              <AdminEmptyState
                icon="checkmark-circle-outline"
                title="No Blocked IP Addresses"
                message="No client IP addresses are currently restricted by security firewall rules."
              />
            ) : (
              blockedIps.map((b: any, index: number) => (
                <View
                  key={b.id || b.ipAddress}
                  style={[styles.blockedRow, index === blockedIps.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View style={styles.blockedIconTile}>
                    <AdminIcon name="ban-outline" size={18} color={toneColors.danger.fg} />
                  </View>
                  <View style={styles.blockedInfo}>
                    <View style={styles.blockedTitleRow}>
                      <Text style={styles.blockedIp}>{b.ipAddress}</Text>
                      <StatusPill label="BLOCKED" tone="danger" />
                    </View>
                    <Text style={styles.metaText}>Reason: {b.reason || 'Security threat detected'}</Text>
                    {b.blockedAt && (
                      <Text style={adminType.caption}>Blocked at: {new Date(b.blockedAt).toLocaleString()}</Text>
                    )}
                  </View>
                  <AdminButton
                    label="Unblock"
                    icon="lock-open-outline"
                    variant="secondary"
                    onPress={() => unblockIpMutation.mutate(b.ipAddress)}
                    disabled={unblockIpMutation.isPending}
                  />
                </View>
              ))
            )}
          </AdminCard>
        </View>
      </ScrollView>

      {/* CREATE LOG MODAL */}
      <AdminModal
        visible={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Security Incident"
        icon="alert-circle-outline"
        tone="danger"
        footer={
          <>
            <AdminButton label="Cancel" variant="secondary" onPress={() => setIsLogModalOpen(false)} />
            <AdminButton
              label="Log Incident"
              onPress={handleCreateLogSubmit}
              loading={createMutation.isPending}
            />
          </>
        }
      >
        <AdminField
          label="Event Action / Title"
          required
          placeholder="e.g. Anomaly Login Attempt"
          value={newAction}
          onChangeText={setNewAction}
        />
        <AdminField
          label="Target User Email"
          required
          placeholder="e.g. suspicious.user@domain.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={newUserEmail}
          onChangeText={setNewUserEmail}
        />
        <AdminField
          label="Source IP Address"
          placeholder="e.g. 192.168.1.1"
          value={newIpAddress}
          onChangeText={setNewIpAddress}
        />
        <View style={styles.choiceBox}>
          <Text style={styles.choiceLabel}>Severity Level</Text>
          <View style={styles.chipRow}>
            {['High', 'Medium', 'Low'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, newSeverity === s && styles.chipSelected]}
                onPress={() => setNewSeverity(s)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: newSeverity === s }}
              >
                <Text style={[styles.chipText, newSeverity === s && styles.chipTextSelected]}>{s} Severity</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </AdminModal>

      {/* INVESTIGATE / ACTION MODAL */}
      <AdminModal
        visible={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title="Security Incident Report"
        subtitle={selectedAlert ? selectedAlert.title : undefined}
        icon="shield-outline"
        tone={selectedAlert ? severityTone(selectedAlert.severityType, selectedAlert.severity) : 'neutral'}
        footer={
          <AdminButton label="Close Report" variant="secondary" onPress={() => setIsActionModalOpen(false)} />
        }
      >
        {selectedAlert && (
          <>

            <AdminDetailList
              rows={[
                { label: 'User', value: String(selectedAlert.user) },
                { label: 'IP Address', value: String(selectedAlert.target) },
                { label: 'Logged', value: formatAdminDateTime(selectedAlert.time) },
                {
                  label: 'Severity',
                  value: (
                    <View style={styles.tagRow}>
                      <AdminTag
                        label={selectedAlert.severity}
                        tone={severityTone(selectedAlert.severityType, selectedAlert.severity)}
                      />
                      {blockedIpSet.has(selectedAlert.target) && <AdminTag label="IP BLOCKED" tone="danger" />}
                    </View>
                  ),
                },
              ]}
            />

            <Text style={styles.actionsHeading}>Response actions</Text>
            <AdminActionList>
              {blockedIpSet.has(selectedAlert.target) ? (
                <AdminActionRow
                  icon="lock-open-outline"
                  tone="success"
                  label="Unblock Source IP Address"
                  onPress={() => {
                    unblockIpMutation.mutate(selectedAlert.target);
                    setIsActionModalOpen(false);
                  }}
                  disabled={unblockIpMutation.isPending}
                />
              ) : (
                <AdminActionRow
                  icon="ban-outline"
                  label="Block Source IP Address"
                  onPress={() => {
                    blockIpMutation.mutate({
                      ipAddress: selectedAlert.target,
                      reason: `Blocked via Incident Report: ${selectedAlert.title}`
                    });
                    setIsActionModalOpen(false);
                  }}
                  disabled={blockIpMutation.isPending}
                />
              )}
              <AdminActionRow
                icon="checkmark-circle-outline"
                label="Mark Reviewed & Dismiss"
                onPress={() => reviewMutation.mutate(selectedAlert.id)}
              />
              <AdminActionRow
                icon="trash-outline"
                tone="danger"
                label="Delete Incident Record"
                onPress={() => deleteMutation.mutate(selectedAlert.id)}
                last
              />
            </AdminActionList>
          </>
        )}
      </AdminModal>

      <AdminTabBar activeTab="security" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  contentContainer: {
    padding: adminSpace.lg,
    paddingBottom: adminLayout.bottomClearance,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: adminSpace.sm,
    marginTop: -adminSpace.md,
    marginBottom: adminSpace.lg,
  },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.md, marginBottom: adminSpace.lg },
  summaryCard: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpace.md,
    padding: adminSpace.md + 2,
  },
  summaryDot: { width: 10, height: 10, borderRadius: 5 },
  summaryCount: { fontSize: 22, fontWeight: '800', color: Colors.dark, letterSpacing: -0.4 },
  summaryLabel: adminType.label,
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpace.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpace.md,
    minHeight: 46,
    marginBottom: adminSpace.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
    paddingVertical: 10,
    // Rounded, palette-colored focus ring on web (the browser default is a square blue box)
    ...(Platform.OS === 'web' ? ({ outlineColor: Colors.primary, borderRadius: 8 } as object) : null),
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.sm, flexShrink: 1 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: adminRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.neutralMedium },
  chipTextSelected: { color: Colors.surface },
  choiceBox: { marginBottom: adminSpace.lg },
  choiceLabel: { fontSize: 12, fontWeight: '700', color: Colors.neutralDark, marginBottom: 6 },
  filterSortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpace.md,
    marginBottom: adminSpace.lg,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: adminSpace.md,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  sortBtnText: { fontSize: 12, fontWeight: '700', color: Colors.dark },
  alertsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.md },
  alertCell: { flexGrow: 1, flexBasis: 440, minWidth: 280, maxWidth: '100%' },
  alertCard: { borderLeftWidth: 4, overflow: 'hidden' },
  alertBody: { padding: adminSpace.lg, gap: 6 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: adminSpace.md,
    marginBottom: 4,
  },
  alertTitle: { ...adminType.cardTitle, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  metaText: { fontSize: 12, color: MUTED_TEXT, flexShrink: 1 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: adminSpace.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: adminSpace.md,
    marginTop: adminSpace.sm,
  },
  loadMoreContainer: { marginTop: adminSpace.lg, alignItems: 'center' },
  blockedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: adminSpace.md,
    paddingVertical: adminSpace.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  blockedIconTile: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.sm,
    backgroundColor: toneColors.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedInfo: { flex: 1, minWidth: 180, gap: 2 },
  blockedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpace.sm, flexWrap: 'wrap' },
  blockedIp: { fontSize: 15, fontWeight: '800', color: Colors.dark },
  tagRow: { flexDirection: 'row', gap: adminSpace.sm, flexWrap: 'wrap', justifyContent: 'flex-end' },
  actionsHeading: { ...adminType.overline, marginBottom: adminSpace.sm },
});

// Presentation helper: maps an alert to its status tone.
const severityTone = (severityType?: string, severity?: string): Tone => {
  if (severityType === 'reviewed') return 'info';
  if (severityType === 'high' || severity === 'High') return 'danger';
  if (severityType === 'medium' || severity === 'Medium') return 'warning';
  if (severityType === 'low' || severity === 'Low') return 'success';
  return 'info';
};

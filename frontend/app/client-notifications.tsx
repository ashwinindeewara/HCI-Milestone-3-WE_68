import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';
import { getSavedUserData } from '../src/services/authService';
import { getClientNotificationReadKey, markNotificationsRead } from '../src/services/notificationReadState';

type ActivityTone = 'SUCCESS' | 'WARNING' | 'ERROR';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: ActivityTone;
  createdAt: string;
  projectTitle: string;
  performedBy: string;
  contractId: string;
  projectId: string;
}

const unwrapList = (value: any): any[] => {
  let candidate = value;
  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(candidate)) return candidate;
    if (!candidate || typeof candidate !== 'object') return [];
    candidate = candidate.content ?? candidate.items ?? candidate.contracts ??
      candidate.activities ?? candidate.data ?? candidate.result;
  }
  return Array.isArray(candidate) ? candidate : [];
};

const activityTitle = (rawType: unknown, rawDescription: unknown): string => {
  const type = String(rawType ?? '').toUpperCase();
  const description = String(rawDescription ?? '').toUpperCase();
  const combined = `${type} ${description}`;
  const status = description.match(/STATUS CHANGED TO\s+([A-Z_]+)/)?.[1] ?? '';

  if (status === 'FUNDED' || combined.includes('MILESTONE_FUNDED')) return 'Milestone Funded';
  if (['SUBMITTED', 'DELIVERED', 'PENDING_REVIEW'].includes(status) || combined.includes('DELIVERABLE_SUBMITTED')) return 'Deliverable Submitted';
  if (status === 'RELEASED' || combined.includes('PAYMENT_RELEASED')) return 'Payment Released';
  if (['APPROVED', 'COMPLETED'].includes(status)) return 'Milestone Approved';
  if (status === 'CHANGES_REQUESTED' || combined.includes('CHANGES_REQUESTED')) return 'Changes Requested';
  if (status === 'REJECTED' || combined.includes('REJECTED')) return 'Milestone Rejected';
  if (type.includes('FILE_UPLOADED')) return 'File Uploaded';
  if (type.includes('CONTRACT_ACCEPTED')) return 'Contract Accepted';
  if (type.includes('PROJECT_ACTIVATED')) return 'Project Activated';

  return String(rawType ?? 'PROJECT_UPDATE')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Project Updated';
};

const activityTone = (rawType: unknown, rawDescription: unknown): ActivityTone => {
  const combined = `${String(rawType ?? '')} ${String(rawDescription ?? '')}`.toUpperCase();
  if (/REJECTED|CHANGES_REQUESTED|FAILED|DISPUTE/.test(combined)) return 'ERROR';
  if (/SUBMITTED|DELIVERED|PENDING_REVIEW|FUNDED/.test(combined)) return 'WARNING';
  return 'SUCCESS';
};

const formatDate = (value: string): string => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
};

const formatDayGroup = (value: string): string => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return 'Earlier activity';
  const today = new Date();
  const yesterday = new Date();
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  const eventDay = new Date(date);
  eventDay.setHours(0, 0, 0, 0);
  if (eventDay.getTime() === today.getTime()) return 'Today';
  if (eventDay.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

async function fetchClientNotifications(clientName: string): Promise<NotificationItem[]> {
  const contractResponse = await apiClient.get(
    `/contracts/client/${encodeURIComponent(clientName)}`,
    { timeout: 15000 },
  );
  const contracts = unwrapList(contractResponse.data);

  const groups = await Promise.all(contracts.map(async (contract: any) => {
    const rawId = String(contract?.id ?? contract?.contractId ?? '').trim();
    if (!rawId) return [] as NotificationItem[];

    const contractId = rawId.startsWith('PRJ-') ? rawId.slice(4) : rawId;
    const projectId = String(
      contract?.projectId ?? contract?.project?.id ??
      (rawId.startsWith('PRJ-') ? rawId : `PRJ-${contractId}`),
    );
    const projectTitle = String(
      contract?.title ?? contract?.projectName ?? contract?.project?.title ?? 'Project update',
    );

    try {
      const response = await apiClient.get(
        `/projects/${encodeURIComponent(projectId)}/activities`,
        { timeout: 10000 },
      );
      return unwrapList(response.data).map((activity: any, index: number) => {
        const rawType = activity?.type ?? activity?.eventType ?? 'PROJECT_UPDATE';
        const description = String(activity?.description ?? activity?.message ?? activity?.details ?? 'A project activity was recorded.');
        return {
          id: `${projectId}-${String(activity?.id ?? activity?.activityId ?? `${rawType}-${activity?.createdAt ?? activity?.timestamp ?? index}-${String(rawDescription).slice(0, 80)}`)}`,
          title: activityTitle(rawType, description),
          description,
          type: activityTone(rawType, description),
          createdAt: String(activity?.createdAt ?? activity?.timestamp ?? activity?.eventTime ?? ''),
          projectTitle,
          performedBy: String(activity?.performedBy ?? activity?.actorName ?? activity?.createdBy ?? ''),
          contractId,
          projectId,
        } as NotificationItem;
      });
    } catch (error: any) {
      // One project's activity endpoint may fail; still display notifications from other projects.
      console.info('[ClientNotifications] Could not load activity for project:', projectId, error?.response?.status ?? error?.message);
      return [] as NotificationItem[];
    }
  }));

  return groups.flat().sort((a, b) => {
    const dateA = Date.parse(a.createdAt);
    const dateB = Date.parse(b.createdAt);
    return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
  });
}

export default function ClientNotificationsScreen() {
  const router = useRouter();
  const savedUser = getSavedUserData();
  const clientName = String(
    savedUser?.company || savedUser?.fullName || savedUser?.name || savedUser?.email || '',
  ).trim();
  const notificationOwner = String(savedUser?.email || savedUser?.id || clientName).trim().toLowerCase();
  const notificationReadStateKey = getClientNotificationReadKey(notificationOwner);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadNotifications = useCallback(async () => {
    setErrorMessage('');
    if (!clientName) {
      setNotifications([]);
      setErrorMessage('Your client profile could not be identified. Please sign in again.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const result = await fetchClientNotifications(clientName);
      setNotifications(result);
      // Opening this screen means the items currently displayed have been viewed.
      // Activity created after this fetch has a new ID and remains unread.
      markNotificationsRead(notificationReadStateKey, result.map((item) => item.id));
    } catch (error: any) {
      console.error('[ClientNotifications] Failed to load notifications:', error);
      setNotifications([]);
      setErrorMessage(
        error?.response?.data?.message ?? error?.response?.data?.error ??
        error?.message ?? 'Could not load notifications. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientName, notificationReadStateKey]);

  // Refresh every time the user opens or returns to the notifications screen.
  useFocusEffect(useCallback(() => {
    setLoading(true);
    void loadNotifications();
  }, [loadNotifications]));

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const openNotification = (item: NotificationItem) => {
    router.push({
      pathname: '/client-project-details',
      params: { contractId: item.contractId, projectId: item.projectId },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Updates from your projects</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh notifications"
        >
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconCircle}><Text style={styles.summaryBell}>🔔</Text></View>
          <View style={styles.summaryTextWrap}>
            <Text style={styles.summaryTitle}>Project activity</Text>
            <Text style={styles.summaryDescription}>
              {notifications.length === 1 ? '1 update' : `${notifications.length} updates`} recorded across your projects
            </Text>
          </View>
          <View style={styles.countPill}><Text style={styles.countText}>{notifications.length > 99 ? '99+' : notifications.length}</Text></View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>All notifications</Text>
          {!loading && !errorMessage && <Text style={styles.listCount}>{notifications.length} total</Text>}
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.stateText}>Loading your notifications…</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIconCircle}><Text style={styles.stateEmoji}>⚠️</Text></View>
            <Text style={styles.stateTitle}>Could not load notifications</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); loadNotifications(); }}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIconCircle}><Text style={styles.stateEmoji}>📭</Text></View>
            <Text style={styles.stateTitle}>You're all caught up</Text>
            <Text style={styles.stateText}>New project updates will appear here when activity is recorded.</Text>
          </View>
        ) : (
          <View style={styles.notificationList}>
            {notifications.map((item, index) => {
              const previous = notifications[index - 1];
              const groupLabel = formatDayGroup(item.createdAt);
              const showGroup = index === 0 || formatDayGroup(previous.createdAt) !== groupLabel;
              return (
                <React.Fragment key={item.id}>
                  {showGroup && <Text style={styles.groupLabel}>{groupLabel}</Text>}
                  <TouchableOpacity
                    style={styles.notificationCard}
                    activeOpacity={0.78}
                    onPress={() => openNotification(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}, ${item.projectTitle}. Open project details.`}
                  >
                    <View style={[styles.activityIcon, item.type === 'SUCCESS' ? styles.successIcon : item.type === 'WARNING' ? styles.warningIcon : styles.errorIcon]}>
                      <Text style={[styles.activitySymbol, item.type === 'SUCCESS' ? styles.successSymbol : item.type === 'WARNING' ? styles.warningSymbol : styles.errorSymbol]}>
                        {item.type === 'SUCCESS' ? '✓' : item.type === 'WARNING' ? '◷' : '!'}
                      </Text>
                    </View>
                    <View style={styles.notificationBody}>
                      <View style={styles.notificationTitleRow}>
                        <Text style={styles.notificationTitle}>{item.title}</Text>
                        <Text style={styles.chevron}>›</Text>
                      </View>
                      <Text style={styles.notificationDescription}>{item.description}</Text>
                      <View style={styles.metaRow}>
                        <View style={styles.projectDot} />
                        <Text style={styles.projectName} numberOfLines={1}>{item.projectTitle}</Text>
                      </View>
                      <Text style={styles.notificationDate}>
                        {[item.performedBy, formatDate(item.createdAt)].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        )}

        <Text style={styles.footerNote}>Notifications are generated from activity recorded by your project backend.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Theme.spacing.md,
    paddingVertical: 12, backgroundColor: Colors.background,
  },
  backButton: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: Colors.dark, fontSize: 32, lineHeight: 34, marginTop: -3 },
  headerTitles: { flex: 1, marginLeft: 12 },
  headerTitle: { color: Colors.dark, fontSize: 22, fontWeight: '800' },
  headerSubtitle: { color: Colors.neutralMedium, fontSize: 12, marginTop: 2 },
  refreshButton: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  refreshIcon: { fontSize: 25, color: Colors.primary, marginTop: -2 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Theme.spacing.md, paddingBottom: 32 },
  summaryCard: {
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
    borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 24,
  },
  summaryIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  summaryBell: { fontSize: 21 },
  summaryTextWrap: { flex: 1, marginLeft: 12 },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: '#166534' },
  summaryDescription: { fontSize: 12, color: '#4B5563', marginTop: 3 },
  countPill: { minWidth: 32, paddingHorizontal: 8, height: 28, borderRadius: 14, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  countText: { color: Colors.primaryDark, fontSize: 12, fontWeight: '800' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { color: Colors.dark, fontSize: 17, fontWeight: '800' },
  listCount: { color: Colors.neutralMedium, fontSize: 12 },
  notificationList: { gap: 0 },
  groupLabel: { color: Colors.neutralMedium, fontSize: 12, fontWeight: '800', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  notificationCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 13, marginBottom: 10,
    ...Theme.shadows.card,
  },
  activityIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 11, marginTop: 1 },
  successIcon: { backgroundColor: '#DCFCE7' },
  warningIcon: { backgroundColor: '#FEF3C7' },
  errorIcon: { backgroundColor: '#FEE2E2' },
  activitySymbol: { fontSize: 20, fontWeight: '800' },
  successSymbol: { color: '#16A34A' },
  warningSymbol: { color: '#D97706' },
  errorSymbol: { color: '#DC2626' },
  notificationBody: { flex: 1 },
  notificationTitleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  notificationTitle: { flex: 1, color: Colors.dark, fontSize: 14, lineHeight: 19, fontWeight: '800', paddingRight: 6 },
  chevron: { color: Colors.neutralLight, fontSize: 23, lineHeight: 23, marginTop: -4 },
  notificationDescription: { color: Colors.neutralMedium, fontSize: 12, lineHeight: 18, marginTop: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  projectDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginRight: 6 },
  projectName: { flex: 1, color: Colors.primaryDark, fontSize: 11, fontWeight: '700' },
  notificationDate: { color: Colors.neutralLight, fontSize: 10, marginTop: 6, lineHeight: 14 },
  stateCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 18,
    padding: 24, marginTop: 12, alignItems: 'center', justifyContent: 'center',
  },
  stateIconCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  stateEmoji: { fontSize: 24 },
  stateTitle: { color: Colors.dark, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  stateText: { color: Colors.neutralMedium, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  retryButton: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 16 },
  retryText: { color: Colors.surface, fontSize: 12, fontWeight: '800' },
  footerNote: { textAlign: 'center', color: Colors.neutralLight, fontSize: 10, lineHeight: 15, marginTop: 24, paddingHorizontal: 16 },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';
import { getCurrentUser, FreelancerApiService, clearApiCache } from '../../src/services/api';

interface NotificationCardItem {
  id: number | string;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeType: 'review' | 'open' | 'resolved' | 'escrow' | string;
  amount?: string;
  category: 'All' | 'Disputes' | 'Payments' | 'Projects' | string;
  actionUrl: string;
  actionLabel: string;
  unread: boolean;
  timestamp: string;
}

const FALLBACK_NOTIFICATIONS: NotificationCardItem[] = [
  {
    id: 5,
    title: 'E-Commerce Mobile App Redesign',
    subtitle: 'New contract offer from TechVentures Inc. • Signature Required',
    badgeText: 'New Contract',
    badgeType: 'contract',
    amount: '$8,500',
    category: 'Contracts',
    actionUrl: '/contract-details?id=C-101',
    actionLabel: 'View Contract & Sign',
    unread: true,
    timestamp: 'Just now',
  },
  {
    id: 1,
    title: 'E-Commerce Redesign',
    subtitle: 'Payment Delay • Filed Oct 10, 2024',
    badgeText: 'Under Review',
    badgeType: 'review',
    amount: '$2,400',
    category: 'Disputes',
    actionUrl: '/dispute-details?id=DSP-409',
    actionLabel: 'View Details & Discussion',
    unread: true,
    timestamp: '2 min ago',
  },
  {
    id: 2,
    title: 'Mobile App Contract',
    subtitle: 'Scope Disagreement • Filed Oct 12, 2024',
    badgeText: 'Open',
    badgeType: 'open',
    amount: '$3,800',
    category: 'Disputes',
    actionUrl: '/dispute-details?id=DSP-408',
    actionLabel: 'View Details & Discussion',
    unread: true,
    timestamp: '1 hr ago',
  },
  {
    id: 3,
    title: 'Logo & Brand Identity',
    subtitle: 'Milestone Discrepancy • Filed Sep 15, 2024',
    badgeText: 'Resolved',
    badgeType: 'resolved',
    amount: '$450',
    category: 'Disputes',
    actionUrl: '/dispute-details?id=DSP-401',
    actionLabel: 'View Details & Discussion',
    unread: false,
    timestamp: '1 day ago',
  },
  {
    id: 4,
    title: 'Brand Identity & Marketing Assets',
    subtitle: 'Milestone 1 Funded • Due Oct 05, 2024',
    badgeText: 'In Escrow',
    badgeType: 'escrow',
    amount: '$1,800',
    category: 'Payments',
    actionUrl: '/(tabs)/escrow',
    actionLabel: 'View Escrow Status',
    unread: false,
    timestamp: '3 days ago',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const isChathuni =
    currentUser?.email === 'chathuniimalsha.com' ||
    (currentUser?.fullName && currentUser.fullName.toLowerCase().includes('chathuni')) ||
    (currentUser?.email && currentUser.email.toLowerCase().includes('chathuni'));

  const [notifications, setNotifications] = useState<NotificationCardItem[]>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const u = getCurrentUser();
        const k = `notifications_list_FREELANCER_${u?.email || u?.fullName || 'default'}`;
        const s = localStorage.getItem(k);
        if (s) {
          const p = JSON.parse(s);
          if (Array.isArray(p)) return p.filter((item) => item.recipientRole === 'FREELANCER');
        }
      } catch (e) {}
    }
    return isChathuni ? FALLBACK_NOTIFICATIONS : [];
  });
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const activeName = currentUser?.fullName || (isChathuni ? 'Chathuni Imalsha' : '');
      const res = await FreelancerApiService.getNotifications(activeName, currentUser?.email, 'FREELANCER');
      const data = Array.isArray(res) ? res : (res?.data || []);
      const freelancerNotifications = Array.isArray(data)
        ? data.filter((item: NotificationCardItem & { recipientRole?: string }) => item.recipientRole === 'FREELANCER')
        : [];
      if (freelancerNotifications.length > 0) {
        setNotifications(freelancerNotifications);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          const k = `notifications_list_FREELANCER_${currentUser?.email || currentUser?.fullName || 'default'}`;
          localStorage.setItem(k, JSON.stringify(freelancerNotifications));
        }
      } else if (!isChathuni) {
        setNotifications([]);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          const k = `notifications_list_FREELANCER_${currentUser?.email || currentUser?.fullName || 'default'}`;
          localStorage.setItem(k, JSON.stringify([]));
        }
      }
    } catch {
      if (!isChathuni) {
        setNotifications([]);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          const k = `notifications_list_FREELANCER_${currentUser?.email || currentUser?.fullName || 'default'}`;
          localStorage.setItem(k, JSON.stringify([]));
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [currentUser?.email, currentUser?.fullName])
  );

  const onRefresh = () => {
    setRefreshing(true);
    clearApiCache();
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await FreelancerApiService.markAllNotificationsAsRead(
        currentUser?.email,
        currentUser?.fullName,
        'FREELANCER'
      );
    } catch {
      // offline state
    }
  };

  const handleCardClick = (item: NotificationCardItem) => {
    // Mark clicked notification as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    FreelancerApiService.markNotificationAsRead(
      item.id,
      currentUser?.email,
      currentUser?.fullName,
      'FREELANCER'
    ).catch(() => {});
    if (item.actionUrl) {
      router.push(item.actionUrl as any);
    } else {
      router.push({
        pathname: '/notification-details',
        params: { id: item.id.toString() },
      });
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Unread') return item.unread;
    return item.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        >
          {/* Top Header Bar with Centered Title & Back Button */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.replace('/(tabs)/dashboard')}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Section Title & Mark all Read Green Action Button */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Active Alerts ({unreadCount > 0 ? unreadCount : notifications.length})
            </Text>
            {unreadCount > 0 ? (
              <TouchableOpacity
                style={styles.markReadGreenBtn}
                onPress={handleMarkAllRead}
                activeOpacity={0.85}
              >
                <Text style={styles.markReadBtnText}>✓ Mark all read</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.allCaughtUpText}>All caught up</Text>
            )}
          </View>

          {/* Category Filter Chips Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
            contentContainerStyle={styles.filterChipsRow}
          >
            {['All', 'Unread', 'Contracts', 'Disputes', 'Payments'].map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Loading Indicator */}
          {loading && notifications.length === 0 ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            /* Notifications Cards List Matching the Exact Visual Card Design */
            <View style={styles.listContainer}>
              {filteredNotifications.length === 0 ? (
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12 }}>
                  <Text style={{ fontSize: 36, marginBottom: 12 }}>🔔</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 }}>
                    No Notifications
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 }}>
                    {activeCategory === 'All'
                      ? 'You have no alerts or notifications at this time.'
                      : `No notifications found under "${activeCategory}".`}
                  </Text>
                </View>
              ) : (
                filteredNotifications.map((item) => {
                const isReview = item.badgeType === 'review' || item.badgeText === 'Under Review';
                const isOpen = item.badgeType === 'open' || item.badgeText === 'Open';
                const isResolved = item.badgeType === 'resolved' || item.badgeText === 'Resolved';
                const isEscrow = item.badgeType === 'escrow' || item.badgeText === 'In Escrow';
                const isContract = item.badgeType === 'contract' || item.badgeText === 'New Contract';

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, item.unread && styles.cardUnread]}
                    onPress={() => handleCardClick(item)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.cardHeader}>
                      {/* Status Pill Badge */}
                      <View style={styles.badgeRow}>
                        {item.unread && <View style={styles.unreadDot} />}
                        <View
                          style={[
                            styles.statusBadge,
                            isContract
                              ? styles.badgeContract
                              : isReview
                              ? styles.badgeReview
                              : isOpen
                              ? styles.badgeOpen
                              : isResolved
                              ? styles.badgeResolved
                              : styles.badgeEscrow,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isContract
                                ? styles.textContract
                                : isReview
                                ? styles.textReview
                                : isOpen
                                ? styles.textOpen
                                : isResolved
                                ? styles.textResolved
                                : styles.textEscrow,
                            ]}
                          >
                            {item.badgeText}
                          </Text>
                        </View>
                      </View>

                      {/* Clean Timestamp (Prices Removed) */}
                      <Text style={styles.timeText}>{item.timestamp}</Text>
                    </View>

                    {/* Project / Notification Title */}
                    <Text style={styles.projectTitle}>{item.title}</Text>
                    <Text style={styles.subtitleText}>{item.subtitle}</Text>

                    <View style={styles.cardDivider} />

                    {/* View Details & Action Footer Link */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.footerLinkText}>
                        {item.actionLabel || 'View Details & Discussion'}
                      </Text>
                      <Text style={styles.footerArrow}>›</Text>
                    </View>
                  </TouchableOpacity>
                );
              }))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  wrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrow: {
    fontSize: 28,
    fontWeight: '400',
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  markReadGreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  markReadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  allCaughtUpText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterScrollView: {
    marginBottom: 18,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#16A34A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardUnread: {
    borderColor: '#86EFAC',
    backgroundColor: '#FAFCF9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeReview: {
    backgroundColor: '#FEF3C7',
  },
  textReview: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeOpen: {
    backgroundColor: '#FEE2E2',
  },
  textOpen: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeResolved: {
    backgroundColor: '#DCFCE7',
  },
  textResolved: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeEscrow: {
    backgroundColor: '#E0F2FE',
  },
  textEscrow: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeContract: {
    backgroundColor: '#EEF2FF',
  },
  textContract: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  projectTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
  },
  dotSeparator: {
    color: '#94A3B8',
    marginHorizontal: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 14,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  footerArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
  },
});

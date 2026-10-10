import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { getCurrentUser, FreelancerApiService } from '../src/services/api';
import { getSavedUserData } from '../src/services/authService';
import { getUserSession } from '../src/services/storage';
import ClientBottomTabBar from '../src/components/ClientBottomTabBar';

interface ClientNotification {
  id: number | string;
  title: string;
  subtitle?: string;
  message?: string;
  badgeText?: string;
  category?: string;
  actionUrl?: string;
  actionLabel?: string;
  type?: string;
  relatedEntityId?: string;
  unread: boolean;
  timestamp?: string;
  recipientRole?: string;
}

export default function ClientNotificationsScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser() || getSavedUserData();
  const session = getUserSession();
  const role = String(session?.role || currentUser?.role || '').toUpperCase();
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await FreelancerApiService.getNotifications(
        currentUser?.fullName || '',
        currentUser?.email || '',
        'CLIENT'
      );
      const result = Array.isArray(response.data) ? response.data : [];
      setNotifications(result.filter(
        (item: ClientNotification) => item.recipientRole === 'CLIENT'
      ));
    } catch (error) {
      console.warn('Failed to load client notifications:', error);
      Alert.alert('Notifications unavailable', 'Could not load client notifications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.email, currentUser?.fullName]);

  useFocusEffect(
    useCallback(() => {
      if (role !== 'CLIENT') {
        router.replace('/client-dashboard');
        return;
      }
      loadNotifications();
    }, [loadNotifications, role, router])
  );

  const markAllAsRead = async () => {
    try {
      await FreelancerApiService.markAllNotificationsAsRead(
        currentUser?.email,
        currentUser?.fullName,
        'CLIENT'
      );
      setNotifications((previous) => previous.map((item) => ({ ...item, unread: false })));
    } catch (error) {
      console.warn('Failed to mark client notifications as read:', error);
      Alert.alert('Update failed', 'Could not mark client notifications as read.');
    }
  };

  const openNotification = async (item: ClientNotification) => {
    if (item.unread) {
      try {
        await FreelancerApiService.markNotificationAsRead(
          item.id,
          currentUser?.email,
          currentUser?.fullName,
          'CLIENT'
        );
        setNotifications((previous) => previous.map((notification) =>
          notification.id === item.id ? { ...notification, unread: false } : notification
        ));
      } catch (error) {
        console.warn('Failed to mark client notification as read:', error);
        Alert.alert('Update failed', 'Could not mark this notification as read.');
        return;
      }
    }

    const isDisputeNotification = item.category?.toLowerCase() === 'disputes'
      || ['DISPUTE_CREATED', 'DISPUTE_MESSAGE', 'DISPUTE_STATUS_CHANGED'].includes(item.type || '');
    if (isDisputeNotification) {
      const actionId = item.actionUrl?.match(/[?&]id=([^&]+)/)?.[1];
      const disputeId = item.relatedEntityId || (actionId ? decodeURIComponent(actionId) : undefined);
      if (disputeId) {
        router.push(`/dispute-details?id=${encodeURIComponent(disputeId)}` as any);
      } else if (item.actionUrl) {
        router.push(item.actionUrl as any);
      }
    } else if (item.type === 'CONTRACT_SIGNED') {
      router.push('/client-contracts');
    } else if (item.actionUrl) {
      router.push(item.actionUrl as any);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back to client dashboard"
            style={styles.backButton}
            onPress={() => router.replace('/client-dashboard')}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Client Notifications</Text>
          <View style={styles.headerAction}>
            {notifications.some((item) => item.unread) && (
              <TouchableOpacity onPress={markAllAsRead}>
                <Text style={styles.markRead}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          <Text style={styles.sectionTitle}>
            {notifications.filter((item) => item.unread).length} unread
          </Text>

          {loading ? (
            <ActivityIndicator style={styles.loader} size="large" color={Colors.primary} />
          ) : notifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>You’re all caught up</Text>
              <Text style={styles.emptySubtitle}>
                Updates about your projects, contracts, and deliverables will appear here.
              </Text>
            </View>
          ) : (
            notifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                accessibilityRole="button"
                style={[styles.notificationCard, item.unread && styles.unreadCard]}
                onPress={() => openNotification(item)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeading}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  {item.unread && <View style={styles.unreadDot} />}
                </View>
                {!!item.badgeText && <Text style={styles.badge}>{item.badgeText}</Text>}
                {!!(item.subtitle || item.message) && (
                  <Text style={styles.description}>{item.subtitle || item.message}</Text>
                )}
                <View style={styles.cardFooter}>
                  <Text style={styles.timestamp}>{item.timestamp || item.category || 'Update'}</Text>
                  {!!item.actionLabel && <Text style={styles.actionLabel}>{item.actionLabel} ›</Text>}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <ClientBottomTabBar activeTab="home" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  page: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    minHeight: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 32,
    lineHeight: 36,
    color: '#111827',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  headerAction: {
    width: 96,
    alignItems: 'flex-end',
  },
  markRead: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 92,
  },
  sectionTitle: {
    marginBottom: 14,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  loader: {
    marginTop: 40,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  emptySubtitle: {
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    color: '#6B7280',
    fontSize: 13,
  },
  notificationCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 14,
  },
  unreadCard: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  notificationTitle: {
    flex: 1,
    marginRight: 10,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    color: '#111827',
  },
  unreadDot: {
    width: 9,
    height: 9,
    marginTop: 5,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#DCFCE7',
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    marginTop: 8,
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  timestamp: {
    color: '#6B7280',
    fontSize: 11,
  },
  actionLabel: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
});

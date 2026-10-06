import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../src/constants/colors';
import { FreelancerApiService } from '../src/services/api';

interface NotificationDetailData {
  id: number | string;
  title: string;
  subtitle?: string;
  message?: string;
  type?: string;
  badgeText?: string;
  badgeType?: string;
  amount?: string;
  category?: string;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntityId?: string;
  unread?: boolean;
  timestamp?: string;
  createdAt?: string;
}

const FALLBACK_DETAIL: NotificationDetailData = {
  id: '5',
  title: 'E-Commerce Mobile App Redesign',
  subtitle: 'New contract offer from TechVentures Inc. • Signature Required',
  message:
    'TechVentures Inc. has offered you a new fixed-price contract for "E-Commerce Mobile App Redesign" totaling $8,500 across 3 funded milestones. Review terms and accept to launch the project.',
  type: 'CONTRACT_RECEIVED',
  badgeText: 'New Contract',
  badgeType: 'contract',
  amount: '$8,500',
  category: 'Contracts',
  actionUrl: '/contract-details?id=C-101',
  actionLabel: 'View Contract & Sign',
  relatedEntityId: 'C-101',
  unread: false,
  timestamp: 'Just now',
};

export default function NotificationDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const notifId = (params.id as string) || '5';

  const [notification, setNotification] = useState<NotificationDetailData>(FALLBACK_DETAIL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificationDetails();
  }, [notifId]);

  const fetchNotificationDetails = async () => {
    try {
      const res = await FreelancerApiService.getNotification(notifId);
      if (res.data) {
        setNotification(res.data);
        // Automatically mark as read
        if (res.data.unread) {
          await FreelancerApiService.markNotificationAsRead(notifId);
        }
      }
    } catch {
      console.warn('Using offline fallback notification details');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = () => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
      return;
    }

    // Smart fallback routing based on type and relatedEntityId
    const entityId = notification.relatedEntityId;
    const type = notification.type?.toUpperCase() || '';

    if (type.includes('CONTRACT')) {
      router.push({
        pathname: '/contract-details',
        params: { id: entityId || 'C-101' },
      });
    } else if (type.includes('DISPUTE')) {
      router.push({
        pathname: '/dispute-details',
        params: { id: entityId || 'DSP-409' },
      });
    } else if (type.includes('DELIVERABLE') || type.includes('PROJECT') || type.includes('MILESTONE')) {
      router.push({
        pathname: '/project-details',
        params: { id: entityId || 'C-101' },
      });
    } else if (type.includes('PAYMENT') || type.includes('ESCROW')) {
      router.push('/(tabs)/escrow' as any);
    } else {
      router.push('/(tabs)/dashboard' as any);
    }
  };

  const getEntityRouteInfo = () => {
    const type = notification.type?.toUpperCase() || '';
    if (type.includes('CONTRACT')) {
      return { entityName: 'Contract', icon: '📄', id: notification.relatedEntityId || 'C-101' };
    }
    if (type.includes('DISPUTE')) {
      return { entityName: 'Dispute', icon: '⚖️', id: notification.relatedEntityId || 'DSP-409' };
    }
    if (type.includes('PROJECT') || type.includes('MILESTONE') || type.includes('DELIVERABLE')) {
      return { entityName: 'Project', icon: '📁', id: notification.relatedEntityId || 'PRJ-C-101' };
    }
    return { entityName: 'Payment Escrow', icon: '💳', id: notification.relatedEntityId || 'ESC-101' };
  };

  const entityInfo = getEntityRouteInfo();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrapper}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.replace('/(tabs)/notifications')}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notification Details</Text>
            <View style={{ width: 36 }} />
          </View>

          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              {/* Main Card */}
              <View style={styles.detailCard}>
                <View style={styles.badgeRow}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {notification.badgeText || notification.category || 'Alert'}
                    </Text>
                  </View>
                  <Text style={styles.timestampText}>{notification.timestamp || 'Just now'}</Text>
                </View>

                <Text style={styles.mainTitle}>{notification.title}</Text>
                {notification.subtitle ? (
                  <Text style={styles.subtitleText}>{notification.subtitle}</Text>
                ) : null}

                {notification.amount ? (
                  <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>Associated Amount</Text>
                    <Text style={styles.amountValue}>{notification.amount}</Text>
                  </View>
                ) : null}

                <View style={styles.divider} />

                {/* Message Body */}
                <Text style={styles.messageLabel}>Notification Message</Text>
                <Text style={styles.messageBody}>
                  {notification.message ||
                    notification.subtitle ||
                    'You have received an update regarding this transaction on your freelancer account.'}
                </Text>
              </View>

              {/* Related Entity Card */}
              <View style={styles.relatedEntityCard}>
                <View style={styles.relatedHeaderRow}>
                  <Text style={styles.relatedIcon}>{entityInfo.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.relatedHeading}>Related {entityInfo.entityName}</Text>
                    <Text style={styles.relatedIdText}>Reference ID: {entityInfo.id}</Text>
                  </View>
                </View>
                <Text style={styles.relatedDesc}>
                  This notification is linked directly to your {entityInfo.entityName.toLowerCase()}{' '}
                  records. Tap below to navigate directly to the details page.
                </Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={handleActionClick}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryActionBtnText}>
                  {notification.actionLabel || `View ${entityInfo.entityName}`}
                </Text>
                <Text style={styles.primaryActionBtnArrow}>→</Text>
              </TouchableOpacity>

              {/* Secondary Back Button */}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.replace('/(tabs)/notifications')}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>Back to Notifications</Text>
              </TouchableOpacity>
            </>
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
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  loaderBox: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  timestampText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 26,
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 20,
  },
  amountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  amountLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16A34A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },
  messageLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageBody: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 23,
    fontWeight: '400',
  },
  relatedEntityCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  relatedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  relatedIcon: {
    fontSize: 24,
  },
  relatedHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  relatedIdText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  relatedDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  primaryActionBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 12,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryActionBtnArrow: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});

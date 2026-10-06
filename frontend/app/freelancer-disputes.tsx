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
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';
import {
  HomeIcon,
  ProjectsIcon,
  PaymentsIcon,
  AlertsIcon,
  ProfileIcon,
} from '../src/components/Icons';

interface DisputeItem {
  id: string;
  dspNumber?: string;
  project: string;
  amount: number | string;
  issueType?: string;
  reason?: string;
  date?: string;
  filedDate?: string;
  status: string;
  statusType: 'review' | 'open' | 'resolved' | string;
}

const FALLBACK_DISPUTES: DisputeItem[] = [
  {
    id: 'DSP-409',
    project: 'E-Commerce Redesign',
    amount: '$2,400',
    reason: 'Payment Delay',
    date: 'Filed Oct 10, 2024',
    status: 'Under Review',
    statusType: 'review',
  },
  {
    id: 'DSP-408',
    project: 'Mobile App Contract',
    amount: '$3,800',
    reason: 'Scope Disagreement',
    date: 'Filed Oct 12, 2024',
    status: 'Open',
    statusType: 'open',
  },
  {
    id: 'DSP-401',
    project: 'Logo & Brand Identity',
    amount: '$450',
    reason: 'Milestone Discrepancy',
    date: 'Filed Sep 15, 2024',
    status: 'Resolved',
    statusType: 'resolved',
  },
];

export default function FreelancerDisputesScreen() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<DisputeItem[]>(FALLBACK_DISPUTES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDisputes = async () => {
    try {
      const res = await apiClient.get('/disputes');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const formatted: DisputeItem[] = res.data.map((d: any) => ({
          id: d.id || d.dspNumber,
          project: d.project,
          amount: typeof d.amount === 'number' ? `$${d.amount.toLocaleString()}` : (d.amount || '$0'),
          reason: d.issueType || d.reason || 'Payment Issue',
          date: d.filedDate || (d.createdAt ? `Filed ${new Date(d.createdAt).toLocaleDateString()}` : 'Filed Oct 10, 2024'),
          status: d.status || 'Under Review',
          statusType: d.statusType || (d.status === 'Resolved' ? 'resolved' : d.status === 'Open' ? 'open' : 'review'),
        }));
        setDisputes(formatted);
      }
    } catch {
      console.warn('Using offline disputes data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDisputes();
  };

  const handleOpenDetails = (disputeId: string) => {
    router.push({
      pathname: '/dispute-details',
      params: { id: disputeId },
    });
  };

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
            <Text style={styles.headerTitle}>Disputes</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Section Title & Create Disputes Action Button */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Active Disputes ({disputes.filter((d) => d.status !== 'Resolved').length || disputes.length})
            </Text>
            <TouchableOpacity
              style={styles.createDisputeGreenBtn}
              onPress={() => router.push('/create-dispute')}
              activeOpacity={0.85}
            >
              <Text style={styles.createBtnPlus}>+</Text>
              <Text style={styles.createBtnText}>Create Dispute</Text>
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {loading && disputes.length === 0 ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            /* Disputes Cards List Matching Screenshot 1 */
            <View style={styles.listContainer}>
              {disputes.map((item) => {
                const isReview = item.statusType === 'review' || item.status === 'Under Review';
                const isOpen = item.statusType === 'open' || item.status === 'Open';
                const isResolved = item.statusType === 'resolved' || item.status === 'Resolved';

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    onPress={() => handleOpenDetails(item.id)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.cardHeader}>
                      {/* Status Pill Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          isReview ? styles.badgeReview : isOpen ? styles.badgeOpen : styles.badgeResolved,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isReview ? styles.textReview : isOpen ? styles.textOpen : styles.textResolved,
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>

                      {/* Amount */}
                      <Text style={styles.amountText}>{item.amount}</Text>
                    </View>

                    {/* Project Title & Subtitle */}
                    <Text style={styles.projectTitle}>{item.project}</Text>
                    <Text style={styles.subtitleText}>
                      {item.reason} <Text style={styles.dotSeparator}>•</Text> {item.date}
                    </Text>

                    <View style={styles.cardDivider} />

                    {/* View Details & Discussion Footer Link */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.footerLinkText}>View Details & Discussion</Text>
                      <Text style={styles.footerArrow}>›</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomTabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/dashboard')}>
            <HomeIcon size={20} color="#16A34A" focused={true} />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/contracts')}>
            <ProjectsIcon size={20} color="#64748B" />
            <Text style={styles.tabLabel}>Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/escrow')}>
            <PaymentsIcon size={20} color="#64748B" />
            <Text style={styles.tabLabel}>Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/notifications')}>
            <AlertsIcon size={20} color="#64748B" />
            <Text style={styles.tabLabel}>Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(tabs)/profile')}>
            <ProfileIcon size={20} color="#64748B" />
            <Text style={styles.tabLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 90,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  createDisputeGreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  createBtnPlus: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
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
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#16A34A',
    fontWeight: '700',
  },
});

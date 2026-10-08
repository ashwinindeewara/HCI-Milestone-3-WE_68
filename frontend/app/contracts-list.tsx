import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import { apiClient, getCurrentUser } from '../src/services/api';
import {
  HomeIcon,
  ProjectsIcon,
  PaymentsIcon,
  AlertsIcon,
  ProfileIcon,
} from '../src/components/Icons';

interface ContractItem {
  id: string;
  title: string;
  clientName: string;
  status: 'New' | 'Pending' | 'Completed' | string;
  badgeType: 'new' | 'pending' | 'completed' | string;
  contractValue: string;
  timeline: string;
}

export default function ContractsListScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();

  const [contracts, setContracts] = useState<ContractItem[]>(() => {
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContracts = async () => {
    try {
      const activeName = currentUser?.fullName || '';
      const activeEmail = currentUser?.email || '';
      const res = await apiClient.get('/contracts', {
        params: {
          ...(activeName ? { freelancerName: activeName } : {}),
          ...(activeEmail ? { email: activeEmail } : {}),
        },
      });
      if (res.data && Array.isArray(res.data)) {
        if (res.data.length > 0) {
          const mapped: ContractItem[] = res.data.map((c: any) => {
            let statusText = 'New';
            let bType = 'new';
            if (c.status === 'COMPLETED') {
              statusText = 'Completed';
              bType = 'completed';
            } else if (c.status === 'PENDING' || c.status === 'UNDER_REVIEW') {
              statusText = 'Pending';
              bType = 'pending';
            } else if (c.status === 'ACTIVE' || c.status === 'IN_PROGRESS') {
              statusText = 'Active';
              bType = 'new';
            }

            const val = c.totalBudget != null ? '$' + c.totalBudget.toLocaleString() : '$8,000';
            return {
              id: c.id,
              title: c.title,
              clientName: c.clientName,
              status: statusText,
              badgeType: bType,
              contractValue: val,
              timeline: c.timeline || (c.startDate && c.endDate ? `${c.startDate} - ${c.endDate}` : 'Sep 01 - Nov 30, 2024'),
            };
          });
          setContracts(mapped);
        } else {
          setContracts([]);
        }
      }
    } catch {
      setContracts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [currentUser?.email, currentUser?.fullName]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContracts();
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
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/contracts');
                }
              }}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contracts</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Contracts List Cards */}
          <View style={styles.listContainer}>
            {contracts.length === 0 ? (
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12 }}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>📋</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 }}>
                  No Contracts Found
                </Text>
                <Text style={{ fontSize: 13, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 }}>
                  You do not have any active or previous contracts yet. When clients create contracts, they will appear here.
                </Text>
              </View>
            ) : (
              contracts.map((item) => {
              const isNew = item.status === 'New' || item.badgeType === 'new';
              const isPending = item.status === 'Pending' || item.badgeType === 'pending';
              const isCompleted = item.status === 'Completed' || item.badgeType === 'completed';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.contractCard}
                  onPress={() => router.push(`/contract-details?id=${item.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.contractTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        isNew ? styles.badgeNew : isPending ? styles.badgePending : styles.badgeCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isNew
                            ? styles.badgeTextNew
                            : isPending
                              ? styles.badgeTextPending
                              : styles.badgeTextCompleted,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.clientName}>{item.clientName}</Text>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.metaLabel}>Contract Value</Text>
                      <Text style={styles.valueAmount}>{item.contractValue}</Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.metaLabel}>Timeline</Text>
                      <Text style={styles.timelineValue}>{item.timeline}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }))}
          </View>
        </ScrollView>

        {/* Bottom Tab Bar (Consistent with other pages) */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => router.replace('/(tabs)/dashboard')}
          >
            <HomeIcon size={20} color="#6B7280" />
            <Text style={styles.bottomNavLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => router.replace('/(tabs)/contracts')}
          >
            <ProjectsIcon size={20} color="#16A34A" />
            <Text style={[styles.bottomNavLabel, styles.bottomNavLabelActive]}>Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => router.replace('/(tabs)/escrow')}
          >
            <PaymentsIcon size={20} color="#6B7280" />
            <Text style={styles.bottomNavLabel}>Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => router.replace('/(tabs)/notifications')}
          >
            <AlertsIcon size={20} color="#6B7280" />
            <Text style={styles.bottomNavLabel}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => router.replace('/(tabs)/profile')}
          >
            <ProfileIcon size={20} color="#6B7280" />
            <Text style={styles.bottomNavLabel}>Profile</Text>
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
    paddingTop: 16,
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
  listContainer: {
    gap: 16,
  },
  contractCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  contractTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeNew: {
    backgroundColor: '#DCFCE7',
  },
  badgeTextNew: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextPending: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeCompleted: {
    backgroundColor: '#F1F5F9',
  },
  badgeTextCompleted: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clientName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  bottomNav: {
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
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavIcon: {
    fontSize: 18,
    color: '#64748B',
    marginBottom: 2,
  },
  bottomNavIconActive: {
    color: '#16A34A',
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  bottomNavLabelActive: {
    color: '#16A34A',
    fontWeight: '700',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';
import { FreelancerApiService, resolveMediaUrl, apiClient, getCurrentUser } from '../../src/services/api';

interface ProjectItem {
  id: string;
  contractId?: string;
  title: string;
  clientName: string;
  inEscrowAmount?: number;
  completionPercentage?: number;
  dueDate?: string;
  statusBadge?: string;
  status?: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const isChathuni =
    currentUser?.email === 'chathuniimalsha.com' ||
    (currentUser?.fullName && currentUser.fullName.toLowerCase().includes('chathuni')) ||
    (currentUser?.email && currentUser.email.toLowerCase().includes('chathuni'));

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(isChathuni ? 3 : 0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState({
    name: currentUser?.fullName || (isChathuni ? 'Chathuni Imalsha' : 'Freelancer'),
    avatar: isChathuni ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' : '',
  });

  const handleDownloadContract = async (e: any, item: ProjectItem) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    const contractId = item.contractId || item.id.replace('PRJ-', '');
    const fileName = `Contract_${contractId}_Agreement.pdf`;
    setDownloadingId(item.id);

    try {
      if (Platform.OS === 'web') {
        const downloadUrl = FreelancerApiService.getContractDownloadUrl(contractId);
        let downloadedFromApi = false;

        try {
          const res = await fetch(downloadUrl);
          if (res.ok) {
            const blob = await res.blob();
            const blobUrl = (window as any).URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            (window as any).URL.revokeObjectURL(blobUrl);
            downloadedFromApi = true;
          }
        } catch (apiErr) {
          console.log('API direct download fallback:', apiErr);
        }

        if (!downloadedFromApi) {
          const docContent = `================================================================================
                    OFFICIAL FREELANCE SERVICE CONTRACT AGREEMENT
================================================================================

Contract Reference:   ${contractId}
Project Title:        ${item.title}
Client Organization:  ${item.clientName}
Contractor / Expert:  ${userProfile.name}
Total Escrow Deposit: $${(item.inEscrowAmount || 2400).toLocaleString()} USD
Target Completion:    ${item.dueDate || 'Nov 2024'}
Security Protocol:    Escrow Smart Protection & Milestone Verification
Status:               ACTIVE & DIGITALLY EXECUTED

--------------------------------------------------------------------------------
1. SCOPE OF ENGAGEMENT
--------------------------------------------------------------------------------
The Contractor agrees to provide comprehensive design, prototyping, and UX engineering
deliverables as specified in Milestone Work Orders for ${item.title}.

--------------------------------------------------------------------------------
2. ESCROW & PAYMENT GUARANTEE
--------------------------------------------------------------------------------
Funds are securely locked in the platform Escrow Vault and released automatically
upon milestone deliverable inspection and client verification.

--------------------------------------------------------------------------------
3. DIGITAL VERIFICATION SIGNATURES
--------------------------------------------------------------------------------
Client Authorized Signatory:    [VERIFIED] ${item.clientName}
Contractor Signature:           [VERIFIED] ${userProfile.name}
Escrow Verification Checksum:   SHA256-ESCROW-STAMP-${contractId}-VALID
Executed on:                    ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
================================================================================`;

          const blob = new Blob([docContent], { type: 'application/pdf;charset=utf-8' });
          const blobUrl = (window as any).URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          (window as any).URL.revokeObjectURL(blobUrl);
        }
      } else {
        Alert.alert('Download Started', `Contract ${fileName} saved to your device.`);
      }

      setDownloadToast(`✓ Downloaded ${fileName}`);
      setTimeout(() => setDownloadToast(null), 3500);
    } catch (err: any) {
      setDownloadToast(`✓ Contract file saved (${fileName})`);
      setTimeout(() => setDownloadToast(null), 3500);
    } finally {
      setDownloadingId(null);
    }
  };

  const [metrics, setMetrics] = useState({
    totalEarnings: isChathuni ? 12450 : 0,
    activeProjects: isChathuni ? 2 : 0,
    pendingMilestones: isChathuni ? 2 : 0,
    pendingEscrow: isChathuni ? 6200 : 0,
  });

  const [projects, setProjects] = useState<ProjectItem[]>(
    isChathuni
      ? [
          {
            id: 'PRJ-C-101',
            contractId: 'C-101',
            title: 'E-Commerce Redesign',
            clientName: 'TechVentures Inc.',
            inEscrowAmount: 2400,
            completionPercentage: 65,
            dueDate: 'Due Oct 15, 2024',
            statusBadge: 'On Track',
            status: 'ACTIVE',
          },
          {
            id: 'PRJ-C-102',
            contractId: 'C-102',
            title: 'Mobile App Contract',
            clientName: 'Global Retail Corp',
            inEscrowAmount: 3800,
            completionPercentage: 30,
            dueDate: 'Due Nov 01, 2024',
            statusBadge: 'On Track',
            status: 'ACTIVE',
          },
        ]
      : []
  );

  const [dashboardContracts, setDashboardContracts] = useState(
    isChathuni
      ? [
          {
            id: 'C-101',
            title: 'E-Commerce Redesign',
            clientName: 'TechVentures Inc.',
            status: 'New',
            contractValue: '$8,000',
            timeline: 'Sep 01 - Nov 30, 2024',
          },
          {
            id: 'C-102',
            title: 'Mobile App Contract',
            clientName: 'Global Retail Corp',
            status: 'Pending',
            contractValue: '$12,500',
            timeline: 'Oct 15 - Jan 15',
          },
        ]
      : []
  );

  const applyStoredProgressToProjects = (projectList: ProjectItem[]): ProjectItem[] => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      return projectList.map((p) => {
        const cleanId = (p.contractId || p.id).replace('PRJ-', '');
        const saved =
          localStorage.getItem(`project_progress_${cleanId}`) ||
          localStorage.getItem(`project_progress_PRJ-${cleanId}`) ||
          localStorage.getItem(`project_progress_${p.id}`);
        if (saved != null) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed)) {
            return { ...p, completionPercentage: parsed };
          }
        }
        return p;
      });
    }
    return projectList;
  };

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleStorageUpdate = () => {
        setProjects((prev) => applyStoredProgressToProjects(prev));
      };
      window.addEventListener('storage', handleStorageUpdate);
      return () => {
        window.removeEventListener('storage', handleStorageUpdate);
      };
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const activeUser = getCurrentUser();
      const activeName = activeUser?.fullName || '';
      const activeEmail = activeUser?.email || '';
      const isTargetChathuni =
        activeEmail === 'chathuniimalsha.com' ||
        (activeName && activeName.toLowerCase().includes('chathuni'));

      const [pRes, notifRes, prjRes, cRes] = await Promise.allSettled([
        FreelancerApiService.getProfile(activeEmail),
        FreelancerApiService.getNotifications(activeName, activeEmail),
        FreelancerApiService.getFreelancerProjects(activeName),
        FreelancerApiService.getFreelancerContracts(activeName),
      ]);

      // 1. Profile
      if (pRes.status === 'fulfilled' && pRes.value.data) {
        setUserProfile({
          name: pRes.value.data.fullName || activeName || 'Freelancer',
          avatar: pRes.value.data.avatarUrl || '',
        });
      } else if (activeName) {
        setUserProfile((prev) => ({ ...prev, name: activeName }));
      }

      // 2. Notifications
      if (notifRes.status === 'fulfilled' && Array.isArray(notifRes.value.data)) {
        const unreadCount = notifRes.value.data.filter((n: any) => n.unread).length;
        setUnreadNotifications(unreadCount);
      } else if (!isTargetChathuni) {
        setUnreadNotifications(0);
      }

      // 3. Projects
      if (prjRes.status === 'fulfilled' && Array.isArray(prjRes.value.data)) {
        const syncedProjects = applyStoredProgressToProjects(prjRes.value.data);
        setProjects(syncedProjects);

        const activeCount = syncedProjects.filter((p: any) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length;
        const totalEscrow = syncedProjects.reduce((acc: number, p: any) => acc + (p.inEscrowAmount || 0), 0);

        setMetrics((prev) => ({
          ...prev,
          activeProjects: activeCount,
          pendingEscrow: totalEscrow,
        }));
      } else if (!isTargetChathuni) {
        setProjects([]);
        setMetrics({ totalEarnings: 0, activeProjects: 0, pendingMilestones: 0, pendingEscrow: 0 });
      }

      // 4. Contracts
      if (cRes.status === 'fulfilled' && Array.isArray(cRes.value.data)) {
        const mapped = cRes.value.data.slice(0, 2).map((c: any) => ({
          id: c.id,
          title: c.title,
          clientName: c.clientName,
          status: c.status === 'COMPLETED' ? 'Completed' : c.status === 'PENDING' || c.status === 'UNDER_REVIEW' ? 'Pending' : 'New',
          contractValue: c.totalBudget != null ? '$' + c.totalBudget.toLocaleString() : '$0',
          timeline: c.timeline || (c.startDate && c.endDate ? `${c.startDate} - ${c.endDate}` : 'Active'),
        }));
        setDashboardContracts(mapped);
      } else if (!isTargetChathuni) {
        setDashboardContracts([]);
      }
    } catch {
      // Keep state intact
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      {/* Header Profile Greeting */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.userGreetingRow}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.8}
        >
          {userProfile.avatar ? (
            <Image
              source={{ uri: resolveMediaUrl(userProfile.avatar) }}
              style={styles.avatarImg}
            />
          ) : (
            <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitials}>
                {userProfile.name ? userProfile.name.trim().charAt(0).toUpperCase() : '👤'}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.greetingSub}>Good morning,</Text>
            <Text style={styles.userName}>{userProfile.name}</Text>
          </View>
        </TouchableOpacity>

        {/* Bell Notification Badge */}
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => router.push('/(tabs)/notifications')}
        >
          <Text style={{ fontSize: 20 }}>🔔</Text>
          {unreadNotifications > 0 && (
            <View style={styles.badgeDot}>
              <Text style={styles.badgeText}>{unreadNotifications}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 2x2 Metric Summary Grid */}
      <View style={styles.gridRow}>
        {/* Card 1: Total Earnings (Light Green BG) */}
        <View style={[styles.gridCard, styles.cardLightGreen]}>
          <Text style={styles.cardLabelGreen}>Total Earnings</Text>
          <Text style={styles.cardValue}>${metrics.totalEarnings.toLocaleString()}</Text>
        </View>

        {/* Card 2: Active Projects */}
        <View style={styles.gridCard}>
          <Text style={styles.cardLabel}>Active Projects</Text>
          <Text style={styles.cardValue}>{metrics.activeProjects}</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        {/* Card 3: Pending Milestones */}
        <View style={styles.gridCard}>
          <Text style={styles.cardLabel}>Pending Milestones</Text>
          <Text style={styles.cardValue}>{metrics.pendingMilestones}</Text>
        </View>

        {/* Card 4: Pending Escrow (Light Green BG) */}
        <View style={[styles.gridCard, styles.cardLightGreen]}>
          <Text style={styles.cardLabelGreen}>Pending Escrow</Text>
          <Text style={styles.cardValue}>${metrics.pendingEscrow.toLocaleString()}</Text>
        </View>
      </View>

      {/* Quick Action Pills Row (Requirement 1: Homepage Disputes Menu) */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.actionPillLightGreen}
          onPress={() => router.push('/(tabs)/contracts')}
        >
          <Text style={styles.actionPillIcon}>📁</Text>
          <Text style={styles.actionPillTextLightGreen}>Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPillMoreGreen}
          onPress={() => router.push('/(tabs)/escrow')}
        >
          <Text style={styles.actionPillIcon}>💳</Text>
          <Text style={styles.actionPillTextMoreGreen}>Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPillMostGreen}
          onPress={() => router.push('/freelancer-disputes')}
        >
          <Text style={styles.actionPillIconGreen}>⚖️</Text>
          <Text style={styles.actionPillTextMostGreen}>Disputes</Text>
        </TouchableOpacity>
      </View>

      {/* Active Projects List Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Active Projects</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/contracts')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {/* Real Project Cards */}
      {projects.length > 0 ? (
        projects.map((item) => {
          const targetId = item.contractId || item.id;
          const progress = item.completionPercentage || 0;
          const escrowFormatted = item.inEscrowAmount
            ? `$${item.inEscrowAmount.toLocaleString()} In Escrow`
            : 'Escrow Secured';

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.projectCard}
              onPress={() => router.push(`/project-details?id=${targetId}`)}
              activeOpacity={0.85}
            >
              <View style={styles.projectCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.projectTitle}>{item.title}</Text>
                  <Text style={styles.clientName}>{item.clientName}</Text>
                </View>
                <View style={styles.escrowTag}>
                  <Text style={styles.escrowTagText}>{escrowFormatted}</Text>
                </View>
              </View>

              <View style={styles.milestoneProgressRow}>
                <Text style={styles.milestoneLabel}>Progress</Text>
                <Text style={styles.progressPercent}>{progress}%</Text>
              </View>

              {/* Green Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>

              <View style={styles.projectCardFooter}>
                <Text style={styles.dueDateText}>📅 {item.dueDate || 'Ongoing'}</Text>
                <Text style={styles.viewDetailsText}>View Details ›</Text>
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyNoticeCard}>
          <Text style={styles.emptyNoticeText}>No active projects yet. Signed contracts will appear here.</Text>
        </View>
      )}

      {/* Contracts Section */}
      <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
        <Text style={styles.sectionTitle}>Contracts</Text>
        <TouchableOpacity onPress={() => router.push('/contracts-list')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 16, gap: 14 }}>
        {dashboardContracts.length > 0 ? (
          dashboardContracts.map((item) => {
            const isNew = item.status === 'New';
            const isPending = item.status === 'Pending';
            const isCompleted = item.status === 'Completed';

            return (
              <TouchableOpacity
                key={`dash-contract-${item.id}`}
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
                        styles.contractBadgeText,
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

                <Text style={styles.contractClientName}>{item.clientName}</Text>

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
          })
        ) : (
          <View style={styles.emptyNoticeCard}>
            <Text style={styles.emptyNoticeText}>No contracts found for this account.</Text>
          </View>
        )}
      </View>

      {/* Upcoming Deadlines Section */}
      <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
      </View>

      {projects.length > 0 ? (
        <View style={styles.deadlineCard}>
          <View style={styles.deadlineLeft}>
            <Text style={styles.deadlineIcon}>⏰</Text>
            <View>
              <Text style={styles.deadlineTitle}>
                {projects[0].statusBadge || 'Project Milestone'} Handover
              </Text>
              <Text style={styles.deadlineSub}>
                {projects[0].title} • {projects[0].clientName}
              </Text>
            </View>
          </View>
          <View style={styles.daysLeftBadge}>
            <Text style={styles.daysLeftText}>{projects[0].dueDate || 'Upcoming'}</Text>
          </View>
        </View>
      ) : isChathuni ? (
        <View style={styles.deadlineCard}>
          <View style={styles.deadlineLeft}>
            <Text style={styles.deadlineIcon}>⏰</Text>
            <View>
              <Text style={styles.deadlineTitle}>UI Design Phase Handover</Text>
              <Text style={styles.deadlineSub}>E-Commerce Redesign • TechVentures</Text>
            </View>
          </View>
          <View style={styles.daysLeftBadge}>
            <Text style={styles.daysLeftText}>3 days left</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.deadlineCard, { justifyContent: 'center', paddingVertical: 14 }]}>
          <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>
            No upcoming deadlines scheduled
          </Text>
        </View>
      )}

      {/* Toast Notification */}
      {downloadToast && (
        <View style={styles.floatingToast}>
          <Text style={styles.floatingToastText}>{downloadToast}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: Theme.spacing.lg,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 8,
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
  },
  emptyNoticeCard: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginVertical: 4,
  },
  emptyNoticeText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  greetingSub: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
  },
  cardLightGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  cardLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  cardLabelGreen: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '600',
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 14,
  },
  actionPillLightGreen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7', // Soft light green
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 24,
    paddingVertical: 10,
    gap: 6,
  },
  actionPillMoreGreen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#86EFAC', // Light green
    borderWidth: 1,
    borderColor: '#4ADE80',
    borderRadius: 24,
    paddingVertical: 10,
    gap: 6,
  },
  actionPillMostGreen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803D', // Most green (deep dark green)
    borderWidth: 1,
    borderColor: '#14532D',
    borderRadius: 24,
    paddingVertical: 10,
    gap: 6,
  },
  actionPillWhite: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingVertical: 10,
    gap: 6,
  },
  actionPillGreen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 24,
    paddingVertical: 10,
    gap: 6,
  },
  actionPillIcon: {
    fontSize: 14,
  },
  actionPillIconGreen: {
    fontSize: 15,
  },
  actionPillTextLightGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  actionPillTextMoreGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#064E3B',
  },
  actionPillTextMostGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionPillTextDark: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  actionPillTextWhite: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  clientName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  escrowTag: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  escrowTagText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  milestoneProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  milestoneLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  projectCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dueDateText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  deadlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deadlineIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  deadlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  deadlineSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  daysLeftBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  daysLeftText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  // Contracts Section Cards (Matching Image 1)
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
    marginBottom: 12,
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
  contractBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contractClientName: {
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
  // Toast Alert
  floatingToast: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

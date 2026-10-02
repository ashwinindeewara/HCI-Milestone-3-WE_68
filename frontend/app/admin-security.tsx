import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';

export default function AdminSecurityScreen() {
  const router = useRouter();

  const alerts = [
    {
      id: '1',
      title: 'IP Mismatch',
      user: 'Chathuni (Freelancer)',
      target: '#TXN-2847',
      time: '2 min ago',
      severity: 'High',
      severityType: 'high',
    },
    {
      id: '2',
      title: 'Suspicious Large Escrow',
      user: 'Ruwan (Client)',
      target: '#TXN-2831',
      time: '1 hour ago',
      severity: 'Medium',
      severityType: 'medium',
    },
    {
      id: '3',
      title: 'Rapid Email Change',
      user: 'Akila (Client)',
      target: 'Account Lock triggered',
      time: '3 hours ago',
      severity: 'High',
      severityType: 'high',
    },
  ];

  const handleReviewAlert = (title: string, user: string) => {
    Alert.alert('Security Review', `Reviewing audit log for ${title} (${user})`, [
      { text: 'Dismiss Alert', style: 'cancel' },
      {
        text: 'Lock Account',
        style: 'destructive',
        onPress: () => Alert.alert('Account Locked', `Security freeze applied for ${user}.`),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Top Back Link & Title */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Security & Fraud</Text>

        {/* System SECURE Banner (Matching Screenshot 5) */}
        <View style={styles.secureCard}>
          <View style={styles.secureIconBox}>
            <Text style={{ fontSize: 18 }}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.secureTitle}>System: SECURE</Text>
            <Text style={styles.secureSub}>
              Platform firewall & card authorization stable
            </Text>
          </View>
        </View>

        {/* Critical Alerts Section */}
        <Text style={styles.sectionTitle}>CRITICAL ALERTS (3)</Text>

        <View style={styles.alertsList}>
          {alerts.map((item) => (
            <View key={item.id} style={styles.alertCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.titleRow}>
                  <View style={styles.redDot} />
                  <Text style={styles.alertTitle}>{item.title}</Text>
                </View>

                <View
                  style={[
                    styles.severityBadge,
                    item.severityType === 'high' ? styles.badgeHigh : styles.badgeMedium,
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      item.severityType === 'high' ? styles.textHigh : styles.textMedium,
                    ]}
                  >
                    {item.severity}
                  </Text>
                </View>
              </View>

              <Text style={styles.userText}>User: {item.user}</Text>
              <Text style={styles.targetText}>Target: {item.target}</Text>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooter}>
                <Text style={styles.timeText}>{item.time}</Text>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => handleReviewAlert(item.title, item.user)}
                >
                  <Text style={styles.reviewText}>Review</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Admin Bottom Navigation Bar */}
      <View style={styles.adminTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-dashboard')}>
          <Text style={styles.tabIcon}>🎛️</Text>
          <Text style={styles.tabLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-users')}>
          <Text style={styles.tabIcon}>👥</Text>
          <Text style={styles.tabLabel}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-transactions')}>
          <Text style={styles.tabIcon}>💵</Text>
          <Text style={styles.tabLabel}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-disputes')}>
          <Text style={styles.tabIcon}>⚠️</Text>
          <Text style={styles.tabLabel}>Disputes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin-security')}>
          <Text style={[styles.tabIcon, styles.tabIconActive]}>•••</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: { flex: 1 },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: 80,
  },
  backBtn: { marginBottom: Theme.spacing.xs },
  backText: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: Theme.spacing.md,
  },
  secureCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  secureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  secureTitle: { fontSize: 15, fontWeight: '800', color: Colors.primaryDark },
  secureSub: { fontSize: 11, color: Colors.neutralMedium, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.neutralMedium,
    letterSpacing: 0.5,
    marginBottom: Theme.spacing.md,
  },
  alertsList: { gap: Theme.spacing.md },
  alertCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  alertTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  severityText: { fontSize: 10, fontWeight: '700' },
  badgeHigh: { backgroundColor: '#FEE2E2' },
  textHigh: { color: Colors.errorText, fontSize: 10, fontWeight: '700' },
  badgeMedium: { backgroundColor: '#FEF3C7' },
  textMedium: { color: Colors.warningText, fontSize: 10, fontWeight: '700' },
  userText: { fontSize: 12, color: Colors.neutralMedium, marginTop: 2 },
  targetText: { fontSize: 12, color: Colors.neutralMedium, marginTop: 2 },
  cardDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Theme.spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { fontSize: 12, color: Colors.neutralLight },
  reviewBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  reviewText: { fontSize: 12, fontWeight: '700', color: Colors.dark },
  adminTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 18, opacity: 0.6 },
  tabIconActive: { opacity: 1, transform: [{ scale: 1.1 }] },
  tabLabel: { fontSize: 10, fontWeight: '600', color: Colors.neutralMedium, marginTop: 2 },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
});

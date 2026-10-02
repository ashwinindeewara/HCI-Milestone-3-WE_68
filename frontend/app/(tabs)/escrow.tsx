import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';

export default function EscrowScreen() {
  const [activeFilter, setActiveFilter] = useState('ALL');

  const history = [
    {
      id: '1',
      title: 'E-Commerce Redesign',
      sub: 'UI Design Phase',
      date: 'Oct 12, 2024',
      amount: '$3,150.00',
      status: 'In Escrow',
    },
    {
      id: '2',
      title: 'Mobile App Contract',
      sub: 'API Specifications',
      date: 'Oct 01, 2024',
      amount: '$4,000.00',
      status: 'Released',
    },
    {
      id: '3',
      title: 'E-Commerce Redesign',
      sub: 'UX Wireframes',
      date: 'Sep 28, 2024',
      amount: '$1,260.00',
      status: 'Released',
    },
    {
      id: '4',
      title: 'Consulting Agreement',
      sub: 'Initial Audit',
      date: 'Sep 15, 2024',
      amount: '$6,800.00',
      status: 'Released',
    },
  ];

  const handleItemPress = (item: (typeof history)[0]) => {
    if (item.status === 'In Escrow') {
      Alert.alert(
        'Escrow Milestone',
        `Milestone "${item.sub}" for ${item.title} has $${item.amount} secured in platform escrow.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Release Payment',
            onPress: () => Alert.alert('Payment Released', `$${item.amount} transferred to freelancer.`),
          },
        ]
      );
    } else {
      Alert.alert('Payment Settled', `Transaction ${item.amount} was released on ${item.date}.`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Title Header */}
      <Text style={styles.headerTitle}>Payments</Text>

      {/* Hero Capital Deployed Card (Matching Screenshot 4) */}
      <View style={styles.heroCard}>
        <Text style={styles.heroSubTitle}>TOTAL CAPITAL DEPLOYED</Text>
        <Text style={styles.heroAmount}>$15,200.00</Text>
      </View>

      {/* Sub Metrics Grid: In Escrow vs Released */}
      <View style={styles.gridRow}>
        <View style={styles.gridCard}>
          <Text style={styles.gridLabel}>In Escrow</Text>
          <Text style={styles.gridValueDark}>$5,400</Text>
        </View>

        <View style={styles.gridCard}>
          <Text style={styles.gridLabel}>Released</Text>
          <Text style={styles.gridValueGreen}>$9,800</Text>
        </View>
      </View>

      {/* Payment History Ledger */}
      <Text style={styles.sectionTitle}>Payment History</Text>

      <View style={styles.historyList}>
        {history.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.historyCard}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub}>{item.sub}</Text>
              <Text style={styles.itemDate}>{item.date}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.itemAmount}>{item.amount}</Text>

              <View
                style={[
                  styles.badge,
                  item.status === 'In Escrow' ? styles.badgeEscrow : styles.badgeReleased,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    item.status === 'In Escrow' ? styles.badgeTextEscrow : styles.badgeTextReleased,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: Theme.spacing.md,
  },
  heroCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  heroSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.dark,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  gridLabel: {
    fontSize: 12,
    color: Colors.neutralMedium,
    marginBottom: 4,
  },
  gridValueDark: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark,
  },
  gridValueGreen: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: Theme.spacing.md,
  },
  historyList: {
    gap: Theme.spacing.sm,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Theme.shadows.card,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  itemSub: {
    fontSize: 12,
    color: Colors.neutralMedium,
    marginTop: 2,
  },
  itemDate: {
    fontSize: 11,
    color: Colors.neutralLight,
    marginTop: 4,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.sm,
  },
  badgeEscrow: {
    backgroundColor: '#EFF6FF',
  },
  badgeReleased: {
    backgroundColor: '#DCFCE7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextEscrow: {
    color: '#2563EB',
  },
  badgeTextReleased: {
    color: Colors.primaryDark,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Contract received from TechVentures...',
      subtitle: "Please sign contract 'E-Commerce Redesign'",
      time: '2 min ago',
      icon: '📄',
      unread: true,
    },
    {
      id: '2',
      title: 'Milestone 1 approved — payment...',
      subtitle: 'TechVentures deposited $2,000 into your linked card',
      time: '1 hr ago',
      icon: '✓',
      unread: true,
    },
    {
      id: '3',
      title: 'Client feedback on UI Design...',
      subtitle: 'New comments added inside file homepage-mockup-v2.fig',
      time: '3 hrs ago',
      icon: '💬',
      unread: true,
    },
    {
      id: '4',
      title: 'Milestone 2 deadline reminder',
      subtitle: 'Reminder: Deliverables for UI Design Phase are due Oct 15',
      time: '2 days ago',
      icon: '🕒',
      unread: false,
    },
    {
      id: '5',
      title: 'New message from Alex Chen',
      subtitle: 'You have received a new contract from TechVentures Inc. for E-Commerce Redesign.',
      time: '3 days ago',
      icon: '💬',
      unread: false,
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Title & Mark all read Link */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <View style={styles.list}>
        {notifications.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, item.unread && styles.cardUnread]}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, item.unread && styles.iconBoxUnread]}>
              <Text style={{ fontSize: 16 }}>{item.icon}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                {item.unread && <View style={styles.dotGreen} />}
                <Text style={styles.titleText} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <Text style={styles.subtitleText} numberOfLines={2}>
                {item.subtitle}
              </Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>

            <Text style={styles.chevron}>›</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
  },
  markReadText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  list: {
    gap: Theme.spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...Theme.shadows.card,
  },
  cardUnread: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.primaryLight,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  iconBoxUnread: {
    backgroundColor: '#DCFCE7',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    flex: 1,
  },
  subtitleText: {
    fontSize: 12,
    color: Colors.neutralMedium,
    lineHeight: 16,
  },
  timeText: {
    fontSize: 11,
    color: Colors.neutralLight,
    marginTop: 4,
  },
  chevron: {
    fontSize: 18,
    color: Colors.neutralLight,
    marginLeft: Theme.spacing.sm,
  },
});

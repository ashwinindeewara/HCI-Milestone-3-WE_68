import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '../constants/colors';
import Theme from '../constants/theme';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badgeText?: string;
  badgeType?: 'primary' | 'warning' | 'success' | 'error';
  onPress?: () => void;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  badgeText,
  badgeType = 'primary',
  onPress,
  icon,
}) => {
  const getBadgeColor = () => {
    switch (badgeType) {
      case 'success':
        return { bg: Colors.successBg, text: Colors.successText };
      case 'warning':
        return { bg: Colors.warningBg, text: Colors.warningText };
      case 'error':
        return { bg: Colors.errorBg, text: Colors.errorText };
      default:
        return { bg: Colors.primaryLight, text: Colors.primaryDark };
    }
  };

  const badgeColor = getBadgeColor();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>

      <View style={styles.body}>
        <Text style={styles.value}>{value}</Text>
        {badgeText && (
          <View style={[styles.badge, { backgroundColor: badgeColor.bg }]}>
            <Text style={[styles.badgeText, { color: badgeColor.text }]}>{badgeText}</Text>
          </View>
        )}
      </View>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.neutralMedium,
  },
  iconContainer: {
    padding: 4,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark,
  },
  badge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: Colors.neutralLight,
    marginTop: Theme.spacing.xs,
  },
});

export default MetricCard;

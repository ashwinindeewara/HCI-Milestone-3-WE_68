import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';
import Theme from '../constants/theme';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = (statusKey: string) => {
    switch (statusKey.toUpperCase()) {
      case 'FUNDED':
      case 'ACTIVE':
      case 'IN_PROGRESS':
        return {
          bg: Colors.primaryLight,
          text: Colors.primaryDark,
          label: statusKey === 'FUNDED' ? 'Funded' : 'Active',
        };
      case 'RELEASED':
      case 'COMPLETED':
      case 'APPROVED':
        return {
          bg: Colors.successBg,
          text: Colors.successText,
          label: statusKey === 'RELEASED' ? 'Released' : 'Completed',
        };
      case 'PENDING':
      case 'PENDING_REVIEW':
        return {
          bg: Colors.warningBg,
          text: Colors.warningText,
          label: statusKey === 'PENDING_REVIEW' ? 'In Review' : 'Pending',
        };
      case 'DISPUTED':
      case 'ERROR':
        return {
          bg: Colors.errorBg,
          text: Colors.errorText,
          label: 'Disputed',
        };
      default:
        return {
          bg: Colors.border,
          text: Colors.neutralMedium,
          label: status,
        };
    }
  };

  const style = getBadgeStyle(status);
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: style.bg },
        isSmall && styles.badgeSm,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: style.text }]} />
      <Text style={[styles.text, { color: style.text }, isSmall && styles.textSm]}>
        {style.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm + 2,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: Theme.spacing.xs + 2,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
});

export default StatusBadge;

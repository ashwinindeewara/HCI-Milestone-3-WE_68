import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Colors from '../constants/colors';

export function BackIcon({ size = 20, color = Colors.dark }: { size?: number; color?: string }) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: size, fontWeight: '700', color }}>‹</Text>
    </View>
  );
}

export function VerifiedBadge({ size = 18 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.65, fontWeight: '900', lineHeight: size * 0.8 }}>
        ✓
      </Text>
    </View>
  );
}

export function StarIcon({ size = 16, color = '#F59E0B' }: { size?: number; color?: string }) {
  return (
    <Text style={{ fontSize: size, color, marginRight: 4 }}>★</Text>
  );
}

export function PencilIcon({ size = 13, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <View style={styles.pencilBadge}>
      <Text style={{ fontSize: size, color, transform: [{ rotate: '45deg' }] }}>✎</Text>
    </View>
  );
}

export function ExitLogoutIcon({ size = 18, color = '#15803D' }: { size?: number; color?: string }) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.logoutSquare}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </View>
    );
  }
  return (
    <View style={styles.logoutSquare}>
      <Text style={{ fontSize: 15, color, fontWeight: '700' }}>➜</Text>
    </View>
  );
}

export function HomeIcon({ size = 22, color = '#6B7280', focused = false }: { size?: number; color?: string; focused?: boolean }) {
  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={focused ? `${color}20` : 'none'}
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }
  return <Text style={{ fontSize: size, color }}>⌂</Text>;
}

export function ProjectsIcon({ size = 22, color = '#6B7280' }: { size?: number; color?: string }) {
  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  return <Text style={{ fontSize: size, color }}>📁</Text>;
}

export function PaymentsIcon({ size = 22, color = '#6B7280' }: { size?: number; color?: string }) {
  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="4" width="22" height="16" rx="3" ry="3" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    );
  }
  return <Text style={{ fontSize: size, color }}>💳</Text>;
}

export function AlertsIcon({ size = 22, color = '#6B7280' }: { size?: number; color?: string }) {
  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    );
  }
  return <Text style={{ fontSize: size, color }}>🔔</Text>;
}

export function ProfileIcon({ size = 22, color = '#6B7280' }: { size?: number; color?: string }) {
  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }
  return <Text style={{ fontSize: size, color }}>👤</Text>;
}

export function SearchIcon({ size = 22, color = '#6B7280' }: { size?: number; color?: string }) {
  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    );
  }
  return <Text style={{ fontSize: size, color }}>🔍</Text>;
}

export function ReconcileIcon({ size = 22, color = '#6B7280' }: { size?: number; color?: string }) {
  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M23 4v6h-6" />
        <path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    );
  }
  return <Text style={{ fontSize: size, color }}>🔄</Text>;
}

export function ReportsIcon({ size = 22, color = '#6B7280' }: { size?: number; color?: string }) {
  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    );
  }
  return <Text style={{ fontSize: size, color }}>📊</Text>;
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pencilBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logoutSquare: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#15803D',
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

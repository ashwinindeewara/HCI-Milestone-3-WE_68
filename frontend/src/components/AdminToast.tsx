import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { adminRadius, adminShadow } from '../constants/adminTheme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface AdminToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
}

export default function AdminToast({
  visible,
  message,
  type = 'success',
  onDismiss,
  duration = 3000,
}: AdminToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: Platform.OS !== 'web',
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      const timer = setTimeout(() => {
        dismissToast();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const textColor =
    type === 'success' ? Colors.successText :
    type === 'error' ? Colors.errorText :
    type === 'warning' ? Colors.warningText :
    Colors.infoText;

  const accent =
    type === 'success' ? Colors.primary :
    type === 'error' ? Colors.error :
    type === 'warning' ? Colors.warning :
    Colors.info;

  const iconName =
    type === 'success' ? 'checkmark' :
    type === 'error' ? 'close' :
    type === 'warning' ? 'alert' :
    'information';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderLeftColor: accent,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: accent }]}>
        <Ionicons name={iconName} size={14} color={Colors.surface} />
      </View>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity onPress={dismissToast} style={styles.closeBtn} accessibilityLabel="Dismiss">
        <Ionicons name="close" size={16} color={textColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    ...adminShadow.raised,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: Colors.dark,
  },
  closeBtn: {
    marginLeft: 8,
    padding: 4,
  },
});

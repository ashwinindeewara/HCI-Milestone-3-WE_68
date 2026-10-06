import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Colors from '../constants/colors';
import Theme from '../constants/theme';

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
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
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
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const bgColor =
    type === 'success' ? Colors.successBg :
    type === 'error' ? Colors.errorBg :
    type === 'warning' ? Colors.warningBg :
    Colors.infoBg;

  const textColor =
    type === 'success' ? Colors.successText :
    type === 'error' ? Colors.errorText :
    type === 'warning' ? Colors.warningText :
    Colors.infoText;

  const icon =
    type === 'success' ? '✓' :
    type === 'error' ? '✕' :
    type === 'warning' ? '⚠' :
    'ℹ';

  const borderColor =
    type === 'success' ? Colors.primary :
    type === 'error' ? Colors.error :
    type === 'warning' ? Colors.warning :
    Colors.info;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: borderColor }]}>
        <Text style={[styles.iconText, { color: Colors.surface }]}>{icon}</Text>
      </View>
      <Text style={[styles.message, { color: textColor }]} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity onPress={dismissToast} style={styles.closeBtn}>
        <Text style={[styles.closeText, { color: textColor }]}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    ...Theme.shadows.card,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 13,
    fontWeight: '800',
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  closeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

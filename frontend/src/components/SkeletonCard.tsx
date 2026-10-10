import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, DimensionValue, Platform } from 'react-native';
import Colors from '../constants/colors';
import Theme from '../constants/theme';

interface SkeletonCardProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: object;
}

export default function SkeletonCard({ width = '100%', height = 80, borderRadius = 12, style }: SkeletonCardProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity: pulseAnim },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.border,
    marginBottom: Theme.spacing.md,
  },
});

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../constants/colors';

interface AdminHeaderBackProps {
  // Where to go when there is no previous screen (e.g. after a page refresh).
  fallbackHref: '/admin-dashboard' | '/login';
}

// Header back arrow for the admin screens. The bottom tabs navigate with router.replace,
// so the stack has no history and the built-in arrow disappears; this one always works.
export default function AdminHeaderBack({ fallbackHref }: AdminHeaderBackProps) {
  const router = useRouter();

  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={styles.button}
    >
      <Ionicons name="arrow-back" size={22} color={Colors.surface} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 12, justifyContent: 'center' },
});

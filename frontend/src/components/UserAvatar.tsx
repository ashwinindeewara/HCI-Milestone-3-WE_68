import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Colors from '../constants/colors';
import { API_BASE_URL } from '../services/api';

interface UserAvatarProps {
  userId?: string | number;
  name?: string;
  size?: number;
  // Only accounts that can have a stored picture (admins) need a lookup; others show the initial.
  hasPicture?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Round avatar that shows the picture saved in the database, falling back to the name's initial.
export default function UserAvatar({ userId, name, size = 44, hasPicture = true, style }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = hasPicture && userId !== undefined && userId !== null && !failed;
  const uri = `${API_BASE_URL}/admin/profile/picture/${userId}`;
  const radius = size / 2;

  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: radius }, style]}>
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius }}
          onError={() => setFailed(true)}
          accessibilityLabel={name ? `${name} profile picture` : 'Profile picture'}
        />
      ) : (
        <Text style={[styles.initial, { fontSize: Math.round(size * 0.38) }]}>
          {name ? name.charAt(0).toUpperCase() : 'U'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.surface,
    shadowColor: '#101827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  initial: { color: Colors.surface, fontWeight: '800' },
});

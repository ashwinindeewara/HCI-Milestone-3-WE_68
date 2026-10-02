import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';

export default function AccountCreatedScreen() {
  const router = useRouter();

  const handleGoToLogin = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Celebration Illustration with Character & Stars */}
        <View style={styles.illustrationContainer}>
          {/* Sparkle Stars */}
          <Text style={[styles.star, styles.starTopLeft]}>✦</Text>
          <Text style={[styles.star, styles.starTopRight]}>✦</Text>
          <Text style={[styles.star, styles.starMidLeft]}>✨</Text>
          <Text style={[styles.star, styles.starMidRight]}>✨</Text>

          {/* Cheering Suit Character Illustration */}
          <View style={styles.characterBody}>
            <View style={styles.hairHead} />
            <View style={styles.face}>
              <View style={styles.happyEyesRow}>
                <Text style={styles.eyeSmile}>^</Text>
                <Text style={styles.eyeSmile}>^</Text>
              </View>
              <View style={styles.happySmile} />
            </View>

            {/* Suit & Raised Arms */}
            <View style={styles.suitContainer}>
              <View style={styles.armLeft} />
              <View style={styles.suitTorso}>
                <View style={styles.shirtCollar} />
                <View style={styles.tie} />
              </View>
              <View style={styles.armRight} />
            </View>

            {/* Legs */}
            <View style={styles.legsRow}>
              <View style={styles.leg} />
              <View style={styles.leg} />
            </View>
          </View>
        </View>

        {/* Text Header & Message */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Account Created!</Text>
          <Text style={styles.subtitle}>
            Welcome to FreelanceFlow. Your account has been created successfully.
          </Text>
        </View>

        {/* Primary Action Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoToLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: Theme.spacing.lg,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxl,
  },
  illustrationContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  star: {
    position: 'absolute',
    color: '#FBBF24',
    fontSize: 20,
  },
  starTopLeft: { top: 10, left: 20 },
  starTopRight: { top: 15, right: 25 },
  starMidLeft: { top: 80, left: 10 },
  starMidRight: { top: 90, right: 15 },
  characterBody: {
    alignItems: 'center',
  },
  hairHead: {
    width: 60,
    height: 30,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginBottom: -10,
    zIndex: 3,
  },
  face: {
    width: 54,
    height: 50,
    backgroundColor: '#FFCBDD',
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  happyEyesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  eyeSmile: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  happySmile: {
    width: 12,
    height: 6,
    borderBottomWidth: 2,
    borderColor: '#1E293B',
    borderRadius: 6,
    marginTop: 2,
  },
  suitContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: -4,
  },
  armLeft: {
    width: 14,
    height: 45,
    backgroundColor: '#3B82F6',
    borderRadius: 7,
    transform: [{ rotate: '-35deg' }],
    marginRight: -4,
  },
  armRight: {
    width: 14,
    height: 45,
    backgroundColor: '#3B82F6',
    borderRadius: 7,
    transform: [{ rotate: '35deg' }],
    marginLeft: -4,
  },
  suitTorso: {
    width: 50,
    height: 60,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
    paddingTop: 2,
  },
  shirtCollar: {
    width: 18,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
  },
  tie: {
    width: 6,
    height: 24,
    backgroundColor: '#0284C7',
    marginTop: -8,
  },
  legsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: -6,
  },
  leg: {
    width: 12,
    height: 35,
    backgroundColor: '#1E293B',
    borderRadius: 6,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.neutralMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
  },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.card,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.surface,
  },
});

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';

const { width, height } = Dimensions.get('window');

// Dynamic scaling constants for mobile viewports
const ILLUST_SIZE = Math.min(width * 0.75, height * 0.3);

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  illustrationType: 'work' | 'contract' | 'escrow';
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Work Smarter. Freelance Better.',
    subtitle: 'Manage your projects, contracts and payments in one secure place.',
    illustrationType: 'work',
  },
  {
    id: '2',
    title: 'Contracts & Milestones Made Clear',
    subtitle: 'Keep project scope, deliverables, deadlines and milestones organized.',
    illustrationType: 'contract',
  },
  {
    id: '3',
    title: 'Secure Payments with Confidence',
    subtitle: 'Use milestone-based payments and escrow to keep every transaction transparent.',
    illustrationType: 'escrow',
  },
];

/** Slide 1: Freelancer Desk Illustration */
const WorkIllustration = () => (
  <View style={styles.deskWrapper}>
    <View style={styles.characterContainer}>
      <View style={styles.hair} />
      <View style={styles.head}>
        <View style={styles.glassesContainer}>
          <View style={styles.glassFrame} />
          <View style={styles.glassBridge} />
          <View style={styles.glassFrame} />
        </View>
        <View style={styles.blushRow}>
          <View style={styles.blush} />
          <View style={styles.blush} />
        </View>
        <View style={styles.smile} />
      </View>
      <View style={styles.shirt} />
    </View>

    <View style={styles.deskRow}>
      <View style={styles.plantContainer}>
        <View style={styles.leavesRow}>
          <View style={styles.leaf} />
          <View style={[styles.leaf, styles.leafCenter]} />
          <View style={styles.leaf} />
        </View>
        <View style={styles.pot} />
      </View>

      <View style={styles.laptopContainer}>
        <View style={styles.laptopScreen}>
          <View style={styles.cameraDot} />
        </View>
      </View>

      <View style={styles.coffeeContainer}>
        <View style={styles.steamLines}>
          <Text style={styles.steamText}>SSS</Text>
        </View>
        <View style={styles.mug}>
          <View style={styles.mugHandle} />
        </View>
      </View>
    </View>
    <View style={styles.deskSurfaceLine} />
  </View>
);

/** Slide 2: Contracts & Milestones Laptop Dashboard Illustration */
const ContractIllustration = () => (
  <View style={styles.contractIllustrationWrapper}>
    <View style={styles.contractDeskRow}>
      <View style={styles.flagCupContainer}>
        <View style={styles.flagPole}>
          <View style={styles.redFlag} />
        </View>
        <View style={styles.saucer}>
          <View style={styles.miniCup} />
        </View>
      </View>

      <View style={styles.contractLaptopBody}>
        <View style={styles.contractLaptopScreen}>
          <View style={styles.webCameraDot} />
          <View style={styles.cardsGrid}>
            <View style={[styles.gridCard, { backgroundColor: '#7FB3B4' }]}>
              <Text style={styles.cardIcon}>⏱️</Text>
              <Text style={styles.cardLabel}>Contracts</Text>
            </View>
            <View style={[styles.gridCard, { backgroundColor: '#F87171' }]}>
              <Text style={styles.cardIcon}>📑</Text>
              <Text style={styles.cardLabel}>Scope</Text>
            </View>
            <View style={[styles.gridCard, { backgroundColor: '#FBBF24' }]}>
              <Text style={styles.cardIcon}>⌛</Text>
              <Text style={styles.cardLabel}>Milestones</Text>
            </View>
            <View style={[styles.gridCard, { backgroundColor: '#A78BFA' }]}>
              <Text style={styles.cardIcon}>📅</Text>
              <Text style={styles.cardLabel}>Deadlines</Text>
            </View>
          </View>
        </View>

        <View style={styles.laptopKeyboardBase}>
          <View style={styles.keyboardKeysPattern} />
          <View style={styles.trackpad} />
        </View>
      </View>

      <View style={styles.steamingCupContainer}>
        <View style={styles.steamFlow}>
          <Text style={styles.steamText}>SS</Text>
        </View>
        <View style={styles.saucer}>
          <View style={styles.miniCupRight} />
        </View>
      </View>
    </View>
  </View>
);

/** Slide 3: 3D Secure Escrow Payment Illustration */
const EscrowIllustration = () => (
  <View style={styles.escrow3DWrapper}>
    <View style={styles.lockBadge3D}>
      <Text style={{ fontSize: 20 }}>🔒</Text>
      <View style={styles.starsBox}>
        <Text style={styles.starsText}>****</Text>
      </View>
    </View>

    <View style={styles.coinLeft}>
      <Text style={{ fontSize: 16 }}>🪙</Text>
    </View>
    <View style={styles.coinRight}>
      <Text style={{ fontSize: 18 }}>🪙</Text>
    </View>

    <View style={styles.phoneBody3D}>
      <View style={styles.phoneNotch} />
      <View style={styles.creditCard3D}>
        <View style={styles.chip3D} />
        <View style={styles.cardLine3D} />
      </View>
    </View>

    <View style={styles.handSleeve}>
      <View style={styles.sleeveCuff} />
    </View>
  </View>
);

const SlideIllustration: React.FC<{ type: 'work' | 'contract' | 'escrow' }> = ({ type }) => {
  return (
    <View style={styles.illustrationContainer}>
      <View style={styles.illustrationBgCircle} />
      {type === 'work' && <WorkIllustration />}
      {type === 'contract' && <ContractIllustration />}
      {type === 'escrow' && <EscrowIllustration />}
    </View>
  );
};

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    router.replace('/register');
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slideIndex !== currentIndex && slideIndex >= 0 && slideIndex < SLIDES.length) {
      setCurrentIndex(slideIndex);
    }
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const isSecondSlide = currentIndex === 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Fixed Top Header Bar with Skip */}
        <View style={styles.headerRow}>
          {!isLastSlide ? (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* Viewport Responsive Carousel ScrollView */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {SLIDES.map((slide) => (
            <View key={slide.id} style={styles.slidePage}>
              <SlideIllustration type={slide.illustrationType} />

              <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={2}>
                  {slide.title}
                </Text>
                <Text style={styles.subtitle} numberOfLines={3}>
                  {slide.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Responsive Step Indicator Dots */}
        <View style={styles.paginationRow}>
          {SLIDES.map((slide, index) => {
            const isActive = index === currentIndex;
            return (
              <View
                key={slide.id}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Fixed Bottom Action Controls */}
        <View style={styles.buttonContainer}>
          {isSecondSlide ? (
            <View style={styles.dualButtonRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextButtonHalf}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.primaryButtonFull}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {isLastSlide ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>
          )}
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
    paddingBottom: Theme.spacing.md,
  },
  headerRow: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  skipButton: {
    minWidth: Theme.minTouchTarget,
    minHeight: Theme.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutralMedium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slidePage: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xs,
  },
  illustrationContainer: {
    width: ILLUST_SIZE,
    height: ILLUST_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 220,
  },
  illustrationBgCircle: {
    position: 'absolute',
    width: ILLUST_SIZE * 0.85,
    height: ILLUST_SIZE * 0.85,
    borderRadius: (ILLUST_SIZE * 0.85) / 2,
    backgroundColor: '#F3F4F6',
  },

  /* Slide 1 Styles */
  deskWrapper: { alignItems: 'center', width: '100%', transform: [{ scale: 0.9 }] },
  characterContainer: { alignItems: 'center', marginBottom: -10, zIndex: 2 },
  hair: { width: 80, height: 40, backgroundColor: '#1E1E1E', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginBottom: -12, zIndex: 3 },
  head: { width: 70, height: 65, backgroundColor: '#FFB09C', borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1E1E1E' },
  glassesContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  glassFrame: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#1E1E1E' },
  glassBridge: { width: 4, height: 2, backgroundColor: '#1E1E1E' },
  blushRow: { flexDirection: 'row', justifyContent: 'space-between', width: 40, marginTop: 2 },
  blush: { width: 12, height: 6, borderRadius: 3, backgroundColor: '#FF7B7B', opacity: 0.8 },
  smile: { width: 14, height: 6, borderBottomWidth: 2, borderColor: '#1E1E1E', borderRadius: 6, marginTop: 2 },
  shirt: { width: 100, height: 40, backgroundColor: '#6366F1', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 2, borderColor: '#1E1E1E', marginTop: -4 },
  deskRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', width: '100%', zIndex: 4 },
  plantContainer: { alignItems: 'center', marginRight: 8 },
  leavesRow: { flexDirection: 'row', marginBottom: -4 },
  leaf: { width: 10, height: 16, backgroundColor: '#10B981', borderRadius: 8, borderWidth: 1.5, borderColor: '#1E1E1E' },
  leafCenter: { height: 18, marginTop: -3 },
  pot: { width: 26, height: 26, backgroundColor: Colors.surface, borderWidth: 2, borderColor: '#1E1E1E', borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  laptopContainer: { alignItems: 'center' },
  laptopScreen: { width: 130, height: 85, backgroundColor: '#D1D5DB', borderWidth: 2.5, borderColor: '#1E1E1E', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cameraDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1E1E1E' },
  coffeeContainer: { alignItems: 'center', marginLeft: 8 },
  steamLines: { marginBottom: 2 },
  steamText: { fontSize: 9, fontWeight: '700', color: '#6B7280', letterSpacing: 2 },
  mug: { width: 24, height: 28, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#1E1E1E', borderRadius: 5 },
  mugHandle: { position: 'absolute', right: -6, top: 4, width: 8, height: 14, borderWidth: 2, borderColor: '#1E1E1E', borderTopRightRadius: 5, borderBottomRightRadius: 5 },
  deskSurfaceLine: { width: '100%', height: 3, backgroundColor: '#1E1E1E', marginTop: -2 },

  /* Slide 2 Styles */
  contractIllustrationWrapper: { alignItems: 'center', justifyContent: 'center', width: '100%', transform: [{ scale: 0.9 }] },
  contractDeskRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6 },
  flagCupContainer: { alignItems: 'center', marginBottom: 4 },
  flagPole: { width: 2, height: 18, backgroundColor: '#374151', alignItems: 'flex-end' },
  redFlag: { width: 10, height: 7, backgroundColor: '#EF4444' },
  miniCup: { width: 18, height: 14, backgroundColor: '#9CA3AF', borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  saucer: { borderBottomWidth: 3, borderBottomColor: '#6B7280', paddingHorizontal: 2 },
  contractLaptopBody: { alignItems: 'center' },
  contractLaptopScreen: { width: 180, height: 110, backgroundColor: '#1E293B', borderRadius: 8, borderWidth: 2.5, borderColor: '#334155', padding: 5, alignItems: 'center' },
  webCameraDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#94A3B8', marginBottom: 3 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, width: '100%', height: '85%' },
  gridCard: { width: '48%', height: '46%', borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  cardIcon: { fontSize: 12 },
  cardLabel: { fontSize: 8, fontWeight: '700', color: '#FFFFFF', marginTop: 1 },
  laptopKeyboardBase: { width: 200, height: 12, backgroundColor: '#64748B', borderBottomLeftRadius: 6, borderBottomRightRadius: 6, alignItems: 'center', justifyContent: 'center' },
  keyboardKeysPattern: { width: 150, height: 3, backgroundColor: '#334155', borderRadius: 2 },
  trackpad: { width: 30, height: 3, backgroundColor: '#94A3B8', borderRadius: 1.5, marginTop: 1 },
  steamingCupContainer: { alignItems: 'center', marginBottom: 4 },
  steamFlow: { marginBottom: 2 },
  miniCupRight: { width: 18, height: 15, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#334155', borderTopLeftRadius: 3, borderTopRightRadius: 3 },

  /* Slide 3 Styles */
  escrow3DWrapper: { alignItems: 'center', justifyContent: 'center', width: '100%', height: 160, transform: [{ scale: 0.9 }] },
  lockBadge3D: { position: 'absolute', top: 5, left: 35, backgroundColor: '#DCFCE7', padding: 5, borderRadius: 10, borderWidth: 2, borderColor: Colors.primary, flexDirection: 'row', alignItems: 'center', zIndex: 5 },
  starsBox: { backgroundColor: '#FFFFFF', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, marginLeft: 4 },
  starsText: { fontSize: 9, fontWeight: '800', color: Colors.primaryDark },
  coinLeft: { position: 'absolute', left: 20, bottom: 40, zIndex: 4 },
  coinRight: { position: 'absolute', right: 25, top: 20, zIndex: 4 },
  phoneBody3D: { width: 100, height: 120, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2.5, borderColor: '#3B82F6', alignItems: 'center', paddingTop: 6, zIndex: 2, ...Theme.shadows.card },
  phoneNotch: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1E293B' },
  creditCard3D: { width: 110, height: 55, backgroundColor: '#3B82F6', borderRadius: 8, marginTop: 12, padding: 6, justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#FFFFFF', zIndex: 3 },
  chip3D: { width: 14, height: 10, backgroundColor: '#FBBF24', borderRadius: 2 },
  cardLine3D: { width: 50, height: 3, backgroundColor: '#FFFFFF', borderRadius: 1.5, opacity: 0.8 },
  handSleeve: { position: 'absolute', bottom: -8, width: 95, height: 42, backgroundColor: '#3B82F6', borderTopLeftRadius: 14, borderTopRightRadius: 14, borderWidth: 2, borderColor: '#1E293B', zIndex: 1 },
  sleeveCuff: { width: '100%', height: 8, backgroundColor: '#1E40AF', borderTopLeftRadius: 12, borderTopRightRadius: 12 },

  /* Text & Navigation */
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.xs,
  },
  title: {
    fontSize: Math.min(width * 0.065, 24),
    fontWeight: '800',
    color: Colors.dark,
    textAlign: 'center',
    lineHeight: Math.min(width * 0.08, 30),
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.neutralMedium,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Theme.spacing.xs,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Theme.spacing.sm,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.border,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: Theme.spacing.lg,
  },
  primaryButtonFull: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.card,
  },
  dualButtonRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  backButton: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  nextButtonHalf: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.card,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.surface,
  },
});

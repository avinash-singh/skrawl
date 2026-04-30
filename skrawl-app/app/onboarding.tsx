import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useThemeColors, typography, radii } from '@/src/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: 'layers-outline' as const,
    title: 'Personal & Business',
    description: 'Keep your life organized with separate contexts. Toggle between personal and business with one tap.',
    color: '#7C6AFF',
  },
  {
    icon: 'add-circle-outline' as const,
    title: 'Quick Capture',
    description: 'Tap the purple button to jot down notes, tasks, or lists instantly. Long-press for voice input with smart parsing.',
    color: '#FF6AC2',
  },
  {
    icon: 'swap-horizontal-outline' as const,
    title: 'Swipe to Act',
    description: 'Swipe left to mark done, swipe right to pin. Swipe partially to quickly set priority. It\'s all customizable in settings.',
    color: '#6AFFCB',
  },
];

export default function OnboardingScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (activeIndex === slides.length - 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
      setActiveIndex(activeIndex + 1);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.skipRow}>
        <Pressable onPress={handleSkip}>
          <Text style={[typography.caption, { color: c.textMuted }]}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: `${item.color}22` }]}>
              <Ionicons name={item.icon} size={64} color={item.color} />
            </View>
            <Text style={[styles.slideTitle, { color: c.text }]}>{item.title}</Text>
            <Text style={[styles.slideDesc, { color: c.textDim }]}>{item.description}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === activeIndex ? c.accent : c.border },
              i === activeIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Next / Get Started button */}
      <Pressable
        onPress={handleNext}
        style={[styles.nextBtn, { backgroundColor: c.accent }]}
      >
        <Text style={[typography.label, { color: '#fff' }]}>
          {activeIndex === slides.length - 1 ? 'Get Started' : 'Next'}
        </Text>
        <Ionicons name={activeIndex === slides.length - 1 ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
      </Pressable>

      <View style={{ height: 50 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipRow: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  slideDesc: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 40,
    paddingVertical: 16,
    borderRadius: radii.full,
  },
});

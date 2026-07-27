import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/theme';

const { width } = Dimensions.get('window');

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    id: '1',
    title: 'Download Anything',
    description: 'Get videos, audio, and images from your favorite social media platforms.',
    icon: 'cloud-download-outline',
  },
  {
    id: '2',
    title: 'High Quality',
    description: 'Choose your preferred quality for video and audio downloads.',
    icon: 'options-outline',
  },
  {
    id: '3',
    title: 'Fast & Simple',
    description: 'Just paste a link and let the app handle the rest.',
    icon: 'flash-outline',
  },
];

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false, listener: (event: any) => {
        const slide = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(slide);
      }
    }
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <Ionicons name={slide.icon as any} size={80} color={Colors.white} style={styles.icon} />
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {SLIDES.map((_, index) => {
          const opacity = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return <Animated.View key={index} style={[styles.dot, { opacity }]} />;
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={14} color={Colors.black} />}
          </View>
          <Text style={styles.checkboxText}>I agree to the Fair Use Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (!agreed || currentIndex !== SLIDES.length - 1) && styles.buttonDisabled]}
          disabled={!agreed || currentIndex !== SLIDES.length - 1}
          onPress={onComplete}
        >
          <Text style={[styles.buttonText, (!agreed || currentIndex !== SLIDES.length - 1) && styles.buttonTextDisabled]}>
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  icon: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    marginHorizontal: 4,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  checkboxText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.white,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.black70,
  },
  buttonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextDisabled: {
    color: Colors.textTertiary,
  },
});

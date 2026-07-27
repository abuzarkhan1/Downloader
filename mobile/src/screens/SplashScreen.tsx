import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';

interface SplashScreenProps {
  onFinished: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const { t } = useI18n();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1.5 seconds splash display matching Kotlin implementation
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400, // 400ms fade transition matching Kotlin tween(400)
        useNativeDriver: true,
      }).start(() => {
        onFinished();
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinished]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} testID="splash-screen">
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.content}>
        <Image
          source={require('../../assets/logoo.png')}
          style={styles.logo}
          resizeMode="cover"
        />

        <Text style={styles.title}>{t('appName')}</Text>

        <Text style={styles.author}>Aqil Konabak</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  author: {
    fontSize: 13,
    color: '#A1A1AA',
    fontWeight: '500',
    letterSpacing: 2,
  },
});

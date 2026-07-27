import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/theme';

interface ClipboardToastProps {
  url: string;
  onPaste: () => void;
  onDismiss: () => void;
  visible: boolean;
}

export const ClipboardToast: React.FC<ClipboardToastProps> = ({ url, onPaste, onDismiss, visible }) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
      
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000); // Auto dismiss after 5 seconds
      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy < 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy < -20) {
          handleDismiss();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Don't render if not visible and animation completed
  const isZero = slideAnim.interpolate({inputRange: [-100, 0], outputRange: [0, 1]}) as unknown as number;
  if (!visible && isZero === 0) return null;

  return (
    <Animated.View 
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.toast}>
        <Ionicons name="link-outline" size={20} color={Colors.white} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Link copied</Text>
          <Text style={styles.url} numberOfLines={1}>{url}</Text>
        </View>
        <TouchableOpacity style={styles.pasteButton} onPress={() => { onPaste(); handleDismiss(); }}>
          <Text style={styles.pasteButtonText}>Paste</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  toast: {
    backgroundColor: Colors.black80,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dividerColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  url: {
    color: Colors.white,
    fontSize: 14,
  },
  pasteButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pasteButtonText: {
    color: Colors.black,
    fontWeight: '700',
    fontSize: 12,
  },
});

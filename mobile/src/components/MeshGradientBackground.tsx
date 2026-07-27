import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../theme/theme';

const { width } = Dimensions.get('window');

export const MeshGradientBackground: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Simulation of a dark mesh gradient using colored circles */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />
    </View>
  );
};

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  blob1: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: Colors.brandTiktok,
    top: -width * 0.2,
    left: -width * 0.2,
  },
  blob2: {
    width: width * 0.9,
    height: width * 0.9,
    backgroundColor: Colors.brandYoutube,
    top: width * 0.1,
    right: -width * 0.3,
  },
  blob3: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: Colors.brandInstagram,
    bottom: -width * 0.1,
    left: width * 0.1,
  },
});

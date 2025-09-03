import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function AuthHeader({ title, subtitle, icon = 'airplane' }: AuthHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Éléments décoratifs de fond */}
      <View style={styles.backgroundElements}>
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeCircle, styles.circle3]} />
      </View>
      
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name={icon} size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.appTitle}>{title}</Text>
      </View>
      
      <Text style={styles.appSubtitle}>{subtitle}</Text>
      
      {/* Éléments décoratifs supplémentaires */}
      <View style={styles.bottomDecorations}>
        <View style={styles.waveContainer}>
          <View style={styles.wave} />
          <View style={[styles.wave, styles.wave2]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2F7417',
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Éléments décoratifs de fond
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  circle1: {
    width: 120,
    height: 120,
    top: -30,
    right: -30,
  },
  
  circle2: {
    width: 80,
    height: 80,
    top: 20,
    left: -20,
  },
  
  circle3: {
    width: 60,
    height: 60,
    bottom: 20,
    right: 40,
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  
  appTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  appSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 20,
    zIndex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Décorations du bas
  bottomDecorations: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 0,
  },
  
  waveContainer: {
    position: 'relative',
    height: '100%',
  },
  
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  
  wave2: {
    height: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
});

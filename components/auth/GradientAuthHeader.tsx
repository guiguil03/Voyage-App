import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface GradientAuthHeaderProps {
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function GradientAuthHeader({ 
  title, 
  subtitle, 
  icon = 'airplane' 
}: GradientAuthHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Gradient de fond simulé avec des couches */}
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />
      <View style={styles.gradientLayer3} />
      
      {/* Éléments décoratifs */}
      <View style={styles.decorativeElements}>
        <View style={[styles.geometricShape, styles.shape1]} />
        <View style={[styles.geometricShape, styles.shape2]} />
        <View style={[styles.geometricShape, styles.shape3]} />
        <View style={[styles.geometricShape, styles.shape4]} />
      </View>
      
      {/* Contenu principal */}
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name={icon} size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.appTitle}>{title}</Text>
        </View>
        
        <Text style={styles.appSubtitle}>{subtitle}</Text>
        
        {/* Statistiques ou badges */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1000+</Text>
            <Text style={styles.statLabel}>Voyages</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50+</Text>
            <Text style={styles.statLabel}>Pays</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Support</Text>
          </View>
        </View>
      </View>
      
      {/* Vagues décoratives du bas */}
      <View style={styles.waveContainer}>
        <View style={styles.wave} />
        <View style={[styles.wave, styles.wave2]} />
        <View style={[styles.wave, styles.wave3]} />
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
  
  // Couches de gradient simulé
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#2F7417',
    opacity: 1,
  },
  
  gradientLayer2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#3A8B1F',
    opacity: 0.3,
  },
  
  gradientLayer3: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#4CAF50',
    opacity: 0.2,
  },
  
  // Éléments géométriques décoratifs
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  
  geometricShape: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  shape1: {
    width: 60,
    height: 60,
    borderRadius: 30,
    top: 40,
    right: 20,
    transform: [{ rotate: '45deg' }],
  },
  
  shape2: {
    width: 40,
    height: 40,
    borderRadius: 20,
    top: 100,
    left: 30,
  },
  
  shape3: {
    width: 80,
    height: 80,
    borderRadius: 40,
    bottom: 60,
    right: 40,
    opacity: 0.5,
  },
  
  shape4: {
    width: 30,
    height: 30,
    borderRadius: 15,
    top: 150,
    left: 60,
    transform: [{ rotate: '30deg' }],
  },
  
  // Contenu principal
  contentContainer: {
    zIndex: 2,
    alignItems: 'center',
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  appTitle: {
    fontSize: 40,
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
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Statistiques
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginTop: 4,
  },
  
  // Vagues décoratives
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    zIndex: 0,
  },
  
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  
  wave2: {
    height: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  
  wave3: {
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

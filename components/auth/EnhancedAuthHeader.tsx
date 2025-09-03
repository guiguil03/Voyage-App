import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EnhancedAuthHeaderProps {
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
  showFeatures?: boolean;
}

export default function EnhancedAuthHeader({ 
  title, 
  subtitle, 
  icon = 'airplane',
  showFeatures = true 
}: EnhancedAuthHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Éléments décoratifs de fond */}
      <View style={styles.backgroundElements}>
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeCircle, styles.circle3]} />
        <View style={[styles.decorativeCircle, styles.circle4]} />
      </View>
      
      {/* Icônes flottantes */}
      <View style={styles.floatingIcons}>
        <View style={[styles.floatingIcon, styles.icon1]}>
          <Ionicons name="location" size={16} color="rgba(255, 255, 255, 0.6)" />
        </View>
        <View style={[styles.floatingIcon, styles.icon2]}>
          <Ionicons name="camera" size={16} color="rgba(255, 255, 255, 0.6)" />
        </View>
        <View style={[styles.floatingIcon, styles.icon3]}>
          <Ionicons name="heart" size={16} color="rgba(255, 255, 255, 0.6)" />
        </View>
      </View>
      
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name={icon} size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.appTitle}>{title}</Text>
      </View>
      
      <Text style={styles.appSubtitle}>{subtitle}</Text>
      
      {/* Features rapides */}
      {showFeatures && (
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="globe" size={20} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.featureText}>Découvrir</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={20} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.featureText}>Partager</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="star" size={20} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.featureText}>Mémoriser</Text>
          </View>
        </View>
      )}
      

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2F7417',
    paddingTop: 50,
    paddingBottom: 15,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  
  circle1: {
    width: 140,
    height: 140,
    top: -40,
    right: -40,
  },
  
  circle2: {
    width: 100,
    height: 100,
    top: 30,
    left: -30,
  },
  
  circle3: {
    width: 80,
    height: 80,
    bottom: 40,
    right: 20,
  },
  
  circle4: {
    width: 60,
    height: 60,
    top: 80,
    right: 60,
  },
  
  // Icônes flottantes
  floatingIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  
  floatingIcon: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  icon1: {
    top: 80,
    left: 30,
  },
  
  icon2: {
    top: 120,
    right: 50,
  },
  
  icon3: {
    top: 160,
    left: 60,
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15,
    zIndex: 2,
  },
  
  logoCircle: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 18,
    zIndex: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Features
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 0,
    zIndex: 2,
  },
  
  featureItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    minWidth: 70,
  },
  
  featureText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginTop: 3,
  },
  

});

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface ParticleAuthHeaderProps {
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function ParticleAuthHeader({ 
  title, 
  subtitle, 
  icon = 'airplane' 
}: ParticleAuthHeaderProps) {
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;
  const particle5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createParticleAnimation = (particle: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(particle, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = [
      createParticleAnimation(particle1, 0),
      createParticleAnimation(particle2, 500),
      createParticleAnimation(particle3, 1000),
      createParticleAnimation(particle4, 1500),
      createParticleAnimation(particle5, 2000),
    ];

    animations.forEach(animation => animation.start());

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, []);

  const particle1Style = {
    opacity: particle1,
    transform: [
      {
        translateY: particle1.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -50],
        }),
      },
      {
        scale: particle1.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1, 0.5],
        }),
      },
    ],
  };

  const particle2Style = {
    opacity: particle2,
    transform: [
      {
        translateY: particle2.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -40],
        }),
      },
      {
        scale: particle2.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.3, 0.8, 0.3],
        }),
      },
    ],
  };

  const particle3Style = {
    opacity: particle3,
    transform: [
      {
        translateY: particle3.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -60],
        }),
      },
      {
        scale: particle3.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.4, 1.2, 0.4],
        }),
      },
    ],
  };

  const particle4Style = {
    opacity: particle4,
    transform: [
      {
        translateY: particle4.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -35],
        }),
      },
      {
        scale: particle4.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.2, 0.6, 0.2],
        }),
      },
    ],
  };

  const particle5Style = {
    opacity: particle5,
    transform: [
      {
        translateY: particle5.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -45],
        }),
      },
      {
        scale: particle5.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.3, 0.9, 0.3],
        }),
      },
    ],
  };

  return (
    <View style={styles.header}>
      {/* Particules animées */}
      <View style={styles.particlesContainer}>
        <Animated.View style={[styles.particle, styles.particle1, particle1Style]} />
        <Animated.View style={[styles.particle, styles.particle2, particle2Style]} />
        <Animated.View style={[styles.particle, styles.particle3, particle3Style]} />
        <Animated.View style={[styles.particle, styles.particle4, particle4Style]} />
        <Animated.View style={[styles.particle, styles.particle5, particle5Style]} />
      </View>

      {/* Éléments décoratifs statiques */}
      <View style={styles.decorativeElements}>
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeCircle, styles.circle3]} />
      </View>

      {/* Contenu principal */}
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name={icon} size={38} color="#FFFFFF" />
          </View>
          <Text style={styles.appTitle}>{title}</Text>
        </View>
        
        <Text style={styles.appSubtitle}>{subtitle}</Text>
        
        {/* Badges de fonctionnalités */}
        <View style={styles.badgesContainer}>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.badgeText}>Sécurisé</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="flash" size={16} color="#FFFFFF" />
            <Text style={styles.badgeText}>Rapide</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="heart" size={16} color="#FFFFFF" />
            <Text style={styles.badgeText}>Fiable</Text>
          </View>
        </View>
      </View>
      
      {/* Vagues décoratives */}
      <View style={styles.waveContainer}>
        <View style={styles.wave} />
        <View style={[styles.wave, styles.wave2]} />
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
  
  // Particules animées
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  
  particle1: {
    top: 100,
    left: 50,
  },
  
  particle2: {
    top: 150,
    right: 80,
  },
  
  particle3: {
    top: 200,
    left: 100,
  },
  
  particle4: {
    top: 120,
    right: 40,
  },
  
  particle5: {
    top: 180,
    left: 200,
  },
  
  // Éléments décoratifs
  decorativeElements: {
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
    width: 120,
    height: 120,
    top: -30,
    right: -30,
  },
  
  circle2: {
    width: 80,
    height: 80,
    top: 50,
    left: -20,
  },
  
  circle3: {
    width: 60,
    height: 60,
    bottom: 30,
    right: 50,
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
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Badges
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  badgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Vagues
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 25,
    zIndex: 0,
  },
  
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  
  wave2: {
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

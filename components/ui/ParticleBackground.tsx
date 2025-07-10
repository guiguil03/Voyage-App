import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

const ParticleBackground: React.FC = () => {
  // Créer des particules
  const particles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * screenWidth,
    y: Math.random() * screenHeight,
    size: Math.random() * 4 + 2,
    speed: Math.random() * 0.5 + 0.2,
    opacity: Math.random() * 0.6 + 0.2,
  }));

  const animationValue = useSharedValue(0);

  useEffect(() => {
    animationValue.value = withRepeat(
      withTiming(1, {
        duration: 10000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const ParticleComponent: React.FC<{ particle: Particle }> = ({ particle }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const translateY = interpolate(
        animationValue.value,
        [0, 1],
        [0, -screenHeight - 100]
      );
      
      const translateX = interpolate(
        animationValue.value,
        [0, 1],
        [0, Math.sin(animationValue.value * Math.PI * 2) * 50]
      );

      const opacity = interpolate(
        animationValue.value,
        [0, 0.1, 0.9, 1],
        [0, particle.opacity, particle.opacity, 0]
      );

      return {
        transform: [
          { translateY: translateY * particle.speed },
          { translateX: translateX * particle.speed },
        ],
        opacity,
      };
    });

    return (
      <Animated.View
        style={[
          styles.particle,
          {
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
          },
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.particleDot,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
            },
          ]}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {particles.map((particle) => (
        <ParticleComponent key={particle.id} particle={particle} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
  },
  particleDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default ParticleBackground; 
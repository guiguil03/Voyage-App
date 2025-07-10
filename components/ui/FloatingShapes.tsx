import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Shape {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'circle' | 'square' | 'triangle';
}

const FloatingShapes: React.FC = () => {
  const shapes: Shape[] = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * screenWidth,
    y: Math.random() * screenHeight,
    size: Math.random() * 60 + 40,
    duration: Math.random() * 8000 + 6000,
    delay: Math.random() * 2000,
    type: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle',
  }));

  const FloatingShape: React.FC<{ shape: Shape }> = ({ shape }) => {
    const animationValue = useSharedValue(0);
    const rotationValue = useSharedValue(0);

    useEffect(() => {
      animationValue.value = withDelay(
        shape.delay,
        withRepeat(
          withTiming(1, {
            duration: shape.duration,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          true
        )
      );

      rotationValue.value = withRepeat(
        withTiming(360, {
          duration: shape.duration * 2,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
      const translateY = interpolate(
        animationValue.value,
        [0, 0.5, 1],
        [0, -100, 0]
      );
      
      const translateX = interpolate(
        animationValue.value,
        [0, 0.5, 1],
        [0, 50, 0]
      );

      const scale = interpolate(
        animationValue.value,
        [0, 0.5, 1],
        [1, 1.2, 1]
      );

      const opacity = interpolate(
        animationValue.value,
        [0, 0.5, 1],
        [0.3, 0.7, 0.3]
      );

      const rotation = interpolate(
        rotationValue.value,
        [0, 360],
        [0, 360]
      );

      return {
        transform: [
          { translateY },
          { translateX },
          { scale },
          { rotate: `${rotation}deg` },
        ],
        opacity,
      };
    });

    const renderShape = () => {
      const baseStyle = {
        width: shape.size,
        height: shape.size,
      };

      switch (shape.type) {
        case 'circle':
          return (
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.4)', 'rgba(118, 75, 162, 0.4)']}
              style={[baseStyle, { borderRadius: shape.size / 2 }]}
            />
          );
        case 'square':
          return (
            <LinearGradient
              colors={['rgba(255, 107, 107, 0.4)', 'rgba(255, 142, 83, 0.4)']}
              style={[baseStyle, { borderRadius: 12 }]}
            />
          );
        case 'triangle':
          return (
            <View
              style={[
                styles.triangle,
                {
                  borderBottomWidth: shape.size,
                  borderLeftWidth: shape.size / 2,
                  borderRightWidth: shape.size / 2,
                },
              ]}
            />
          );
        default:
          return null;
      }
    };

    return (
      <Animated.View
        style={[
          styles.shape,
          {
            left: shape.x,
            top: shape.y,
          },
          animatedStyle,
        ]}
      >
        {renderShape()}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {shapes.map((shape) => (
        <FloatingShape key={shape.id} shape={shape} />
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
    zIndex: 0,
  },
  shape: {
    position: 'absolute',
  },
  triangle: {
    width: 0,
    height: 0,
    borderBottomColor: 'rgba(78, 205, 196, 0.4)',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'solid',
  },
});

export default FloatingShapes;
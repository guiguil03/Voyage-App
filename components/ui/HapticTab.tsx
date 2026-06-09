import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const isSelected = props.accessibilityState?.selected ?? false;

  const scale   = useRef(new Animated.Value(isSelected ? 1 : 0.7)).current;
  const opacity = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const glow    = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isSelected ? 1 : 0.7,
        useNativeDriver: true,
        damping: 14,
        stiffness: 180,
      }),
      Animated.timing(opacity, {
        toValue: isSelected ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: isSelected ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSelected]);

  return (
    <PlatformPressable
      {...props}
      style={[props.style, styles.btn]}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    >
      <View style={styles.inner}>
        {/* Halo de glow derrière la pill */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
              transform: [{ scale: scale.interpolate({ inputRange: [0.7, 1], outputRange: [0.6, 1.4] }) }],
            },
          ]}
        />
        {/* Pill glass active */}
        <Animated.View
          style={[
            styles.pill,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        />
        {/* Icône + label */}
        {props.children}
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pill: {
    position: 'absolute',
    top: 6,
    width: 52,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245,237,214,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,237,214,0.28)',
  },
  glow: {
    position: 'absolute',
    top: -2,
    width: 60,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245,237,214,0.12)',
  },
});

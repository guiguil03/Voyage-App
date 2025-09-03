import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AnimatedModeToggleProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
  disabled?: boolean;
}

export default function AnimatedModeToggle({ 
  mode, 
  onModeChange, 
  disabled = false 
}: AnimatedModeToggleProps) {
  const slideAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: mode === 'signin' ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [mode, slideAnimation]);

  const translateX = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100], // Ajustez selon la largeur de votre conteneur
  });

  return (
    <View style={styles.modeIndicator}>
      <Animated.View
        style={[
          styles.activeTab,
          {
            transform: [{ translateX }],
          },
        ]}
      />
      
      <TouchableOpacity
        style={[styles.modeTab, mode === 'signin' && styles.modeTabActive]}
        onPress={() => onModeChange('signin')}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.modeTabText, mode === 'signin' && styles.modeTabTextActive]}>
          Connexion
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
        onPress={() => onModeChange('signup')}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
          Inscription
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  modeIndicator: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
    position: 'relative',
  },
  activeTab: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    backgroundColor: '#2F7417',
    borderRadius: 8,
    width: '50%',
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 1,
  },
  modeTabActive: {
    // Styles pour l'onglet actif (géré par l'animation)
  },
  modeTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
});

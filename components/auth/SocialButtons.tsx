import { signInWithProvider } from '@/lib/auth-client';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SocialButtons() {
  // Animations pour chaque bouton
  const facebookAnimation = useRef(new Animated.Value(1)).current;
  const googleAnimation = useRef(new Animated.Value(1)).current;
  const appleAnimation = useRef(new Animated.Value(1)).current;

  const animateButton = (animation: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSocialLogin = async (provider: 'apple' | 'facebook' | 'google') => {
    // Animation en fonction du provider
    switch (provider) {
      case 'facebook':
        animateButton(facebookAnimation);
        break;
      case 'google':
        animateButton(googleAnimation);
        break;
      case 'apple':
        animateButton(appleAnimation);
        break;
    }

    try {
      const result = await signInWithProvider(provider);
      if (result.data) {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error(`Erreur de connexion ${provider}:`, error);
      Alert.alert('Erreur', `Erreur lors de la connexion avec ${provider}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>ou continuer avec</Text>
        <View style={styles.divider} />
      </View>

      {/* Boutons Facebook et Google côte à côte */}
      <View style={styles.socialButtonsRow}>
        <Animated.View 
          style={[
            styles.socialButtonWrapper,
            { transform: [{ scale: facebookAnimation }] }
          ]}
        >
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('facebook')}
          >
            <LinearGradient
              colors={['rgba(24, 119, 242, 0.8)', 'rgba(24, 119, 242, 0.6)']}
              style={styles.socialButtonGradient}
            >
              <Ionicons name="logo-facebook" size={22} color="#FFFFFF" />
              <Text style={styles.socialButtonText}>Facebook</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View 
          style={[
            styles.socialButtonWrapper,
            { transform: [{ scale: googleAnimation }] }
          ]}
        >
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('google')}
          >
            <View style={styles.googleButton}>
              <Ionicons name="logo-google" size={22} color="#4285F4" />
              <Text style={styles.googleButtonText}>Google</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bouton Apple pleine largeur */}
      <Animated.View 
        style={[
          styles.appleButtonContainer,
          { transform: [{ scale: appleAnimation }] }
        ]}
      >
        <TouchableOpacity
          style={styles.appleButton}
          onPress={() => handleSocialLogin('apple')}
        >
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.8)', 'rgba(50, 50, 50, 0.8)']}
            style={styles.appleButtonGradient}
          >
            <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
            <Text style={styles.appleButtonText}>Continuer avec Apple</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 25,
    paddingBottom: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 15,
  },
  socialButtonWrapper: {
    flex: 1,
  },
  socialButton: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  socialButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  googleButtonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
  },
  appleButtonContainer: {
    width: '100%',
  },
  appleButton: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  appleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
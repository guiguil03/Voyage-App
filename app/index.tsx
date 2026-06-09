import { useAuth } from '@/features/auth/hooks/useAuth';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function IndexScreen() {
  const { isConnected, loading } = useAuth();

  useEffect(() => {
    console.log('🔍 IndexScreen - État:', { isConnected, loading });
    
    if (!loading) {
      if (isConnected) {
        // Utilisateur connecté → App principale
        console.log('✅ Utilisateur connecté, redirection vers home...');
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 100);
      } else {
        // Utilisateur non connecté → Page de login
        console.log('❌ Utilisateur non connecté, redirection vers login...');
        setTimeout(() => {
          router.replace('/login');
        }, 100);
      }
    }
  }, [isConnected, loading]);

  // Afficher un loader pendant la vérification
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>
        {loading ? 'Vérification...' : 'Redirection...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
}); 
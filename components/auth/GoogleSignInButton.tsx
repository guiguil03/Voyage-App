import { signInWithGoogleMobile } from '@/lib/google-auth-mobile';
import { signInWithGoogleWeb } from '@/lib/google-auth-web';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert, Platform, StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (loading) return;

    console.log('🔘 Bouton Google cliqué !');
    console.log('🔧 Platform:', Platform.OS);
    
    setLoading(true);
    try {
      console.log('🚀 Tentative de connexion Google...');
      
      // Utiliser la méthode appropriée selon la plateforme
      const { data, error } = Platform.OS === 'web' 
        ? await signInWithGoogleWeb()
        : await signInWithGoogleMobile();
      
      if (error) {
        console.error('❌ Erreur Google:', error);
        Alert.alert('Erreur de connexion', error);
        onError?.(error);
      } else if (data?.user) {
        console.log('🎉 Authentification Google réussie !');
        // La redirection sera gérée automatiquement par useAuth
        onSuccess?.();
      } else if (data?.type === 'success') {
        console.log('🎉 Authentification Google réussie !');
        // La redirection sera gérée automatiquement par useAuth
        onSuccess?.();
      } else if (data?.type === 'cancel') {
        console.log('⚠️ Authentification annulée');
        // Pas d'alerte pour l'annulation, c'est normal
      } else {
        console.log('✅ Redirection Google en cours...');
        // L'utilisateur va être redirigé vers Google
        // Le retour sera géré automatiquement
      }
      
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur inattendue';
      console.error('❌ Erreur inattendue:', errorMessage);
      Alert.alert('Erreur', errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handleGoogleSignIn}
      disabled={loading}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator size="small" color="#4285F4" style={styles.icon} />
        ) : (
          <Ionicons name="logo-google" size={20} color="#4285F4" style={styles.icon} />
        )}
        <Text style={styles.buttonText}>
          {loading ? 'Connexion...' : 'Continuer avec Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});

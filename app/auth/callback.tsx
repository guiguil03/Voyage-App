import { handleAuthCallback } from '@/lib/google-auth-web';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function AuthCallbackScreen() {
  useEffect(() => {
    const processCallback = async () => {
      try {
        // Récupérer l'URL actuelle avec les paramètres OAuth
        const url = window.location.href;
        
        console.log('🔄 Traitement du callback OAuth...');
        const { user, error } = await handleAuthCallback(url);
        
        if (error) {
          console.error('❌ Erreur callback:', error);
          // Rediriger vers login avec erreur
          router.replace('/login?error=' + encodeURIComponent(error));
        } else if (user) {
          console.log('🎉 Authentification réussie !');
          // Rediriger vers l'accueil
          router.replace('/(tabs)/home');
        } else {
          console.warn('⚠️ Pas d\'utilisateur dans le callback');
          router.replace('/login');
        }
      } catch (error: any) {
        console.error('❌ Erreur traitement callback:', error);
        router.replace('/login?error=' + encodeURIComponent(error.message));
      }
    };

    // Délai pour laisser le temps à la page de se charger
    const timer = setTimeout(processCallback, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2F7417" />
      <Text style={styles.text}>Finalisation de la connexion...</Text>
      <Text style={styles.subtext}>Veuillez patienter</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 20,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

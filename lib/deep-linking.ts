import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { handleAuthCallback } from './google-auth-web';

export const setupDeepLinking = () => {
  // Écouter les liens entrants
  const handleDeepLink = (url: string) => {
    console.log('🔗 Lien profond reçu:', url);
    
    // Ignorer les URLs localhost qui causent des problèmes
    if (url.includes('localhost:8081')) {
      console.log('⚠️ URL localhost ignorée:', url);
      return;
    }
    
    // Gérer les callbacks OAuth
    if (url.includes('auth/callback') || 
        url.includes('supabase.co/auth/v1/callback') ||
        url.includes('access_token=') ||
        url.includes('refresh_token=') ||
        url.includes('#access_token=') ||
        url.startsWith('voyageapp://')) {
      console.log('🔄 Callback OAuth détecté, traitement...');
      handleAuthCallbackDeepLink(url);
    }
  };

  // Écouter les liens quand l'app est ouverte
  const subscription = Linking.addEventListener('url', (event) => {
    handleDeepLink(event.url);
  });

  // Vérifier s'il y a un lien au démarrage
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink(url);
    }
  });

  return () => subscription?.remove();
};

const handleAuthCallbackDeepLink = async (url: string) => {
  try {
    console.log('🔄 Traitement du callback d\'authentification (Deep Link):', url);
    
    // Utiliser la fonction de callback centralisée
    const { user, error } = await handleAuthCallback(url);
    
    if (error) {
      console.error('❌ Erreur dans le callback:', error);
      router.replace('/login?error=' + encodeURIComponent(error));
      return;
    }

    if (user) {
      console.log('🎉 Utilisateur connecté via deep link:', user.email);
      
      // Rediriger vers l'accueil
      console.log('🏠 Redirection vers l\'accueil...');
      router.replace('/(tabs)/home');
    } else {
      console.warn('⚠️ Pas d\'utilisateur dans le callback');
      router.replace('/login');
    }
    
  } catch (error: any) {
    console.error('❌ Erreur traitement callback deep link:', error);
    router.replace('/login?error=' + encodeURIComponent(error.message));
  }
};



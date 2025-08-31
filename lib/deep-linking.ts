import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from './supabase';

export const setupDeepLinking = () => {
  // Écouter les liens entrants
  const handleDeepLink = (url: string) => {
    console.log('🔗 Lien profond reçu:', url);
    
    if (url.includes('auth/callback')) {
      handleAuthCallback(url);
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

const handleAuthCallback = async (url: string) => {
  try {
    console.log('🔄 Traitement du callback d\'authentification:', url);
    
    // Extraire les paramètres de l'URL
    const urlObj = new URL(url);
    const accessToken = urlObj.searchParams.get('access_token');
    const refreshToken = urlObj.searchParams.get('refresh_token');
    const error = urlObj.searchParams.get('error');
    
    if (error) {
      console.error('❌ Erreur dans le callback:', error);
      router.replace('/login?error=' + encodeURIComponent(error));
      return;
    }

    if (accessToken) {
      console.log('✅ Token d\'accès reçu, finalisation...');
      
      // Récupérer la session utilisateur
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erreur session:', sessionError);
        router.replace('/login?error=' + encodeURIComponent(sessionError.message));
        return;
      }

      if (session?.user) {
        console.log('🎉 Utilisateur connecté:', session.user.email);
        
        // Créer ou mettre à jour le profil
        await createOrUpdateProfile(session.user);
        
        // Rediriger vers l'accueil
        console.log('🏠 Redirection vers l\'accueil...');
        router.replace('/(tabs)/home');
      } else {
        console.warn('⚠️ Pas de session utilisateur');
        router.replace('/login');
      }
    } else {
      console.warn('⚠️ Pas de token dans le callback');
      router.replace('/login');
    }
    
  } catch (error: any) {
    console.error('❌ Erreur traitement callback:', error);
    router.replace('/login?error=' + encodeURIComponent(error.message));
  }
};

// Fonction pour créer ou mettre à jour le profil utilisateur
const createOrUpdateProfile = async (user: any) => {
  if (!supabase) return;

  try {
    console.log('📝 Création/mise à jour du profil...');
    
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      updated_at: new Date().toISOString(),
    };

    // Utiliser upsert pour créer ou mettre à jour
    const { error } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      });

    if (error) {
      console.error('❌ Erreur lors de la gestion du profil:', error);
    } else {
      console.log('✅ Profil créé/mis à jour avec succès');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la gestion du profil:', error);
  }
};

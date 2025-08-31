import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configuration pour OAuth web
WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogleWeb = async () => {
  try {
    if (!supabase) {
      console.error('❌ Supabase non configuré');
      return { data: null, error: 'Supabase non configuré' };
    }

    console.log('🚀 Démarrage de l\'authentification Google...');
    
    // Vérifier d'abord si Google est configuré en testant l'endpoint
    try {
      const testUrl = 'https://eqxgqenvaqexcasjkuaz.supabase.co/auth/v1/providers';
      const testResponse = await fetch(testUrl);
      const providers = await testResponse.json();
      console.log('🔍 Providers disponibles:', providers);
      
      if (!providers.includes('google')) {
        throw new Error('Google OAuth n\'est pas activé dans Supabase. Allez dans Authentication > Providers pour l\'activer.');
      }
    } catch (testError: any) {
      console.warn('⚠️ Impossible de vérifier les providers:', testError.message);
    }
    
    // Utiliser l'URL de callback Supabase standard
    const redirectUrl = 'https://eqxgqenvaqexcasjkuaz.supabase.co/auth/v1/callback';
      
    console.log('🔗 Redirect URL:', redirectUrl);
    console.log('🔧 Platform:', Platform.OS);

    // Version simplifiée qui fonctionne sur toutes les plateformes
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    
    console.log('📊 Réponse OAuth:', { data, error });

    if (error) {
      console.error('❌ Erreur OAuth Google:', error);
      return { data: null, error: error.message };
    }

    // Ouvrir automatiquement l'URL d'authentification
    if (data?.url) {
      console.log('🌐 Ouverture du navigateur pour:', data.url);
      try {
        // Utiliser WebBrowser avec l'URL de callback Supabase
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'https://eqxgqenvaqexcasjkuaz.supabase.co'
        );
        console.log('🔄 Résultat WebBrowser:', result);
        
        if (result.type === 'success') {
          console.log('✅ Authentification réussie via WebBrowser');
          // L'authentification est gérée automatiquement par Supabase
          // L'utilisateur sera connecté automatiquement
          return { data: result, error: null };
        } else if (result.type === 'cancel') {
          return { data: null, error: 'Authentification annulée par l\'utilisateur' };
        }
      } catch (browserError: any) {
        console.error('❌ Erreur WebBrowser:', browserError);
        return { data: null, error: browserError.message };
      }
    }

    console.log('✅ Authentification Google initiée');
    return { data, error: null };

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'authentification Google:', error);
    return { 
      data: null, 
      error: error.message || 'Erreur lors de l\'authentification Google' 
    };
  }
};

export const handleAuthCallback = async (url: string) => {
  try {
    console.log('🔄 Traitement du callback OAuth:', url);
    
    // Extraire les paramètres de l'URL de callback
    const urlObj = new URL(url);
    const accessToken = urlObj.searchParams.get('access_token');
    const refreshToken = urlObj.searchParams.get('refresh_token');
    
    if (accessToken) {
      console.log('✅ Tokens reçus, finalisation de l\'authentification...');
      
             // Récupérer la session utilisateur
       const { data: { user }, error } = await supabase!.auth.getUser(accessToken);
      
      if (error) {
        throw error;
      }

      if (user) {
        console.log('🎉 Utilisateur authentifié:', user.email);
        await createOrUpdateProfile(user);
        return { user, error: null };
      }
    }
    
    throw new Error('Tokens non reçus dans le callback');
    
  } catch (error: any) {
    console.error('❌ Erreur callback OAuth:', error);
    return { user: null, error: error.message };
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

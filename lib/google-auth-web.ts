import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { getOAuthRedirectUrl } from './oauth-config';
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
    console.log('🔧 Platform:', Platform.OS);
    
    // Vérifier d'abord si Google est configuré en testant l'endpoint
    try {
      const testUrl = 'https://eqxgqenvaqexcasjkuaz.supabase.co/auth/v1/providers';
      const testResponse = await fetch(testUrl, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeGdxZW52YXFleGNhc2prdWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNDU0MDcsImV4cCI6MjA2ODkyMTQwN30.oODlr-BaIy0P_4woaxXj_ImuZ2ZpRnLyuOgFSuIp93g'
        }
      });
      const providers = await testResponse.json();
      console.log('🔍 Providers disponibles:', providers);
      
      // Vérifier si providers est un tableau et contient 'google'
      if (Array.isArray(providers) && !providers.includes('google')) {
        throw new Error('Google OAuth n\'est pas activé dans Supabase. Allez dans Authentication > Providers pour l\'activer.');
      }
    } catch (testError: any) {
      console.warn('⚠️ Impossible de vérifier les providers:', testError.message);
      // Continuer quand même, car l'authentification peut fonctionner même si la vérification échoue
    }
    
    // Configuration différente selon la plateforme
    if (Platform.OS === 'web') {
      // Pour le web, utiliser l'approche standard
      const redirectUrl = getOAuthRedirectUrl();
      console.log('🔗 Redirect URL (Web):', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      console.log('📊 Réponse OAuth (Web):', { data, error });

      if (error) {
        console.error('❌ Erreur OAuth Google:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } else {
      // Pour mobile, utiliser une approche différente
      console.log('📱 Mode mobile - Configuration spéciale...');
      
      // Pour mobile, ne pas spécifier de redirectTo pour laisser Supabase gérer
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Ne pas spécifier redirectTo pour mobile - Supabase gère automatiquement
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      console.log('📊 Réponse OAuth (Mobile):', { data, error });

      if (error) {
        console.error('❌ Erreur OAuth Google:', error);
        return { data: null, error: error.message };
      }

      // Ouvrir automatiquement l'URL d'authentification sur mobile
      if (data?.url) {
        console.log('🌐 Ouverture du navigateur mobile pour:', data.url);
        try {
          // Utiliser WebBrowser sans URL de callback spécifique
          // Supabase gérera automatiquement le retour
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            'voyageapp://' // Utiliser le scheme de l'app
          );
          console.log('🔄 Résultat WebBrowser (Mobile):', result);
          
          if (result.type === 'success') {
            console.log('✅ Authentification réussie via WebBrowser mobile');
            
            // Traiter l'URL de callback reçue
            if (result.url) {
              console.log('🔗 URL de callback reçue:', result.url);
              const { user, error: callbackError } = await handleAuthCallback(result.url);
              
              if (callbackError) {
                return { data: null, error: callbackError };
              }
              
              return { data: { user }, error: null };
            }
            
            // Si pas d'URL de callback, attendre et vérifier la session
            console.log('⚠️ Pas d\'URL de callback, vérification de la session...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const { data: { session }, error: sessionError } = await supabase!.auth.getSession();
            if (sessionError) {
              return { data: null, error: sessionError.message };
            }
            
            if (session?.user) {
              console.log('✅ Session trouvée après callback:', session.user.email);
              await createOrUpdateProfile(session.user);
              return { data: { user: session.user }, error: null };
            }
            
            return { data: result, error: null };
          } else if (result.type === 'cancel') {
            return { data: null, error: 'Authentification annulée par l\'utilisateur' };
          }
        } catch (browserError: any) {
          console.error('❌ Erreur WebBrowser mobile:', browserError);
          return { data: null, error: browserError.message };
        }
      }

      console.log('✅ Authentification Google mobile initiée');
      return { data, error: null };
    }

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
    
    // Vérifier si l'URL contient des paramètres OAuth
    if (!url.includes('access_token') && !url.includes('refresh_token') && !url.includes('error')) {
      console.log('⚠️ URL ne contient pas de paramètres OAuth, vérification de la session actuelle...');
      
      // Attendre un peu pour que Supabase traite le callback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Essayer de récupérer la session actuelle
      const { data: { session }, error: currentSessionError } = await supabase!.auth.getSession();
      
      if (currentSessionError) {
        console.error('❌ Erreur session actuelle:', currentSessionError);
        throw currentSessionError;
      }
      
      if (session?.user) {
        console.log('✅ Session actuelle trouvée:', session.user.email);
        await createOrUpdateProfile(session.user);
        return { user: session.user, error: null };
      }
      
      throw new Error('Aucune session utilisateur trouvée');
    }
    
    // Extraire les paramètres de l'URL de callback
    const urlObj = new URL(url);
    
    // Les tokens peuvent être dans les paramètres de requête (?) ou dans le fragment (#)
    let accessToken = urlObj.searchParams.get('access_token');
    let refreshToken = urlObj.searchParams.get('refresh_token');
    let errorParam = urlObj.searchParams.get('error');
    
    // Si pas trouvé dans les paramètres, chercher dans le fragment
    if (!accessToken && urlObj.hash) {
      console.log('🔍 Recherche des tokens dans le fragment URL...');
      const fragmentParams = new URLSearchParams(urlObj.hash.substring(1));
      accessToken = fragmentParams.get('access_token');
      refreshToken = fragmentParams.get('refresh_token');
      errorParam = fragmentParams.get('error');
    }
    
    if (errorParam) {
      console.error('❌ Erreur dans l\'URL de callback:', errorParam);
      throw new Error(`Erreur OAuth: ${errorParam}`);
    }
    
    if (accessToken) {
      console.log('✅ Tokens reçus, finalisation de l\'authentification...');
      console.log('🔑 Access token trouvé:', accessToken.substring(0, 20) + '...');
      
      // Définir la session avec les tokens reçus
      const { data: { session }, error: sessionError } = await supabase!.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
      
      if (sessionError) {
        console.error('❌ Erreur lors de la définition de la session:', sessionError);
        throw sessionError;
      }

      if (session?.user) {
        console.log('🎉 Utilisateur authentifié:', session.user.email);
        await createOrUpdateProfile(session.user);
        return { user: session.user, error: null };
      }
    }
    
    throw new Error('Aucune session utilisateur trouvée');
    
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

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configuration Google Sign-In
const GOOGLE_WEB_CLIENT_ID = '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com'; // À remplacer
const GOOGLE_IOS_CLIENT_ID = '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com'; // À remplacer

export const configureGoogleSignIn = () => {
  try {
    // Ne configurer que si on a de vrais credentials
    if (GOOGLE_WEB_CLIENT_ID !== '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com') {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : undefined,
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });
      console.log('✅ Google Sign-In configuré avec credentials réels');
    } else {
      console.log('⚠️ Google Sign-In pas configuré - credentials par défaut détectés');
    }
  } catch (error) {
    console.warn('⚠️ Erreur configuration Google Sign-In:', error);
  }
};

export const signInWithGoogle = async () => {
  try {
    // Vérifier si Google Sign-In est configuré
    if (GOOGLE_WEB_CLIENT_ID === '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com') {
      throw new Error('Google Sign-In n\'est pas encore configuré. Veuillez suivre les instructions dans GOOGLE_AUTH_SETUP.md');
    }

    console.log('🔍 Vérification des services Google Play...');
    await GoogleSignin.hasPlayServices();
    
    console.log('🚀 Démarrage de la connexion Google...');
    const userInfo = await GoogleSignin.signIn();
    
    if (!userInfo.idToken) {
      throw new Error('Pas de token ID reçu de Google');
    }

    console.log('✅ Connexion Google réussie:', userInfo.user.email);
    
    // Connexion à Supabase avec le token Google
    console.log('🔐 Connexion à Supabase...');
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: userInfo.idToken,
    });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      throw error;
    }

    console.log('🎉 Connexion Supabase réussie !');
    
    // Créer ou mettre à jour le profil utilisateur
    if (data.user) {
      await createOrUpdateProfile(data.user, userInfo.user);
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Erreur lors de la connexion Google:', error);
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { data: null, error: 'Connexion annulée par l\'utilisateur' };
    } else if (error.code === statusCodes.IN_PROGRESS) {
      return { data: null, error: 'Connexion déjà en cours' };
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { data: null, error: 'Google Play Services non disponible' };
    } else {
      return { data: null, error: error.message || 'Erreur de connexion' };
    }
  }
};

export const signOutGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    await supabase.auth.signOut();
    console.log('✅ Déconnexion réussie');
    return { error: null };
  } catch (error: any) {
    console.error('❌ Erreur lors de la déconnexion:', error);
    return { error: error.message };
  }
};

export const getCurrentGoogleUser = async () => {
  try {
    const userInfo = await GoogleSignin.signInSilently();
    return userInfo;
  } catch (error) {
    console.log('Aucun utilisateur Google connecté');
    return null;
  }
};

// Fonction pour créer ou mettre à jour le profil utilisateur
const createOrUpdateProfile = async (supabaseUser: any, googleUser: any) => {
  if (!supabase) return;

  try {
    // Vérifier si le profil existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', supabaseUser.id)
      .single();

    const profileData = {
      id: supabaseUser.id,
      email: supabaseUser.email || googleUser.email,
      full_name: googleUser.name || supabaseUser.user_metadata?.full_name,
      avatar_url: googleUser.photo || supabaseUser.user_metadata?.avatar_url,
      updated_at: new Date().toISOString(),
    };

    if (existingProfile) {
      // Mettre à jour le profil existant
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', supabaseUser.id);

      if (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
      }
    } else {
      // Créer un nouveau profil
      const { error } = await supabase
        .from('profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Erreur lors de la création du profil:', error);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la gestion du profil:', error);
  }
};

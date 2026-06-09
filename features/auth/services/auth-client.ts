import { supabase } from '@/lib/supabase';

// Mode test local quand Supabase n'est pas configuré
const createTestSession = (email: string) => ({
  access_token: 'test-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'test-refresh',
  user: {
    id: 'test-user-id',
    email: email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    confirmation_sent_at: null,
    recovery_sent_at: null,
    email_change_sent_at: null,
    new_email: null,
    invited_at: null,
    action_link: null,
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: null,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    phone: null,
    new_phone: null,
    phone_change_sent_at: null,
    email_change_confirm_status: 0,
    banned_until: null,
    deleted_at: null,
    is_sso_user: false,
    identities: []
  }
});

// Vérifier si Supabase est configuré
const checkSupabaseConfig = () => {
  if (!supabase) {
    console.warn('⚠️ Supabase n\'est pas configuré. Mode test local activé.');
    return null;
  }
  return supabase;
};

// Helper pour formater les messages d'erreur
const formatErrorMessage = (error: any) => {
  if (error.message?.includes('rate limit')) {
    return 'Trop de tentatives. Veuillez patienter quelques instants avant de réessayer.';
  }
  if (error.message?.includes('security purposes')) {
    return 'Trop de tentatives récentes. Veuillez patienter avant de réessayer.';
  }
  if (error.message?.includes('Invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (error.message?.includes('User already registered')) {
    return 'Un compte existe déjà avec cet email. Essayez de vous connecter.';
  }
  if (error.message?.includes('Password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  if (error.message?.includes('Unable to validate email address')) {
    return 'Adresse email invalide.';
  }
  return error.message || 'Une erreur est survenue.';
};

// Valider le token JWT
const validateJWTToken = (session: any) => {
  if (!session || !session.access_token) {
    return false;
  }

  // Si c'est un token de test, l'accepter
  if (session.access_token === 'test-token') {
    return true;
  }

  try {
    // Décoder le payload du token JWT (simple validation)
    const payload = JSON.parse(atob(session.access_token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // Vérifier l'expiration
    if (payload.exp && now >= payload.exp) {
      console.warn('Token JWT expiré');
      return false;
    }

    // Vérifier l'issuer et autres claims critiques
    if (payload.iss && !payload.iss.includes('supabase')) {
      console.warn('Token JWT invalide - issuer incorrect');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la validation du token JWT:', error);
    return false;
  }
};

// Fonction de connexion par email/mot de passe
export const signIn = {
  email: async ({ email, password }: { email: string; password: string }) => {
    try {
      const client = checkSupabaseConfig();
      
      // Validation côté client
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Format d\'email invalide');
      }

      // Mode test local si Supabase n'est pas configuré
      if (!client) {
        console.log('🧪 Mode test local - Création session test pour:', email);
        
        const testSession = createTestSession(email);
        
        // Simuler un délai de réseau
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Stocker la session de test localement
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('test-session', JSON.stringify(testSession));
          } else {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem('test-session', JSON.stringify(testSession));
          }
        } catch (storageError) {
          console.warn('⚠️ Impossible de stocker la session test:', storageError);
        }
        
        return { 
          data: { 
            session: testSession,
            user: testSession.user 
          }, 
          error: null 
        };
      }
      
      // Mode Supabase normal
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const formattedError = new Error(formatErrorMessage(error));
        throw formattedError;
      }

      // Valider le token JWT reçu
      if (data.session && !validateJWTToken(data.session)) {
        throw new Error('Token de sécurité invalide');
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Erreur de connexion:', error.message);
      throw error;
    }
  }
};

// Fonction d'inscription
export const signUp = {
  email: async ({ email, password }: { email: string; password: string }) => {
    try {
      const client = checkSupabaseConfig();
      
      // Validation côté client
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Format d\'email invalide');
      }

      if (password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      // Mode test local si Supabase n'est pas configuré
      if (!client) {
        console.log('🧪 Mode test local - Création compte test pour:', email);
        
        const testSession = createTestSession(email);
        
        // Simuler un délai de réseau
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Stocker la session de test localement
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('test-session', JSON.stringify(testSession));
          } else {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem('test-session', JSON.stringify(testSession));
          }
        } catch (storageError) {
          console.warn('⚠️ Impossible de stocker la session test:', storageError);
        }
        
        return { 
          data: { 
            session: testSession,
            user: testSession.user 
          }, 
          error: null 
        };
      }

      // Mode Supabase normal
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          // Pas de redirection email pour simplifier le processus
          emailRedirectTo: undefined,
        }
      });

      if (error) {
        const formattedError = new Error(formatErrorMessage(error));
        throw formattedError;
      }

      // Valider le token JWT reçu si présent
      if (data.session && !validateJWTToken(data.session)) {
        throw new Error('Token de sécurité invalide');
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error.message);
      throw error;
    }
  }
};

// Fonction de déconnexion ROBUSTE
export const signOut = async () => {
  console.log('🚪 Début de la déconnexion...');
  
  try {
    const client = checkSupabaseConfig();
    
    if (client) {
      console.log('🔄 Tentative de déconnexion Supabase...');
      const { error } = await client.auth.signOut();
      
      if (error) {
        console.warn('⚠️ Erreur Supabase lors de la déconnexion:', error.message);
        // Continue quand même pour nettoyer localement
      } else {
        console.log('✅ Déconnexion Supabase réussie');
      }
    } else {
      console.log('⚠️ Mode test local - Déconnexion locale uniquement');
    }

    // Nettoyer le storage local de manière forcée
    console.log('🧹 Nettoyage du storage local...');
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web
        const keys = Object.keys(window.localStorage);
        keys.forEach((key: string) => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('session') || key.includes('test-session')) {
            window.localStorage.removeItem(key);
          }
        });
      } else {
        // React Native
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter((key: string) => 
          key.includes('supabase') || key.includes('auth') || key.includes('session') || key.includes('test-session')
        );
        if (authKeys.length > 0) {
          await AsyncStorage.multiRemove(authKeys);
        }
      }
      console.log('✅ Storage local nettoyé');
    } catch (storageError) {
      console.warn('⚠️ Erreur lors du nettoyage du storage:', storageError);
    }

    console.log('✅ Déconnexion terminée avec succès');
    
  } catch (error: any) {
    console.error('❌ Erreur lors de la déconnexion:', error.message);
    // Même en cas d'erreur, on considère la déconnexion comme réussie
    // car on a nettoyé localement
  }
};

// Fonction pour vider complètement la session (déconnexion forcée)
export const forceSignOut = async () => {
  console.log('💥 Déconnexion FORCÉE...');
  
  // Nettoyer TOUT le storage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.clear();
    }
    console.log('🗑️ Storage entièrement vidé');
  } catch (error) {
    console.warn('⚠️ Impossible de vider le storage:', error);
  }

  // Essayer de déconnecter de Supabase aussi
  try {
    const client = checkSupabaseConfig();
    if (client) {
      await client.auth.signOut();
    }
  } catch (error) {
    console.warn('⚠️ Impossible de déconnecter de Supabase:', error);
  }

  console.log('✅ Déconnexion forcée terminée');
};

// Hook pour obtenir la session utilisateur
export const useSession = () => {
  try {
    const client = checkSupabaseConfig();
    if (!client) {
      return Promise.resolve({ data: { session: null }, error: null });
    }
    return client.auth.getSession();
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    return Promise.resolve({ data: { session: null }, error: null });
  }
};

// Fonction pour obtenir la session actuelle avec validation JWT
export const getSession = async () => {
  try {
    const client = checkSupabaseConfig();
    
    if (!client) {
      console.log('⚠️ Mode test local - Vérification session test...');
      
      // Récupérer la session de test
      try {
        let testSessionStr = null;
        if (typeof window !== 'undefined' && window.localStorage) {
          testSessionStr = window.localStorage.getItem('test-session');
        } else {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          testSessionStr = await AsyncStorage.getItem('test-session');
        }
        
        if (testSessionStr) {
          const testSession = JSON.parse(testSessionStr);
          console.log('✅ Session test trouvée');
          return testSession;
        } else {
          console.log('❌ Aucune session test trouvée');
          return null;
        }
      } catch (storageError) {
        console.warn('⚠️ Erreur lecture session test:', storageError);
        return null;
      }
    }
    
    // Mode Supabase normal
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) throw error;
    
    if (session && !validateJWTToken(session)) {
      // Token invalide, déconnecter l'utilisateur
      console.log('🔴 Token invalide détecté, déconnexion automatique');
      await signOut();
      return null;
    }
    
    return session;
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la session:', error.message);
    return null;
  }
};

// Fonction pour les connexions sociales
export const signInWithProvider = async (provider: 'apple' | 'facebook' | 'google') => {
  try {
    const client = checkSupabaseConfig();
    if (!client) {
      throw new Error('Connexions sociales non disponibles en mode test');
    }
    
    const { data, error } = await client.auth.signInWithOAuth({
      provider: provider as any,
    });

    if (error) {
      const formattedError = new Error(formatErrorMessage(error));
      throw formattedError;
    }
    
    return { data, error: null };
  } catch (error: any) {
    console.error(`Erreur de connexion ${provider}:`, error.message);
    throw error;
  }
}; 
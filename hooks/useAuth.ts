import type { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { forceSignOut, getSession, signOut } from '../lib/auth-client';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour forcer la mise à jour de l'état
  const forceRefresh = async () => {
    console.log('🔄 Mise à jour forcée de l\'état auth...');
    try {
      const currentSession = await getSession();
      console.log('📊 Session forcée récupérée:', currentSession ? 'Connecté' : 'Non connecté');
      setSession(currentSession);
      setError(null);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour forcée:', error);
      setSession(null);
    }
  };

  // Fonction de déconnexion améliorée
  const handleSignOut = async () => {
    console.log('🔥 Déconnexion demandée...');
    setLoading(true);
    setError(null);
    
    try {
      // Première tentative : déconnexion normale
      await signOut();
      
      // Vérifier que la session est bien supprimée
      const currentSession = await getSession();
      if (currentSession) {
        console.log('⚠️ Session encore présente, déconnexion forcée...');
        await forceSignOut();
      }
      
      // Mettre à jour l'état local immédiatement
      setSession(null);
      
      console.log('✅ Déconnexion réussie, redirection vers login...');
      
      // Rediriger vers le login après un petit délai pour s'assurer que l'état est à jour
      setTimeout(() => {
        try {
          router.replace('/login');
        } catch (navError) {
          console.warn('⚠️ Erreur de navigation:', navError);
          // Essayer une navigation alternative
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }, 100);
      
    } catch (signOutError) {
      console.error('❌ Erreur lors de la déconnexion:', signOutError);
      
      // Même en cas d'erreur, forcer la déconnexion locale
      console.log('🔥 Forcing local logout...');
      setSession(null);
      
      try {
        await forceSignOut();
      } catch (forceError) {
        console.error('❌ Erreur lors de la déconnexion forcée:', forceError);
      }
      
      // Rediriger quand même
      setTimeout(() => {
        try {
          router.replace('/login');
        } catch (navError) {
          console.warn('⚠️ Erreur de navigation après échec:', navError);
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rafraîchir l'état de l'authentification
  const refreshAuth = async () => {
    console.log('🔄 Rafraîchissement de l\'authentification...');
    setLoading(true);
    setError(null);
    
    try {
      const currentSession = await getSession();
      console.log('📊 Session récupérée:', currentSession ? 'Connecté' : 'Non connecté');
      setSession(currentSession);
    } catch (refreshError) {
      console.error('❌ Erreur lors du rafraîchissement:', refreshError);
      setError('Erreur lors de la vérification de l\'authentification');
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour détecter l'état de connexion (debug)
  const getAuthStatus = async () => {
    try {
      console.log('🔍 === DIAGNOSTIC AUTHENTIFICATION ===');
      
      if (!supabase) {
        console.log('❌ Supabase non configuré');
        return 'SUPABASE_NOT_CONFIGURED';
      }
      
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('📋 Session Supabase:', session ? 'PRÉSENTE' : 'ABSENTE');
      console.log('📋 Erreur Supabase:', error?.message || 'AUCUNE');
      
      const hookSession = session;
      console.log('📋 Session Hook:', hookSession ? 'PRÉSENTE' : 'ABSENTE');
      
      if (session && hookSession) {
        console.log('✅ État: CONNECTÉ');
        return 'CONNECTED';
      } else if (!session && !hookSession) {
        console.log('❌ État: DÉCONNECTÉ');
        return 'DISCONNECTED';
      } else {
        console.log('⚠️ État: INCOHÉRENT');
        return 'INCONSISTENT';
      }
    } catch (diagError) {
      console.error('❌ Erreur de diagnostic:', diagError);
      return 'ERROR';
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Fonction pour initialiser l'authentification
    const initAuth = async () => {
      console.log('🚀 Initialisation de l\'authentification...');
      
      if (!supabase) {
        console.log('⚠️ Supabase non configuré, mode déconnecté');
        setSession(null);
        setLoading(false);
        return;
      }

      try {
        // Récupérer la session initiale
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erreur lors de la récupération de la session:', error.message);
          setError(error.message);
          setSession(null);
        } else if (mounted) {
          console.log('📱 Session initiale:', session ? 'Trouvée' : 'Aucune');
          setSession(session);
        }
      } catch (initError) {
        console.error('❌ Erreur d\'initialisation:', initError);
        if (mounted) {
          setError('Erreur d\'initialisation de l\'authentification');
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Écouter les changements d'authentification
    let authListener: any = null;
    
    if (supabase) {
      authListener = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          console.log('🔔 Changement d\'état auth:', event, newSession ? 'Session présente' : 'Pas de session');
          
          if (!mounted) return;
          
          if (event === 'SIGNED_OUT' || !newSession) {
            console.log('👋 Utilisateur déconnecté');
            setSession(null);
            setError(null);
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('👤 Utilisateur connecté/token rafraîchi');
            setSession(newSession);
            setError(null);
            
            // Forcer la mise à jour après une petite pause
            setTimeout(() => {
              if (mounted) {
                console.log('🔄 Validation post-connexion...');
                forceRefresh();
              }
            }, 200);
          }
        }
      );
    }

    // Nettoyage
    return () => {
      mounted = false;
      if (authListener) {
        authListener.data?.subscription?.unsubscribe();
      }
    };
  }, []);

  // Calculer l'état de connexion
  const isConnected = !!session;
  const isAuthenticated = isConnected; // Alias pour compatibilité

  return {
    session,
    user: session?.user ?? null,
    loading,
    error,
    signOut: handleSignOut,
    refreshAuth,
    getAuthStatus,
    forceRefresh,
    isConnected,
    isAuthenticated, // Ajout pour compatibilité
  };
} 
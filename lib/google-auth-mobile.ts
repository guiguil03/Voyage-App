import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Configuration pour OAuth mobile
WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogleMobile = async () => {
  try {
    if (!supabase) {
      console.error('❌ Supabase non configuré');
      return { data: null, error: 'Supabase non configuré' };
    }

    console.log('🚀 Démarrage de l\'authentification Google mobile...');
    
    // Utiliser l'approche mobile native de Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Ne pas spécifier redirectTo - Supabase gère automatiquement
        skipBrowserRedirect: false,
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
        // Utiliser WebBrowser avec le scheme de l'app
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'voyageapp://' // Scheme de l'app
        );
        console.log('🔄 Résultat WebBrowser (Mobile):', result);
        
        if (result.type === 'success') {
          console.log('✅ Authentification réussie via WebBrowser mobile');
          
          // Attendre un peu pour que Supabase traite l'authentification
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Vérifier la session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('❌ Erreur session:', sessionError);
            return { data: null, error: sessionError.message };
          }
          
          if (session?.user) {
            console.log('✅ Session trouvée:', session.user.email);
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

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'authentification Google mobile:', error);
    return { 
      data: null, 
      error: error.message || 'Erreur lors de l\'authentification Google mobile' 
    };
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


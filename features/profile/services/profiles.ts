import { supabase } from '@/lib/supabase';

// Types pour les profils
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  phone?: string;
  country?: string;
  city?: string;
  website?: string;
  privacy_level: 'public' | 'friends' | 'private';
  travel_preferences: {
    budget_range?: string;
    travel_style?: string[];
    interests?: string[];
    accommodation_type?: string[];
  };
  notification_settings: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  full_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  phone?: string;
  country?: string;
  city?: string;
  website?: string;
  privacy_level?: 'public' | 'friends' | 'private';
  travel_preferences?: {
    budget_range?: string;
    travel_style?: string[];
    interests?: string[];
    accommodation_type?: string[];
  };
  notification_settings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// Récupérer le profil de l'utilisateur connecté
export async function getCurrentUserProfile(): Promise<{ data: Profile | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    // Essayer de récupérer le profil existant
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur lors de la récupération du profil:', error);
      return { data: null, error: error.message };
    }

    // Si le profil n'existe pas, le créer automatiquement
    if (!data) {
      console.log('🆕 Création d\'un nouveau profil pour l\'utilisateur:', userData.user.email);
      
      const newProfile = {
        id: userData.user.id,
        email: userData.user.email!,
        full_name: userData.user.email?.split('@')[0] || '',
        privacy_level: 'public' as const,
        travel_preferences: {},
        notification_settings: {
          email: true,
          push: true,
          sms: false,
        },
        is_verified: false,
        is_active: true,
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('Erreur lors de la création du profil:', createError);
        return { data: null, error: createError.message };
      }

      return { data: createdProfile, error: null };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return { data: null, error: 'Une erreur inattendue est survenue' };
  }
}

// Créer ou mettre à jour un profil
export async function upsertProfile(profileData: ProfileUpdate): Promise<{ data: Profile | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    // Préparer les données d'insertion/mise à jour
    const upsertData = {
      id: userData.user.id,
      email: userData.user.email!,
      ...profileData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(upsertData)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return { data: null, error: 'Une erreur inattendue est survenue' };
  }
}

// Mettre à jour les préférences de voyage
export async function updateTravelPreferences(preferences: Profile['travel_preferences']): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: 'Supabase non configuré' };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return { error: 'Utilisateur non connecté' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        travel_preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.user.id);

    if (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return { error: 'Une erreur inattendue est survenue' };
  }
}

// Mettre à jour les paramètres de notification
export async function updateNotificationSettings(settings: Profile['notification_settings']): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: 'Supabase non configuré' };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return { error: 'Utilisateur non connecté' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        notification_settings: settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.user.id);

    if (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return { error: 'Une erreur inattendue est survenue' };
  }
}

// Mettre à jour l'avatar
export async function updateAvatar(avatarUrl: string): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: 'Supabase non configuré' };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return { error: 'Utilisateur non connecté' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.user.id);

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'avatar:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return { error: 'Une erreur inattendue est survenue' };
  }
}

// Vérifier la disponibilité d'un nom d'utilisateur
export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error: string | null }> {
  if (!supabase) {
    return { available: false, error: 'Supabase non configuré' };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return { available: false, error: 'Utilisateur non connecté' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .neq('id', userData.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Pas de résultat trouvé, le nom d'utilisateur est disponible
      return { available: true, error: null };
    }

    if (error) {
      console.error('Erreur lors de la vérification du nom d\'utilisateur:', error);
      return { available: false, error: error.message };
    }

    // Un utilisateur avec ce nom existe déjà
    return { available: false, error: null };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return { available: false, error: 'Une erreur inattendue est survenue' };
  }
} 

// Récupérer tous les profils utilisateurs publics et actifs
export async function getAllPublicProfiles(): Promise<{ data: Profile[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .eq('privacy_level', 'public');
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error: 'Erreur inattendue' };
  }
} 

// Récupérer un profil par ID
export async function getProfileById(id: string): Promise<{ data: Profile | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
} 
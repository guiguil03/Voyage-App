import { supabase, Voyage, VoyageInsert } from './supabase';

// Fonction pour obtenir l'emoji du drapeau basé sur le pays
const getFlagEmoji = (destination: string): string => {
  const flagMapping: { [key: string]: string } = {
    'france': '🇫🇷',
    'paris': '🇫🇷',
    'espagne': '🇪🇸',
    'madrid': '🇪🇸',
    'barcelone': '🇪🇸',
    'italie': '🇮🇹',
    'rome': '🇮🇹',
    'milan': '🇮🇹',
    'allemagne': '🇩🇪',
    'berlin': '🇩🇪',
    'munich': '🇩🇪',
    'royaume-uni': '🇬🇧',
    'london': '🇬🇧',
    'londre': '🇬🇧',
    'etats-unis': '🇺🇸',
    'usa': '🇺🇸',
    'new york': '🇺🇸',
    'los angeles': '🇺🇸',
    'canada': '🇨🇦',
    'montreal': '🇨🇦',
    'toronto': '🇨🇦',
    'japon': '🇯🇵',
    'tokyo': '🇯🇵',
    'kyoto': '🇯🇵',
    'chine': '🇨🇳',
    'beijing': '🇨🇳',
    'shanghai': '🇨🇳',
    'inde': '🇮🇳',
    'mumbai': '🇮🇳',
    'delhi': '🇮🇳',
    'brésil': '🇧🇷',
    'rio': '🇧🇷',
    'sao paulo': '🇧🇷',
    'australie': '🇦🇺',
    'sydney': '🇦🇺',
    'melbourne': '🇦🇺',
  };

  const destinationLower = destination.toLowerCase();
  for (const [key, flag] of Object.entries(flagMapping)) {
    if (destinationLower.includes(key)) {
      return flag;
    }
  }
  return '🌍'; // Emoji par défaut
};

// Créer un nouveau voyage
export async function createVoyage(voyageData: {
  tripName: string;
  destination: string;
  description?: string;
  imageUrl?: string;
  images?: string[]; // Nouveau champ pour les images multiples
  tripType: string;
  rating: number;
  duration: string;
  memoryText?: string;
  status?: string;
  isPublic?: boolean;
}): Promise<{ data: Voyage | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  try {
    // Obtenir l'utilisateur connecté
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    // Préparer les données d'insertion
    const insertData: VoyageInsert = {
      user_id: userData.user.id,
      trip_name: voyageData.tripName,
      destination: voyageData.destination,
      description: voyageData.description || null,
      image_url: voyageData.imageUrl || null,
      images: voyageData.images || [], // Stocker les images multiples en JSON
      trip_type: voyageData.tripType,
      rating: voyageData.rating,
      duration: voyageData.duration,
      memory_text: voyageData.memoryText || null,
      flag_emoji: getFlagEmoji(voyageData.destination),
      status: voyageData.status || 'Terminé', // Par défaut "Terminé" pour les souvenirs
      is_public: voyageData.isPublic !== undefined ? voyageData.isPublic : true, // Par défaut public
    };

    // Insérer en base de données
    const { data, error } = await supabase
      .from('voyages')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du voyage:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return { data: null, error: 'Une erreur inattendue est survenue' };
  }
}

// Récupérer tous les voyages de l'utilisateur connecté
export async function getUserVoyages(): Promise<{ data: Voyage[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  try {
    // Obtenir l'utilisateur connecté
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    // Récupérer les voyages de l'utilisateur
    const { data, error } = await supabase
      .from('voyages')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des voyages:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return { data: null, error: 'Une erreur inattendue est survenue' };
  }
}

// Récupérer tous les voyages (pour la section "amis")
export async function getAllVoyages(): Promise<{ data: any[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  try {
    // Récupérer tous les voyages avec les infos utilisateur
    const { data, error } = await supabase
      .from('voyages')
      .select(`
        *,
        profiles!user_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Erreur lors de la récupération de tous les voyages:', error);
      return { data: null, error: error.message };
    }

    // Formater les données pour correspondre au format attendu
    const formattedData = data?.map(voyage => ({
      id: voyage.id,
      user: voyage.profiles?.full_name || voyage.profiles?.email?.split('@')[0] || 'Utilisateur',
      name: voyage.trip_name,
      description: voyage.description || voyage.memory_text || voyage.destination,
      drapeau: voyage.flag_emoji,
      image: voyage.image_url,
      created_at: voyage.created_at,
      updated_at: voyage.updated_at
    })) || [];

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return { data: null, error: 'Une erreur inattendue est survenue' };
  }
}

// Supprimer un voyage/souvenir (version sécurisée)
export async function deleteVoyage(voyageId: string): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: 'Supabase non configuré' };
  }

  try {
    // Obtenir l'utilisateur connecté
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return { error: 'Utilisateur non connecté' };
    }

    // Supprimer le voyage (avec vérification que l'utilisateur est propriétaire)
    const { error } = await supabase
      .from('voyages')
      .delete()
      .eq('id', voyageId)
      .eq('user_id', userData.user.id); // Sécurité : seul le propriétaire peut supprimer

    if (error) {
      console.error('Erreur lors de la suppression du voyage:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return { error: 'Une erreur inattendue est survenue' };
  }
} 
import { getCurrentUserProfile } from './profiles';
import { supabase, TripPlan, TripPlanInsert } from './supabase';

/**
 * Interface pour créer une nouvelle planification de voyage
 */
export interface CreateTripPlanData {
  destination: string;
  startDate?: Date | null;
  endDate?: Date | null;
  travelType: 'Solo' | 'Couple' | 'Family' | 'Group';
  interests: string[];
  activityLevel: 'Relax' | 'Balanced' | 'Intense';
}

/**
 * Interface pour l'itinéraire généré par l'IA
 */
export interface GeneratedItinerary {
  days: ItineraryDay[];
  totalEstimatedCost?: number;
  recommendations?: string[];
  generatedAt: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
  estimatedCost?: number;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  location: string;
  startTime?: string;
  endTime?: string;
  estimatedCost?: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Créer une nouvelle planification de voyage
 */
export async function createTripPlan(data: CreateTripPlanData) {
  try {
    if (!supabase) {
      throw new Error('Supabase client non initialisé');
    }
    
    // Obtenir l'utilisateur actuel
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // S'assurer qu'un profil utilisateur existe (le créer automatiquement si nécessaire)
    const { data: profile, error: profileError } = await getCurrentUserProfile();
    
    if (profileError) {
      throw new Error(`Erreur lors de la création/récupération du profil: ${profileError}`);
    }

    if (!profile) {
      throw new Error('Impossible de créer ou récupérer le profil utilisateur');
    }

    console.log('✅ Profil utilisateur confirmé:', profile.email);

    // Préparer les données pour insertion
    const tripPlanData: TripPlanInsert = {
      user_id: user.id,
      destination: data.destination,
      start_date: data.startDate ? data.startDate.toISOString().split('T')[0] : null,
      end_date: data.endDate ? data.endDate.toISOString().split('T')[0] : null,
      travel_type: data.travelType,
      interests: data.interests,
      activity_level: data.activityLevel,
      status: 'pending'
    };

    // Insérer dans la base de données
    const { data: tripPlan, error } = await supabase
      .from('trip_plans')
      .insert([tripPlanData])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la planification:', error);
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
    }

    return { data: tripPlan, error: null };
  } catch (error) {
    console.error('Erreur dans createTripPlan:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Récupérer toutes les planifications de voyage d'un utilisateur
 */
export async function getUserTripPlans() {
  try {
    if (!supabase) {
      throw new Error('Supabase client non initialisé');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data: tripPlans, error } = await supabase
      .from('trip_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des planifications:', error);
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }

    return { data: tripPlans || [], error: null };
  } catch (error) {
    console.error('Erreur dans getUserTripPlans:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Récupérer une planification spécifique par ID
 */
export async function getTripPlan(id: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase client non initialisé');
    }

    const { data: tripPlan, error } = await supabase
      .from('trip_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de la planification:', error);
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }

    return { data: tripPlan, error: null };
  } catch (error) {
    console.error('Erreur dans getTripPlan:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Mettre à jour le statut d'une planification
 */
export async function updateTripPlanStatus(id: string, status: TripPlan['status']) {
  try {
    if (!supabase) {
      throw new Error('Supabase client non initialisé');
    }

    const { data, error } = await supabase
      .from('trip_plans')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erreur dans updateTripPlanStatus:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Sauvegarder l'itinéraire généré pour une planification
 */
export async function saveGeneratedItinerary(tripPlanId: string, itinerary: GeneratedItinerary) {
  try {
    if (!supabase) {
      throw new Error('Supabase client non initialisé');
    }

    const { data, error } = await supabase
      .from('trip_plans')
      .update({ 
        generated_itinerary: itinerary,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', tripPlanId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la sauvegarde de l\'itinéraire:', error);
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erreur dans saveGeneratedItinerary:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Supprimer une planification
 */
export async function deleteTripPlan(id: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase client non initialisé');
    }

    const { error } = await supabase
      .from('trip_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression:', error);
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }

    return { error: null };
  } catch (error) {
    console.error('Erreur dans deleteTripPlan:', error);
    return { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Fonction utilitaire pour formater les dates
 */
export function formatTripPlanDates(tripPlan: TripPlan): { 
  startDate: Date | null; 
  endDate: Date | null; 
  duration: string | null 
} {
  const startDate = tripPlan.start_date ? new Date(tripPlan.start_date) : null;
  const endDate = tripPlan.end_date ? new Date(tripPlan.end_date) : null;
  
  let duration = null;
  if (startDate && endDate) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    duration = `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  }

  return { startDate, endDate, duration };
} 
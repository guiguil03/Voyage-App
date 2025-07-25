import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Configuration du storage selon la plateforme
const createStorage = () => {
  // Vérifier si on est côté client
  if (typeof window === 'undefined' && Platform.OS !== 'ios' && Platform.OS !== 'android') {
    // Côté serveur - retourner un storage vide
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
  }

  if (Platform.OS === 'web') {
    // Pour le web, utiliser localStorage
    return {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return Promise.resolve(window.localStorage.getItem(key));
        }
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        return Promise.resolve();
      },
    };
  } else {
    // Pour React Native, utiliser AsyncStorage
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return AsyncStorage;
    } catch (error) {
      // Fallback si AsyncStorage n'est pas disponible
      return {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
      };
    }
  }
};

// Pour Expo, les variables d'environnement doivent commencer par EXPO_PUBLIC_
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Ne créer le client que si les clés sont disponibles
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}) : null;

// Types pour TypeScript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      voyages: {
        Row: {
          id: string;
          user_id: string;
          trip_name: string;
          destination: string;
          description: string | null;
          image_url: string | null;
          images: string[] | null;
          trip_type: string;
          rating: number;
          duration: string;
          memory_text: string | null;
          flag_emoji: string | null;
          status: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trip_name: string;
          destination: string;
          description?: string | null;
          image_url?: string | null;
          images?: string[] | null;
          trip_type: string;
          rating: number;
          duration: string;
          memory_text?: string | null;
          flag_emoji?: string | null;
          status?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          trip_name?: string;
          destination?: string;
          description?: string | null;
          image_url?: string | null;
          images?: string[] | null;
          trip_type?: string;
          rating?: number;
          duration?: string;
          memory_text?: string | null;
          flag_emoji?: string | null;
          status?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      trip_plans: {
        Row: {
          id: string;
          user_id: string;
          destination: string;
          start_date: string | null;
          end_date: string | null;
          travel_type: string;
          interests: any[] | null;
          activity_level: string;
          status: string;
          generated_itinerary: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          destination: string;
          start_date?: string | null;
          end_date?: string | null;
          travel_type: string;
          interests?: any[] | null;
          activity_level: string;
          status?: string;
          generated_itinerary?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          destination?: string;
          start_date?: string | null;
          end_date?: string | null;
          travel_type?: string;
          interests?: any[] | null;
          activity_level?: string;
          status?: string;
          generated_itinerary?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// Type pour un voyage
export type Voyage = Database['public']['Tables']['voyages']['Row'];
export type VoyageInsert = Database['public']['Tables']['voyages']['Insert'];
export type VoyageUpdate = Database['public']['Tables']['voyages']['Update'];

// Types pour les planifications de voyage
export type TripPlan = Database['public']['Tables']['trip_plans']['Row'];
export type TripPlanInsert = Database['public']['Tables']['trip_plans']['Insert'];
export type TripPlanUpdate = Database['public']['Tables']['trip_plans']['Update']; 
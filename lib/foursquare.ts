/**
 * Service de recherche de lieux avec l'API Foursquare Places
 * Documentation: https://developer.foursquare.com/docs/api-reference/places/search/
 */

export interface FoursquareConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface FoursquareCoordinates {
  lat: number;
  lng: number;
}

export interface FoursquareSearchParams {
  coordinates: FoursquareCoordinates;
  radius?: number; // en mètres (max: 100000)
  categories?: string[]; // IDs de catégories Foursquare
  limit?: number; // max: 50
  query?: string; // recherche textuelle
  price?: number[]; // niveau de prix 1-4
}

export interface FoursquarePlace {
  fsq_id: string; // ID unique Foursquare
  name: string;
  description?: string;
  categories: FoursquareCategory[];
  location: {
    address?: string;
    locality?: string;
    region?: string;
    postcode?: string;
    country?: string;
    formatted_address?: string;
  };
  geocodes: {
    main: {
      latitude: number;
      longitude: number;
    };
  };
  distance?: number;
  rating?: number;
  price?: number;
  hours?: {
    display?: string;
    is_local_holiday?: boolean;
    open_now?: boolean;
  };
  photos?: FoursquarePhoto[];
  website?: string;
  tel?: string;
  email?: string;
  social_media?: {
    facebook_id?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface FoursquareCategory {
  id: string;
  name: string;
  short_name: string;
  plural_name: string;
  icon: {
    prefix: string;
    suffix: string;
  };
}

export interface FoursquarePhoto {
  id: string;
  created_at: string;
  prefix: string;
  suffix: string;
  width: number;
  height: number;
}

export interface FoursquareResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class FoursquareAPI {
  private config: FoursquareConfig;

  constructor(config: FoursquareConfig) {
    this.config = {
      baseUrl: 'https://api.foursquare.com/v3',
      ...config
    };
  }

  /**
   * Recherche des lieux à proximité
   */
  async searchPlaces(params: FoursquareSearchParams): Promise<FoursquareResponse<FoursquarePlace[]>> {
    try {
      const searchParams = new URLSearchParams({
        ll: `${params.coordinates.lat},${params.coordinates.lng}`,
        radius: Math.min(params.radius || 5000, 100000).toString(),
        limit: Math.min(params.limit || 20, 50).toString(),
      });

      // Ajouter les paramètres optionnels
      if (params.query) {
        searchParams.append('query', params.query);
      }

      if (params.categories && params.categories.length > 0) {
        searchParams.append('categories', params.categories.join(','));
      }

      if (params.price && params.price.length > 0) {
        searchParams.append('price', params.price.join(','));
      }

      const url = `${this.config.baseUrl}/places/search?${searchParams}`;
      console.log('🔍 URL Foursquare:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.config.apiKey,
          'User-Agent': 'VoyageApp/1.0',
        },
      });

      console.log('📡 Réponse Foursquare:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        
        // Si c'est une erreur 401 (clé API invalide), on retourne une réponse vide silencieusement
        if (response.status === 401) {
          console.warn('🔑 Clé API Foursquare invalide, service indisponible');
          return {
            success: true,
            data: [],
            message: 'Service Foursquare indisponible (clé API invalide)',
          };
        }
        
        throw new Error(`Foursquare API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Données Foursquare reçues:', data.results?.length || 0, 'lieux');

      return {
        success: true,
        data: data.results || [],
        message: `${data.results?.length || 0} lieux trouvés via Foursquare`,
      };
    } catch (error) {
      // Gestion silencieuse des erreurs pour éviter de polluer les logs
      if (error instanceof Error && error.message.includes('401')) {
        console.warn('🔑 Clé API Foursquare invalide');
        return {
          success: true,
          data: [],
          message: 'Service Foursquare indisponible',
        };
      }
      
      console.warn('⚠️ Erreur Foursquare (service indisponible):', error instanceof Error ? error.message : 'Erreur inconnue');
      return {
        success: true,
        data: [],
        message: 'Service Foursquare temporairement indisponible',
      };
    }
  }

  /**
   * Obtenir les détails d'un lieu spécifique
   */
  async getPlaceDetails(placeId: string): Promise<FoursquareResponse<FoursquarePlace>> {
    try {
      const url = `${this.config.baseUrl}/places/${placeId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.config.apiKey,
        },
      });

      if (!response.ok) {
        // Si c'est une erreur 401 (clé API invalide), on retourne une réponse vide silencieusement
        if (response.status === 401) {
          console.warn('🔑 Clé API Foursquare invalide, détails indisponibles');
          return {
            success: false,
            message: 'Service Foursquare indisponible',
          };
        }
        
        throw new Error(`Foursquare API Error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data,
        message: 'Détails du lieu récupérés',
      };
    } catch (error) {
      // Gestion silencieuse des erreurs pour éviter de polluer les logs
      if (error instanceof Error && error.message.includes('401')) {
        console.warn('🔑 Clé API Foursquare invalide');
        return {
          success: false,
          message: 'Service Foursquare indisponible',
        };
      }
      
      console.warn('⚠️ Erreur détails Foursquare (service indisponible):', error instanceof Error ? error.message : 'Erreur inconnue');
      return {
        success: false,
        message: 'Service Foursquare temporairement indisponible',
      };
    }
  }

  /**
   * Recherche par catégorie avec mapping simplifié
   */
  async searchByCategory(
    coordinates: FoursquareCoordinates,
    category: string,
    options?: {
      radius?: number;
      limit?: number;
    }
  ): Promise<FoursquareResponse<FoursquarePlace[]>> {
    // Mapping des catégories simplifiées vers les IDs Foursquare
    const categoryMapping: { [key: string]: string[] } = {
      'restaurants': ['13065'], // Food and Drink
      'cafes': ['13034', '13035'], // Coffee Shop, Café
      'bars': ['13003'], // Bar
      'hotels': ['19014'], // Hotel
      'museums': ['12026'], // Museum
      'parks': ['16032'], // Park
      'shopping': ['17000'], // Retail
      'entertainment': ['10000'], // Arts and Entertainment
      'attractions': ['12000'], // Building and Residence
      'transport': ['18000'], // Travel and Transportation
    };

    const categoryIds = categoryMapping[category] || [];

    return this.searchPlaces({
      coordinates,
      categories: categoryIds,
      radius: options?.radius || 5000,
      limit: options?.limit || 20,
    });
  }
}

// Instance singleton
let foursquareInstance: FoursquareAPI | null = null;

/**
 * Initialise le service Foursquare
 */
export function initializeFoursquare(config: FoursquareConfig): FoursquareAPI {
  foursquareInstance = new FoursquareAPI(config);
  return foursquareInstance;
}

/**
 * Configuration simplifiée du service Foursquare
 */
export function setupFoursquareService() {
  const apiKey = process.env.EXPO_PUBLIC_FOURSQUARE_API_KEY || 'FUYU1NP0OFV02KNQQ0NOZVAX1BEDQ5MQ53JW2B3SEGM3X2EM';
  
  console.log('🔑 Configuration Foursquare avec clé:', apiKey ? 'Clé présente' : 'Aucune clé');

  return initializeFoursquare({
    apiKey: apiKey,
  });
}

/**
 * Obtient l'instance du service Foursquare
 */
export function getFoursquareService(): FoursquareAPI {
  if (!foursquareInstance) {
    return setupFoursquareService();
  }
  return foursquareInstance;
}

/**
 * Convertit un lieu Foursquare vers le format POI unifié
 */
export function convertFoursquareToUserPOI(place: FoursquarePlace): any {
  return {
    id: place.fsq_id,
    source: 'foursquare',
    name: place.name,
    description: place.description,
    categories: place.categories.map(cat => cat.name),
    coordinates: {
      lat: place.geocodes.main.latitude,
      lng: place.geocodes.main.longitude,
    },
    address: place.location.formatted_address || place.location.address,
    rating: place.rating,
    price: place.price,
    distance: place.distance,
    hours: place.hours,
    website: place.website,
    phone: place.tel,
    photos: place.photos?.map(photo => `${photo.prefix}300x300${photo.suffix}`),
    isOpen: place.hours?.open_now,
  };
}

/**
 * Catégories principales Foursquare
 */
export const FOURSQUARE_CATEGORIES = {
  FOOD_AND_DRINK: '13065',
  RESTAURANT: '13065',
  COFFEE_SHOP: '13034',
  BAR: '13003',
  HOTEL: '19014',
  MUSEUM: '12026',
  PARK: '16032',
  SHOPPING: '17000',
  ENTERTAINMENT: '10000',
  TRANSPORT: '18000',
} as const; 
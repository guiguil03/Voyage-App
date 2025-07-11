/**
 * Service de recherche de lieux touristiques avec OpenTripMap API
 * Documentation API: https://opentripmap.io/docs
 */

// Types pour l'API OpenTripMap
export interface OpenTripMapConfig {
  apiKey: string;
  baseUrl?: string;
  language?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface POISearchParams {
  coordinates: Coordinates;
  radius?: number; // en mètres (max: 50000)
  kinds?: string[]; // categories de POIs
  limit?: number; // nombre de résultats (max: 500)
  minRate?: number; // note minimum (1-7)
  format?: 'json' | 'geojson';
}

export interface POI {
  xid: string; // ID unique OpenTripMap
  name: string;
  description?: string;
  kinds: string; // catégories séparées par des virgules
  coordinates: Coordinates;
  address?: {
    city?: string;
    road?: string;
    house_number?: string;
    postcode?: string;
    country?: string;
  };
  image?: string;
  preview?: {
    source: string;
    height: number;
    width: number;
  };
  wikipedia?: string;
  wikidata?: string;
  rate?: number; // note de 1 à 7
  osm?: string;
  otm?: string;
  distance?: number; // en mètres
  point?: {
    lon: number;
    lat: number;
  };
}

export interface POIDetails extends POI {
  wikipedia_extracts?: {
    title: string;
    text: string;
    html: string;
  };
  url?: string;
  bbox?: {
    lon_min: number;
    lon_max: number;
    lat_min: number;
    lat_max: number;
  };
}

export interface OpenTripMapResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class OpenTripMapAPI {
  private config: OpenTripMapConfig;

  constructor(config: OpenTripMapConfig) {
    this.config = {
      baseUrl: 'https://api.opentripmap.com/0.1',
      language: 'fr',
      ...config
    };
  }

  /**
   * Recherche des points d'intérêt dans un rayon
   */
  async searchPOI(params: POISearchParams): Promise<OpenTripMapResponse<POI[]>> {
    try {
      const searchParams = new URLSearchParams({
        radius: Math.min(params.radius || 5000, 50000).toString(),
        lon: params.coordinates.lng.toString(),
        lat: params.coordinates.lat.toString(),
        limit: Math.min(params.limit || 20, 500).toString(),
        format: params.format || 'json',
        apikey: this.config.apiKey,
      });

      if (params.kinds && params.kinds.length > 0) {
        searchParams.append('kinds', params.kinds.join(','));
      }

      if (params.minRate) {
        searchParams.append('rate', params.minRate.toString());
      }

      const response = await fetch(
        `${this.config.baseUrl}/${this.config.language}/places/radius?${searchParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transformation des données selon le format attendu
      const pois: POI[] = data.features?.map((feature: any) => ({
        xid: feature.properties.xid,
        name: feature.properties.name || 'Point d\'intérêt',
        kinds: feature.properties.kinds || '',
        coordinates: {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
        },
        rate: feature.properties.rate,
        distance: feature.properties.dist,
        point: {
          lon: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
        },
      })) || [];

      return {
        success: true,
        data: pois,
      };
    } catch (error) {
      console.error('Erreur lors de la recherche POI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Obtenir les détails complets d'un POI
   */
  async getPOIDetails(xid: string): Promise<OpenTripMapResponse<POIDetails>> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/${this.config.language}/places/xid/${xid}?apikey=${this.config.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const poiDetails: POIDetails = {
        xid: data.xid,
        name: data.name || 'Point d\'intérêt',
        description: data.wikipedia_extracts?.text || data.info?.descr,
        kinds: data.kinds || '',
        coordinates: {
          lat: data.point?.lat || 0,
          lng: data.point?.lon || 0,
        },
        address: data.address || {},
        image: data.preview?.source || data.image,
        preview: data.preview,
        wikipedia: data.wikipedia,
        wikidata: data.wikidata,
        rate: data.rate,
        osm: data.osm,
        otm: data.otm,
        point: data.point,
        wikipedia_extracts: data.wikipedia_extracts,
        url: data.url,
        bbox: data.bbox,
      };

      return {
        success: true,
        data: poiDetails,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des détails POI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Recherche de lieux par catégorie spécifique
   */
  async searchByCategory(
    coordinates: Coordinates,
    category: string,
    options?: {
      radius?: number;
      limit?: number;
      minRate?: number;
    }
  ): Promise<OpenTripMapResponse<POI[]>> {
    return this.searchPOI({
      coordinates,
      kinds: [category],
      radius: options?.radius,
      limit: options?.limit,
      minRate: options?.minRate,
    });
  }

  /**
   * Recherche dans une zone géographique (bounding box)
   */
  async searchInBbox(
    bbox: {
      lon_min: number;
      lat_min: number;
      lon_max: number;
      lat_max: number;
    },
    options?: {
      kinds?: string[];
      limit?: number;
      minRate?: number;
    }
  ): Promise<OpenTripMapResponse<POI[]>> {
    try {
      const searchParams = new URLSearchParams({
        lon_min: bbox.lon_min.toString(),
        lat_min: bbox.lat_min.toString(),
        lon_max: bbox.lon_max.toString(),
        lat_max: bbox.lat_max.toString(),
        limit: Math.min(options?.limit || 20, 500).toString(),
        format: 'json',
        apikey: this.config.apiKey,
      });

      if (options?.kinds && options.kinds.length > 0) {
        searchParams.append('kinds', options.kinds.join(','));
      }

      if (options?.minRate) {
        searchParams.append('rate', options.minRate.toString());
      }

      const response = await fetch(
        `${this.config.baseUrl}/${this.config.language}/places/bbox?${searchParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const pois: POI[] = data.features?.map((feature: any) => ({
        xid: feature.properties.xid,
        name: feature.properties.name || 'Point d\'intérêt',
        kinds: feature.properties.kinds || '',
        coordinates: {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
        },
        rate: feature.properties.rate,
        point: {
          lon: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
        },
      })) || [];

      return {
        success: true,
        data: pois,
      };
    } catch (error) {
      console.error('Erreur lors de la recherche bbox:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Recherche automatique de lieux intéressants autour d'un point
   */
  async discoverNearby(
    coordinates: Coordinates,
    options?: {
      radius?: number;
      limit?: number;
      excludeKinds?: string[];
    }
  ): Promise<OpenTripMapResponse<POI[]>> {
    // Catégories intéressantes pour le tourisme
    const interestingKinds = [
      'museums',
      'churches',
      'monuments_and_memorials',
      'historic_architecture',
      'archaeological_sites',
      'palaces',
      'castles',
      'towers',
      'bridges',
      'parks',
      'gardens',
      'zoos',
      'theatres',
      'galleries',
      'cultural',
      'architecture',
      'religion',
      'historic',
      'natural',
      'entertainment',
    ];

    const filteredKinds = options?.excludeKinds 
      ? interestingKinds.filter(kind => !options.excludeKinds!.includes(kind))
      : interestingKinds;

    return this.searchPOI({
      coordinates,
      kinds: filteredKinds,
      radius: options?.radius || 3000,
      limit: options?.limit || 15,
      minRate: 3, // Seulement les lieux bien notés
    });
  }
}

// Instance singleton du service
let openTripMapInstance: OpenTripMapAPI | null = null;

/**
 * Initialise le service OpenTripMap
 */
export function initializeOpenTripMap(config: OpenTripMapConfig): OpenTripMapAPI {
  openTripMapInstance = new OpenTripMapAPI(config);
  return openTripMapInstance;
}

/**
 * Configuration simplifiée du service OpenTripMap
 */
export function setupOpenTripMapService() {
  const apiKey = process.env.EXPO_PUBLIC_OPENTRIPMAP_API_KEY;
  
  if (!apiKey) {
    throw new Error('Clé API OpenTripMap manquante');
  }

  return initializeOpenTripMap({
    apiKey: apiKey,
    language: 'fr'
  });
}

/**
 * Obtient l'instance du service OpenTripMap
 */
export function getOpenTripMapService(): OpenTripMapAPI {
  if (!openTripMapInstance) {
    throw new Error('Service OpenTripMap non initialisé. Appelez initializeOpenTripMap() d\'abord.');
  }
  return openTripMapInstance;
}

// Catégories OpenTripMap (kinds)
export const CATEGORIES = {
  // Architecture et monuments
  ARCHITECTURE: 'architecture',
  HISTORIC_ARCHITECTURE: 'historic_architecture',
  MONUMENTS: 'monuments_and_memorials',
  CASTLES: 'castles',
  PALACES: 'palaces',
  TOWERS: 'towers',
  BRIDGES: 'bridges',
  
  // Culture
  MUSEUMS: 'museums',
  GALLERIES: 'galleries',
  THEATRES: 'theatres',
  CULTURAL: 'cultural',
  
  // Religion
  CHURCHES: 'churches',
  RELIGION: 'religion',
  
  // Nature
  PARKS: 'parks',
  GARDENS: 'gardens',
  NATURAL: 'natural',
  BEACHES: 'beaches',
  
  // Divertissement
  ENTERTAINMENT: 'entertainment',
  ZOOS: 'zoos',
  AMUSEMENT_PARKS: 'amusement_parks',
  
  // Historique
  HISTORIC: 'historic',
  ARCHAEOLOGICAL: 'archaeological_sites',
  
  // Commerce et services
  SHOPS: 'shops',
  RESTAURANTS: 'food',
  ACCOMMODATIONS: 'accomodations',
  
  // Sport
  SPORT: 'sport',
  CLIMBING: 'climbing',
  DIVING: 'diving',
  SKIING: 'skiing',
  
  // Transport
  TRANSPORT: 'transport',
  RAILWAYS: 'railways',
  AIRPORTS: 'airports',
} as const;

/**
 * Fonctions d'aide pour les coordonnées
 */
export function createCoordinates(lat: number, lng: number): Coordinates {
  return { lat, lng };
}

/**
 * Calcule la distance entre deux points (formule haversine)
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Retourne la distance en mètres
}

/**
 * Convertit les "kinds" OpenTripMap en catégories lisibles
 */
export function translateKinds(kinds: string): string[] {
  const kindMap: { [key: string]: string } = {
    'museums': 'Musée',
    'churches': 'Église',
    'monuments_and_memorials': 'Monument',
    'historic_architecture': 'Architecture historique',
    'archaeological_sites': 'Site archéologique',
    'palaces': 'Palais',
    'castles': 'Château',
    'towers': 'Tour',
    'bridges': 'Pont',
    'parks': 'Parc',
    'gardens': 'Jardin',
    'zoos': 'Zoo',
    'theatres': 'Théâtre',
    'galleries': 'Galerie',
    'cultural': 'Culturel',
    'architecture': 'Architecture',
    'religion': 'Religion',
    'historic': 'Historique',
    'natural': 'Nature',
    'entertainment': 'Divertissement',
    'sport': 'Sport',
    'food': 'Restaurant',
    'shops': 'Commerce',
  };

  return kinds.split(',')
    .map(kind => kindMap[kind.trim()] || kind.trim())
    .filter(Boolean);
}

/**
 * Obtient une icône appropriée selon la catégorie
 */
export function getIconForCategory(kinds: string): string {
  const lowerKinds = kinds.toLowerCase();
  
  if (lowerKinds.includes('museum')) return 'library';
  if (lowerKinds.includes('church') || lowerKinds.includes('religion')) return 'home';
  if (lowerKinds.includes('castle') || lowerKinds.includes('palace')) return 'business';
  if (lowerKinds.includes('park') || lowerKinds.includes('garden')) return 'leaf';
  if (lowerKinds.includes('bridge') || lowerKinds.includes('tower')) return 'business';
  if (lowerKinds.includes('theatre') || lowerKinds.includes('entertainment')) return 'play';
  if (lowerKinds.includes('food') || lowerKinds.includes('restaurant')) return 'restaurant';
  if (lowerKinds.includes('shop')) return 'storefront';
  if (lowerKinds.includes('sport')) return 'fitness';
  if (lowerKinds.includes('historic') || lowerKinds.includes('monument')) return 'time';
  
  return 'location'; // icône par défaut
}

export default OpenTripMapAPI; 
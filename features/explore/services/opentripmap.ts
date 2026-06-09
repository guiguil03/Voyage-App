/**
 * Service OpenTripMap complet - API de recherche d'attractions touristiques
 * Plus de 10 millions d'attractions dans le monde, 150+ types d'attractions
 * Documentation API: https://opentripmap.io/docs
 */

export interface OpenTripMapConfig {
  apiKey: string;
  baseUrl?: string;
  language?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface OpenTripMapPlace {
  xid: string;
  name: string;
  kinds: string;
  coordinates: Coordinates;
  rate?: number;
  distance?: number;
  osm?: string;
  wikidata?: string;
  wikipedia?: string;
  preview?: {
    source: string;
    height: number;
    width: number;
  };
  image?: string;
  address?: {
    country: string;
    country_code: string;
    city?: string;
    state?: string;
    postcode?: string;
    road?: string;
    house_number?: string;
  };
  bbox?: {
    lat_max: number;
    lat_min: number;
    lon_max: number;
    lon_min: number;
  };
}

export interface OpenTripMapPlaceDetails extends OpenTripMapPlace {
  description?: string;
  wikipedia_extracts?: {
    title: string;
    text: string;
    html: string;
  };
  url?: string;
  otm?: string;
  sources?: {
    geometry: string;
    attributes: string[];
  };
}

export interface SearchParams {
  coordinates: Coordinates;
  radius?: number; // en mètres, max 50000
  limit?: number; // max 500
  kinds?: string[]; // catégories d'attractions
  minRate?: number; // note minimale 1-7
  format?: 'json' | 'geojson';
  src_geom?: string; // source de géométrie
  src_attr?: string; // source d'attributs
}

export interface CitySearchParams {
  name: string;
  country?: string;
  limit?: number;
}

export interface AutocompleteParams {
  name: string;
  radius?: number;
  limit?: number;
  coordinates?: Coordinates;
  kinds?: string[];
  sources?: string[];
}

export interface BboxSearchParams {
  bbox: {
    lon_min: number;
    lat_min: number;
    lon_max: number;
    lat_max: number;
  };
  limit?: number;
  kinds?: string[];
  minRate?: number;
}

export interface OpenTripMapResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Catégories principales OpenTripMap (basées sur l'API réelle)
export const OPENTRIPMAP_CATEGORIES = {
  // Architecture & Histoire
  historic: [
    'historic',
    'monuments_and_memorials',
    'archaeology',
    'architecture',
    'fortifications',
    'palaces',
    'castles'
  ],
  
  // Culture & Arts
  cultural: [
    'cultural',
    'museums',
    'theatres_and_entertainments',
    'galleries',
    'libraries',
    'cinemas'
  ],
  
  // Nature
  natural: [
    'natural',
    'beaches',
    'mountains',
    'islands',
    'caves',
    'volcanoes',
    'forests'
  ],
  
  // Divertissement
  entertainment: [
    'amusements',
    'zoos',
    'aquariums',
    'theme_parks',
    'water_parks'
  ],
  
  // Sport & Loisirs - CORRIGÉ pour éviter l'erreur 400
  sport: [
    'sport',
    'stadiums'
  ],
  
  // Tourisme
  tourism: [
    'tourist_facilities',
    'tourist_object',
    'viewpoints',
    'interesting_places'
  ],
  
  // Religion
  religion: [
    'religion',
    'churches',
    'mosques',
    'temples',
    'monasteries'
  ],

  // Autres catégories utiles
  other: [
    'foods',
    'shops',
    'accomodations',
    'banks',
    'transport'
  ]
};

// Kinds valides pour OpenTripMap (conservateur)
const VALID_KINDS = [
  'historic',
  'monuments_and_memorials', 
  'archaeology',
  'architecture',
  'fortifications',
  'palaces',
  'castles',
  'cultural',
  'museums',
  'theatres_and_entertainments',
  'galleries',
  'libraries',
  'cinemas',
  'natural',
  'beaches',
  'mountains',
  'islands',
  'caves',
  'volcanoes',
  'forests',
  'amusements',
  'zoos',
  'aquariums',
  'theme_parks',
  'water_parks',
  'sport',
  'stadiums',
  'tourist_facilities',
  'tourist_object',
  'viewpoints',
  'interesting_places',
  'religion',
  'churches',
  'mosques',
  'temples',
  'monasteries',
  'foods',
  'shops',
  'accomodations',
  'banks',
  'transport'
];

class OpenTripMapAPI {
  private config: OpenTripMapConfig;

  constructor(config: OpenTripMapConfig) {
    this.config = {
      baseUrl: 'https://api.opentripmap.com/0.1',
      language: 'en', // OpenTripMap ne supporte que 'en' et 'ru'
      ...config
    };
  }

  /**
   * Valide et filtre les kinds pour éviter les erreurs 400
   */
  private validateKinds(kinds?: string[]): string[] {
    if (!kinds || kinds.length === 0) {
      return [];
    }

    // Filtrer seulement les kinds valides
    const validKinds = kinds.filter(kind => VALID_KINDS.includes(kind));
    
    // Limiter à 5 kinds maximum pour éviter les erreurs
    return validKinds.slice(0, 5);
  }

  /**
   * Recherche d'attractions par coordonnées et rayon
   */
  async searchByRadius(params: SearchParams): Promise<OpenTripMapResponse<OpenTripMapPlace[]>> {
    try {
      const searchParams = new URLSearchParams({
        radius: Math.min(params.radius || 5000, 50000).toString(),
        lon: params.coordinates.lng.toString(),
        lat: params.coordinates.lat.toString(),
        format: params.format || 'json',
        apikey: this.config.apiKey,
      });

      if (params.limit) {
        searchParams.append('limit', Math.min(params.limit, 500).toString());
      }

      // Valider et filtrer les kinds
      const validKinds = this.validateKinds(params.kinds);
      if (validKinds.length > 0) {
        searchParams.append('kinds', validKinds.join(','));
      }

      if (params.minRate) {
        searchParams.append('rate', params.minRate.toString());
      }

      const url = `${this.config.baseUrl}/${this.config.language}/places/radius?${searchParams}`;
      console.log('🔍 Recherche OpenTripMap:', url);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VoyageApp/2.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API OpenTripMap:', response.status, response.statusText, errorText);
        throw new Error(`Erreur API OpenTripMap: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ ${Array.isArray(data) ? data.length : 0} attractions trouvées`);

      const places: OpenTripMapPlace[] = Array.isArray(data) ? data.map(this.formatPlace) : [];

      return {
        success: true,
        data: places,
        message: `${places.length} attractions trouvées via OpenTripMap`
      };
    } catch (error) {
      console.error('❌ Erreur OpenTripMap:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors de la recherche OpenTripMap'
      };
    }
  }

  /**
   * Recherche d'attractions dans une zone géographique (bbox)
   */
  async searchInBbox(params: BboxSearchParams): Promise<OpenTripMapResponse<OpenTripMapPlace[]>> {
    try {
      const searchParams = new URLSearchParams({
        lon_min: params.bbox.lon_min.toString(),
        lat_min: params.bbox.lat_min.toString(),
        lon_max: params.bbox.lon_max.toString(),
        lat_max: params.bbox.lat_max.toString(),
        limit: Math.min(params.limit || 100, 500).toString(),
        format: 'json',
        apikey: this.config.apiKey,
      });

      // Valider et filtrer les kinds
      const validKinds = this.validateKinds(params.kinds);
      if (validKinds.length > 0) {
        searchParams.append('kinds', validKinds.join(','));
      }

      if (params.minRate) {
        searchParams.append('rate', params.minRate.toString());
      }

      const url = `${this.config.baseUrl}/${this.config.language}/places/bbox?${searchParams}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VoyageApp/2.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API OpenTripMap bbox:', response.status, response.statusText, errorText);
        throw new Error(`Erreur API OpenTripMap: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const places: OpenTripMapPlace[] = Array.isArray(data) ? data.map(this.formatPlace) : [];

      return {
        success: true,
        data: places,
        message: `${places.length} attractions trouvées dans la zone`
      };
    } catch (error) {
      console.error('❌ Erreur OpenTripMap bbox:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Recherche de villes pour géocodage
   */
  async searchCities(params: CitySearchParams): Promise<OpenTripMapResponse<any[]>> {
    try {
      const searchParams = new URLSearchParams({
        name: params.name,
        apikey: this.config.apiKey,
        limit: (params.limit || 10).toString()
      });

      if (params.country) {
        searchParams.append('country', params.country);
      }

      const url = `${this.config.baseUrl}/${this.config.language}/places/geoname?${searchParams}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VoyageApp/2.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur géocodage: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
        message: `${Array.isArray(data) ? data.length : 0} villes trouvées`
      };
    } catch (error) {
      console.error('❌ Erreur géocodage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Autocomplétion pour la recherche
   */
  async autocomplete(params: AutocompleteParams): Promise<OpenTripMapResponse<any[]>> {
    try {
      const searchParams = new URLSearchParams({
        name: params.name,
        apikey: this.config.apiKey,
        limit: (params.limit || 10).toString()
      });

      if (params.coordinates) {
        searchParams.append('lon', params.coordinates.lng.toString());
        searchParams.append('lat', params.coordinates.lat.toString());
      }

      if (params.radius) {
        searchParams.append('radius', params.radius.toString());
      }

      // Valider et filtrer les kinds
      const validKinds = this.validateKinds(params.kinds);
      if (validKinds.length > 0) {
        searchParams.append('kinds', validKinds.join(','));
      }

      const url = `${this.config.baseUrl}/${this.config.language}/places/autosuggest?${searchParams}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VoyageApp/2.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur autocomplétion:', response.status, response.statusText, errorText);
        throw new Error(`Erreur autocomplétion: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: Array.isArray(data.features) ? data.features : [],
        message: `${Array.isArray(data.features) ? data.features.length : 0} suggestions trouvées`
      };
    } catch (error) {
      console.error('❌ Erreur autocomplétion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Obtenir les détails complets d'une attraction
   */
  async getPlaceDetails(xid: string): Promise<OpenTripMapResponse<OpenTripMapPlaceDetails>> {
    try {
      const url = `${this.config.baseUrl}/${this.config.language}/places/xid/${xid}?apikey=${this.config.apiKey}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VoyageApp/2.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur détails: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: this.formatPlaceDetails(data),
        message: 'Détails récupérés avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur détails place:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Recherche par nom de ville (géocodage puis recherche)
   */
  async searchByCity(cityName: string, options?: {
    kinds?: string[];
    radius?: number;
    limit?: number;
    minRate?: number;
  }): Promise<OpenTripMapResponse<{ coordinates: Coordinates; places: OpenTripMapPlace[] }>> {
    try {
      console.log('🏙️ Recherche de coordonnées pour:', cityName);
      let coordinates: Coordinates | null = null;

      // Étape 1a: Essayer le géocodage OpenTripMap d'abord
      try {
        const cityResult = await this.searchCities({ name: cityName, limit: 1 });
        
        if (cityResult.success && cityResult.data && cityResult.data.length > 0) {
          const city = cityResult.data[0];
          coordinates = {
            lat: city.lat,
            lng: city.lon
          };
          console.log('✅ Coordonnées trouvées via OpenTripMap:', coordinates);
        }
      } catch (error) {
        console.log('❌ Géocodage OpenTripMap échoué, tentative avec Nominatim...');
      }

      // Étape 1b: Fallback avec Nominatim (OpenStreetMap) si OpenTripMap échoue
      if (!coordinates) {
        try {
          console.log('🔍 Géocodage via Nominatim pour:', cityName);
          const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1&accept-language=fr`;
          
          const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'VoyageApp/2.0'
            }
          });

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            
            if (geocodeData && geocodeData.length > 0) {
              coordinates = {
                lat: parseFloat(geocodeData[0].lat),
                lng: parseFloat(geocodeData[0].lon)
              };
              console.log('✅ Coordonnées trouvées via Nominatim:', coordinates);
            }
          }
        } catch (nominatimError) {
          console.error('❌ Erreur Nominatim:', nominatimError);
        }
      }

      // Si aucun géocodage n'a fonctionné
      if (!coordinates) {
        throw new Error(`Ville "${cityName}" non trouvée. Vérifiez l'orthographe ou essayez une ville plus connue.`);
      }

      // Étape 2: Recherche d'attractions avec les coordonnées trouvées
      console.log('🔍 Recherche d\'attractions à', cityName, 'aux coordonnées:', coordinates);
      
      // Valider et filtrer les kinds
      const validKinds = this.validateKinds(options?.kinds);
      
      const placesResult = await this.searchByRadius({
        coordinates,
        kinds: validKinds,
        radius: options?.radius || 10000,
        limit: options?.limit || 50,
        minRate: options?.minRate
      });

      if (!placesResult.success) {
        return {
          success: false,
          error: placesResult.error,
          message: placesResult.message
        };
      }

      return {
        success: true,
        data: {
          coordinates,
          places: placesResult.data || []
        },
        message: `${placesResult.data?.length || 0} attractions trouvées à ${cityName}`
      };
    } catch (error) {
      console.error('❌ Erreur recherche par ville:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Obtenir toutes les catégories d'attractions disponibles
   */
  getAvailableCategories(): Record<string, string[]> {
    return OPENTRIPMAP_CATEGORIES;
  }

  /**
   * Filtrer les catégories par type d'activité
   */
  getCategoriesByType(type: keyof typeof OPENTRIPMAP_CATEGORIES): string[] {
    return OPENTRIPMAP_CATEGORIES[type] || [];
  }

  /**
   * Formatage d'une attraction
   */
  private formatPlace(place: any): OpenTripMapPlace {
    return {
      xid: place.xid || '',
      name: place.name || 'Attraction sans nom',
      kinds: place.kinds || '',
      coordinates: {
        lat: place.point?.lat || 0,
        lng: place.point?.lon || 0
      },
      rate: place.rate,
      distance: place.dist,
      osm: place.osm,
      wikidata: place.wikidata,
      wikipedia: place.wikipedia,
      preview: place.preview,
      image: place.image
    };
  }

  /**
   * Formatage des détails d'une attraction
   */
  private formatPlaceDetails(place: any): OpenTripMapPlaceDetails {
    return {
      ...this.formatPlace(place),
      description: place.wikipedia_extracts?.text || place.description,
      wikipedia_extracts: place.wikipedia_extracts,
      url: place.url,
      otm: place.otm,
      sources: place.sources,
      address: place.address,
      bbox: place.bbox
    };
  }
}

// Configuration du service
const API_KEY = process.env.EXPO_PUBLIC_OPENTRIPMAP_API_KEY || '5ae2e3f221c38a28845f05b6642b4764a2b508d229948d60bc943be9';

// Instance singleton
let openTripMapInstance: OpenTripMapAPI | null = null;

/**
 * Initialise le service OpenTripMap
 */
export function initializeOpenTripMap(config?: Partial<OpenTripMapConfig>): OpenTripMapAPI {
  const fullConfig: OpenTripMapConfig = {
    apiKey: API_KEY,
    language: 'en', // OpenTripMap ne supporte que 'en' et 'ru'
    baseUrl: 'https://api.opentripmap.com/0.1',
    ...config
  };

  openTripMapInstance = new OpenTripMapAPI(fullConfig);
  return openTripMapInstance;
}

/**
 * Obtient l'instance du service OpenTripMap
 */
export function getOpenTripMapService(): OpenTripMapAPI {
  if (!openTripMapInstance) {
    return initializeOpenTripMap();
  }
  return openTripMapInstance;
}

/**
 * Fonctions utilitaires exportées
 */
export const OpenTripMapUtils = {
  /**
   * Convertit une catégorie simple en liste de catégories OpenTripMap
   */
  mapCategoryToKinds(category: string): string[] {
    const categoryMap: Record<string, string[]> = {
      restaurant: ['foods'],
      hotel: ['accomodations'],
      attraction: ['interesting_places', 'tourist_object'],
      museum: ['museums'],
      church: ['churches', 'religion'],
      castle: ['castles', 'palaces'],
      park: ['natural'],
      beach: ['beaches'],
      shopping: ['shops'],
      nightlife: ['amusements'],
      historic: ['historic', 'monuments_and_memorials', 'archaeology'],
      cultural: ['cultural', 'museums', 'galleries'],
      natural: ['natural', 'beaches', 'mountains'],
      entertainment: ['amusements', 'zoos', 'aquariums'],
      sport: ['sport', 'stadiums'],
      tourism: ['tourist_facilities', 'tourist_object', 'viewpoints'],
      religion: ['religion', 'churches', 'temples']
    };

    const kinds = categoryMap[category.toLowerCase()] || [category];
    
    // Filtrer seulement les kinds valides
    return kinds.filter(kind => VALID_KINDS.includes(kind));
  },

  /**
   * Formate la distance en texte lisible
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  },

  /**
   * Obtient l'icône appropriée pour une catégorie
   */
  getIconForCategory(kinds: string): string {
    if (kinds.includes('museums')) return '🏛️';
    if (kinds.includes('churches') || kinds.includes('religion')) return '⛪';
    if (kinds.includes('castles') || kinds.includes('palaces') || kinds.includes('historic')) return '🏰';
    if (kinds.includes('parks') || kinds.includes('natural')) return '🌳';
    if (kinds.includes('beaches')) return '🏖️';
    if (kinds.includes('mountains')) return '⛰️';
    if (kinds.includes('foods') || kinds.includes('restaurant')) return '🍽️';
    if (kinds.includes('accomodations') || kinds.includes('hotel')) return '🏨';
    if (kinds.includes('shops') || kinds.includes('shopping')) return '🛍️';
    if (kinds.includes('amusements') || kinds.includes('entertainment')) return '🎭';
    if (kinds.includes('sport') || kinds.includes('stadiums')) return '⚽';
    if (kinds.includes('viewpoints')) return '🔭';
    if (kinds.includes('bridges')) return '🌉';
    if (kinds.includes('nightlife')) return '🍸';
    if (kinds.includes('zoos')) return '🦁';
    if (kinds.includes('aquariums')) return '🐠';
    return '📍';
  },

  /**
   * Traduit les catégories en français
   */
  translateKinds(kinds: string): string {
    const translations: Record<string, string> = {
      'historic': 'Historique',
      'monuments_and_memorials': 'Monuments',
      'archaeology': 'Archéologie',
      'architecture': 'Architecture',
      'fortifications': 'Fortifications',
      'palaces': 'Palais',
      'castles': 'Châteaux',
      'cultural': 'Culturel',
      'museums': 'Musées',
      'theatres_and_entertainments': 'Théâtres',
      'galleries': 'Galeries d\'art',
      'libraries': 'Bibliothèques',
      'cinemas': 'Cinémas',
      'natural': 'Nature',
      'beaches': 'Plages',
      'mountains': 'Montagnes',
      'islands': 'Îles',
      'caves': 'Grottes',
      'volcanoes': 'Volcans',
      'forests': 'Forêts',
      'amusements': 'Divertissements',
      'zoos': 'Zoos',
      'aquariums': 'Aquariums',
      'theme_parks': 'Parcs d\'attractions',
      'water_parks': 'Parcs aquatiques',
      'sport': 'Sport',
      'stadiums': 'Stades',
      'tourist_facilities': 'Installations touristiques',
      'tourist_object': 'Attraction touristique',
      'viewpoints': 'Points de vue',
      'interesting_places': 'Lieux d\'intérêt',
      'foods': 'Restaurants',
      'shops': 'Boutiques',
      'accomodations': 'Hébergements',
      'banks': 'Banques',
      'transport': 'Transport',
      'religion': 'Religion',
      'churches': 'Églises',
      'mosques': 'Mosquées',
      'temples': 'Temples',
      'monasteries': 'Monastères'
    };

    const kindsArray = kinds.split(',');
    const translated = kindsArray.map(kind => 
      translations[kind.trim()] || kind.trim()
    );
    
    return translated.join(', ');
  }
};

export default OpenTripMapAPI; 
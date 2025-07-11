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
      language: 'en', // OpenTripMap ne supporte que 'en' et 'ru', pas 'fr'
      ...config
    };
  }

  /**
   * Recherche des points d'intérêt dans un rayon
   */
  async searchPOI(params: POISearchParams): Promise<OpenTripMapResponse<POI[]>> {
    try {
      // Utiliser le format qui fonctionne selon nos tests
      const searchParams = new URLSearchParams({
        radius: Math.min(params.radius || 5000, 50000).toString(),
        lon: params.coordinates.lng.toString(),
        lat: params.coordinates.lat.toString(),
        format: 'json', // Format JSON qui retourne un tableau direct
        apikey: this.config.apiKey,
      });

      // Ajouter les paramètres optionnels
      if (params.limit) {
        searchParams.append('limit', Math.min(params.limit, 500).toString());
      }

      if (params.kinds && params.kinds.length > 0) {
        searchParams.append('kinds', params.kinds.join(','));
      }

      const url = `${this.config.baseUrl}/${this.config.language}/places/radius?${searchParams}`;
      console.log('🔍 URL OpenTripMap:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VoyageApp/1.0',
        },
      });

      console.log('📡 Réponse API:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Type de données reçues:', Array.isArray(data) ? `Array[${data.length}]` : typeof data);
      
      let pois: POI[] = [];
      
      // Avec format=json, on reçoit un tableau direct
      if (Array.isArray(data)) {
        pois = data.map((item: any, index: number) => ({
          xid: item.xid || `poi_${index}`,
          name: item.name || 'Point d\'intérêt',
          kinds: item.kinds || 'tourism',
          coordinates: {
            lat: item.point?.lat || params.coordinates.lat,
            lng: item.point?.lon || params.coordinates.lng,
          },
          rate: item.rate || 0,
          distance: item.dist || 0,
          point: {
            lon: item.point?.lon || params.coordinates.lng,
            lat: item.point?.lat || params.coordinates.lat,
          },
          // Ajouter les données supplémentaires disponibles
          osm: item.osm,
          wikidata: item.wikidata,
        }));
      } else {
        console.warn('⚠️ Format de données inattendu:', data);
        pois = [];
      }

      // Filtrage côté client par note minimum si spécifié
      if (params.minRate) {
        pois = pois.filter(poi => poi.rate && poi.rate >= params.minRate!);
      }

      console.log(`✅ ${pois.length} POIs trouvés et traités`);

      return {
        success: true,
        data: pois,
        message: `${pois.length} POIs trouvés via OpenTripMap`,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la recherche POI:', error);
      
      // En cas d'erreur, utiliser les données de démonstration
      const demoPois = getDemoPOIs(params.coordinates, {
        kinds: params.kinds,
        limit: params.limit,
        minRate: params.minRate,
      });

      return {
        success: true,
        data: demoPois,
        message: 'Données de démonstration (erreur API)',
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
   * Recherche par catégorie spécifique
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
    // Mapping des catégories vers les kinds OpenTripMap
    const categoryMapping: { [key: string]: string[] } = {
      'museums': ['museums', 'galleries'],
      'historic': ['historic_architecture', 'monuments_and_memorials', 'archaeological_sites', 'castles', 'palaces'],
      'religious': ['churches', 'religion'],
      'nature': ['parks', 'gardens', 'natural'],
      'culture': ['cultural', 'theatres', 'galleries'],
      'entertainment': ['entertainment', 'zoos', 'amusement_parks'],
      'architecture': ['architecture', 'historic_architecture', 'towers', 'bridges'],
    };

    const kinds = categoryMapping[category] || [category];

    return this.searchPOI({
      coordinates,
      kinds,
      radius: options?.radius || 5000,
      limit: options?.limit || 20,
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

      // Note: Le paramètre 'rate' n'est pas supporté dans l'endpoint bbox
      // Le filtrage par note se fera côté client après récupération des données

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
      
      let pois: POI[] = data.features?.map((feature: any) => ({
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

      // Filtrage côté client par note minimum si spécifié
      if (options?.minRate) {
        pois = pois.filter(poi => poi.rate && poi.rate >= options.minRate!);
      }

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
   * Recherche par nom de ville (géocodage puis recherche POI)
   */
  async searchByCity(
    cityName: string,
    options?: {
      kinds?: string[];
      radius?: number;
      limit?: number;
      minRate?: number;
    }
  ): Promise<OpenTripMapResponse<{ coordinates: Coordinates; pois: POI[] }>> {
    try {
      // Étape 1: Géocodage avec Nominatim (OpenStreetMap)
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'OpenTripMapApp/1.0',
          },
        }
      );

      if (!geocodeResponse.ok) {
        throw new Error(`Géocodage Error: ${geocodeResponse.status}`);
      }

      const geocodeData = await geocodeResponse.json();
      
      if (!geocodeData || geocodeData.length === 0) {
        throw new Error(`Ville "${cityName}" non trouvée`);
      }

      const coordinates: Coordinates = {
        lat: parseFloat(geocodeData[0].lat),
        lng: parseFloat(geocodeData[0].lon),
      };

      // Étape 2: Recherche POI autour de cette ville
      const poisResult = await this.searchPOI({
        coordinates,
        kinds: options?.kinds,
        radius: options?.radius || 10000, // 10km par défaut pour une ville
        limit: options?.limit || 20,
        minRate: options?.minRate,
      });

      if (!poisResult.success) {
        return {
          success: false,
          error: poisResult.error,
          message: poisResult.message,
        };
      }

      return {
        success: true,
        data: {
          coordinates,
          pois: poisResult.data || [],
        },
      };
    } catch (error) {
      console.error('Erreur lors de la recherche par ville:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Recherche avec de nombreuses catégories en divisant les requêtes
   */
  async searchWithManyCategories(
    coordinates: Coordinates,
    allKinds: string[],
    options?: {
      radius?: number;
      limit?: number;
      minRate?: number;
    }
  ): Promise<OpenTripMapResponse<POI[]>> {
    try {
      // Diviser les catégories en chunks pour éviter les erreurs 400
      const chunkSize = 8; // Limite sûre pour éviter les erreurs
      const chunks: string[][] = [];
      
      for (let i = 0; i < allKinds.length; i += chunkSize) {
        chunks.push(allKinds.slice(i, i + chunkSize));
      }

      const allPOIs: POI[] = [];
      const limitPerChunk = Math.ceil((options?.limit || 20) / chunks.length);

      // Faire une requête pour chaque chunk
      for (const kindsChunk of chunks) {
        const response = await this.searchPOI({
          coordinates,
          kinds: kindsChunk,
          radius: options?.radius || 5000,
          limit: limitPerChunk,
          minRate: options?.minRate || 3,
        });

        if (response.success && response.data) {
          allPOIs.push(...response.data);
        }
      }

      // Supprimer les doublons basés sur xid
      const uniquePOIs = allPOIs.filter(
        (poi, index, self) => index === self.findIndex(p => p.xid === poi.xid)
      );

      // Trier par distance ou par note et limiter les résultats
      const sortedPOIs = uniquePOIs
        .sort((a, b) => (b.rate || 0) - (a.rate || 0))
        .slice(0, options?.limit || 20);

      return {
        success: true,
        data: sortedPOIs,
      };
    } catch (error) {
      console.error('Erreur lors de la recherche avec plusieurs catégories:', error);
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
    // Catégories principales pour éviter l'erreur 400 (liste réduite)
    const interestingKinds = [
      'museums',
      'churches',
      'monuments_and_memorials',
      'historic_architecture',
      'palaces',
      'castles',
      'parks',
      'galleries',
      'cultural',
      'historic',
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
  const apiKey = process.env.EXPO_PUBLIC_OPENTRIPMAP_API_KEY || '5ae2e3f221c38a28845f05b6642b4764a2b508d229948d60bc943be9';
  
  console.log('🔑 Configuration OpenTripMap avec clé:', apiKey ? 'Clé présente' : 'Aucune clé');

  if (!apiKey) {
    console.warn('⚠️ Aucune clé API OpenTripMap trouvée, utilisation des données de démonstration');
  }

  return initializeOpenTripMap({
    apiKey: apiKey,
    language: 'en', // OpenTripMap ne supporte que 'en' et 'ru'
    baseUrl: 'https://api.opentripmap.com/0.1', // S'assurer que l'URL est correcte
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
  if (lowerKinds.includes('monument') || lowerKinds.includes('historic')) return 'business';
  if (lowerKinds.includes('park') || lowerKinds.includes('garden') || lowerKinds.includes('natural')) return 'leaf';
  if (lowerKinds.includes('cultural') || lowerKinds.includes('theatre') || lowerKinds.includes('gallery')) return 'images';
  if (lowerKinds.includes('entertainment') || lowerKinds.includes('zoo')) return 'game-controller';
  if (lowerKinds.includes('architecture') || lowerKinds.includes('tower') || lowerKinds.includes('bridge')) return 'business';
  
  return 'location'; // Icône par défaut
}

/**
 * Données de démonstration pour les tests
 */
export const DEMO_POIS: POI[] = [
  {
    xid: 'demo_1',
    name: 'Musée du Louvre',
    description: 'Le plus grand musée d\'art du monde',
    kinds: 'museums,cultural,historic',
    coordinates: { lat: 48.8606, lng: 2.3376 },
    rate: 7,
    distance: 1200,
    point: { lon: 2.3376, lat: 48.8606 },
    address: {
      city: 'Paris',
      road: 'Rue de Rivoli',
      house_number: '99',
      postcode: '75001',
      country: 'France',
    },
  },
  {
    xid: 'demo_2',
    name: 'Tour Eiffel',
    description: 'Monument emblématique de Paris',
    kinds: 'monuments_and_memorials,historic_architecture,towers',
    coordinates: { lat: 48.8584, lng: 2.2945 },
    rate: 6,
    distance: 800,
    point: { lon: 2.2945, lat: 48.8584 },
    address: {
      city: 'Paris',
      road: 'Champ de Mars',
      house_number: '5',
      postcode: '75007',
      country: 'France',
    },
  },
  {
    xid: 'demo_3',
    name: 'Notre-Dame de Paris',
    description: 'Cathédrale gothique historique',
    kinds: 'churches,religion,historic_architecture',
    coordinates: { lat: 48.8530, lng: 2.3499 },
    rate: 6,
    distance: 1500,
    point: { lon: 2.3499, lat: 48.8530 },
    address: {
      city: 'Paris',
      road: 'Parvis Notre-Dame',
      house_number: '6',
      postcode: '75004',
      country: 'France',
    },
  },
  {
    xid: 'demo_4',
    name: 'Jardin du Luxembourg',
    description: 'Magnifique jardin parisien',
    kinds: 'parks,gardens,natural',
    coordinates: { lat: 48.8462, lng: 2.3372 },
    rate: 5,
    distance: 2000,
    point: { lon: 2.3372, lat: 48.8462 },
    address: {
      city: 'Paris',
      road: 'Rue de Médicis',
      postcode: '75006',
      country: 'France',
    },
  },
  {
    xid: 'demo_5',
    name: 'Arc de Triomphe',
    description: 'Monument commémoratif historique',
    kinds: 'monuments_and_memorials,historic_architecture',
    coordinates: { lat: 48.8738, lng: 2.2950 },
    rate: 5,
    distance: 2500,
    point: { lon: 2.2950, lat: 48.8738 },
    address: {
      city: 'Paris',
      road: 'Place Charles de Gaulle',
      postcode: '75008',
      country: 'France',
    },
  },
];

/**
 * Fonction utilitaire pour obtenir des données de démonstration
 */
export function getDemoPOIs(coordinates: Coordinates, options?: {
  kinds?: string[];
  limit?: number;
  minRate?: number;
}): POI[] {
  let pois = [...DEMO_POIS];

  // Filtrer par kinds si spécifié
  if (options?.kinds && options.kinds.length > 0) {
    pois = pois.filter(poi => 
      options.kinds!.some(kind => poi.kinds.toLowerCase().includes(kind.toLowerCase()))
    );
  }

  // Filtrer par note minimum si spécifié
  if (options?.minRate) {
    pois = pois.filter(poi => poi.rate && poi.rate >= options.minRate!);
  }

  // Calculer les distances par rapport aux coordonnées données
  pois = pois.map(poi => ({
    ...poi,
    distance: Math.round(calculateDistance(coordinates, poi.coordinates)),
  }));

  // Trier par distance
  pois.sort((a, b) => (a.distance || 0) - (b.distance || 0));

  // Limiter le nombre de résultats
  if (options?.limit) {
    pois = pois.slice(0, options.limit);
  }

  return pois;
}

export default OpenTripMapAPI; 
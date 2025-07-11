/**
 * Service de recherche unifié combinant OpenTripMap et Foursquare
 * Pour maximiser la diversité et la qualité des résultats
 */

import {
    FoursquareCoordinates,
    FoursquarePlace
} from './foursquare';
import {
    Coordinates,
    POI,
    POISearchParams
} from './recherche';

export interface UnifiedSearchParams {
  coordinates: Coordinates;
  radius?: number;
  limit?: number;
  query?: string;
  category?: string;
  minRating?: number;
  includeOpenTripMap?: boolean;
  includeFoursquare?: boolean;
}

export interface UnifiedPOI {
  id: string;
  source: 'opentripmap' | 'foursquare';
  name: string;
  description?: string;
  categories: string[];
  coordinates: Coordinates;
  address?: string;
  rating?: number;
  distance?: number;
  price?: number;
  hours?: any;
  website?: string;
  phone?: string;
  photos?: string[];
  isOpen?: boolean;
  // Données spécifiques selon la source
  originalData?: POI | FoursquarePlace;
}

export interface UnifiedSearchResponse {
  success: boolean;
  data?: UnifiedPOI[];
  error?: string;
  message?: string;
  sources: {
    opentripmap: { count: number; success: boolean; };
    foursquare: { count: number; success: boolean; };
  };
}

class UnifiedSearchService {
  private openTripMapService: any = null;
  private foursquareService: any = null;

  /**
   * Initialise les services de manière paresseuse
   */
  private initializeServices() {
    try {
      // Initialiser OpenTripMap si pas encore fait
      if (!this.openTripMapService) {
        console.log('🔧 Initialisation automatique du service OpenTripMap...');
        
        // Utiliser setupOpenTripMapService() qui gère l'initialisation automatique
        import('./recherche').then(module => {
          module.setupOpenTripMapService();
          this.openTripMapService = module.getOpenTripMapService();
        }).catch(error => {
          console.warn('⚠️ Impossible d\'initialiser OpenTripMap:', error.message);
          this.openTripMapService = null;
        });
      }

      // Initialiser Foursquare si pas encore fait  
      if (!this.foursquareService) {
        console.log('🔧 Initialisation automatique du service Foursquare...');
        
        import('./foursquare').then(module => {
          module.setupFoursquareService();
          this.foursquareService = module.getFoursquareService();
        }).catch(error => {
          console.warn('⚠️ Impossible d\'initialiser Foursquare:', error.message);
          this.foursquareService = null;
        });
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors de l\'initialisation des services:', error);
    }
  }

  /**
   * Obtient le service OpenTripMap avec initialisation automatique
   */
  private async getOpenTripMapService() {
    if (!this.openTripMapService) {
      try {
        const { setupOpenTripMapService, getOpenTripMapService } = await import('./recherche');
        setupOpenTripMapService();
        this.openTripMapService = getOpenTripMapService();
      } catch (error) {
        console.warn('⚠️ Service OpenTripMap indisponible:', error.message);
        return null;
      }
    }
    return this.openTripMapService;
  }

  /**
   * Obtient le service Foursquare avec initialisation automatique
   */
  private async getFoursquareService() {
    if (!this.foursquareService) {
      try {
        const { setupFoursquareService, getFoursquareService } = await import('./foursquare');
        setupFoursquareService();
        this.foursquareService = getFoursquareService();
      } catch (error) {
        console.warn('⚠️ Service Foursquare indisponible:', error.message);
        return null;
      }
    }
    return this.foursquareService;
  }

  /**
   * Recherche combinée dans les deux APIs
   */
  async searchPlaces(params: UnifiedSearchParams): Promise<UnifiedSearchResponse> {
    const {
      coordinates,
      radius = 5000,
      limit = 20,
      query,
      category,
      minRating,
      includeOpenTripMap = true,
      includeFoursquare = true,
    } = params;

    const promises: Promise<any>[] = [];
    const sources = {
      opentripmap: { count: 0, success: false },
      foursquare: { count: 0, success: false },
    };

    console.log('🔍 Recherche unifiée:', { coordinates, radius, limit, category });

    // Recherche OpenTripMap
    if (includeOpenTripMap) {
      const openTripMapService = await this.getOpenTripMapService();
      
      if (openTripMapService) {
        const openTripMapParams: POISearchParams = {
          coordinates,
          radius,
          limit: Math.ceil(limit / 2), // Diviser la limite entre les deux APIs
          minRate: minRating,
        };

        // Mapper la catégorie si fournie
        if (category) {
          openTripMapParams.kinds = this.mapCategoryToOpenTripMap(category);
        }

        promises.push(
          openTripMapService.searchPOI(openTripMapParams)
            .then((result: any) => ({ source: 'opentripmap', result }))
            .catch((error: any) => {
              console.warn('⚠️ Erreur OpenTripMap, utilisation de données de démonstration:', error.message);
              // Utiliser des données de démonstration
              const { getDemoPOIs } = require('./recherche');
              const demoPOIs = getDemoPOIs(coordinates, { 
                kinds: category ? this.mapCategoryToOpenTripMap(category) : undefined,
                limit: Math.ceil(limit / 2),
                minRate: minRating 
              });
              return { 
                source: 'opentripmap', 
                result: { 
                  success: true, 
                  data: demoPOIs,
                  message: 'Données de démonstration OpenTripMap'
                }
              };
            })
        );
      } else {
        // Service indisponible, utiliser des données de démonstration
        console.log('📋 Service OpenTripMap indisponible, utilisation de données de démonstration');
        promises.push(
          Promise.resolve({
            source: 'opentripmap',
            result: {
              success: true,
              data: this.createDemoOpenTripMapData(coordinates, category),
              message: 'Données de démonstration OpenTripMap (service indisponible)'
            }
          })
        );
      }
    }

    // Recherche Foursquare
    if (includeFoursquare) {
      const foursquareService = await this.getFoursquareService();
      
      if (foursquareService) {
        const foursquareCoords: FoursquareCoordinates = {
          lat: coordinates.lat,
          lng: coordinates.lng,
        };

        const searchPromise = category 
          ? foursquareService.searchByCategory(foursquareCoords, category, { radius, limit: Math.ceil(limit / 2) })
          : foursquareService.searchPlaces({
              coordinates: foursquareCoords,
              radius,
              limit: Math.ceil(limit / 2),
              query,
            });

        promises.push(
          searchPromise
            .then((result: any) => ({ source: 'foursquare', result }))
            .catch((error: any) => {
              console.warn('🔑 Erreur Foursquare, utilisation de données de démonstration:', error.message);
              // Créer des données de démonstration
              const demoData = this.createDemoFoursquareData(coordinates, query, category);
              return { 
                source: 'foursquare', 
                result: { 
                  success: true, 
                  data: demoData,
                  message: 'Données de démonstration Foursquare (erreur API)'
                }
              };
            })
        );
      } else {
        // Service indisponible, utiliser des données de démonstration
        console.log('📋 Service Foursquare indisponible, utilisation de données de démonstration');
        promises.push(
          Promise.resolve({
            source: 'foursquare',
            result: {
              success: true,
              data: this.createDemoFoursquareData(coordinates, query, category),
              message: 'Données de démonstration Foursquare (service indisponible)'
            }
          })
        );
      }
    }

    try {
      const results = await Promise.allSettled(promises);
      const allPOIs: UnifiedPOI[] = [];

      // Traiter les résultats de chaque API
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { source, result: apiResult, error } = result.value;

          if (error) {
            console.warn(`⚠️ Erreur ${source}:`, error);
            return;
          }

          if (source === 'opentripmap' && apiResult.success) {
            sources.opentripmap.success = true;
            const convertedPOIs = this.convertOpenTripMapPOIs(apiResult.data || []);
            sources.opentripmap.count = convertedPOIs.length;
            allPOIs.push(...convertedPOIs);
          } else if (source === 'foursquare' && apiResult.success) {
            sources.foursquare.success = true;
            const convertedPOIs = this.convertFoursquarePOIs(apiResult.data || []);
            sources.foursquare.count = convertedPOIs.length;
            allPOIs.push(...convertedPOIs);
          }
        }
      });

      // Supprimer les doublons basés sur la proximité et le nom
      const uniquePOIs = this.removeDuplicates(allPOIs);

      // Trier par pertinence (rating, distance)
      const sortedPOIs = this.sortByRelevance(uniquePOIs, coordinates);

      // Limiter aux résultats demandés
      const finalPOIs = sortedPOIs.slice(0, limit);

      console.log(`✅ Recherche unifiée terminée: ${finalPOIs.length} POIs (OpenTripMap: ${sources.opentripmap.count}, Foursquare: ${sources.foursquare.count})`);

      return {
        success: true,
        data: finalPOIs,
        message: `${finalPOIs.length} lieux trouvés via recherche combinée`,
        sources,
      };
    } catch (error) {
      console.error('❌ Erreur recherche unifiée:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        sources,
      };
    }
  }

  /**
   * Convertit les POIs OpenTripMap vers le format unifié
   */
  private convertOpenTripMapPOIs(pois: POI[]): UnifiedPOI[] {
    return pois.map(poi => ({
      id: poi.xid,
      source: 'opentripmap' as const,
      name: poi.name,
      description: poi.description,
      categories: poi.kinds?.split(',').filter(Boolean) || [],
      coordinates: poi.coordinates,
      address: poi.address ? Object.values(poi.address).filter(Boolean).join(', ') : undefined,
      rating: poi.rate,
      distance: poi.distance,
      originalData: poi,
    }));
  }

  /**
   * Convertit les places Foursquare vers le format unifié
   */
  private convertFoursquarePOIs(places: FoursquarePlace[]): UnifiedPOI[] {
    return places.map(place => ({
      id: place.fsq_id,
      source: 'foursquare' as const,
      name: place.name,
      description: place.description,
      categories: place.categories?.map(cat => cat.name) || [],
      coordinates: {
        lat: place.geocodes.main.latitude,
        lng: place.geocodes.main.longitude,
      },
      address: place.location.formatted_address || place.location.address,
      rating: place.rating,
      distance: place.distance,
      price: place.price,
      hours: place.hours,
      website: place.website,
      phone: place.tel,
      photos: place.photos?.map(photo => `${photo.prefix}300x300${photo.suffix}`),
      isOpen: place.hours?.open_now,
      originalData: place,
    }));
  }

  /**
   * Supprime les doublons basés sur la proximité et la similarité des noms
   */
  private removeDuplicates(pois: UnifiedPOI[]): UnifiedPOI[] {
    const unique: UnifiedPOI[] = [];
    const DISTANCE_THRESHOLD = 50; // mètres
    const NAME_SIMILARITY_THRESHOLD = 0.8;

    for (const poi of pois) {
      const isDuplicate = unique.some(existing => {
        const distance = this.calculateDistance(poi.coordinates, existing.coordinates);
        const nameSimilarity = this.calculateStringSimilarity(poi.name, existing.name);
        
        return distance < DISTANCE_THRESHOLD && nameSimilarity > NAME_SIMILARITY_THRESHOLD;
      });

      if (!isDuplicate) {
        unique.push(poi);
      }
    }

    return unique;
  }

  /**
   * Trie les POIs par pertinence
   */
  private sortByRelevance(pois: UnifiedPOI[], coordinates: Coordinates): UnifiedPOI[] {
    return pois.sort((a, b) => {
      // Priorité 1: Rating (si disponible)
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingA !== ratingB) {
        return ratingB - ratingA;
      }

      // Priorité 2: Distance
      const distanceA = a.distance || this.calculateDistance(a.coordinates, coordinates);
      const distanceB = b.distance || this.calculateDistance(b.coordinates, coordinates);
      
      return distanceA - distanceB;
    });
  }

  /**
   * Mappe une catégorie générique vers les kinds OpenTripMap
   */
  private mapCategoryToOpenTripMap(category: string): string[] {
    const mapping: { [key: string]: string[] } = {
      'museums': ['museums', 'galleries'],
      'restaurants': ['food'],
      'hotels': ['accommodations'],
      'parks': ['parks', 'gardens'],
      'entertainment': ['entertainment', 'theatres'],
      'historic': ['historic', 'monuments_and_memorials'],
      'shopping': ['shops'],
      'transport': ['transport'],
    };

    return mapping[category] || [category];
  }

  /**
   * Calcule la distance entre deux coordonnées (en mètres)
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Calcule la similarité entre deux chaînes de caractères
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcule la distance de Levenshtein entre deux chaînes
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Crée des données de démonstration OpenTripMap
   */
  private createDemoOpenTripMapData(coordinates: Coordinates, category?: string): any[] {
    // POIs de démonstration autour de Paris
    const demoPOIs = [
      {
        xid: 'demo_otm_1',
        name: 'Musée du Louvre',
        description: 'Le plus grand musée d\'art du monde',
        kinds: 'museums,cultural,historic',
        coordinates: { lat: 48.8606, lng: 2.3376 },
        rate: 7,
        distance: this.calculateDistance(coordinates, { lat: 48.8606, lng: 2.3376 }),
      },
      {
        xid: 'demo_otm_2',
        name: 'Tour Eiffel',
        description: 'Monument emblématique de Paris',
        kinds: 'monuments_and_memorials,historic_architecture,towers',
        coordinates: { lat: 48.8584, lng: 2.2945 },
        rate: 6,
        distance: this.calculateDistance(coordinates, { lat: 48.8584, lng: 2.2945 }),
      },
      {
        xid: 'demo_otm_3',
        name: 'Notre-Dame de Paris',
        description: 'Cathédrale gothique historique',
        kinds: 'churches,religion,historic_architecture',
        coordinates: { lat: 48.8530, lng: 2.3499 },
        rate: 6,
        distance: this.calculateDistance(coordinates, { lat: 48.8530, lng: 2.3499 }),
      },
    ];

    return demoPOIs.slice(0, 3);
  }

  /**
   * Crée des données de démonstration Foursquare
   */
  private createDemoFoursquareData(coordinates: Coordinates, query?: string, category?: string): any[] {
    // Places de démonstration autour de Paris
    const demoPlaces = [
      {
        fsq_id: 'demo_4sq_1',
        name: 'Le Procope',
        description: 'Café historique parisien',
        categories: [{ name: 'Restaurant', id: 'restaurant' }],
        geocodes: {
          main: { latitude: 48.8534, longitude: 2.3387 }
        },
        location: {
          formatted_address: '13 Rue de l\'Ancienne Comédie, 75006 Paris',
        },
        rating: 4.2,
        distance: this.calculateDistance(coordinates, { lat: 48.8534, lng: 2.3387 }),
        price: 3,
        hours: { open_now: true },
      },
      {
        fsq_id: 'demo_4sq_2',
        name: 'Café de Flore',
        description: 'Café littéraire emblématique',
        categories: [{ name: 'Café', id: 'cafe' }],
        geocodes: {
          main: { latitude: 48.8542, longitude: 2.3320 }
        },
        location: {
          formatted_address: '172 Boulevard Saint-Germain, 75006 Paris',
        },
        rating: 4.0,
        distance: this.calculateDistance(coordinates, { lat: 48.8542, lng: 2.3320 }),
        price: 4,
        hours: { open_now: true },
      },
    ];

    return demoPlaces.slice(0, 2);
  }
}

// Instance singleton
let unifiedSearchInstance: UnifiedSearchService | null = null;

/**
 * Obtient l'instance du service de recherche unifié
 */
export function getUnifiedSearchService(): UnifiedSearchService {
  if (!unifiedSearchInstance) {
    unifiedSearchInstance = new UnifiedSearchService();
  }
  return unifiedSearchInstance;
} 
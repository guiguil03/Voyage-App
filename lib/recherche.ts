/**
 * Service de recherche d'activités et attractions touristiques
 * Utilise OpenTripMap - Plus de 10 millions d'attractions dans le monde
 */

import {
  getOpenTripMapService,
  initializeOpenTripMap,
  OPENTRIPMAP_CATEGORIES,
  OpenTripMapPlace,
  OpenTripMapPlaceDetails,
  OpenTripMapUtils,
  type Coordinates,
  type SearchParams as OpenTripMapSearchParams
} from './opentripmap';

// Types pour la compatibilité avec l'ancien système
export interface SearchParams {
  coordinates: Coordinates;
  radius?: number;
  limit?: number;
  query?: string;
  category?: string;
  minRating?: number;
  kinds?: string[]; // Types spécifiques d'attractions
}

export interface SearchResponse {
  success: boolean;
  data?: SearchResult[];
  error?: string;
  message?: string;
  total?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  description?: string;
  categories: string[];
  coordinates: Coordinates;
  address?: string;
  rating?: number;
  distance?: number;
  price?: number;
  website?: string;
  phone?: string;
  photos?: string[];
  isOpen?: boolean;
  icon?: string;
  source: 'opentripmap';
}

export interface PlaceDetailsResult extends SearchResult {
  fullDescription?: string;
  wikipediaExtract?: string;
  openingHours?: string;
  facilities?: string[];
  reviews?: any[];
}

class SearchService {
  private openTripMapService = getOpenTripMapService();

  /**
   * Recherche d'activités par coordonnées et paramètres
   */
  async searchActivities(params: SearchParams): Promise<SearchResponse> {
    try {
      console.log('🔍 Recherche d\'activités:', params);

      // Conversion des paramètres
      const openTripMapParams: OpenTripMapSearchParams = {
        coordinates: params.coordinates,
        radius: params.radius || 5000,
        limit: params.limit || 20,
        minRate: params.minRating ? Math.max(1, Math.min(7, params.minRating)) : undefined
      };

      // Gestion des catégories
      if (params.category) {
        openTripMapParams.kinds = OpenTripMapUtils.mapCategoryToKinds(params.category);
      }

      // Recherche via OpenTripMap
      const result = await this.openTripMapService.searchByRadius(openTripMapParams);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: result.message || 'Erreur lors de la recherche'
        };
      }

      // Conversion des résultats
      const searchResults = (result.data || []).map(place => 
        this.convertToSearchResult(place)
      );

      // Filtrage par texte si fourni
      let filteredResults = searchResults;
      if (params.query) {
        const queryLower = params.query.toLowerCase();
        filteredResults = searchResults.filter(result =>
          result.name.toLowerCase().includes(queryLower) ||
          result.description?.toLowerCase().includes(queryLower) ||
          result.categories.some(cat => cat.toLowerCase().includes(queryLower))
        );
      }

      console.log(`✅ ${filteredResults.length} activités trouvées`);

      return {
        success: true,
        data: filteredResults,
        total: filteredResults.length,
        message: `${filteredResults.length} activités trouvées`
      };

    } catch (error) {
      console.error('❌ Erreur recherche activités:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors de la recherche d\'activités'
      };
    }
  }

  /**
   * Recherche par nom de ville
   */
  async searchByCity(cityName: string, options?: {
    category?: string;
    radius?: number;
    limit?: number;
    minRating?: number;
  }): Promise<SearchResponse & { cityCoordinates?: Coordinates }> {
    try {
      console.log('🏙️ Recherche par ville:', cityName);

      const kinds = options?.category ? 
        OpenTripMapUtils.mapCategoryToKinds(options.category) : 
        undefined;

      const result = await this.openTripMapService.searchByCity(cityName, {
        kinds,
        radius: options?.radius || 10000,
        limit: options?.limit || 50,
        minRate: options?.minRating
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: result.message || `Ville "${cityName}" non trouvée`
        };
      }

      const searchResults = (result.data?.places || []).map(place => 
        this.convertToSearchResult(place)
      );

      return {
        success: true,
        data: searchResults,
        total: searchResults.length,
        cityCoordinates: result.data?.coordinates,
        message: `${searchResults.length} activités trouvées à ${cityName}`
      };

    } catch (error) {
      console.error('❌ Erreur recherche par ville:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors de la recherche par ville'
      };
    }
  }

  /**
   * Recherche dans une zone géographique
   */
  async searchInArea(bbox: {
    north: number;
    south: number;
    east: number;
    west: number;
  }, options?: {
    category?: string;
    limit?: number;
    minRating?: number;
  }): Promise<SearchResponse> {
    try {
      console.log('🗺️ Recherche dans une zone:', bbox);

      const kinds = options?.category ? 
        OpenTripMapUtils.mapCategoryToKinds(options.category) : 
        undefined;

      const result = await this.openTripMapService.searchInBbox({
        bbox: {
          lon_min: bbox.west,
          lat_min: bbox.south,
          lon_max: bbox.east,
          lat_max: bbox.north
        },
        limit: options?.limit || 100,
        kinds,
        minRate: options?.minRating
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: result.message || 'Erreur lors de la recherche dans la zone'
        };
      }

      const searchResults = (result.data || []).map(place => 
        this.convertToSearchResult(place)
      );

      return {
        success: true,
        data: searchResults,
        total: searchResults.length,
        message: `${searchResults.length} activités trouvées dans la zone`
      };

    } catch (error) {
      console.error('❌ Erreur recherche zone:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors de la recherche dans la zone'
      };
    }
  }

  /**
   * Obtenir les détails complets d'une attraction
   */
  async getPlaceDetails(id: string): Promise<SearchResponse & { place?: PlaceDetailsResult }> {
    try {
      console.log('📋 Détails de l\'attraction:', id);

      const result = await this.openTripMapService.getPlaceDetails(id);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: result.message || 'Attraction non trouvée'
        };
      }

      const placeDetails = this.convertToPlaceDetails(result.data!);

      return {
        success: true,
        place: placeDetails,
        message: 'Détails récupérés avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur détails attraction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors de la récupération des détails'
      };
    }
  }

  /**
   * Autocomplétion pour la recherche
   */
  async autocomplete(query: string, coordinates?: Coordinates): Promise<SearchResponse> {
    try {
      console.log('💭 Autocomplétion:', query);

      const result = await this.openTripMapService.autocomplete({
        name: query,
        coordinates,
        radius: coordinates ? 50000 : undefined, // 50km si position fournie
        limit: 10
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: result.message || 'Erreur autocomplétion'
        };
      }

      // Conversion des suggestions en résultats de recherche
      const searchResults = (result.data || []).map((feature: any) => ({
        id: feature.properties?.xid || feature.properties?.osm_id || Math.random().toString(),
        name: feature.properties?.name || 'Lieu sans nom',
        description: feature.properties?.kinds || '',
        categories: feature.properties?.kinds ? [feature.properties.kinds] : [],
        coordinates: {
          lat: feature.geometry?.coordinates?.[1] || 0,
          lng: feature.geometry?.coordinates?.[0] || 0
        },
        icon: OpenTripMapUtils.getIconForCategory(feature.properties?.kinds || ''),
        source: 'opentripmap' as const
      }));

      return {
        success: true,
        data: searchResults,
        total: searchResults.length,
        message: `${searchResults.length} suggestions trouvées`
      };

    } catch (error) {
      console.error('❌ Erreur autocomplétion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors de l\'autocomplétion'
      };
    }
  }

  /**
   * Obtenir les catégories disponibles
   */
  getAvailableCategories(): Record<string, string[]> {
    return OPENTRIPMAP_CATEGORIES;
  }

  /**
   * Obtenir les catégories par type
   */
  getCategoriesByType(type: keyof typeof OPENTRIPMAP_CATEGORIES): string[] {
    return this.openTripMapService.getCategoriesByType(type);
  }

  /**
   * Convertit un résultat OpenTripMap en SearchResult
   */
  private convertToSearchResult(place: OpenTripMapPlace): SearchResult {
    const categories = place.kinds ? place.kinds.split(',').map(k => k.trim()) : [];
    
    return {
      id: place.xid,
      name: place.name,
      description: OpenTripMapUtils.translateKinds(place.kinds),
      categories,
      coordinates: place.coordinates,
      address: this.formatAddress(place.address),
      rating: place.rate,
      distance: place.distance,
      photos: place.preview ? [place.preview.source] : place.image ? [place.image] : [],
      icon: OpenTripMapUtils.getIconForCategory(place.kinds),
      source: 'opentripmap'
    };
  }

  /**
   * Convertit les détails OpenTripMap en PlaceDetailsResult
   */
  private convertToPlaceDetails(place: OpenTripMapPlaceDetails): PlaceDetailsResult {
    const baseResult = this.convertToSearchResult(place);
    
    return {
      ...baseResult,
      fullDescription: place.description,
      wikipediaExtract: place.wikipedia_extracts?.text,
      website: place.url,
      facilities: place.sources ? [place.sources.geometry, ...place.sources.attributes] : []
    };
  }

  /**
   * Formate une adresse
   */
  private formatAddress(address?: any): string | undefined {
    if (!address) return undefined;

    const parts = [];
    if (address.house_number) parts.push(address.house_number);
    if (address.road) parts.push(address.road);
    if (address.city) parts.push(address.city);
    if (address.postcode) parts.push(address.postcode);
    if (address.country) parts.push(address.country);

    return parts.length > 0 ? parts.join(', ') : undefined;
  }
}

// Instance singleton
let searchServiceInstance: SearchService | null = null;

/**
 * Initialise le service de recherche
 */
export function initializeSearchService(): SearchService {
  // Initialiser OpenTripMap d'abord
  initializeOpenTripMap();
  searchServiceInstance = new SearchService();
  return searchServiceInstance;
}

/**
 * Obtient l'instance du service de recherche
 */
export function getSearchService(): SearchService {
  if (!searchServiceInstance) {
    return initializeSearchService();
  }
  return searchServiceInstance;
}

/**
 * Fonctions utilitaires exportées
 */
export const SearchUtils = {
  ...OpenTripMapUtils,

  /**
   * Filtre les résultats par distance
   */
  filterByDistance(results: SearchResult[], maxDistance: number): SearchResult[] {
    return results.filter(result => 
      !result.distance || result.distance <= maxDistance
    );
  },

  /**
   * Filtre les résultats par note
   */
  filterByRating(results: SearchResult[], minRating: number): SearchResult[] {
    return results.filter(result => 
      !result.rating || result.rating >= minRating
    );
  },

  /**
   * Trie les résultats par distance
   */
  sortByDistance(results: SearchResult[]): SearchResult[] {
    return [...results].sort((a, b) => {
      if (!a.distance) return 1;
      if (!b.distance) return -1;
      return a.distance - b.distance;
    });
  },

  /**
   * Trie les résultats par note
   */
  sortByRating(results: SearchResult[]): SearchResult[] {
    return [...results].sort((a, b) => {
      if (!a.rating) return 1;
      if (!b.rating) return -1;
      return b.rating - a.rating;
    });
  },

  /**
   * Obtient les catégories populaires
   */
  getPopularCategories(): string[] {
    return [
      'tourism.attraction',
      'cultural.museum',
      'historic.monument',
      'natural.park',
      'entertainment.zoo',
      'cultural.theatre',
      'historic.castle',
      'natural.beach'
    ];
  }
};

export default SearchService; 
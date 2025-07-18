/**
 * Service de recherche pour les composants React Native
 * Interface simplifiée utilisant OpenTripMap
 */

import { getSearchService, SearchParams } from '../lib/recherche';

interface RechercheParams {
  coordinates: {
    lat: number;
    lng: number;
  };
  radius?: number;
  query?: string;
  category?: string;
  limit?: number;
  offset?: number; // Pour la pagination
  minRating?: number;
  maxDistance?: number;
  kinds?: string[]; // Types spécifiques d'attractions
  sortBy?: 'distance' | 'rating' | 'name';
}

interface RechercheFilters {
  categories: string[];
  minRating: number;
  maxDistance: number;
  sortBy: 'distance' | 'rating' | 'name';
  showOnlyWithPhotos: boolean;
  showOnlyWithReviews: boolean;
}

interface RechercheResult {
  id: string;
  name: string;
  description?: string;
  type: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distance?: number;
  rating?: number;
  icon: string;
  address?: string;
  photos?: string[];
  hasReviews?: boolean;
  price?: string;
  openingHours?: string;
}

class RechercheService {
  private searchService = getSearchService();

  /**
   * Recherche d'activités et attractions avec filtres avancés
   */
  async rechercherActivites(params: RechercheParams): Promise<{
    success: boolean;
    data: RechercheResult[];
    total: number;
    hasMore: boolean; // Indique s'il y a plus de résultats
    message?: string;
    error?: string;
  }> {
    try {
      console.log('🔍 Recherche activités avancée:', params);

      const searchParams: SearchParams = {
        coordinates: params.coordinates,
        radius: params.radius || 10000, // 10km par défaut
        limit: params.limit || 50, // 50 résultats par défaut
        query: params.query,
        category: params.category,
        minRating: params.minRating || 0,
        kinds: params.kinds
      };

      const result = await this.searchService.searchActivities(searchParams);

      if (!result.success) {
        return {
          success: false,
          data: [],
          total: 0,
          hasMore: false,
          error: result.error,
          message: result.message
        };
      }

      let activites: RechercheResult[] = (result.data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.categories[0] || 'attraction',
        coordinates: item.coordinates,
        distance: item.distance,
        rating: item.rating,
        icon: item.icon || '📍',
        address: item.address,
        photos: item.photos,
        hasReviews: (item.rating && item.rating > 0) || false
      }));

      // Appliquer le tri
      if (params.sortBy) {
        activites = this.sortResults(activites, params.sortBy);
      }

      // Appliquer la pagination côté client si nécessaire
      const offset = params.offset || 0;
      const limit = params.limit || 50;
      const paginatedResults = activites.slice(offset, offset + limit);
      const hasMore = offset + limit < activites.length;

      return {
        success: true,
        data: paginatedResults,
        total: activites.length,
        hasMore,
        message: result.message
      };

    } catch (error) {
      console.error('❌ Erreur recherche activités:', error);
      return {
        success: false,
        data: [],
        total: 0,
        hasMore: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Recherche avec filtres avancés
   */
  async rechercherAvecFiltres(
    coordinates: { lat: number; lng: number },
    filters: Partial<RechercheFilters>,
    query?: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<{
    success: boolean;
    data: RechercheResult[];
    total: number;
    hasMore: boolean;
    message?: string;
    error?: string;
  }> {
    const params: RechercheParams = {
      coordinates,
      query,
      limit: limit * 2, // Récupérer plus pour permettre le filtrage
      offset,
      minRating: filters.minRating || 0,
      maxDistance: filters.maxDistance || 50000,
      sortBy: filters.sortBy || 'distance',
      kinds: filters.categories
    };

    const result = await this.rechercherActivites(params);

    if (!result.success) {
      return result;
    }

    // Appliquer les filtres avancés
    let filteredData = result.data;

    if (filters.showOnlyWithPhotos) {
      filteredData = filteredData.filter(item => item.photos && item.photos.length > 0);
    }

    if (filters.showOnlyWithReviews) {
      filteredData = filteredData.filter(item => item.hasReviews);
    }

    if (filters.maxDistance) {
      filteredData = filteredData.filter(item => 
        !item.distance || item.distance <= filters.maxDistance!
      );
    }

    // Limiter aux résultats demandés
    const finalResults = filteredData.slice(0, limit);
    const hasMore = filteredData.length > limit;

    return {
      success: true,
      data: finalResults,
      total: filteredData.length,
      hasMore,
      message: `${finalResults.length} activités trouvées`
    };
  }

  /**
   * Trier les résultats selon le critère choisi
   */
  private sortResults(results: RechercheResult[], sortBy: string): RechercheResult[] {
    return [...results].sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || 0) - (b.distance || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }

  /**
   * Obtenir les catégories disponibles avec compteurs
   */
  getCategoriesDisponibles(): {
    id: string;
    name: string;
    icon: string;
    count?: number;
    subcategories?: string[];
  }[] {
    return [
      { 
        id: 'cultural', 
        name: 'Culture & Histoire', 
        icon: '🏛️',
        subcategories: ['museums', 'architecture', 'historic', 'monuments']
      },
      { 
        id: 'natural', 
        name: 'Nature & Paysages', 
        icon: '🌿',
        subcategories: ['natural', 'parks', 'beaches', 'mountains']
      },
      { 
        id: 'entertainment', 
        name: 'Divertissement', 
        icon: '🎢',
        subcategories: ['amusements', 'zoo', 'aquariums', 'entertainment']
      },
      { 
        id: 'sport', 
        name: 'Sport & Loisirs', 
        icon: '⚽',
        subcategories: ['sport', 'water_sports', 'winter_sports', 'climbing']
      },
      { 
        id: 'religion', 
        name: 'Sites Religieux', 
        icon: '⛪',
        subcategories: ['religion', 'churches', 'temples', 'synagogues']
      },
      { 
        id: 'food', 
        name: 'Gastronomie', 
        icon: '🍽️',
        subcategories: ['foods', 'restaurants', 'bars', 'cafes']
      },
      { 
        id: 'shops', 
        name: 'Shopping', 
        icon: '🛍️',
        subcategories: ['shops', 'markets', 'malls', 'souvenirs']
      },
      { 
        id: 'accommodation', 
        name: 'Hébergement', 
        icon: '🏨',
        subcategories: ['accomodations', 'hotels', 'hostels', 'camping']
      }
    ];
  }

  /**
   * Obtenir les options de tri disponibles
   */
  getSortOptions(): {
    id: string;
    name: string;
    icon: string;
  }[] {
    return [
      { id: 'distance', name: 'Distance', icon: '📍' },
      { id: 'rating', name: 'Note', icon: '⭐' },
      { id: 'name', name: 'Nom', icon: '🔤' }
    ];
  }

  /**
   * Recherche rapide autour d'un point
   */
  async rechercheRapide(
    coordinates: { lat: number; lng: number },
    query: string,
    limit: number = 20
  ): Promise<RechercheResult[]> {
    const result = await this.rechercherActivites({
      coordinates,
      query,
      limit,
      radius: 5000 // 5km pour recherche rapide
    });

    return result.success ? result.data : [];
  }

  /**
   * Recherche par nom de ville
   */
  async rechercherParVille(
    cityName: string,
    options?: {
      category?: string;
      radius?: number;
      limit?: number;
      minRating?: number;
    }
  ): Promise<{
    success: boolean;
    data: RechercheResult[];
    total: number;
    hasMore: boolean;
    cityCoordinates?: { lat: number; lng: number };
    message?: string;
    error?: string;
  }> {
    try {
      console.log('🏙️ Recherche par ville:', cityName, options);

      const result = await this.searchService.searchByCity(cityName, {
        category: options?.category,
        radius: options?.radius || 15000,
        limit: options?.limit || 30,
        minRating: options?.minRating
      });

      if (!result.success) {
        return {
          success: false,
          data: [],
          total: 0,
          hasMore: false,
          error: result.error,
          message: result.message || `Ville "${cityName}" non trouvée`
        };
      }

      const activites: RechercheResult[] = (result.data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.categories[0] || 'attraction',
        coordinates: item.coordinates,
        distance: item.distance,
        rating: item.rating,
        icon: item.icon || '📍',
        address: item.address,
        photos: item.photos,
        hasReviews: (item.rating && item.rating > 0) || false
      }));

      return {
        success: true,
        data: activites,
        total: activites.length,
        hasMore: false,
        cityCoordinates: result.cityCoordinates,
        message: result.message || `${activites.length} activités trouvées à ${cityName}`
      };

    } catch (error) {
      console.error('❌ Erreur recherche par ville:', error);
      return {
        success: false,
        data: [],
        total: 0,
        hasMore: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors de la recherche par ville'
      };
    }
  }

  /**
   * Obtenir les attractions populaires d'une zone
   */
  async getAttractionsPopulaires(
    coordinates: { lat: number; lng: number },
    radius: number = 10000
  ): Promise<RechercheResult[]> {
    const result = await this.rechercherActivites({
      coordinates,
      radius,
      limit: 100,
      minRating: 4,
      sortBy: 'rating'
    });

    return result.success ? result.data.slice(0, 20) : [];
  }

  /**
   * Formate une distance en mètres vers une chaîne lisible
   */
  formaterDistance(distanceEnMetres?: number): string {
    if (!distanceEnMetres) return '';
    
    if (distanceEnMetres < 1000) {
      return `${Math.round(distanceEnMetres)}m`;
    } else {
      return `${(distanceEnMetres / 1000).toFixed(1)}km`;
    }
  }
}

// Instance singleton
let rechercheServiceInstance: RechercheService | null = null;

export function getRechercheService(): RechercheService {
  if (!rechercheServiceInstance) {
    rechercheServiceInstance = new RechercheService();
  }
  return rechercheServiceInstance;
}

export type { RechercheFilters, RechercheParams, RechercheResult };


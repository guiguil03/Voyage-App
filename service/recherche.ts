/**
 * Service de recherche pour les composants React Native
 * Interface simplifiée utilisant OpenTripMap
 */

import { getSearchService, SearchParams, SearchUtils } from '../lib/recherche';

interface RechercheParams {
  coordinates: {
    lat: number;
    lng: number;
  };
  radius?: number;
  query?: string;
  category?: string;
  limit?: number;
  minRating?: number;
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
}

class RechercheService {
  private searchService = getSearchService();

  /**
   * Recherche d'activités et attractions
   */
  async rechercherActivites(params: RechercheParams): Promise<{
    success: boolean;
    data: RechercheResult[];
    total: number;
    message?: string;
    error?: string;
  }> {
    try {
      console.log('🔍 Recherche activités:', params);

      const searchParams: SearchParams = {
        coordinates: params.coordinates,
        radius: params.radius || 5000,
        limit: params.limit || 20,
        query: params.query,
        category: params.category,
        minRating: params.minRating
      };

      const result = await this.searchService.searchActivities(searchParams);

      if (!result.success) {
        return {
          success: false,
          data: [],
          total: 0,
          error: result.error,
          message: result.message
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
        photos: item.photos
      }));

      return {
        success: true,
        data: activites,
        total: result.total || activites.length,
        message: result.message
      };

    } catch (error) {
      console.error('❌ Erreur recherche activités:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Recherche par ville
   */
  async rechercherParVille(ville: string, options?: {
    category?: string;
    radius?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: RechercheResult[];
    coordinates?: { lat: number; lng: number };
    message?: string;
    error?: string;
  }> {
    try {
      console.log('🏙️ Recherche par ville:', ville);

      const result = await this.searchService.searchByCity(ville, {
        category: options?.category,
        radius: options?.radius || 10000,
        limit: options?.limit || 50
      });

      if (!result.success) {
        return {
          success: false,
          data: [],
          error: result.error,
          message: result.message
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
        photos: item.photos
      }));

      return {
        success: true,
        data: activites,
        coordinates: result.cityCoordinates,
        message: result.message
      };

    } catch (error) {
      console.error('❌ Erreur recherche par ville:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Autocomplétion pour la recherche
   */
  async autocompletion(query: string, coordinates?: { lat: number; lng: number }): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      name: string;
      type: string;
      coordinates?: { lat: number; lng: number };
    }>;
    message?: string;
    error?: string;
  }> {
    try {
      if (query.length < 2) {
        return {
          success: true,
          data: [],
          message: 'Tapez au moins 2 caractères'
        };
      }

      const result = await this.searchService.autocomplete(query, coordinates);

      if (!result.success) {
        return {
          success: false,
          data: [],
          error: result.error,
          message: result.message
        };
      }

      const suggestions = (result.data || []).map(item => ({
        id: item.id,
        name: item.name,
        type: item.categories[0] || 'lieu',
        coordinates: item.coordinates
      }));

      return {
        success: true,
        data: suggestions,
        message: result.message
      };

    } catch (error) {
      console.error('❌ Erreur autocomplétion:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Obtenir les catégories disponibles
   */
  getCategoriesDisponibles(): Array<{
    id: string;
    name: string;
    icon: string;
    subcategories?: string[];
  }> {
    const categories = this.searchService.getAvailableCategories();
    
    return [
      {
        id: 'historic',
        name: 'Histoire & Culture',
        icon: '🏛️',
        subcategories: categories.historic
      },
      {
        id: 'cultural',
        name: 'Arts & Culture',
        icon: '🎭',
        subcategories: categories.cultural
      },
      {
        id: 'natural',
        name: 'Nature',
        icon: '🌳',
        subcategories: categories.natural
      },
      {
        id: 'entertainment',
        name: 'Divertissement',
        icon: '🎢',
        subcategories: categories.entertainment
      },
      {
        id: 'sport',
        name: 'Sport & Loisirs',
        icon: '⚽',
        subcategories: categories.sport
      },
      {
        id: 'tourism',
        name: 'Tourisme',
        icon: '📸',
        subcategories: categories.tourism
      },
      {
        id: 'religion',
        name: 'Sites Religieux',
        icon: '⛪',
        subcategories: categories.religion
      }
    ];
  }

  /**
   * Filtrer et trier les résultats
   */
  filtrerResultats(
    resultats: RechercheResult[], 
    filtres: {
      maxDistance?: number;
      minRating?: number;
      sortBy?: 'distance' | 'rating' | 'name';
    }
  ): RechercheResult[] {
    let filtered = [...resultats];

    // Filtrage par distance
    if (filtres.maxDistance) {
      filtered = filtered.filter(r => !r.distance || r.distance <= filtres.maxDistance!);
    }

    // Filtrage par note
    if (filtres.minRating) {
      filtered = filtered.filter(r => !r.rating || r.rating >= filtres.minRating!);
    }

    // Tri
    switch (filtres.sortBy) {
      case 'distance':
        filtered.sort((a, b) => {
          if (!a.distance) return 1;
          if (!b.distance) return -1;
          return a.distance - b.distance;
        });
        break;
      case 'rating':
        filtered.sort((a, b) => {
          if (!a.rating) return 1;
          if (!b.rating) return -1;
          return b.rating - a.rating;
        });
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        break;
    }

    return filtered;
  }

  /**
   * Formater la distance pour l'affichage
   */
  formaterDistance(meters?: number): string {
    if (!meters) return '';
    return SearchUtils.formatDistance(meters);
  }

  /**
   * Obtenir l'icône pour une catégorie
   */
  getIconeCategorie(category: string): string {
    return SearchUtils.getIconForCategory(category);
  }
}

// Instance singleton
let rechercheServiceInstance: RechercheService | null = null;

/**
 * Obtient l'instance du service de recherche
 */
export function getRechercheService(): RechercheService {
  if (!rechercheServiceInstance) {
    rechercheServiceInstance = new RechercheService();
  }
  return rechercheServiceInstance;
}

export default RechercheService;
export type { RechercheParams, RechercheResult };

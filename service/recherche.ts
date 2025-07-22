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
  isPopular?: boolean; // Marque les lieux populaires/connus
}

class RechercheService {
  private searchService = getSearchService();

  /**
   * Recherche d'activités et attractions avec filtres avancés
   * Priorise automatiquement les lieux populaires et connus
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
      console.log('🔍 Recherche activités avancée (lieux populaires prioritaires):', params);

      // Recherche en 2 phases : d'abord les lieux populaires, puis tous les autres
      let allActivites: RechercheResult[] = [];

      // Phase 1 : Rechercher les lieux populaires (note >= 4)
      const popularParams: SearchParams = {
        coordinates: params.coordinates,
        radius: params.radius || 10000,
        limit: Math.min((params.limit || 50) * 2, 100), // Plus de résultats pour avoir du choix
        query: params.query,
        category: params.category,
        minRating: Math.max(params.minRating || 0, 4), // Minimum note 4 pour les populaires
        kinds: params.kinds
      };

      const popularResult = await this.searchService.searchActivities(popularParams);

      if (popularResult.success && popularResult.data) {
        const popularActivites = popularResult.data.map(item => ({
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
          hasReviews: (item.rating && item.rating > 0) || false,
          isPopular: true // Marquer comme populaire
        }));
        
        allActivites.push(...popularActivites);
      }

      // Phase 2 : Si pas assez de résultats populaires, chercher d'autres lieux
      const targetCount = params.limit || 50;
      if (allActivites.length < targetCount) {
        const remainingNeeded = targetCount - allActivites.length;
        
        const generalParams: SearchParams = {
          coordinates: params.coordinates,
          radius: params.radius || 15000, // Élargir le rayon
          limit: remainingNeeded * 2,
          query: params.query,
          category: params.category,
          minRating: Math.max(params.minRating || 0, 2), // Note minimum 2 pour les autres
          kinds: params.kinds
        };

        const generalResult = await this.searchService.searchActivities(generalParams);

        if (generalResult.success && generalResult.data) {
          const existingIds = new Set(allActivites.map(a => a.id));
          
          const additionalActivites = generalResult.data
            .filter(item => !existingIds.has(item.id))
            .map(item => ({
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
              hasReviews: (item.rating && item.rating > 0) || false,
              isPopular: false
            }));
          
          allActivites.push(...additionalActivites);
        }
      }

      // Tri intelligent : populaires d'abord, puis par note, puis par distance
      allActivites = this.sortResultsIntelligent(allActivites, params.sortBy);

      // Appliquer la pagination côté client
      const offset = params.offset || 0;
      const limit = params.limit || 50;
      const paginatedResults = allActivites.slice(offset, offset + limit);
      const hasMore = offset + limit < allActivites.length;

      return {
        success: true,
        data: paginatedResults,
        total: allActivites.length,
        hasMore,
        message: `${paginatedResults.length} activités trouvées (lieux populaires en priorité)`
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
   * Tri intelligent qui privilégie les lieux populaires et attractions majeures
   */
  private sortResultsIntelligent(results: RechercheResult[], sortBy?: string): RechercheResult[] {
    return [...results].sort((a, b) => {
      // 1. Privilégier les attractions touristiques majeures
      const aIsMajor = this.isMajorTouristAttraction(a);
      const bIsMajor = this.isMajorTouristAttraction(b);
      
      if (aIsMajor && !bIsMajor) return -1;
      if (!aIsMajor && bIsMajor) return 1;
      
      // 2. Puis privilégier les lieux populaires (bien notés)
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      
      // 3. Si même niveau de popularité, appliquer le tri demandé
      switch (sortBy) {
        case 'distance':
          return (a.distance || 0) - (b.distance || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
        default:
          // Tri par défaut : note puis distance
          const ratingDiff = (b.rating || 0) - (a.rating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          return (a.distance || 0) - (b.distance || 0);
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
   * Priorise automatiquement les attractions touristiques populaires
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
      console.log('🏙️ Recherche par ville (attractions populaires prioritaires):', cityName, options);

      let allActivites: RechercheResult[] = [];
      let cityCoordinates: { lat: number; lng: number } | undefined;

      // Phase 1 : Rechercher les attractions touristiques populaires (note >= 4)
      const popularResult = await this.searchService.searchByCity(cityName, {
        category: options?.category,
        radius: options?.radius || 15000,
        limit: Math.min((options?.limit || 30) * 2, 60),
        minRating: Math.max(options?.minRating || 0, 4) // Minimum note 4 pour les populaires
      });

      if (popularResult.success && popularResult.data) {
        cityCoordinates = popularResult.cityCoordinates;
        
        const popularActivites = popularResult.data.map(item => ({
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
          hasReviews: (item.rating && item.rating > 0) || false,
          isPopular: true
        }));
        
        allActivites.push(...popularActivites);
      }

      // Phase 2 : Si pas assez de résultats populaires, chercher d'autres attractions
      const targetCount = options?.limit || 30;
      if (allActivites.length < targetCount) {
        const remainingNeeded = targetCount - allActivites.length;
        
        const generalResult = await this.searchService.searchByCity(cityName, {
          category: options?.category,
          radius: (options?.radius || 15000) + 5000, // Élargir le rayon
          limit: remainingNeeded * 2,
          minRating: Math.max(options?.minRating || 0, 2) // Note minimum 2 pour les autres
        });

        if (generalResult.success && generalResult.data) {
          if (!cityCoordinates) {
            cityCoordinates = generalResult.cityCoordinates;
          }
          
          const existingIds = new Set(allActivites.map(a => a.id));
          
          const additionalActivites = generalResult.data
            .filter(item => !existingIds.has(item.id))
            .map(item => ({
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
              hasReviews: (item.rating && item.rating > 0) || false,
              isPopular: false
            }));
          
          allActivites.push(...additionalActivites);
        }
      }

      // Tri intelligent : populaires d'abord, puis par note
      allActivites = this.sortResultsIntelligent(allActivites, 'rating');

      return {
        success: true,
        data: allActivites.slice(0, targetCount),
        total: allActivites.length,
        hasMore: false,
        cityCoordinates,
        message: `${Math.min(allActivites.length, targetCount)} attractions trouvées à ${cityName} (lieux populaires en priorité)`
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
   * Retourne uniquement les lieux les plus connus et visités
   */
  async getAttractionsPopulaires(
    coordinates: { lat: number; lng: number },
    radius: number = 10000
  ): Promise<RechercheResult[]> {
    const result = await this.rechercherActivites({
      coordinates,
      radius,
      limit: 100,
      minRating: 5, // Note très élevée pour les vraiment populaires
      sortBy: 'rating'
    });

    // Filtrer pour garder seulement les vraiment populaires
    const popularResults = result.success ? 
      result.data
        .filter(item => item.rating && item.rating >= 5) // Note minimum 5
        .slice(0, 20) : [];

    return popularResults;
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

  /**
   * Détermine si un lieu est une attraction touristique majeure
   */
  private isMajorTouristAttraction(result: RechercheResult): boolean {
    const majorCategories = [
      'museums', 'historic', 'monuments', 'castles', 'palaces',
      'towers', 'cathedrals', 'churches', 'temples', 'bridges',
      'natural', 'beaches', 'mountains', 'parks', 'zoos',
      'amusements', 'theatres', 'cultural'
    ];

    const type = result.type?.toLowerCase() || '';
    const description = result.description?.toLowerCase() || '';
    const name = result.name?.toLowerCase() || '';

    // Vérifier si c'est une catégorie touristique majeure
    const isMajorCategory = majorCategories.some(category => 
      type.includes(category) || description.includes(category)
    );

    // Mots-clés indiquant une attraction majeure
    const majorKeywords = [
      'tower', 'cathedral', 'museum', 'palace', 'castle', 'monument',
      'beach', 'park', 'zoo', 'aquarium', 'gallery', 'theatre',
      'basilica', 'opera', 'stadium', 'bridge', 'fountain',
      'tour', 'cathédrale', 'musée', 'château', 'palais',
      'plage', 'parc', 'opéra', 'stade', 'pont', 'fontaine'
    ];

    const hasKeywords = majorKeywords.some(keyword =>
      name.includes(keyword) || description.includes(keyword)
    );

    return isMajorCategory || hasKeywords;
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


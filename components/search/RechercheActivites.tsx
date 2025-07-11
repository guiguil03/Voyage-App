import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Import des services unifié et individuels
import { Coordinates, getIconForCategory } from '../../lib/recherche';
import {
    getUnifiedSearchService,
    UnifiedPOI,
    UnifiedSearchParams,
    UnifiedSearchResponse
} from '../../lib/recherche-unifiee';


interface RechercheActivitesProps {
  coordinates?: Coordinates;
  onSelectPOI?: (poi: UnifiedPOI) => void;
}

type SearchMode = 'nearby' | 'category' | 'discover' | 'city';

export default function RechercheActivites({ 
  coordinates, 
  onSelectPOI, 
}: RechercheActivitesProps) {
  const [pois, setPois] = useState<UnifiedPOI[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('nearby');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cityName, setCityName] = useState('');
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(coordinates || null);
  const [lastSearchInfo, setLastSearchInfo] = useState<string>('');

  const unifiedSearchService = getUnifiedSearchService();

  // Obtenir la localisation si pas fournie en props
  useEffect(() => {
    if (!coordinates) {
      getCurrentLocation();
    } else {
      setCurrentCoordinates(coordinates);
    }
  }, [coordinates]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission de localisation refusée');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentCoordinates({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    } catch (error) {
      console.error('Erreur lors de l\'obtention de la localisation:', error);
    }
  };

  // Recherche unifiée (remplace searchPOI)
  const searchUnified = async (params: Partial<UnifiedSearchParams> = {}) => {
    if (!currentCoordinates) {
      console.log('Aucune coordonnée disponible');
      return;
    }

    setLoading(true);
    try {
      const searchParams: UnifiedSearchParams = {
        coordinates: currentCoordinates,
        radius: 5000,
        limit: 15,
        includeOpenTripMap: true,
        includeFoursquare: true,
        ...params,
      };

      console.log('🔍 Recherche unifiée avec params:', searchParams);
      
      const result: UnifiedSearchResponse = await unifiedSearchService.searchPlaces(searchParams);

      if (result.success && result.data) {
        setPois(result.data);
        setLastSearchInfo(`${result.message} (OpenTripMap: ${result.sources.opentripmap.count}, Foursquare: ${result.sources.foursquare.count})`);
        console.log('✅ Recherche terminée:', result.data.length, 'POIs');
      } else {
        console.error('❌ Erreur recherche:', result.error);
        setPois([]);
        setLastSearchInfo(result.error || 'Erreur de recherche');
      }
    } catch (error) {
      console.error('❌ Erreur recherche unifiée:', error);
      setPois([]);
      setLastSearchInfo('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Recherche par ville avec géocodage
  const searchByCity = async () => {
    if (!cityName.trim()) return;

    setLoading(true);
    try {
      console.log('🏙️ Recherche par ville:', cityName);
      
      // Géocodage avec l'API gratuite Nominatim
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData && geocodeData.length > 0) {
        const cityCoords: Coordinates = {
          lat: parseFloat(geocodeData[0].lat),
          lng: parseFloat(geocodeData[0].lon),
        };

        console.log('📍 Coordonnées trouvées pour', cityName, ':', cityCoords);
        setCurrentCoordinates(cityCoords);

        // Recherche avec les nouvelles coordonnées
        await searchUnified({
          coordinates: cityCoords,
          category: selectedCategory || undefined,
        });
      } else {
        console.log('❌ Ville non trouvée');
        setLastSearchInfo('Ville non trouvée');
      }
    } catch (error) {
      console.error('❌ Erreur géocodage:', error);
      setLastSearchInfo('Erreur de géocodage');
    } finally {
      setLoading(false);
    }
  };

  // Recherche par catégorie
  const searchByCategory = async (category: string) => {
    await searchUnified({
      category: category,
      limit: 20,
    });
  };

  // Découverte automatique
  const discoverNearby = async () => {
    await searchUnified({
      limit: 15,
      minRating: 3,
    });
  };

  // Catégories disponibles
  const categories = [
    { key: '', label: 'Tous', icon: 'apps' },
    { key: 'museums', label: 'Musées', icon: 'library' },
    { key: 'restaurants', label: 'Restaurants', icon: 'restaurant' },
    { key: 'parks', label: 'Parcs', icon: 'leaf' },
    { key: 'hotels', label: 'Hôtels', icon: 'bed' },
    { key: 'entertainment', label: 'Loisirs', icon: 'game-controller' },
    { key: 'shopping', label: 'Shopping', icon: 'storefront' },
    { key: 'historic', label: 'Historique', icon: 'time' },
  ];

  // Fonction de recherche selon le mode
  const handleSearch = () => {
    switch (searchMode) {
      case 'nearby':
        searchUnified();
        break;
      case 'category':
        if (selectedCategory) {
          searchByCategory(selectedCategory);
        } else {
          searchUnified();
        }
        break;
      case 'discover':
        discoverNearby();
        break;
      case 'city':
        searchByCity();
        break;
    }
  };

  // Obtenir la description d'un POI unifié
  const getPoiDescription = (poi: UnifiedPOI): string => {
    if (poi.categories && poi.categories.length > 0) {
      return poi.categories.slice(0, 2).join(', ');
    }
    return poi.description || 'Point d\'intérêt';
  };

  // Obtenir l'icône d'un POI unifié
  const getPoiIcon = (poi: UnifiedPOI): string => {
    if (poi.categories && poi.categories.length > 0) {
      return getIconForCategory(poi.categories.join(','));
    }
    return 'location';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recherche d&apos;Activités</Text>
        <Text style={styles.subtitle}>Découvrez des lieux d&apos;intérêt près de vous</Text>
        {lastSearchInfo && (
          <Text style={styles.searchInfo}>{lastSearchInfo}</Text>
        )}
      </View>

      {/* Mode de recherche */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, searchMode === 'nearby' && styles.activeModeButton]}
          onPress={() => setSearchMode('nearby')}
        >
          <Text style={[styles.modeText, searchMode === 'nearby' && styles.activeModeText]}>
            Proximité
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, searchMode === 'city' && styles.activeModeButton]}
          onPress={() => setSearchMode('city')}
        >
          <Text style={[styles.modeText, searchMode === 'city' && styles.activeModeText]}>
            Ville
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, searchMode === 'category' && styles.activeModeButton]}
          onPress={() => setSearchMode('category')}
        >
          <Text style={[styles.modeText, searchMode === 'category' && styles.activeModeText]}>
            Catégorie
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, searchMode === 'discover' && styles.activeModeButton]}
          onPress={() => setSearchMode('discover')}
        >
          <Text style={[styles.modeText, searchMode === 'discover' && styles.activeModeText]}>
            Découvrir
          </Text>
        </TouchableOpacity>
      </View>

      {/* Barre de recherche par ville */}
      {searchMode === 'city' && (
        <View style={styles.citySearchContainer}>
          <Ionicons name="location" size={20} color="#2F7417" style={styles.citySearchIcon} />
          <TextInput
            style={styles.citySearchInput}
            placeholder="Nom de la ville (ex: Paris, Lyon, Marseille...)"
            placeholderTextColor="#666"
            value={cityName}
            onChangeText={setCityName}
            onSubmitEditing={searchByCity}
          />
          {cityName.length > 0 && (
            <TouchableOpacity onPress={() => setCityName('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Catégories (pour les modes category et city) */}
      {(searchMode === 'category' || searchMode === 'city') && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                selectedCategory === category.key && styles.activeCategoryButton
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Ionicons 
                name={category.icon as any} 
                size={20} 
                color={selectedCategory === category.key ? '#fff' : '#2F7417'} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.key && styles.activeCategoryText
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Bouton de recherche */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={handleSearch}
        disabled={loading || (searchMode === 'city' && !cityName.trim())}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.searchButtonText}>
              {searchMode === 'nearby' ? 'Rechercher à proximité' :
               searchMode === 'city' ? `Rechercher à ${cityName || 'ville'}` :
               searchMode === 'category' ? 'Rechercher par catégorie' :
               'Découvrir automatiquement'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Informations sur la localisation actuelle */}
      {currentCoordinates && (
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.locationText}>
            📍 Recherche autour de {currentCoordinates.lat.toFixed(4)}, {currentCoordinates.lng.toFixed(4)}
          </Text>
        </View>
      )}

      {/* Informations sur la dernière recherche */}
      {lastSearchInfo && (
        <View style={styles.searchInfo}>
          <Text style={styles.searchInfoText}>{lastSearchInfo}</Text>
        </View>
      )}

      {/* Résultats */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {pois.length > 0 && (
          <View>
            <Text style={styles.resultsTitle}>📍 Points d&apos;intérêt trouvés ({pois.length})</Text>
            {pois.map((poi) => (
              <TouchableOpacity
                key={poi.id}
                style={styles.poiCard}
                onPress={() => onSelectPOI?.(poi)}
              >
                <View style={styles.poiHeader}>
                  <View style={styles.poiTitleContainer}>
                    <Ionicons 
                      name={getPoiIcon(poi) as any} 
                      size={20} 
                      color="#2F7417" 
                    />
                    <Text style={styles.poiName}>{poi.name}</Text>
                    {poi.source === 'foursquare' && (
                      <View style={styles.sourceBadge}>
                        <Text style={styles.sourceBadgeText}>4SQ</Text>
                      </View>
                    )}
                    {poi.source === 'opentripmap' && (
                      <View style={[styles.sourceBadge, { backgroundColor: '#FF6B35' }]}>
                        <Text style={styles.sourceBadgeText}>OTM</Text>
                      </View>
                    )}
                  </View>
                  {poi.rating && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>
                        {poi.source === 'foursquare' ? `${poi.rating}/10` : `${poi.rating}/7`}
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.poiDescription} numberOfLines={2}>
                  {getPoiDescription(poi)}
                </Text>
                
                <View style={styles.poiFooter}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {poi.categories?.[0] || 'POI'}
                    </Text>
                  </View>
                  {poi.distance && (
                    <Text style={styles.distanceText}>
                      📍 {Math.round(poi.distance)}m
                    </Text>
                  )}
                  {poi.price && (
                    <Text style={styles.priceText}>
                      {'€'.repeat(poi.price)}
                    </Text>
                  )}
                </View>
                
                {poi.address && (
                  <Text style={styles.addressText} numberOfLines={1}>
                    📍 {poi.address}
                  </Text>
                )}

                {poi.isOpen !== undefined && (
                  <View style={[styles.statusBadge, { backgroundColor: poi.isOpen ? '#4CAF50' : '#F44336' }]}>
                    <Text style={styles.statusText}>
                      {poi.isOpen ? '🟢 Ouvert' : '🔴 Fermé'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2F7417" />
            <Text style={styles.loadingText}>Recherche en cours...</Text>
          </View>
        )}

        {!loading && pois.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color="#ccc" />
            <Text style={styles.emptyContainerTitle}>Aucun résultat</Text>
            <Text style={styles.emptyText}>
              Essayez de modifier vos critères de recherche ou votre localisation
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    marginRight: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeModeButton: {
    backgroundColor: '#2F7417',
    borderColor: '#2F7417',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeModeText: {
    color: '#fff',
  },
  citySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  citySearchIcon: {
    marginRight: 12,
  },
  citySearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  clearButton: {
    marginLeft: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  categoriesContainer: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeCategoryButton: {
    backgroundColor: '#2F7417',
    borderColor: '#2F7417',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  activeCategoryText: {
    color: '#fff',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F7417',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  poiCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  poiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  poiTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  poiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  poiDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  poiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#F0F9F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#2F7417',
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  apiInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  apiInfoText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  apiInfoSubtext: {
    fontSize: 10,
    color: '#ccc',
  },
  searchInfo: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchInfoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sourceBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginLeft: 8,
  },
  sourceBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyContainerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  priceText: {
    fontSize: 14,
    color: '#2F7417',
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
}); 
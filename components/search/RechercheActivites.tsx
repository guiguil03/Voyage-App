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

// Import du nouveau service OpenTripMap
import { Coordinates } from '../../lib/recherche';
import { getRechercheService, type RechercheResult } from '../../service/recherche';

interface RechercheActivitesProps {
  coordinates?: Coordinates;
  onSelectPOI?: (poi: RechercheResult) => void;
}

type SearchMode = 'nearby' | 'category' | 'discover' | 'city';

export default function RechercheActivites({ 
  coordinates, 
  onSelectPOI, 
}: RechercheActivitesProps) {
  const [pois, setPois] = useState<RechercheResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('nearby');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cityName, setCityName] = useState('');
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(coordinates || null);
  const [lastSearchInfo, setLastSearchInfo] = useState<string>('');

  const rechercheService = getRechercheService();

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

  // Recherche par coordonnées
  const searchNearby = async () => {
    if (!currentCoordinates) {
      console.log('Aucune coordonnée disponible');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Recherche à proximité:', currentCoordinates);
      
      const result = await rechercheService.rechercherActivites({
        coordinates: currentCoordinates,
        radius: 5000,
        limit: 15,
        category: selectedCategory || undefined,
      });

      if (result.success) {
        setPois(result.data);
        setLastSearchInfo(`${result.total} activités trouvées via OpenTripMap`);
        console.log('✅ Recherche terminée:', result.data.length, 'POIs');
      } else {
        console.error('❌ Erreur recherche:', result.error);
        setPois([]);
        setLastSearchInfo(result.error || 'Erreur de recherche');
      }
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      setPois([]);
      setLastSearchInfo('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Recherche par ville
  const searchByCity = async () => {
    if (!cityName.trim()) return;

    setLoading(true);
    try {
      console.log('🏙️ Recherche par ville:', cityName);
      
      const result = await rechercheService.rechercherParVille(cityName, {
        category: selectedCategory || undefined,
        radius: 15000,
        limit: 20
      });

      if (result.success) {
        setPois(result.data);
        if (result.coordinates) {
          setCurrentCoordinates(result.coordinates);
        }
        setLastSearchInfo(`${result.data.length} activités trouvées à ${cityName}`);
        console.log('✅ Recherche ville terminée:', result.data.length, 'POIs');
      } else {
        console.error('❌ Erreur recherche ville:', result.error);
        setPois([]);
        setLastSearchInfo(result.error || `Ville "${cityName}" non trouvée`);
      }
    } catch (error) {
      console.error('❌ Erreur recherche ville:', error);
      setLastSearchInfo('Erreur de recherche');
      setPois([]);
    } finally {
      setLoading(false);
    }
  };

  // Recherche par catégorie
  const searchByCategory = async (category: string) => {
    if (!currentCoordinates) {
      console.log('Aucune coordonnée disponible pour la recherche par catégorie');
      return;
    }

    setLoading(true);
    try {
      const result = await rechercheService.rechercherActivites({
        coordinates: currentCoordinates,
        radius: 10000,
        limit: 20,
        category: category,
      });

      if (result.success) {
        setPois(result.data);
        setLastSearchInfo(`${result.total} activités trouvées dans la catégorie`);
      } else {
        setPois([]);
        setLastSearchInfo(result.error || 'Erreur de recherche par catégorie');
      }
    } catch (error) {
      console.error('❌ Erreur recherche catégorie:', error);
      setPois([]);
      setLastSearchInfo('Erreur de recherche');
    } finally {
      setLoading(false);
    }
  };

  // Découverte automatique avec filtres
  const discoverNearby = async () => {
    if (!currentCoordinates) return;

    setLoading(true);
    try {
      const result = await rechercheService.rechercherActivites({
        coordinates: currentCoordinates,
        radius: 8000,
        limit: 15,
        minRating: 3,
      });

      if (result.success) {
        // Trier par note si disponible
        const sortedResults = rechercheService.filtrerResultats(result.data, {
          minRating: 3,
          sortBy: 'rating'
        });
        setPois(sortedResults);
        setLastSearchInfo(`${sortedResults.length} lieux recommandés découverts`);
      } else {
        setPois([]);
        setLastSearchInfo(result.error || 'Erreur de découverte');
      }
    } catch (error) {
      console.error('❌ Erreur découverte:', error);
      setPois([]);
      setLastSearchInfo('Erreur de découverte');
    } finally {
      setLoading(false);
    }
  };

  // Catégories disponibles basées sur OpenTripMap
  const categories = [
    { key: '', label: 'Tous', icon: 'apps' },
    { key: 'museums', label: 'Musées', icon: 'library' },
    { key: 'historic', label: 'Historique', icon: 'time' },
    { key: 'cultural', label: 'Culture', icon: 'color-palette' },
    { key: 'natural', label: 'Nature', icon: 'leaf' },
    { key: 'entertainment', label: 'Loisirs', icon: 'game-controller' },
    { key: 'sport', label: 'Sport', icon: 'fitness' },
    { key: 'religion', label: 'Religion', icon: 'business' },
  ];

  // Fonction de recherche selon le mode
  const handleSearch = () => {
    switch (searchMode) {
      case 'nearby':
        searchNearby();
        break;
      case 'category':
        if (selectedCategory) {
          searchByCategory(selectedCategory);
        } else {
          searchNearby();
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

  // Obtenir la description d'un POI
  const getPoiDescription = (poi: RechercheResult): string => {
    return poi.description || poi.type || 'Point d\'intérêt';
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
        <View style={styles.searchInfoContainer}>
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
                    <Text style={styles.poiIcon}>{poi.icon}</Text>
                    <Text style={styles.poiName}>{poi.name}</Text>
                    <View style={styles.sourceBadge}>
                      <Text style={styles.sourceBadgeText}>OTM</Text>
                    </View>
                  </View>
                  {poi.rating && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>
                        {poi.rating.toFixed(1)}/7
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
                      {poi.type || 'POI'}
                    </Text>
                  </View>
                  {poi.distance && (
                    <Text style={styles.distanceText}>
                      📍 {rechercheService.formaterDistance(poi.distance)}
                    </Text>
                  )}
                </View>
                
                {poi.address && (
                  <Text style={styles.addressText} numberOfLines={1}>
                    📍 {poi.address}
                  </Text>
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
  poiIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  poiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
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
  searchInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchInfoContainer: {
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
  addressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
}); 
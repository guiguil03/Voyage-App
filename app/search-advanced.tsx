import { getRechercheService, type RechercheFilters, type RechercheResult } from '@/service/recherche';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SearchAdvancedScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<RechercheResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Filtres
  const [filters, setFilters] = useState<Partial<RechercheFilters>>({
    categories: [],
    minRating: 0,
    maxDistance: 10000,
    sortBy: 'distance',
    showOnlyWithPhotos: false,
    showOnlyWithReviews: false,
  });

  const rechercheService = getRechercheService();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'L\'accès à la localisation est nécessaire pour cette fonctionnalité.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      
      setCurrentLocation(userLocation);
      console.log('📍 Position utilisateur:', userLocation);
    } catch (error) {
      console.error('❌ Erreur géolocalisation:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position.');
    }
  };

  const performSearch = async (resetResults = true) => {
    if (!currentLocation) {
      Alert.alert('Erreur', 'Position non disponible. Activez la géolocalisation.');
      return;
    }

    if (resetResults) {
      setOffset(0);
      setResults([]);
    }

    setLoading(true);

    try {
      const searchOffset = resetResults ? 0 : offset;
      
      const result = await rechercheService.rechercherAvecFiltres(
        currentLocation,
        filters,
        searchQuery || undefined,
        searchOffset,
        20
      );

      if (result.success) {
        if (resetResults) {
          setResults(result.data);
        } else {
          setResults(prev => [...prev, ...result.data]);
        }
        
        setTotalResults(result.total);
        setHasMore(result.hasMore);
        setOffset(prev => prev + result.data.length);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la recherche');
      }
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite lors de la recherche.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      performSearch(false);
    }
  };

  const openInMaps = async (result: RechercheResult) => {
    const { lat, lng } = result.coordinates;
    const label = encodeURIComponent(result.name);
    const url = `https://maps.google.com/maps?q=${lat},${lng}(${label})`;
    
    await WebBrowser.openBrowserAsync(url);
  };

  const resetFilters = () => {
    setFilters({
      categories: [],
      minRating: 0,
      maxDistance: 10000,
      sortBy: 'distance',
      showOnlyWithPhotos: false,
      showOnlyWithReviews: false,
    });
  };

  const applyFilters = () => {
    setShowFilters(false);
    performSearch(true);
  };

  const renderResultItem = ({ item }: { item: RechercheResult }) => (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultIcon}>{item.icon}</Text>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.resultType}>{item.type}</Text>
        </View>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => openInMaps(item)}
        >
          <Ionicons name="map-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {item.description && (
        <Text style={styles.resultDescription} numberOfLines={3}>
          {item.description}
        </Text>
      )}
      
      <View style={styles.resultDetails}>
        {item.distance && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {(item.distance / 1000).toFixed(1)} km
            </Text>
          </View>
        )}
        
        {item.rating && (
          <View style={styles.detailItem}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.detailText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
        
        {item.hasReviews && (
          <View style={styles.detailItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Avis</Text>
          </View>
        )}
      </View>
      
      {item.address && (
        <Text style={styles.resultAddress} numberOfLines={2}>
          {item.address}
        </Text>
      )}
    </View>
  );

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.modalCancel}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filtres</Text>
          <TouchableOpacity onPress={applyFilters}>
            <Text style={styles.modalApply}>Appliquer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Catégories */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Catégories</Text>
            {rechercheService.getCategoriesDisponibles().map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  filters.categories?.includes(category.id) && styles.categoryOptionSelected
                ]}
                onPress={() => {
                  setFilters(prev => ({
                    ...prev,
                    categories: prev.categories?.includes(category.id)
                      ? prev.categories.filter(c => c !== category.id)
                      : [...(prev.categories || []), category.id]
                  }));
                }}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  filters.categories?.includes(category.id) && styles.categoryTextSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Distance */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Distance maximale</Text>
            <View style={styles.distanceButtons}>
              {[1000, 5000, 10000, 20000].map((distance) => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.distanceButton,
                    filters.maxDistance === distance && styles.distanceButtonSelected
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, maxDistance: distance }))}
                >
                  <Text style={[
                    styles.distanceButtonText,
                    filters.maxDistance === distance && styles.distanceButtonTextSelected
                  ]}>
                    {distance >= 1000 ? `${distance / 1000}km` : `${distance}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note minimale */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Note minimale</Text>
            <View style={styles.ratingButtons}>
              {[0, 3, 4, 4.5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    filters.minRating === rating && styles.ratingButtonSelected
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                >
                  <Text style={[
                    styles.ratingButtonText,
                    filters.minRating === rating && styles.ratingButtonTextSelected
                  ]}>
                    {rating === 0 ? 'Toutes' : `${rating}+ ⭐`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tri */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Trier par</Text>
            {rechercheService.getSortOptions().map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.sortOption,
                  filters.sortBy === option.id && styles.sortOptionSelected
                ]}
                onPress={() => setFilters(prev => ({ ...prev, sortBy: option.id as any }))}
              >
                <Text style={styles.sortIcon}>{option.icon}</Text>
                <Text style={[
                  styles.sortText,
                  filters.sortBy === option.id && styles.sortTextSelected
                ]}>
                  {option.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Options avancées */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Options avancées</Text>
            
            <View style={styles.switchOption}>
              <Text style={styles.switchLabel}>Avec photos uniquement</Text>
              <TouchableOpacity
                style={[
                  styles.switch,
                  filters.showOnlyWithPhotos && styles.switchActive
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  showOnlyWithPhotos: !prev.showOnlyWithPhotos 
                }))}
              >
                <View style={[
                  styles.switchThumb,
                  filters.showOnlyWithPhotos && styles.switchThumbActive
                ]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.switchOption}>
              <Text style={styles.switchLabel}>Avec avis uniquement</Text>
              <TouchableOpacity
                style={[
                  styles.switch,
                  filters.showOnlyWithReviews && styles.switchActive
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  showOnlyWithReviews: !prev.showOnlyWithReviews 
                }))}
              >
                <View style={[
                  styles.switchThumb,
                  filters.showOnlyWithReviews && styles.switchThumbActive
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reset */}
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Recherche Avancée</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des activités..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => performSearch(true)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => performSearch(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Rechercher</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {totalResults > 0 ? `${totalResults} résultats` : 'Aucun résultat'}
          </Text>
          {currentLocation && (
            <Text style={styles.locationText}>
              📍 Position actuelle
            </Text>
          )}
        </View>

        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => 
            loading && results.length > 0 ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator color="#007AFF" />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={() =>
            !loading && results.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color="#CCC" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Aucun résultat trouvé' : 'Lancez une recherche pour voir les résultats'}
                </Text>
              </View>
            ) : null
          }
        />
      </View>

      {/* Filters Modal */}
      {renderFiltersModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationText: {
    fontSize: 14,
    color: '#007AFF',
  },
  resultCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  mapButton: {
    padding: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  resultDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  resultAddress: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 250,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalCancel: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalApply: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  filterSection: {
    backgroundColor: '#FFF',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#F0F8FF',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  categoryTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  distanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  distanceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    marginBottom: 8,
  },
  distanceButtonSelected: {
    backgroundColor: '#007AFF',
  },
  distanceButtonText: {
    fontSize: 14,
    color: '#666',
  },
  distanceButtonTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  ratingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ratingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    marginBottom: 8,
  },
  ratingButtonSelected: {
    backgroundColor: '#007AFF',
  },
  ratingButtonText: {
    fontSize: 14,
    color: '#666',
  },
  ratingButtonTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionSelected: {
    backgroundColor: '#F0F8FF',
  },
  sortIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  sortText: {
    fontSize: 16,
    color: '#333',
  },
  sortTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  switchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5E5',
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#007AFF',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  resetButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
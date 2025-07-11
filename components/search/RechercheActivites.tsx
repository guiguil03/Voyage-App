import {
    CATEGORIES,
    createCoordinates,
    getIconForCategory,
    getOpenTripMapService,
    setupOpenTripMapService,
    translateKinds,
    type Coordinates,
    type POI
} from '@/lib/recherche';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface RechercheActivitesProps {
  coordinates?: Coordinates;
  onSelectPOI?: (poi: POI) => void;
}

type SearchMode = 'nearby' | 'category' | 'discover';

export default function RechercheActivites({ 
  coordinates, 
  onSelectPOI, 
}: RechercheActivitesProps) {
  // État
  const [searchMode, setSearchMode] = useState<SearchMode>('nearby');
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Résultats
  const [pois, setPois] = useState<POI[]>([]);

  // Configuration par défaut (Paris)
  const defaultCoordinates = coordinates || createCoordinates(48.8566, 2.3522);

  // Initialisation du service
  useEffect(() => {
    try {
      setupOpenTripMapService();
      setIsInitialized(true);
    } catch (error) {
      console.error('Erreur initialisation OpenTripMap:', error);
      Alert.alert('Erreur', 'Impossible d\'initialiser le service de recherche');
    }
  }, []);

  // Recherche POI par catégorie
  const searchPOI = async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    try {
      const service = getOpenTripMapService();
      
      const result = await service.searchPOI({
        coordinates: defaultCoordinates,
        kinds: selectedCategory ? [selectedCategory] : undefined,
        radius: 5000,
        limit: 20,
        minRate: 3
      });

      if (result.success && result.data) {
        setPois(result.data);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la recherche');
      }
    } catch (error) {
      console.error('Erreur recherche POI:', error);
      Alert.alert('Erreur', 'Erreur lors de la recherche');
    }
    setLoading(false);
  };

  // Découverte automatique de lieux intéressants
  const discoverNearby = async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    try {
      const service = getOpenTripMapService();
      
      const result = await service.discoverNearby(defaultCoordinates, {
        radius: 3000,
        limit: 15,
        excludeKinds: ['transport', 'accommodations']
      });

      if (result.success && result.data) {
        setPois(result.data);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la découverte');
      }
    } catch (error) {
      console.error('Erreur découverte:', error);
      Alert.alert('Erreur', 'Erreur lors de la découverte');
    }
    setLoading(false);
  };

  // Recherche par catégorie spécifique
  const searchByCategory = async (category: string) => {
    if (!isInitialized) return;
    
    setLoading(true);
    try {
      const service = getOpenTripMapService();
      
      const result = await service.searchByCategory(
        defaultCoordinates,
        category,
        {
          radius: 5000,
          limit: 15,
          minRate: 3
        }
      );

      if (result.success && result.data) {
        setPois(result.data);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la recherche');
      }
    } catch (error) {
      console.error('Erreur recherche catégorie:', error);
      Alert.alert('Erreur', 'Erreur lors de la recherche');
    }
    setLoading(false);
  };

  // Catégories disponibles avec traduction
  const categories = [
    { key: '', label: 'Tous', icon: 'apps' },
    { key: CATEGORIES.MUSEUMS, label: 'Musées', icon: 'library' },
    { key: CATEGORIES.MONUMENTS, label: 'Monuments', icon: 'business' },
    { key: CATEGORIES.PARKS, label: 'Parcs', icon: 'leaf' },
    { key: CATEGORIES.CHURCHES, label: 'Églises', icon: 'home' },
    { key: CATEGORIES.GALLERIES, label: 'Galeries', icon: 'images' },
    { key: CATEGORIES.ENTERTAINMENT, label: 'Loisirs', icon: 'game-controller' },
  ];

  // Obtenir la description d'un POI
  const getPoiDescription = (poi: POI): string => {
    const categories = translateKinds(poi.kinds);
    return categories.slice(0, 2).join(', ') || 'Point d\'intérêt';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recherche OpenTripMap</Text>
        <Text style={styles.subtitle}>Découvrez des lieux d&apos;intérêt près de vous</Text>
      </View>

      {/* Mode de recherche */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, searchMode === 'nearby' && styles.activeModeButton]}
          onPress={() => setSearchMode('nearby')}
        >
          <Text style={[styles.modeText, searchMode === 'nearby' && styles.activeModeText]}>
            À proximité
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, searchMode === 'category' && styles.activeModeButton]}
          onPress={() => setSearchMode('category')}
        >
          <Text style={[styles.modeText, searchMode === 'category' && styles.activeModeText]}>
            Par catégorie
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

      {/* Catégories (seulement pour le mode category) */}
      {searchMode === 'category' && (
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
        onPress={() => {
          if (searchMode === 'nearby') {
            searchPOI();
          } else if (searchMode === 'category' && selectedCategory) {
            searchByCategory(selectedCategory);
          } else if (searchMode === 'discover') {
            discoverNearby();
          } else {
            searchPOI();
          }
        }}
        disabled={loading || !isInitialized}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.searchButtonText}>
              {searchMode === 'nearby' ? 'Rechercher à proximité' :
               searchMode === 'category' ? 'Rechercher par catégorie' :
               'Découvrir automatiquement'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Résultats */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {pois.length > 0 && (
          <View>
            <Text style={styles.resultsTitle}>📍 Points d&apos;intérêt trouvés ({pois.length})</Text>
            {pois.map((poi) => (
              <TouchableOpacity
                key={poi.xid}
                style={styles.poiCard}
                onPress={() => onSelectPOI?.(poi)}
              >
                <View style={styles.poiHeader}>
                  <View style={styles.poiTitleContainer}>
                    <Ionicons 
                      name={getIconForCategory(poi.kinds) as any} 
                      size={20} 
                      color="#2F7417" 
                    />
                    <Text style={styles.poiName}>{poi.name}</Text>
                  </View>
                  {poi.rate && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>{poi.rate}/7</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.poiDescription} numberOfLines={2}>
                  {getPoiDescription(poi)}
                </Text>
                
                <View style={styles.poiFooter}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {translateKinds(poi.kinds)[0] || 'POI'}
                    </Text>
                  </View>
                  {poi.distance && (
                    <Text style={styles.distanceText}>
                      {Math.round(poi.distance)}m
                    </Text>
                  )}
                </View>

                {/* Informations supplémentaires */}
                <View style={styles.additionalInfo}>
                  {poi.wikipedia && (
                    <View style={styles.infoRow}>
                      <Ionicons name="book" size={14} color="#666" />
                      <Text style={styles.infoText}>Wikipedia disponible</Text>
                    </View>
                  )}
                  {poi.image && (
                    <View style={styles.infoRow}>
                      <Ionicons name="image" size={14} color="#666" />
                      <Text style={styles.infoText}>Photo disponible</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* État vide */}
        {!loading && pois.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="map" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>Aucun lieu trouvé</Text>
            <Text style={styles.emptySubtitle}>
              {searchMode === 'category' 
                ? 'Sélectionnez une catégorie et lancez la recherche'
                : 'Lancez une recherche pour découvrir des lieux d\'intérêt'
              }
            </Text>
          </View>
        )}

        {/* Informations sur OpenTripMap */}
        {!loading && (
          <View style={styles.apiInfo}>
            <Text style={styles.apiInfoText}>
              Données fournies par OpenTripMap
            </Text>
            <Text style={styles.apiInfoSubtext}>
              Base de données collaborative de lieux touristiques
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeModeText: {
    color: '#fff',
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
}); 
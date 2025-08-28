import { getRechercheService, type RechercheResult } from '@/service/recherche';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories?: string[];
}

export default function SearchActivitiesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [results, setResults] = useState<RechercheResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const rechercheService = getRechercheService();

  useEffect(() => {
    loadCategories();
    getCurrentLocation();
  }, []);

  const loadCategories = () => {
    const availableCategories = rechercheService.getCategoriesDisponibles();
    setCategories(availableCategories);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission de localisation refusée');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
    }
  };

  const searchActivities = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une destination');
      return;
    }

    setLoading(true);
    try {
      let searchResult;

      if (location && (searchQuery.toLowerCase().includes('proche') || searchQuery.toLowerCase().includes('ici'))) {
        // Recherche autour de la position actuelle
        searchResult = await rechercheService.rechercherActivites({
          coordinates: location,
          radius: 10000, // 10km
          category: selectedCategory || undefined,
          limit: 20
        });
      } else {
        // Recherche par ville
        searchResult = await rechercheService.rechercherParVille(searchQuery, {
          category: selectedCategory || undefined,
          radius: 15000, // 15km autour de la ville
          limit: 30
        });
      }

      if (searchResult.success) {
        setResults(searchResult.data);
        if (searchResult.data.length === 0) {
          Alert.alert('Aucun résultat', `Aucune activité trouvée pour "${searchQuery}"`);
        }
      } else {
        Alert.alert('Erreur', searchResult.error || 'Erreur lors de la recherche');
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      Alert.alert('Erreur', 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const navigateToDetails = (item: RechercheResult) => {
    router.push({
      pathname: '/activity-details',
      params: {
        id: item.id,
        name: item.name,
        description: item.description || '',
        type: item.type,
        rating: item.rating?.toString() || '',
        distance: item.distance?.toString() || '',
        address: item.address || '',
        photos: JSON.stringify(item.photos || []),
        coordinates: JSON.stringify(item.coordinates),
        icon: item.icon,
        isPopular: item.isPopular?.toString() || 'false'
      }
    });
  };

  const renderActivity = ({ item }: { item: RechercheResult }) => (
    <TouchableOpacity style={styles.activityCard} onPress={() => navigateToDetails(item)}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityIcon}>{item.icon}</Text>
        <View style={styles.activityInfo}>
          <Text style={styles.activityName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.activityType}>
            {item.description || item.type}
          </Text>
          {item.distance && (
            <Text style={styles.activityDistance}>
              📍 {rechercheService.formaterDistance(item.distance)}
            </Text>
          )}
        </View>
        {item.rating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      
      {item.address && (
        <Text style={styles.activityAddress} numberOfLines={1}>
          {item.address}
        </Text>
      )}
      
      {item.photos && item.photos.length > 0 && (
        <Image 
          source={{ uri: item.photos[0] }} 
          style={styles.activityImage}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.categoryChipSelected
      ]}
      onPress={() => handleCategorySelect(item.id)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextSelected
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2F7417" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Suggestions d&apos;activités</Text>
          <Text style={styles.subtitle}>Découvrez les meilleures attractions</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Barre de recherche */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Chercher une ville... (ex: Paris, Lyon)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchActivities}
            />
            {location && (
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={() => setSearchQuery('Proche de moi')}
              >
                <Ionicons name="location" size={18} color="#2F7417" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={searchActivities}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="search" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Catégories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Résultats */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>
              {results.length > 0 ? `${results.length} activités trouvées` : 'Activités'}
            </Text>
            {selectedCategory && (
              <TouchableOpacity 
                style={styles.clearFilterButton}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={styles.clearFilterText}>Effacer filtres</Text>
                <Ionicons name="close-circle" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2F7417" />
              <Text style={styles.loadingText}>Recherche en cours...</Text>
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderActivity}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.activitiesList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune activité trouvée</Text>
              <Text style={styles.emptyText}>
                Essayez de chercher une ville ou utilisez votre position actuelle
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1a1a1a',
  },
  locationButton: {
    padding: 8,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2F7417',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  categoriesSection: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryChipSelected: {
    backgroundColor: '#2F7417',
    borderColor: '#2F7417',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  resultsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFilterText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  activitiesList: {
    gap: 16,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  activityType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityDistance: {
    fontSize: 12,
    color: '#2F7417',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
  },
  activityAddress: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  activityImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 8,
  },
}); 
import { getOpenTripMapService } from '@/lib/opentripmap';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const categories = [
  { id: 1, name: 'Aventure', icon: 'trail-sign' },
  { id: 2, name: 'Plage', icon: 'sunny' },
  { id: 3, name: 'Ville', icon: 'business' },
  { id: 4, name: 'Culture', icon: 'library' },
  { id: 5, name: 'Nature', icon: 'leaf' },
  { id: 6, name: 'Gastronomie', icon: 'restaurant' },
];

const popularDestinations = [
  {
    name: 'Paris',
    country: 'France',
    image: require('@/assets/images/temple-bali-sunset.jpg'),
  },
  {
    name: 'Rome',
    country: 'Italie',
    image: require('@/assets/images/temple-water-sunset.jpg'),
  },
  {
    name: 'Tokyo',
    country: 'Japon',
    image: require('@/assets/images/mountain-background.jpg'),
  },
  {
    name: 'New York',
    country: 'États-Unis',
    image: require('@/assets/images/temple-bali-sunset.jpg'),
  },
  {
    name: 'Bali',
    country: 'Indonésie',
    image: require('@/assets/images/temple-bali-sunset.jpg'),
  },
  {
    name: 'Le Cap',
    country: 'Afrique du Sud',
    image: require('@/assets/images/temple-water-sunset.jpg'),
  },
];

function getFallbackImageForKind(kind: string) {
  if (!kind) return require('@/assets/images/mountain-background.jpg');
  const k = kind.toLowerCase();
  if (k.includes('museum')) return require('@/assets/images/temple-bali-sunset.jpg');
  if (k.includes('historic') || k.includes('monument')) return require('@/assets/images/temple-water-sunset.jpg');
  if (k.includes('nature') || k.includes('park') || k.includes('forest')) return require('@/assets/images/mountain-background.jpg');
  if (k.includes('beach')) return require('@/assets/images/temple-bali-sunset.jpg');
  if (k.includes('square')) return require('@/assets/images/temple-water-sunset.jpg');
  if (k.includes('church') || k.includes('religion')) return require('@/assets/images/temple-bali-sunset.jpg');
  return require('@/assets/images/mountain-background.jpg');
}

export default function ExploreScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);

  // Charger les lieux d'une ville sélectionnée
  useEffect(() => {
    if (!selectedCity) return;
    const fetchDestinations = async () => {
      setLoading(true);
      try {
        const otm = getOpenTripMapService();
        const result = await otm.searchByCity(selectedCity.name, {
          kinds: selectedCategory ? [selectedCategory.toLowerCase()] : undefined,
          limit: 12,
          radius: 15000,
          minRate: 3
        });
        if (result.success && result.data && result.data.places) {
          setDestinations(result.data.places);
        } else {
          setDestinations([]);
        }
      } catch (e) {
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, [selectedCity, selectedCategory]);

  // Filtrer les villes selon la recherche
  const filteredCities = popularDestinations.filter(city =>
    city.name.toLowerCase().includes(searchText.toLowerCase()) ||
    city.country.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleDestinationPress = (destination: any) => {
    Alert.alert(destination.name, `Découvrir ${destination.name} pour ${destination.price}`);
  };

  const handleCategoryPress = (categoryName: string) => {
    setSelectedCategory(selectedCategory === categoryName ? null : categoryName);
  };

  const handleSeeAllPress = () => {
    Alert.alert('Voir tout', 'Afficher toutes les destinations disponibles');
  };

  const handleAdvancedSearch = () => {
    router.push('/search-advanced');
  };

  const handlePlannerPress = () => {
    Alert.alert('Planificateur IA', 'Fonctionnalité de planification automatique à venir !');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dégradé premium en haut */}
      <LinearGradient
        colors={["#E8F5E8", "#F8F9FA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220, zIndex: 0 }}
      />
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'transparent', borderBottomWidth: 0, marginTop: 10, marginBottom: 18, zIndex: 1 }]}>
          <Text style={[styles.title, { fontSize: 30 }]}>Explorer</Text>
          <Text style={[styles.subtitle, { fontSize: 17 }]}>Découvrez votre prochaine destination</Text>
        </View>

        {/* Barre de recherche */}
        <BlurView intensity={30} tint="light" style={styles.searchContainerBlur}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={styles.searchIcon.color} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une destination..."
              placeholderTextColor="#666"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </BlurView>

        {/* Catégories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((category) => (
              <BlurView key={category.id} intensity={30} tint="light" style={[
                styles.categoryCardBlur,
                selectedCategory === category.name && styles.selectedCategoryCardBlur
              ]}>
                <TouchableOpacity
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.name && styles.selectedCategoryCard
                  ]}
                  onPress={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                >
                  <View style={[
                    styles.categoryIconContainer,
                    selectedCategory === category.name && styles.selectedCategoryIcon
                  ]}>
                    <Ionicons 
                      name={category.icon as any} 
                      size={24} 
                      color={selectedCategory === category.name ? '#fff' : '#2F7417'} 
                    />
                  </View>
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.name && styles.selectedCategoryText
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              </BlurView>
            ))}
          </ScrollView>
        </View>

        {/* Destinations populaires (villes) */}
        {!selectedCity && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Destinations populaires</Text>
            </View>
            {filteredCities.length > 0 ? (
              filteredCities.map((city, idx) => (
                <BlurView key={city.name + idx} intensity={30} tint="light" style={styles.destinationCardBlur}>
                  <TouchableOpacity style={styles.destinationCard} onPress={() => setSelectedCity(city)}>
                    <Image source={city.image} style={styles.destinationImage} />
                    <View style={styles.destinationInfo}>
                      <View style={styles.destinationHeader}>
                        <Text style={styles.destinationName}>{city.name}</Text>
                        <Text style={styles.destinationPrice}>{city.country}</Text>
                      </View>
                    </View>
<<<<<<< HEAD
                  </View>
            </TouchableOpacity>
=======
                  </TouchableOpacity>
                </BlurView>
>>>>>>> b65fc8c637b9989ed7dd580154e77611390f2edd
              ))
            ) : (
              <Text style={{ textAlign: 'center', color: '#888', marginVertical: 20 }}>Aucune destination trouvée</Text>
            )}
          </View>
        )}

        {/* Lieux de la ville sélectionnée */}
        {selectedCity && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity onPress={() => setSelectedCity(null)}>
                <Ionicons name="arrow-back" size={22} color="#2F7417" />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>À {selectedCity.name}</Text>
            </View>
            {loading ? (
              <Text style={{ textAlign: 'center', color: '#666', marginVertical: 20 }}>Chargement...</Text>
            ) : destinations.length > 0 ? (
              destinations.map((destination) => {
                const hasImage = !!(destination.preview?.source || destination.image);
                return hasImage ? (
<<<<<<< HEAD
            <TouchableOpacity 
                    key={destination.xid || destination.id} 
              style={styles.destinationCard}
              onPress={() => handleDestinationPress(destination)}
            >
                    <Image source={{ uri: destination.preview?.source || destination.image }} style={styles.destinationImage} />
              <View style={styles.destinationInfo}>
                <View style={styles.destinationHeader}>
                  <Text style={styles.destinationName}>{destination.name}</Text>
                        {destination.rate && <Text style={styles.destinationPrice}>★ {destination.rate}</Text>}
                </View>
                <View style={styles.destinationDetails}>
                  <View style={styles.ratingContainer}>
                          {destination.kinds && <Text style={styles.categoryTagText}>{destination.kinds.split(',')[0]}</Text>}
                  </View>
                        {destination.address?.country && (
                  <View style={styles.categoryTag}>
                            <Text style={styles.categoryTagText}>{destination.address.country}</Text>
                  </View>
                        )}
                </View>
              </View>
            </TouchableOpacity>
                ) : (
                  <TouchableOpacity
=======
                  <BlurView 
>>>>>>> b65fc8c637b9989ed7dd580154e77611390f2edd
                    key={destination.xid || destination.id}
                    intensity={30} 
                    tint="light" 
                    style={styles.destinationCardBlur}
                  >
                    <TouchableOpacity 
                      style={styles.destinationCard}
                      onPress={() => handleDestinationPress(destination)}
                    >
                      <Image source={{ uri: destination.preview?.source || destination.image }} style={styles.destinationImage} />
                      <View style={styles.destinationInfo}>
                        <View style={styles.destinationHeader}>
                          <Text style={styles.destinationName}>{destination.name}</Text>
                          {destination.rate && <Text style={styles.destinationPrice}>★ {destination.rate}</Text>}
                        </View>
                        <View style={styles.destinationDetails}>
                          <View style={styles.ratingContainer}>
                            {destination.kinds && <Text style={styles.categoryTagText}>{destination.kinds.split(',')[0]}</Text>}
                          </View>
                          {destination.address?.country && (
                            <View style={styles.categoryTag}>
                              <Text style={styles.categoryTagText}>{destination.address.country}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </BlurView>
                ) : (
                  <BlurView
                    key={destination.xid || destination.id}
                    intensity={30}
                    tint="light"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      borderRadius: 26,
                      marginBottom: 12,
                      marginHorizontal: 20,
                      shadowColor: '#2F7417',
                      shadowOffset: { width: 0, height: 12 },
                      shadowOpacity: 0.15,
                      shadowRadius: 24,
                      elevation: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        padding: 16,
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                      onPress={() => handleDestinationPress(destination)}
                    >
                      <Text style={{ fontWeight: 'bold', color: '#2F7417', fontSize: 16, marginBottom: 2 }}>{destination.name}</Text>
                      {destination.kinds && <Text style={{ color: '#2F7417', fontSize: 13, marginBottom: 2 }}>{destination.kinds.split(',')[0]}</Text>}
                      {destination.address?.country && <Text style={{ color: '#666', fontSize: 12 }}>{destination.address.country}</Text>}
                      {destination.rate && <Text style={{ color: '#2F7417', fontWeight: 'bold', fontSize: 13, marginTop: 2 }}>★ {destination.rate}</Text>}
                    </TouchableOpacity>
                  </BlurView>
                );
              })
            ) : (
              <Text style={{ textAlign: 'center', color: '#888', marginVertical: 20 }}>Aucun lieu trouvé</Text>
            )}
        </View>
        )}
        {/* Section planificateur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Besoin d&apos;aide ?</Text>
          <BlurView intensity={30} tint="light" style={styles.plannerCardBlur}>
            <TouchableOpacity style={styles.plannerCard} onPress={() => router.push('/plan-trip')}>
              <View style={styles.plannerContent}>
                <View style={styles.plannerIconContainer}>
                  <Ionicons name="bulb-outline" size={28} color="#2F7417" />
                </View>
                <View style={styles.plannerText}>
                  <Text style={styles.plannerTitle}>Planificateur IA</Text>
                  <Text style={styles.plannerSubtitle}>
                    Laissez notre IA créer votre voyage parfait selon vos préférences
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* États vides */}
        {filteredCities.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>Aucune destination trouvée</Text>
            <Text style={styles.emptySubtitle}>
              Essayez de modifier vos critères de recherche
            </Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => {
                setSearchText('');
                setSelectedCategory(null);
              }}
            >
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const GREEN = '#2F7417';
const BG = '#F8F9FA';
const BORDER = '#E9ECEF';
const GREEN_LIGHT = '#F0F9F0';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  searchContainerBlur: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 26,
    marginHorizontal: 20,
    marginBottom: 30,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  searchIcon: {
    marginRight: 12,
    color: GREEN,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  seeAllText: {
    fontSize: 14,
    color: GREEN,
    fontWeight: '600',
  },
  categoriesScroll: {
    paddingLeft: 20,
  },
  categoryCardBlur: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 26,
    marginRight: 16,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
  },
  selectedCategoryCardBlur: {
    backgroundColor: 'rgba(47, 116, 23, 0.9)',
  },
  categoryCard: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    minWidth: 80,
  },
  selectedCategoryCard: {
    // Le style de sélection est maintenant géré par le BlurView
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCategoryIcon: {
    backgroundColor: GREEN,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  destinationCardBlur: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 26,
    marginBottom: 18,
    marginHorizontal: 20,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  destinationCard: {
    // Le style est maintenant géré par le BlurView parent
  },
  destinationImage: {
    width: '100%',
    height: 160,
  },
  destinationInfo: {
    padding: 16,
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
    flex: 1,
  },
  destinationPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
  },
  destinationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 4,
    fontWeight: '500',
  },
  reviewsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  categoryTag: {
    backgroundColor: GREEN_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '500',
  },
  plannerCardBlur: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 26,
    marginHorizontal: 20,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  plannerCard: {
    padding: 24,
  },
  plannerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  plannerText: {
    flex: 1,
  },
  plannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 4,
  },
  plannerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 10,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 120,
  },
});
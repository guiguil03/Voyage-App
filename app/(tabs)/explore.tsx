import { getOpenTripMapService } from '@/features/explore/services/opentripmap';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

const C = {
  bg:         '#0D0D0D',
  card:       'rgba(13,13,13,0.82)',
  border:     'rgba(245,237,214,0.14)',
  cream:      '#F5EDD6',
  creamDim:   'rgba(245,237,214,0.50)',
  creamFaint: 'rgba(245,237,214,0.18)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.40)',
};

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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>EXPLORER</Text>
          <Text style={styles.subtitle}>Découvrez votre prochaine destination</Text>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={C.cream} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une destination..."
            placeholderTextColor={C.whiteDim}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Catégories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CATÉGORIES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
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
                    size={22}
                    color={selectedCategory === category.name ? C.bg : C.cream}
                  />
                </View>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.name && styles.selectedCategoryText
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Destinations populaires (villes) */}
        {!selectedCity && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>DESTINATIONS POPULAIRES</Text>
            </View>
            {filteredCities.length > 0 ? (
              filteredCities.map((city, idx) => (
                <TouchableOpacity key={city.name + idx} style={styles.destinationCard} onPress={() => setSelectedCity(city)}>
                  <Image source={city.image} style={styles.destinationImage} />
                  <View style={styles.destinationInfo}>
                    <View style={styles.destinationHeader}>
                      <Text style={styles.destinationName}>{city.name}</Text>
                      <Text style={styles.destinationPrice}>{city.country}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyInlineText}>Aucune destination trouvée</Text>
            )}
          </View>
        )}

        {/* Lieux de la ville sélectionnée */}
        {selectedCity && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity onPress={() => setSelectedCity(null)}>
                <Ionicons name="arrow-back" size={22} color={C.cream} />
              </TouchableOpacity>
              <Text style={[styles.sectionTitle, { marginBottom: 0, paddingHorizontal: 12 }]}>
                À {selectedCity.name}
              </Text>
            </View>
            {loading ? (
              <View style={{ alignItems: 'center', marginVertical: 32 }}>
                <ActivityIndicator color={C.cream} />
              </View>
            ) : destinations.length > 0 ? (
              destinations.map((destination) => {
                const hasImage = !!(destination.preview?.source || destination.image);
                return hasImage ? (
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
                    key={destination.xid || destination.id}
                    style={styles.placeCardSimple}
                    onPress={() => handleDestinationPress(destination)}
                  >
                    <Text style={styles.placeCardName}>{destination.name}</Text>
                    {destination.kinds && (
                      <Text style={styles.placeCardKind}>{destination.kinds.split(',')[0]}</Text>
                    )}
                    {destination.address?.country && (
                      <Text style={styles.placeCardCountry}>{destination.address.country}</Text>
                    )}
                    {destination.rate && (
                      <Text style={styles.placeCardRate}>★ {destination.rate}</Text>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.emptyInlineText}>Aucun lieu trouvé</Text>
            )}
          </View>
        )}

        {/* Section planificateur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BESOIN D&apos;AIDE ?</Text>
          <TouchableOpacity style={styles.plannerCard} onPress={() => router.push('/plan-trip')}>
            <View style={styles.plannerContent}>
              <View style={styles.plannerIconContainer}>
                <Ionicons name="bulb-outline" size={28} color={C.cream} />
              </View>
              <View style={styles.plannerText}>
                <Text style={styles.plannerTitle}>Planificateur IA</Text>
                <Text style={styles.plannerSubtitle}>
                  Laissez notre IA créer votre voyage parfait selon vos préférences
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* États vides */}
        {filteredCities.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search" size={34} color={C.cream} />
            </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '200',
    letterSpacing: 6,
    color: C.cream,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: C.creamDim,
    fontWeight: '300',
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.white,
    fontWeight: '300',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 3,
    color: C.creamDim,
    marginBottom: 16,
    paddingHorizontal: 24,
    fontWeight: '400',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  categoriesScroll: {
    paddingLeft: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 80,
  },
  selectedCategoryCard: {
    backgroundColor: C.cream,
    borderColor: C.cream,
  },
  categoryIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(245,237,214,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.creamFaint,
  },
  selectedCategoryIcon: {
    backgroundColor: 'rgba(13,13,13,0.18)',
    borderColor: 'rgba(13,13,13,0.20)',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '300',
    color: C.creamDim,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  selectedCategoryText: {
    color: C.bg,
    fontWeight: '500',
  },
  destinationCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    marginBottom: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
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
    marginBottom: 10,
  },
  destinationName: {
    fontSize: 17,
    fontWeight: '300',
    color: C.cream,
    flex: 1,
    letterSpacing: 0.5,
  },
  destinationPrice: {
    fontSize: 13,
    fontWeight: '300',
    color: C.creamDim,
    letterSpacing: 0.5,
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
    fontSize: 13,
    color: C.creamDim,
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 13,
    color: C.whiteDim,
    marginLeft: 4,
  },
  categoryTag: {
    backgroundColor: C.creamFaint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  categoryTagText: {
    fontSize: 11,
    color: C.creamDim,
    letterSpacing: 0.5,
  },
  placeCardSimple: {
    backgroundColor: C.card,
    borderRadius: 20,
    marginBottom: 12,
    marginHorizontal: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  placeCardName: {
    fontSize: 16,
    fontWeight: '300',
    color: C.cream,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  placeCardKind: {
    fontSize: 12,
    color: C.creamDim,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  placeCardCountry: {
    fontSize: 12,
    color: C.whiteDim,
  },
  placeCardRate: {
    fontSize: 12,
    color: C.cream,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  plannerCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  plannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plannerIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(245,237,214,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: C.creamFaint,
  },
  plannerText: {
    flex: 1,
  },
  plannerTitle: {
    fontSize: 17,
    fontWeight: '300',
    color: C.cream,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  plannerSubtitle: {
    fontSize: 13,
    color: C.creamDim,
    lineHeight: 20,
    fontWeight: '300',
  },
  emptyInlineText: {
    textAlign: 'center',
    color: C.creamDim,
    marginVertical: 20,
    fontSize: 13,
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245,237,214,0.06)',
    borderWidth: 1,
    borderColor: C.creamFaint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: C.cream,
    marginBottom: 8,
    letterSpacing: 1,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.creamDim,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
    fontWeight: '300',
  },
  resetButton: {
    backgroundColor: C.cream,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.bg,
    letterSpacing: 1,
  },
});

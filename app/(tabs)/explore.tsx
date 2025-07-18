import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

const destinations = [
  {
    id: 1,
    name: 'Bali, Indonésie',
    image: require('@/assets/images/temple-bali-sunset.jpg'),
    price: '€890',
    rating: 4.8,
    category: 'Plage',
    reviews: 324,
  },
  {
    id: 2,
    name: 'Tokyo, Japon',
    image: require('@/assets/images/temple-water-sunset.jpg'),
    price: '€1250',
    rating: 4.9,
    category: 'Ville',
    reviews: 198,
  },
  {
    id: 3,
    name: 'Patagonie, Argentine',
    image: require('@/assets/images/mountain-background.jpg'),
    price: '€1150',
    rating: 4.7,
    category: 'Aventure',
    reviews: 156,
  },
];

export default function ExploreScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredDestinations = destinations.filter(dest => {
    const matchesSearch = dest.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = !selectedCategory || dest.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <Text style={styles.title}>Explorer</Text>
          <Text style={styles.subtitle}>Découvrez votre prochaine destination</Text>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une destination..."
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Catégories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.name && styles.selectedCategoryCard
                ]}
                onPress={() => handleCategoryPress(category.name)}
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
            ))}
          </ScrollView>
        </View>

        {/* Destinations populaires */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Destinations populaires</Text>
            <TouchableOpacity onPress={handleSeeAllPress}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {filteredDestinations.map((destination) => (
            <TouchableOpacity 
              key={destination.id} 
              style={styles.destinationCard}
              onPress={() => handleDestinationPress(destination)}
            >
              <Image source={destination.image} style={styles.destinationImage} />
              <View style={styles.destinationInfo}>
                <View style={styles.destinationHeader}>
                  <Text style={styles.destinationName}>{destination.name}</Text>
                  <Text style={styles.destinationPrice}>{destination.price}</Text>
                </View>
                <View style={styles.destinationDetails}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{destination.rating}</Text>
                    <Text style={styles.reviewsText}>({destination.reviews} avis)</Text>
                  </View>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{destination.category}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section OpenTripMap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recherche Avancée</Text>
          <TouchableOpacity style={styles.plannerCard} onPress={handleAdvancedSearch}>
            <View style={styles.plannerContent}>
              <View style={styles.plannerIconContainer}>
                <Ionicons name="telescope" size={28} color="#2F7417" />
              </View>
              <View style={styles.plannerText}>
                <Text style={styles.plannerTitle}>OpenTripMap Search</Text>
                <Text style={styles.plannerSubtitle}>
                  Découvrez des lieux d&apos;intérêt et points touristiques gratuits avec OpenTripMap
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section planificateur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Besoin d&apos;aide ?</Text>
          <TouchableOpacity style={styles.plannerCard} onPress={handlePlannerPress}>
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
        </View>

        {/* États vides */}
        {filteredDestinations.length === 0 && (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 12,
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
    color: '#1a1a1a',
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
    color: '#2F7417',
    fontWeight: '600',
  },
  categoriesScroll: {
    paddingLeft: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 80,
  },
  selectedCategoryCard: {
    backgroundColor: '#2F7417',
    borderColor: '#2F7417',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedCategoryIcon: {
    backgroundColor: '#4B8B3B',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  destinationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    marginBottom: 12,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  destinationPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2F7417',
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
    backgroundColor: '#F0F9F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#2F7417',
    fontWeight: '500',
  },
  plannerCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  plannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plannerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  plannerText: {
    flex: 1,
  },
  plannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
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
    color: '#1a1a1a',
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
    backgroundColor: '#2F7417',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
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
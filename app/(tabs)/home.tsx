import TripCard from '@/components/travel/TripCard';
import city from '@/data/city.json';
import { useAuth } from '@/hooks/useAuth';
import { getAllVoyages, getUserVoyages } from '@/lib/voyages';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [userVoyages, setUserVoyages] = useState<any[]>([]);
  const [allVoyages, setAllVoyages] = useState<any[]>([]);
  const [loadingVoyages, setLoadingVoyages] = useState(true);

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading]);

  // Charger les voyages depuis Supabase
  useEffect(() => {
    const loadVoyages = async () => {
      if (isAuthenticated) {
        setLoadingVoyages(true);
        try {
          // Charger les voyages de l'utilisateur et tous les voyages en parallèle
          const [userResult, allResult] = await Promise.all([
            getUserVoyages(),
            getAllVoyages()
          ]);

          if (userResult.data) {
            setUserVoyages(userResult.data);
          }
          if (allResult.data) {
            setAllVoyages(allResult.data);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des voyages:', error);
        } finally {
          setLoadingVoyages(false);
        }
      }
    };

    loadVoyages();
  }, [isAuthenticated]);

  const handleTripDetail = () => {
    Alert.alert('Détails du voyage', 'Fonctionnalité des détails à venir !');
  };

  const handleCreateTrip = () => {
    router.push('/(tabs)/create');
  };

  const handleExploreTrips = () => {
    Alert.alert('Explorer', 'Découvrez les destinations populaires !');
  };

  const handleAddTrip = () => {
    setShowAddForm(!showAddForm);
  };

  const handleCityPress = (cityName: string, country: string) => {
    Alert.alert(`${cityName}`, `Découvrir ${cityName}, ${country}`);
  };

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F7417" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Si l'utilisateur n'est pas authentifié, ne rien afficher (redirection en cours)
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F7417" />
        <Text style={styles.loadingText}>Redirection...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
     

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Actions rapides */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Bonjour {user.email?.split('@')[0]}</Text>
        </View>

        {/* Dernier voyage */}
        <View style={styles.tripSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dernier Voyage</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/voyage')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {loadingVoyages ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2F7417" />
              <Text style={styles.loadingText}>Chargement des voyages...</Text>
            </View>
          ) : userVoyages.length > 0 ? (
            <TripCard
              date={new Date(userVoyages[0].created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
              country={userVoyages[0].destination}
              flagEmoji={userVoyages[0].flag_emoji || '🌍'}
              image={userVoyages[0].image_url ? 
                { uri: userVoyages[0].image_url } : 
                require('@/assets/images/mountain-background.jpg')
              }
              onPress={handleTripDetail}
            />
          ) : (
            <View style={styles.noVoyageCard}>
              <Text style={styles.noVoyageText}>Aucun voyage encore créé</Text>
              <TouchableOpacity 
                style={styles.addVoyageButton} 
                onPress={() => router.push('/Memory')}
              >
                <Text style={styles.addVoyageButtonText}>Ajouter votre premier voyage</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Destinations populaires */}
        <View style={styles.destinationsContainer}>
          <Text style={styles.sectionTitle}>Destinations Populaires</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destinationsScroll}>
            {city.city.slice(0, 6).map((cityItem, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.destinationCard}
                onPress={() => handleCityPress(cityItem.name, cityItem.country)}
              >
                <LinearGradient
                  colors={['#F8F9FA', '#E9ECEF']}
                  style={styles.destinationGradient}
                >
                  <View style={styles.destinationIconContainer}>
                    <Ionicons name="location" size={28} color="#2F7417" />
                  </View>
                  <Text style={styles.destinationName}>{cityItem.name}</Text>
                  <Text style={styles.destinationCountry}>{cityItem.country}</Text>
                  <Text style={styles.destinationCount}>{Math.floor(Math.random() * 200) + 50} voyages</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Prochains voyages planifiés */}
        <View style={styles.upcomingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Voyages Planifiés</Text>
            <TouchableOpacity onPress={handleCreateTrip}>
              <Text style={styles.seeAllText}>Planifier</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.upcomingCard}>
            <LinearGradient
              colors={['#E3F2FD', '#BBDEFB']}
              style={styles.upcomingGradient}
            >
              <View style={styles.upcomingContent}>
                <Ionicons name="calendar" size={24} color="#1976D2" />
                <View style={styles.upcomingText}>
                  <Text style={styles.upcomingTitle}>Aucun voyage planifié</Text>
                  <Text style={styles.upcomingSubtitle}>Commencez à planifier votre prochaine aventure !</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.planButton} onPress={handleCreateTrip}>
                <Text style={styles.planButtonText}>Planifier</Text>
                <Ionicons name="arrow-forward" size={16} color="#1976D2" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* Derniers Voyages de vos amis */}
        <View style={styles.friendsTripsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Derniers Voyages de vos amis</Text>
            <TouchableOpacity onPress={() => Alert.alert('Voir tout', 'Liste complète des voyages à venir !')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsTripsScroll}>
            {loadingVoyages ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2F7417" />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : allVoyages.length > 0 ? (
              allVoyages.map((voyageItem) => (
                <TouchableOpacity key={voyageItem.id} style={styles.friendVoyageCard}>
                  <View style={styles.friendVoyageHeader}>
                    <Text style={styles.voyageDrapeau}>{voyageItem.drapeau || '🌍'}</Text>
                    <View style={styles.friendVoyageInfo}>
                      <Text style={styles.voyageUser}>@{voyageItem.user}</Text>
                      <Text style={styles.voyageName}>{voyageItem.name}</Text>
                    </View>
                  </View>
                  <Text style={styles.voyageDescription} numberOfLines={3}>
                    {voyageItem.description}
                  </Text>
                  <View style={styles.friendVoyageFooter}>
                    <View style={styles.friendVoyageStats}>
                      <Ionicons name="heart" size={16} color="#EF4444" />
                      <Text style={styles.friendVoyageStatsText}>{Math.floor(Math.random() * 50) + 10}</Text>
                      <Ionicons name="chatbubble" size={16} color="#2F7417" style={styles.statsIcon} />
                      <Text style={styles.friendVoyageStatsText}>{Math.floor(Math.random() * 20) + 3}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noVoyageCard}>
                <Text style={styles.noVoyageText}>Aucun voyage partagé pour le moment</Text>
              </View>
            )}
          </ScrollView>
        </View>

        


      </ScrollView>

      {/* Bouton flottant pour ajouter un voyage */}
      <TouchableOpacity style={styles.fab} onPress={handleAddTrip}>
        <LinearGradient
          colors={['#2F7417', '#4B8B3B']}
          style={styles.fabGradient}
        >
          <Ionicons 
            name={showAddForm ? "close" : "add"} 
            size={28} 
            color="#FFFFFF" 
          />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  // Styles pour les voyages d'amis
  friendsTripsSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  friendsTripsScroll: {
    paddingRight: 20,
  },
  friendVoyageCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 280,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  friendVoyageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  voyageDrapeau: {
    fontSize: 32,
    marginRight: 12,
  },
  friendVoyageInfo: {
    flex: 1,
  },
  voyageUser: {
    fontSize: 12,
    color: '#2F7417',
    fontWeight: '600',
    marginBottom: 2,
  },
  voyageName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  voyageDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  friendVoyageFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
  },
  friendVoyageStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendVoyageStatsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 12,
  },
  statsIcon: {
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2F7417',
    fontWeight: '500',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  userText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 2,
  },
  profileButton: {
    opacity: 0.9,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '300',
    marginBottom: 20,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
  },
  headerStatItem: {
    alignItems: 'center',
  },
  headerStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionGradient: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'rgba(47, 116, 23, 0.2)',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  tripSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#2F7417',
    fontSize: 14,
    fontWeight: '600',
  },
  destinationsContainer: {
    marginBottom: 25,
  },
  destinationsScroll: {
    paddingLeft: 20,
  },
  destinationCard: {
    marginRight: 12,
    width: 140,
  },
  destinationGradient: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  destinationIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(47, 116, 23, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  destinationName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  destinationCountry: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  destinationCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  upcomingSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  upcomingCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  upcomingGradient: {
    borderRadius: 16,
    padding: 20,
  },
  upcomingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  upcomingText: {
    marginLeft: 16,
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  upcomingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  planButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  inspirationSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  inspirationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  inspirationCard: {
    width: '48%',
    marginBottom: 12,
  },
  inspirationGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inspirationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  inspirationSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#2F7417',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  noVoyageCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  noVoyageText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  addVoyageButton: {
    backgroundColor: '#2F7417',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addVoyageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 
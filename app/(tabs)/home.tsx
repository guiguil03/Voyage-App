import TripCard from '@/components/travel/TripCard';
import city from '@/data/city.json';
import { useAuth } from '@/hooks/useAuth';
import { getFriendsVoyages, getMyFriends } from '@/lib/friends';
import { getUserTripPlans } from '@/lib/trip-planning';
import { getAllVoyages, getUserVoyages } from '@/lib/voyages';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface TripPlan {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  travel_type: string;
  interests: string[] | null;
  activity_level: string;
  status: string;
  created_at: string;
}

export default function HomeScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [userVoyages, setUserVoyages] = useState<any[]>([]);
  const [allVoyages, setAllVoyages] = useState<any[]>([]);
  const [loadingVoyages, setLoadingVoyages] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [trips, setTrips] = useState<any[]>([]);
  const [nextTrip, setNextTrip] = useState<TripPlan | null>(null);
  const [loadingNextTrip, setLoadingNextTrip] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsVoyages, setFriendsVoyages] = useState<any[]>([]);

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

  // Charger le prochain voyage planifié
  useEffect(() => {
    const loadNextTrip = async () => {
      if (isAuthenticated) {
        setLoadingNextTrip(true);
        try {
          const result = await getUserTripPlans();
          
          if (result.data && result.data.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Filtrer les voyages avec des dates de départ futures
            const upcomingTrips = result.data
              .filter((trip: TripPlan) => {
                if (!trip.start_date) return false;
                const tripDate = new Date(trip.start_date);
                return tripDate >= today;
              })
              .sort((a: TripPlan, b: TripPlan) => {
                const dateA = new Date(a.start_date!).getTime();
                const dateB = new Date(b.start_date!).getTime();
                return dateA - dateB;
              });
            
            // Si pas de voyage futur, prendre le voyage le plus récent
            if (upcomingTrips.length > 0) {
              setNextTrip(upcomingTrips[0]);
            } else if (result.data.length > 0) {
              // Prendre le voyage le plus récemment créé
              const sortedByCreation = [...result.data].sort((a: TripPlan, b: TripPlan) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              });
              setNextTrip(sortedByCreation[0]);
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement du prochain voyage:', error);
        } finally {
          setLoadingNextTrip(false);
        }
      }
    };

    loadNextTrip();
  }, [isAuthenticated]);

  // Charger les amis et leur voyages
  useEffect(() => {
    const loadFriends = async () => {
      const { data, error } = await getMyFriends()
      const { data: voyages, error: voyagesError } = await getFriendsVoyages(data);
      if (error) {
        console.error('Erreur lors du chargement des amis:', error);
      } else {
        setFriends(data);
        setFriendsVoyages(voyages);
      }
    };
    loadFriends();
  }, [isAuthenticated]);


  const formatTripDate = (trip: TripPlan): string => {
    if (trip.start_date && trip.end_date) {
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      return `Du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`;
    } else if (trip.start_date) {
      const startDate = new Date(trip.start_date);
      return `À partir du ${startDate.toLocaleDateString('fr-FR')}`;
    }
    return 'Dates à définir';
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'En attente', color: '#FF6B35' };
      case 'processing': return { text: 'En cours', color: '#2F7417' };
      case 'completed': return { text: 'Terminé', color: '#4ECDC4' };
      case 'failed': return { text: 'Échoué', color: '#FF4757' };
      default: return { text: status, color: '#666' };
    }
  };

 


  const handleTripDetail = () => {
    if (userVoyages.length > 0) {
      const lastVoyage = userVoyages[0];
      // Créer un objet compatible avec le type UnifiedTrip
      const tripData = {
        id: lastVoyage.id,
        destination: lastVoyage.destination,
        start_date: null,
        end_date: null,
        travel_type: lastVoyage.trip_type,
        interests: [],
        status: 'completed',
        type: 'voyage',
        created_at: lastVoyage.created_at,
        trip_name: lastVoyage.trip_name,
        description: lastVoyage.description,
        memory_text: lastVoyage.memory_text,
        rating: lastVoyage.rating,
        duration: lastVoyage.duration,
        image_url: lastVoyage.image_url,
        images: lastVoyage.images || []
      };
      
      router.push({
        pathname: '/travel/detailMemory',
        params: {
          tripData: JSON.stringify(tripData)
        }
      });
    } else {
      Alert.alert('Aucun voyage', 'Aucun voyage à afficher.');
    }
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

  const handleFriendVoyageDetail = (voyage: any) => {
    const tripData = {
      id: voyage.id,
      destination: voyage.destination,
      start_date: voyage.start_date || null,
      end_date: voyage.end_date || null,
      travel_type: voyage.trip_type,
      interests: voyage.interests || [],
      status: voyage.status || 'completed',
      type: 'voyage',
      created_at: voyage.created_at,
      trip_name: voyage.trip_name,
      description: voyage.description,
      memory_text: voyage.memory_text,
      rating: voyage.rating,
      duration: voyage.duration,
      image_url: voyage.image_url,
      images: voyage.images || [],
      user: voyage.user, // pour afficher le nom de l'ami si besoin
    };
    router.push({
      pathname: '/travel/detailMemory',
      params: { tripData: JSON.stringify(tripData) }
    });
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

  // Grouper les voyages par ami (dans HomeScreen, juste avant le return)
  const voyagesByFriend = friends.reduce((acc: Record<string, any[]>, friend) => {
    acc[friend.id] = friendsVoyages.filter(v => v.user_id === friend.id);
    return acc;
  }, {});

  // Palette verte premium
  const GREEN = '#2F7417';
  const GREEN_LIGHT = '#F0F9F0';
  const DARK = '#1a1a1a';
  const BG = '#F8F9FA';
  const BORDER = '#E9ECEF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ backgroundColor: GREEN, paddingTop: 38, paddingBottom: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 6 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, letterSpacing: 0.5 }}>Tripflow</Text>
        <Ionicons name="planet" size={30} color="#fff" />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Actions rapides */}
        <View style={[styles.quickActionsContainer, { marginTop: 8 }]}> 
          <Text style={[styles.sectionTitle, { color: GREEN, fontWeight: 'bold', fontSize: 20 }]}>Bonjour {user.email?.split('@')[0]}</Text>
        </View>
        {/* Dernier voyage */}
        <View style={{ backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 18, marginBottom: 18, padding: 20, shadowColor: GREEN, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4, borderWidth: 1, borderColor: BORDER }}> 
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: DARK, fontWeight: 'bold', fontSize: 18 }]}>Dernier Voyage</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/voyage')}>
              <Text style={[styles.seeAllText, { color: GREEN, fontWeight: 'bold' }]}>Voir tout</Text>
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
        <View style={{ backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 18, marginBottom: 18, padding: 20, shadowColor: GREEN, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4, borderWidth: 1, borderColor: BORDER }}> 
          <Text style={[styles.sectionTitle, { color: DARK, fontWeight: 'bold', fontSize: 18 }]}>Destinations Populaires</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destinationsScroll}>
            {city.city.slice(0, 6).map((cityItem, index) => (
              <TouchableOpacity key={index} style={{ backgroundColor: GREEN_LIGHT, borderRadius: 18, marginRight: 14, width: 140, alignItems: 'center', borderWidth: 1, borderColor: BORDER, shadowColor: GREEN, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, padding: 14 }} onPress={() => handleCityPress(cityItem.name, cityItem.country)}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: GREEN }}>
                  <Ionicons name="location" size={28} color={GREEN} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: DARK, marginBottom: 2 }}>{cityItem.name}</Text>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>{cityItem.country}</Text>
                <Text style={{ fontSize: 11, color: GREEN }}>{Math.floor(Math.random() * 200) + 50} voyages</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Prochains voyages planifiés */}
        <View style={{ backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 18, marginBottom: 18, padding: 20, shadowColor: GREEN, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4, borderWidth: 1, borderColor: BORDER }}> 
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: DARK, fontWeight: 'bold', fontSize: 18 }]}>Voyages Planifiés</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/voyage')}>
              <Text style={[styles.seeAllText, { color: GREEN, fontWeight: 'bold' }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {loadingNextTrip ? (
            <View style={styles.upcomingCard}>
              <LinearGradient
                colors={['#E3F2FD', '#BBDEFB']}
                style={styles.upcomingGradient}
              >
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#1976D2" />
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              </LinearGradient>
            </View>
          ) : nextTrip ? (
            <View style={styles.upcomingCard}>
              <LinearGradient
                colors={['#E8F5E8', '#D4F1D4']}
                style={styles.upcomingGradient}
              >
                <View style={styles.upcomingHeader}>
                  <View style={styles.upcomingIconContainer}>
                    <Ionicons name="airplane" size={24} color="#2F7417" />
                  </View>
                  <View style={styles.upcomingInfo}>
                    <Text style={styles.upcomingDestination}>{nextTrip.destination}</Text>
                    <Text style={styles.upcomingDate}>{formatTripDate(nextTrip)}</Text>
                    <View style={styles.upcomingDetails}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusDisplay(nextTrip.status).color }]}>
                        <Text style={styles.statusText}>{getStatusDisplay(nextTrip.status).text}</Text>
                      </View>
                      <Text style={styles.upcomingType}>{nextTrip.travel_type}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.upcomingActions}>
                  <TouchableOpacity 
                    style={styles.detailButton} 
                    onPress={() => {
                      if (nextTrip) {
                        const tripData = {
                          id: nextTrip.id,
                          destination: nextTrip.destination,
                          start_date: nextTrip.start_date,
                          end_date: nextTrip.end_date,
                          travel_type: nextTrip.travel_type,
                          interests: nextTrip.interests || [],
                          activity_level: nextTrip.activity_level,
                          status: nextTrip.status,
                          type: 'trip_plan',
                          created_at: nextTrip.created_at
                        };
                        
                        router.push({
                          pathname: '/travel/detailMemory',
                          params: {
                            tripData: JSON.stringify(tripData)
                          }
                        });
                      }
                    }}
                  >
                    <Text style={styles.detailButtonText}>Voir détails</Text>
                    <Ionicons name="arrow-forward" size={16} color="#2F7417" />
                  </TouchableOpacity>
                  
                  {nextTrip.status === 'pending' && (
                    <TouchableOpacity 
                      style={styles.modifyButton} 
                      onPress={() => router.push('/plan-trip')}
                    >
                      <Ionicons name="create" size={16} color="#666" />
                      <Text style={styles.modifyButtonText}>Modifier</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {nextTrip.interests && nextTrip.interests.length > 0 && (
                  <View style={styles.upcomingInterests}>
                    <Text style={styles.interestsLabel}>Centres d&apos;intérêt:</Text>
                    <Text style={styles.interestsText}>{nextTrip.interests.join(', ')}</Text>
                  </View>
                )}
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.upcomingCard}>
              <LinearGradient
                colors={['#E3F2FD', '#BBDEFB']}
                style={styles.upcomingGradient}
              >
                <View style={styles.upcomingContent}>
                  <Ionicons name="calendar" size={24} color="#1976D2" />
                  <View style={styles.upcomingText}>
                    <Text style={styles.upcomingTitle}>Aucun voyage planifié</Text>
                    <Text style={styles.upcomingSubtitle}>Créez votre première aventure !</Text>
                  </View>
                </View>
                  
                <TouchableOpacity style={styles.planButton} onPress={handleCreateTrip}>
                  <Text style={styles.planButtonText}>Planifier</Text>
                  <Ionicons name="arrow-forward" size={16} color="#1976D2" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>
        {/* Amis */}
        <View style={{ backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 18, marginBottom: 18, padding: 20, shadowColor: GREEN, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4, borderWidth: 1, borderColor: BORDER }}> 
          <Text style={[styles.sectionTitle, { color: DARK, fontWeight: 'bold', fontSize: 18 }]}>Amis & leurs voyages</Text>
          {friends.length === 0 ? (
            <Text style={{ color: '#888', fontStyle: 'italic', marginBottom: 12 }}>Aucun ami pour l&apos;instant.</Text>
          ) : (
            friends.map((friend) => (
              <View key={friend.id} style={styles.friendBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <View style={styles.friendAvatarCircle}>
                    <Ionicons name="person" size={28} color="#2F7417" />
                  </View>
                  <Text style={styles.friendNameBig}>{friend.full_name || friend.username || friend.email}</Text>
                </View>
                {voyagesByFriend[friend.id] && voyagesByFriend[friend.id].length > 0 ? (
                  <FlatList
                    data={voyagesByFriend[friend.id]}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.friendVoyageCard} onPress={() => handleFriendVoyageDetail(item)}>
                        <View style={styles.friendVoyageHeader}>
                          <Text style={styles.voyageDrapeau}>{item.flag_emoji || '🌍'}</Text>
                          <View style={styles.friendVoyageInfo}>
                            <Text style={styles.voyageName}>{item.trip_name}</Text>
                            <Text style={styles.voyageDestination}>{item.destination}</Text>
                          </View>
                        </View>
                        <Text style={styles.voyageDate}>{item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''}</Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.friendsList}
                  />
                ) : (
                  <Text style={{ color: '#bbb', fontSize: 13, fontStyle: 'italic', marginLeft: 10 }}>Aucun voyage</Text>
                )}
              </View>
            ))
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
  friendsSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  friendsList: {
    paddingHorizontal: 20,
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
  friendCard: {
    alignItems: 'center',
    marginRight: 18,
    width: 70,
  },
  friendAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0ffe0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#2F7417',
  },
  friendName: {
    fontSize: 12,
    color: '#2F7417',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 70,
  },
  friendVoyageCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 12,
    marginRight: 14,
    width: 200,
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
    marginBottom: 8,
  },
  voyageDrapeau: {
    fontSize: 28,
    marginRight: 8,
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
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  voyageDestination: {
    fontSize: 12,
    color: '#888',
  },
  voyageDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
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
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  upcomingIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(47, 116, 23, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingDestination: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  upcomingDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  upcomingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  upcomingType: {
    fontSize: 14,
    color: '#666',
  },
  upcomingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  detailButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  modifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modifyButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  upcomingInterests: {
    marginTop: 12,
  },
  interestsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  interestsText: {
    fontSize: 13,
    color: '#666',
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
  friendBlock: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  friendNameBig: {
    fontSize: 16,
    color: '#2F7417',
    fontWeight: '700',
  },
}); 
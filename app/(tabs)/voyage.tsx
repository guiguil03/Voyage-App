import { useAuth } from '@/hooks/useAuth';
import { deleteTripPlan, getTripPlanWithItinerary, getUserTripPlans } from '@/lib/trip-planning';
import { getUserVoyages } from '@/lib/voyages';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
    TouchableOpacity,
    View
} from 'react-native';

interface TripPlan {
  id: string;
  user_id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  travel_type: string;
  interests: string[] | null;
  activity_level: string;
  status: string;
  generated_itinerary: any;
  created_at: string;
  updated_at: string;
}

// Type unifié pour afficher les voyages et trip plans ensemble
interface UnifiedTrip {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  travel_type: string;
  interests: string[] | null;
  activity_level?: string;
  status: string;
  type: 'trip_plan' | 'voyage'; // Pour distinguer la source
  created_at: string;
  generated_itinerary?: any; // Planning sauvegardé
  // Champs spécifiques aux souvenirs
  trip_name?: string;
  description?: string;
  memory_text?: string;
  rating?: number;
  duration?: string;
  image_url?: string; // URL de l'image principale
  images?: string[]; // Toutes les images du voyage
}

interface TripStats {
  totalTrips: number;
  pendingTrips: number;
  completedTrips: number;
}

export default function VoyageScreen() {
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [voyages, setVoyages] = useState<any[]>([]);
  const [unifiedTrips, setUnifiedTrips] = useState<UnifiedTrip[]>([]);
  const [stats, setStats] = useState<TripStats>({ totalTrips: 0, pendingTrips: 0, completedTrips: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const filters = ['Tous', 'En attente', 'Terminé', 'En cours'];

  useEffect(() => {
    if (user) {
      loadUserTrips();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadUserTrips = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Charger les trip plans et les souvenirs en parallèle
      const [tripPlansResult, voyagesResult] = await Promise.all([
        getUserTripPlans(),
        getUserVoyages()
      ]);
      
      if (tripPlansResult.error) {
        throw new Error(tripPlansResult.error);
      }
      
      if (voyagesResult.error) {
        console.warn('Erreur lors du chargement des souvenirs:', voyagesResult.error);
      }
      
      const tripPlansData = tripPlansResult.data || [];
      const voyagesData = voyagesResult.data || [];
      
      setTrips(tripPlansData);
      setVoyages(voyagesData);
      
      // Créer les voyages unifiés
      const unifiedData: UnifiedTrip[] = [
        // Trip plans
        ...tripPlansData.map((trip: TripPlan): UnifiedTrip => ({
          id: trip.id,
          destination: trip.destination,
          start_date: trip.start_date,
          end_date: trip.end_date,
          travel_type: trip.travel_type,
          interests: trip.interests,
          activity_level: trip.activity_level,
          status: trip.status,
          type: 'trip_plan',
          created_at: trip.created_at,
          generated_itinerary: trip.generated_itinerary
        })),
        // Souvenirs convertis en format unifié
        ...voyagesData.map((voyage: any): UnifiedTrip => ({
          id: voyage.id,
          destination: voyage.destination,
          start_date: null, // Les souvenirs n'ont pas forcément de dates
          end_date: null,
          travel_type: voyage.trip_type,
          interests: [], // Les souvenirs utilisent un autre système
          status: 'completed', // Les souvenirs sont toujours terminés
          type: 'voyage',
          created_at: voyage.created_at,
          trip_name: voyage.trip_name,
          description: voyage.description,
          memory_text: voyage.memory_text,
          rating: voyage.rating,
          duration: voyage.duration,
          image_url: voyage.image_url, // Image principale
          images: voyage.images || [] // Toutes les images
        }))
      ];
      
      setUnifiedTrips(unifiedData);
      
      // Calculer les statistiques
      const totalTrips = tripPlansData.length;
      const pendingTrips = tripPlansData.filter((trip: TripPlan) => trip.status === 'pending').length;
      const completedTrips = tripPlansData.filter((trip: TripPlan) => trip.status === 'completed').length + voyagesData.length;
      
      setStats({ totalTrips: totalTrips + voyagesData.length, pendingTrips, completedTrips });
      
    } catch (error) {
      console.error('Erreur lors du chargement des voyages:', error);
      setError('Impossible de charger vos voyages. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'En attente', color: '#FF6B35' };
      case 'processing': return { text: 'En cours', color: '#2F7417' };
      case 'completed': 
      case 'Terminé': return { text: 'Terminé', color: '#4ECDC4' };
      case 'failed': return { text: 'Échoué', color: '#FF4757' };
      default: return { text: status, color: '#666' };
    }
  };

  const getFilteredTrips = () => {
    if (activeFilter === 'Tous') return unifiedTrips;
    
    const statusMap = {
      'En attente': 'pending',
      'En cours': 'processing', 
      'Terminé': 'completed'
    };
    
    const statusKey = statusMap[activeFilter as keyof typeof statusMap];
    
    // Pour "Terminé", inclure aussi les souvenirs (qui ont toujours le status 'completed')
    if (activeFilter === 'Terminé') {
      return unifiedTrips.filter(trip => 
        trip.status === 'completed' || 
        trip.status === 'Terminé' || 
        trip.type === 'voyage'
      );
    }
    
    return unifiedTrips.filter(trip => trip.status === statusKey);
  };

  const filteredTrips = getFilteredTrips();

  const handleTripPress = (trip: UnifiedTrip) => {
    const isMemory = trip.type === 'voyage';
    
    if (isMemory) {
      const details = [
        `Destination: ${trip.destination}`,
        `Type: ${trip.travel_type}`,
        trip.duration ? `Durée: ${trip.duration}` : '',
        trip.rating ? `Note: ${trip.rating}/5 ⭐` : '',
        trip.description ? `Description: ${trip.description}` : ''
      ].filter(Boolean).join('\n');
      
      Alert.alert(
        trip.trip_name || trip.destination,
        `✈️ Souvenir de voyage\n\n${details}`
      );
    } else {
    const interests = trip.interests || [];
    Alert.alert(
      trip.destination, 
        `📋 Plan de voyage - ${getStatusDisplay(trip.status).text}\nType: ${trip.travel_type}\nIntérêts: ${interests.join(', ') || 'Aucun'}\nNiveau: ${trip.activity_level}`
    );
    }
  };

  const handleAddTrip = () => {
    Alert.alert(
      'Ajouter un voyage',
      'Que souhaitez-vous faire ?',
      [
        {
          text: 'Planifier un voyage',
          onPress: () => router.push('/plan-trip'),
          style: 'default'
        },
        {
          text: 'Ajouter un souvenir',
          onPress: () => router.push('/Memory'),
          style: 'default'
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  // Fonction pour vérifier si un voyage a un planning sauvegardé
  const hasPlanning = (trip: UnifiedTrip): boolean => {
    return trip.type === 'trip_plan' && 
           trip.generated_itinerary && 
           trip.generated_itinerary.places && 
           trip.generated_itinerary.places.length > 0;
  };

  // Fonction pour voir le planning sauvegardé
  const handleViewPlanning = async (trip: UnifiedTrip) => {
    if (trip.type !== 'trip_plan') return;
    
    try {
      const result = await getTripPlanWithItinerary(trip.id);
      
      if (result.error || !result.data) {
        Alert.alert('Erreur', 'Impossible de récupérer le planning. Il n\'existe peut-être pas encore.');
        return;
      }
      
      const tripData = result.data;
      
      if (!tripData.generated_itinerary || !tripData.generated_itinerary.places) {
        Alert.alert('Aucun planning', 'Ce voyage n\'a pas encore de planning généré.');
        return;
      }
      
      // Naviguer vers la page planning avec les données sauvegardées
      router.push({
        pathname: '/planning',
        params: {
          planning: JSON.stringify(tripData.generated_itinerary.places),
          trip: JSON.stringify({
            id: tripData.id,
            destination: tripData.destination,
            startDate: tripData.start_date,
            endDate: tripData.end_date
          })
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du planning:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la récupération du planning.');
    }
  };

  const handleTripAction = (action: string, trip: UnifiedTrip) => {
    if (action === 'Détails') {
      // Naviguer vers la page de détails en passant les données du voyage
      router.push({
        pathname: '/travel/detailMemory',
        params: {
          tripData: JSON.stringify(trip)
        }
      });
    } else if (action === 'Voir le planning') {
      handleViewPlanning(trip);
    } else if (action === 'Supprimer le souvenir' && trip.type === 'voyage') {
      Alert.alert(
        'Supprimer le souvenir',
        `Êtes-vous sûr de vouloir supprimer "${trip.trip_name || trip.destination}" ?`,
        [
          {
            text: 'Annuler',
            style: 'cancel'
          },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                const { deleteVoyage } = await import('@/lib/voyages');
                const result = await deleteVoyage(trip.id);
                
                if (result.error) {
                  Alert.alert('Erreur', 'Impossible de supprimer: ' + result.error);
                } else {
                  Alert.alert('Supprimé', 'Le souvenir a été supprimé.', [
                    { text: 'OK', onPress: () => loadUserTrips() }
                  ]);
                }
              } catch (error) {
                Alert.alert('Erreur', 'Une erreur est survenue.');
              }
            }
          }
        ]
      );
    } else if (action === 'Supprimer' && trip.type === 'trip_plan') {
      // Vérifier que le voyage est bien en attente avant de permettre la suppression
      if (trip.status !== 'pending') {
        Alert.alert(
          'Suppression impossible', 
          'Seuls les voyages en attente peuvent être supprimés. Ce voyage a déjà un statut avancé.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Supprimer le voyage en attente',
        `Êtes-vous sûr de vouloir supprimer ce voyage en attente vers "${trip.destination}" ?\n\nCette action est irréversible et supprimera toutes les informations du voyage.`,
        [
          {
            text: 'Annuler',
            style: 'cancel'
          },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🗑️ Suppression du voyage en attente:', trip.id);
                const result = await deleteTripPlan(trip.id);
                
                if (result.error) {
                  Alert.alert('Erreur', `Impossible de supprimer le voyage: ${result.error}`);
                } else {
                  Alert.alert(
                    'Voyage supprimé ✅', 
                    `Le voyage en attente vers "${trip.destination}" a été supprimé avec succès.`,
                    [{ text: 'OK', onPress: () => loadUserTrips() }]
                  );
                }
              } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                Alert.alert('Erreur', 'Une erreur inattendue est survenue lors de la suppression.');
              }
            }
          }
        ]
      );
    } else {
    Alert.alert(action, `${action} pour ${trip.destination}`);
    }
  };

  const formatDateRange = (trip: UnifiedTrip): string => {
    if (trip.start_date && trip.end_date) {
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      return `Du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`;
    } else if (trip.start_date) {
      const startDate = new Date(trip.start_date);
      return `À partir du ${startDate.toLocaleDateString('fr-FR')}`;
    }
    return 'Dates non spécifiées';
  };

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F7417" />
          <Text style={styles.loadingText}>Chargement de vos voyages...</Text>
        </View>
      </SafeAreaView>
    );
  }



  // Affichage des statistiques adaptées
  const statsDisplay = [
    { label: 'Voyages', value: stats.totalTrips.toString(), icon: 'airplane' },
    { label: 'En attente', value: stats.pendingTrips.toString(), icon: 'time' },
    { label: 'Terminés', value: stats.completedTrips.toString(), icon: 'checkmark-circle' },
  ];

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
          <Text style={[styles.title, { fontSize: 30 }]}>Mes Voyages</Text>
          <Text style={[styles.subtitle, { fontSize: 17 }]}>Gérez vos aventures</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={loadUserTrips}
          >
            <Ionicons name="refresh" size={20} color="#2F7417" />
          </TouchableOpacity>
        </View>
        {/* Statistiques */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 30, gap: 16 }}>
          {statsDisplay.map((stat, index) => (
            <BlurView key={stat.label} intensity={30} tint="light" style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 22, padding: 18, alignItems: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.13, shadowRadius: 18, elevation: 6, marginRight: index < statsDisplay.length - 1 ? 8 : 0 }}> 
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E8', justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: GREEN, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 2 }}>
                <Ionicons name={stat.icon as any} size={26} color={GREEN} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: DARK, marginBottom: 2 }}>{stat.value}</Text>
              <Text style={{ fontSize: 13, color: '#666', fontWeight: '500' }}>{stat.label}</Text>
            </BlurView>
          ))}
        </View>
        {/* Filtres */}
        <View style={{ marginBottom: 20 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[{
                  backgroundColor: activeFilter === filter ? GREEN : 'rgba(255,255,255,0.7)',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 22,
                  marginRight: 14,
                  shadowColor: GREEN,
                  shadowOffset: { width: 0, height: activeFilter === filter ? 8 : 2 },
                  shadowOpacity: activeFilter === filter ? 0.13 : 0.06,
                  shadowRadius: activeFilter === filter ? 18 : 8,
                  elevation: activeFilter === filter ? 6 : 2,
                  borderWidth: 0,
                }]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={{ fontSize: 15, color: activeFilter === filter ? '#fff' : GREEN, fontWeight: 'bold' }}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Header des voyages */}
        <View style={styles.tripsHeader}>
          <Text style={styles.sectionTitle}>
            {activeFilter === 'Tous' ? 'Tous mes voyages' : `Voyages ${activeFilter.toLowerCase()}`}
          </Text>
          <TouchableOpacity style={[styles.addButton, { shadowColor: GREEN, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.13, shadowRadius: 18, elevation: 6 }]} onPress={handleAddTrip}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Liste des voyages */}
        <View style={styles.tripsContainer}>
          {filteredTrips.map((trip) => {
            const statusDisplay = getStatusDisplay(trip.status);
            const dateRange = formatDateRange(trip);
            const isMemory = trip.type === 'voyage';
            // Affichage de l'image principale (image_url ou images[0])
            const mainImage = trip.image_url || (trip.images && trip.images[0]);
            return (
              <BlurView key={trip.id} intensity={30} tint="light" style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 26, marginBottom: 22, shadowColor: GREEN, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8, overflow: 'hidden' }}>
              <TouchableOpacity 
                  style={{ flex: 1 }}
                onPress={() => handleTripPress(trip)}
                  activeOpacity={0.88}
                >
                  {/* Image du voyage ou placeholder */}
                  {mainImage ? (
                    <View style={{ height: 140, backgroundColor: '#f0f0f0', position: 'relative', overflow: 'hidden', borderTopLeftRadius: 26, borderTopRightRadius: 26 }}>
                      <Image source={{ uri: mainImage }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                      <LinearGradient
                        colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.45)"]}
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, justifyContent: 'flex-end', paddingHorizontal: 18, paddingVertical: 14 }}
                      >
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }}>{trip.destination}</Text>
                      </LinearGradient>
                </View>
                  ) : (
                    <LinearGradient
                      colors={["#E8F5E8", "#F8F9FA"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: '100%', height: 140, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 26, borderTopRightRadius: 26 }}
                    >
                      <Ionicons name={isMemory ? "heart" : "location"} size={44} color={GREEN} style={{ marginBottom: 8 }} />
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: GREEN, marginTop: 6 }}>{trip.destination}</Text>
                    </LinearGradient>
                  )}
                  {/* Badge de statut avec indication du type */}
                  <View style={{ position: 'absolute', top: 18, right: 18, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: statusDisplay.color, shadowColor: statusDisplay.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#fff' }}>{isMemory ? 'Souvenir' : statusDisplay.text}</Text>
                  </View>
                  
                  {/* Badge "Supprimable" pour les voyages en attente */}
                  {trip.status === 'pending' && trip.type === 'trip_plan' && (
                    <View style={{ position: 'absolute', top: 18, left: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#FF4757', shadowColor: '#FF4757', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 }}>
                      <Ionicons name="trash-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}>Supprimable</Text>
                    </View>
                  )}
                  <View style={{ padding: 18 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: DARK, flex: 1 }}>{isMemory ? trip.trip_name || trip.destination : trip.destination}</Text>
                      <View style={{ backgroundColor: '#E8F5E8', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 10 }}>
                        <Text style={{ fontSize: 13, color: GREEN, fontWeight: '600' }}>{trip.travel_type}</Text>
                    </View>
                  </View>
                    <View style={{ marginBottom: 18 }}>
                      {/* Affichage adapté selon le type */}
                      {isMemory ? (
                        <>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                              <Ionicons name="location" size={16} color={GREEN} />
                    </View>
                            <Text style={{ fontSize: 15, color: '#666' }}>{trip.destination}</Text>
                    </View>
                          {trip.duration && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
                              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                <Ionicons name="time" size={16} color={GREEN} />
                    </View>
                              <Text style={{ fontSize: 15, color: '#666' }}>{trip.duration}</Text>
                  </View>
                          )}
                          {trip.rating && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
                              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                <Ionicons name="star" size={16} color="#FFD700" />
                      </View>
                              <Text style={{ fontSize: 15, color: '#666' }}>{trip.rating}/5</Text>
                            </View>
                          )}
                          {trip.memory_text && (
                            <View key={trip.id + '-memory'} style={{ marginTop: 8, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 10 }}>
                              <Text style={{ fontSize: 15, color: '#333', lineHeight: 20 }} numberOfLines={2}>{trip.memory_text}</Text>
                            </View>
                          )}
                        </>
                      ) : (
                        <>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                              <Ionicons name="calendar" size={16} color={GREEN} />
                            </View>
                            <Text style={{ fontSize: 15, color: '#666' }}>{dateRange}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                              <Ionicons name="heart" size={16} color={GREEN} />
                            </View>
                            <Text style={{ fontSize: 15, color: '#666' }}>{trip.interests?.join(', ') || 'Aucun thème'}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                              <Ionicons name="fitness" size={16} color={GREEN} />
                            </View>
                            <Text style={{ fontSize: 15, color: '#666' }}>Niveau: {trip.activity_level}</Text>
                          </View>
                        </>
                      )}
                    </View>
                    {/* Barre de progression uniquement pour les trip plans non terminés */}
                    {!isMemory && trip.status !== 'completed' && (
                      <View style={{ marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ fontSize: 14, color: '#666', fontWeight: '500' }}>Statut</Text>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: DARK }}>{statusDisplay.text}</Text>
                        </View>
                        <View style={{ height: 7, backgroundColor: BORDER, borderRadius: 4, overflow: 'hidden' }}>
                        <View 
                            style={{
                              height: '100%',
                              borderRadius: 4,
                              width: trip.status === 'pending' ? '25%' : trip.status === 'processing' ? '75%' : '100%',
                              backgroundColor: statusDisplay.color
                            }}
                        />
                      </View>
                    </View>
                  )}
                  {/* Actions */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 16 }}>
                    <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E8', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, shadowColor: GREEN, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 2 }}
                      onPress={() => handleTripAction('Détails', trip)}
                    >
                        <Ionicons name="document-text" size={16} color={GREEN} />
                        <Text style={{ color: GREEN, fontWeight: 'bold', fontSize: 15, marginLeft: 6 }}>Détails</Text>
                    </TouchableOpacity>
                    
                    {/* Bouton "Voir le planning" si un planning existe */}
                    {hasPlanning(trip) && (
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#FF9800', shadowColor: '#FF9800', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 2 }}
                        onPress={() => handleTripAction('Voir le planning', trip)}
                      >
                        <Ionicons name="map" size={16} color="#FF9800" />
                        <Text style={{ color: '#FF9800', fontWeight: 'bold', fontSize: 15, marginLeft: 6 }}>Planning</Text>
                      </TouchableOpacity>
                    )}
                      {isMemory ? (
                        <>
                    <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#FF4757', marginLeft: 8, shadowColor: '#FF4757', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 2 }}
                            onPress={() => handleTripAction('Supprimer le souvenir', trip)}
                    >
                            <Ionicons name="trash" size={16} color="#FF4757" />
                            <Text style={{ color: '#FF4757', fontWeight: 'bold', fontSize: 15, marginLeft: 6 }}>Supprimer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: GREEN, marginLeft: 8, shadowColor: GREEN, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 2 }}
                            onPress={() => handleTripAction('Voir photos', trip)}
                          >
                            <Ionicons name="images" size={16} color={GREEN} />
                            <Text style={{ color: GREEN, fontWeight: 'bold', fontSize: 15, marginLeft: 6 }}>Photos</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: GREEN, marginLeft: 8, shadowColor: GREEN, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 2 }}
                            onPress={() => router.push({ pathname: '/plan-trip', params: { tripData: JSON.stringify(trip) } })}
                          >
                            <Ionicons name="create" size={16} color={GREEN} />
                            <Text style={{ color: GREEN, fontWeight: 'bold', fontSize: 15, marginLeft: 6 }}>Modifier</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: GREEN, marginLeft: 8, shadowColor: GREEN, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 2 }}
                      onPress={() => handleTripAction('Partager', trip)}
                    >
                            <Ionicons name="share" size={16} color={GREEN} />
                            <Text style={{ color: GREEN, fontWeight: 'bold', fontSize: 15, marginLeft: 6 }}>Partager</Text>
                    </TouchableOpacity>
                          
                          {/* Bouton Supprimer seulement pour les voyages en attente */}
                          {trip.status === 'pending' && (
                            <TouchableOpacity 
                              style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                backgroundColor: '#FFF5F5', 
                                borderRadius: 16, 
                                paddingHorizontal: 16, 
                                paddingVertical: 8, 
                                borderWidth: 2, 
                                borderColor: '#FF4757', 
                                marginLeft: 8, 
                                shadowColor: '#FF4757', 
                                shadowOffset: { width: 0, height: 2 }, 
                                shadowOpacity: 0.15, 
                                shadowRadius: 6, 
                                elevation: 3 
                              }}
                              onPress={() => handleTripAction('Supprimer', trip)}
                            >
                              <Ionicons name="trash" size={16} color="#FF4757" />
                              <Text style={{ color: '#FF4757', fontWeight: 'bold', fontSize: 15, marginLeft: 6 }}>Supprimer</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                  </View>
                </View>
              </TouchableOpacity>
              </BlurView>
            );
          })}
        </View>
        {/* État vide */}
        {filteredTrips.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="airplane-outline" size={60} color="#2F7417" style={{ opacity: 0.18 }} />
            <Text style={styles.emptyTitle}>Aucun voyage trouvé</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'Tous' 
                ? 'Créez votre premier voyage pour commencer votre aventure !'
                : `Aucun voyage ${activeFilter.toLowerCase()} pour le moment.`
              }
            </Text>
            <TouchableOpacity style={[styles.createTripButton, { shadowColor: GREEN, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.13, shadowRadius: 18, elevation: 6 }]} onPress={handleAddTrip}>
              <Text style={styles.createTripText}>Créer un voyage</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const GREEN = '#2F7417';
const GREEN_LIGHT = '#E0F2F7';
const DARK = '#1a1a1a';
const BG = '#F8F9FA';
const BORDER = '#E9ECEF';

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
  refreshButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    backgroundColor: BG,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    marginHorizontal: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersScroll: {
    paddingLeft: 20,
  },
  filterButton: {
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activeFilterButton: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  tripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
  },
  addButton: {
    backgroundColor: GREEN,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  tripsContainer: {
    paddingHorizontal: 20,
  },
  tripCard: {
    backgroundColor: BG,
    borderRadius: 22,
    marginBottom: 18,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  tripImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  destinationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 5,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  tripInfo: {
    padding: 16,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK,
    flex: 1,
  },
  tripType: {
    backgroundColor: GREEN_LIGHT,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tripTypeText: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '500',
  },
  tripDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  memoryTextContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  memoryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DARK,
  },
  progressBar: {
    height: 6,
    backgroundColor: BORDER,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tripActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: GREEN,
    marginLeft: 6,
    fontWeight: '500',
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
    lineHeight: 22,
  },
  createTripButton: {
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
  createTripText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  // Nouveaux styles pour les images
  tripImageContainer: {
    height: 120,
    backgroundColor: '#f0f0f0',
    position: 'relative',
    overflow: 'hidden',
  },
  tripImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  destinationOverlayOnImage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

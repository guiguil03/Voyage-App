import { useAuth } from '@/features/auth/hooks/useAuth';
import { deleteTripPlan, getUserTripPlans } from '@/features/trips/services/trip-planning';
import { getUserVoyages } from '@/features/trips/services/voyages';
import { Ionicons } from '@expo/vector-icons';
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
          created_at: trip.created_at
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

  const handleTripAction = (action: string, trip: UnifiedTrip) => {
    if (action === 'Détails') {
      // Naviguer vers la page de détails en passant les données du voyage
      router.push({
        pathname: '/travel/detailMemory',
        params: {
          tripData: JSON.stringify(trip)
        }
      });
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
                const { deleteVoyage } = await import('@/features/trips/services/voyages');
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
      Alert.alert(
        'Supprimer le voyage',
        `Êtes-vous sûr de vouloir supprimer ce voyage planifié à "${trip.destination}" ?`,
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
                const result = await deleteTripPlan(trip.id);
                if (result.error) {
                  Alert.alert('Erreur', 'Impossible de supprimer: ' + result.error);
                } else {
                  Alert.alert('Supprimé', 'Le voyage a été supprimé.', [
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
          <ActivityIndicator size="large" color={C.cream} />
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>MES VOYAGES</Text>
          <Text style={styles.subtitle}>Gérez vos aventures</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadUserTrips}>
            <Ionicons name="refresh" size={18} color={C.cream} />
          </TouchableOpacity>
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          {statsDisplay.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name={stat.icon as any} size={22} color={C.cream} />
              </View>
              <Text style={styles.statNumber}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        {/* Filtres */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.activeFilterButton,
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === filter && styles.activeFilterText,
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Header des voyages */}
        <View style={styles.tripsHeader}>
          <Text style={styles.sectionTitle}>
            {activeFilter === 'Tous' ? 'TOUS MES VOYAGES' : `VOYAGES ${activeFilter.toUpperCase()}`}
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddTrip}>
            <Ionicons name="add" size={20} color={C.bg} />
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
              <View key={trip.id} style={styles.tripCard}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => handleTripPress(trip)}
                  activeOpacity={0.88}
                >
                  {/* Image du voyage ou placeholder */}
                  {mainImage ? (
                    <View style={styles.tripImageContainer}>
                      <Image source={{ uri: mainImage }} style={styles.tripImage} />
                      <LinearGradient
                        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.55)']}
                        style={styles.imageOverlayGradient}
                      >
                        <Text style={styles.destinationOverlayOnImage}>{trip.destination}</Text>
                      </LinearGradient>
                    </View>
                  ) : (
                    <View style={styles.tripImagePlaceholder}>
                      <View style={styles.placeholderIconCircle}>
                        <Ionicons name={isMemory ? 'heart' : 'location'} size={32} color={C.cream} />
                      </View>
                      <Text style={styles.placeholderDestination}>{trip.destination}</Text>
                    </View>
                  )}

                  {/* Badge de statut */}
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {isMemory ? 'SOUVENIR' : statusDisplay.text.toUpperCase()}
                    </Text>
                  </View>

                  {/* Infos de la carte */}
                  <View style={styles.tripInfo}>
                    {/* Titre + type */}
                    <View style={styles.tripHeader}>
                      <Text style={styles.tripTitle} numberOfLines={1}>
                        {isMemory ? trip.trip_name || trip.destination : trip.destination}
                      </Text>
                      <View style={styles.tripTypeChip}>
                        <Text style={styles.tripTypeText}>{trip.travel_type}</Text>
                      </View>
                    </View>

                    {/* Détails */}
                    <View style={styles.tripDetails}>
                      {isMemory ? (
                        <>
                          <View style={styles.detailRow}>
                            <View style={styles.detailIconCircle}>
                              <Ionicons name="location" size={14} color={C.cream} />
                            </View>
                            <Text style={styles.detailText}>{trip.destination}</Text>
                          </View>
                          {trip.duration && (
                            <View style={styles.detailRow}>
                              <View style={styles.detailIconCircle}>
                                <Ionicons name="time" size={14} color={C.cream} />
                              </View>
                              <Text style={styles.detailText}>{trip.duration}</Text>
                            </View>
                          )}
                          {trip.rating && (
                            <View style={styles.detailRow}>
                              <View style={styles.detailIconCircle}>
                                <Ionicons name="star" size={14} color={C.cream} />
                              </View>
                              <Text style={styles.detailText}>{trip.rating}/5</Text>
                            </View>
                          )}
                          {trip.memory_text && (
                            <View style={styles.memoryTextContainer}>
                              <Text style={styles.memoryText} numberOfLines={2}>
                                {trip.memory_text}
                              </Text>
                            </View>
                          )}
                        </>
                      ) : (
                        <>
                          <View style={styles.detailRow}>
                            <View style={styles.detailIconCircle}>
                              <Ionicons name="calendar" size={14} color={C.cream} />
                            </View>
                            <Text style={styles.detailText}>{dateRange}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <View style={styles.detailIconCircle}>
                              <Ionicons name="heart" size={14} color={C.cream} />
                            </View>
                            <Text style={styles.detailText}>
                              {trip.interests?.join(', ') || 'Aucun thème'}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <View style={styles.detailIconCircle}>
                              <Ionicons name="fitness" size={14} color={C.cream} />
                            </View>
                            <Text style={styles.detailText}>Niveau: {trip.activity_level}</Text>
                          </View>
                        </>
                      )}
                    </View>

                    {/* Barre de progression uniquement pour les trip plans non terminés */}
                    {!isMemory && trip.status !== 'completed' && (
                      <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabel}>STATUT</Text>
                          <Text style={styles.progressPercent}>{statusDisplay.text}</Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width:
                                  trip.status === 'pending'
                                    ? '25%'
                                    : trip.status === 'processing'
                                    ? '75%'
                                    : '100%',
                              },
                            ]}
                          />
                        </View>
                      </View>
                    )}

                    {/* Actions */}
                    <View style={styles.tripActions}>
                      {/* Bouton Détails — principal */}
                      <TouchableOpacity
                        style={styles.actionButtonPrimary}
                        onPress={() => handleTripAction('Détails', trip)}
                      >
                        <Ionicons name="document-text" size={15} color={C.bg} />
                        <Text style={styles.actionTextPrimary}>Détails</Text>
                      </TouchableOpacity>

                      {isMemory ? (
                        <>
                          <TouchableOpacity
                            style={styles.actionButtonGhost}
                            onPress={() => handleTripAction('Voir photos', trip)}
                          >
                            <Ionicons name="images" size={15} color={C.cream} />
                            <Text style={styles.actionTextGhost}>Photos</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButtonDelete}
                            onPress={() => handleTripAction('Supprimer le souvenir', trip)}
                          >
                            <Ionicons name="trash" size={15} color="#EF4444" />
                            <Text style={styles.actionTextDelete}>Supprimer</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.actionButtonGhost}
                            onPress={() => router.push({ pathname: '/plan-trip', params: { tripData: JSON.stringify(trip) } })}
                          >
                            <Ionicons name="create" size={15} color={C.cream} />
                            <Text style={styles.actionTextGhost}>Modifier</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButtonGhost}
                            onPress={() => handleTripAction('Partager', trip)}
                          >
                            <Ionicons name="share" size={15} color={C.cream} />
                            <Text style={styles.actionTextGhost}>Partager</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButtonDelete}
                            onPress={() => handleTripAction('Supprimer', trip)}
                          >
                            <Ionicons name="trash" size={15} color="#EF4444" />
                            <Text style={styles.actionTextDelete}>Supprimer</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* État vide */}
        {filteredTrips.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="airplane-outline" size={56} color={C.creamDim} />
            <Text style={styles.emptyTitle}>Aucun voyage trouvé</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'Tous'
                ? 'Créez votre premier voyage pour commencer votre aventure !'
                : `Aucun voyage ${activeFilter.toLowerCase()} pour le moment.`}
            </Text>
            <TouchableOpacity style={styles.createTripButton} onPress={handleAddTrip}>
              <Text style={styles.createTripText}>Créer un voyage</Text>
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

  // ── Header ──────────────────────────────────────────────────
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 28,
    position: 'relative',
  },
  title: {
    fontSize: 28,
    fontWeight: '200',
    letterSpacing: 6,
    color: C.cream,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    letterSpacing: 2,
    color: C.creamDim,
    fontWeight: '300',
  },
  refreshButton: {
    position: 'absolute',
    top: 52,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Loading ──────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: C.creamDim,
    letterSpacing: 1,
  },

  // ── Stats ────────────────────────────────────────────────────
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.creamFaint,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '600',
    color: C.cream,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: C.creamDim,
    fontWeight: '300',
    textAlign: 'center',
  },

  // ── Filtres ──────────────────────────────────────────────────
  filtersContainer: {
    marginBottom: 24,
  },
  filtersScroll: {
    paddingLeft: 20,
  },
  filterButton: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 12,
  },
  activeFilterButton: {
    backgroundColor: C.cream,
    borderColor: C.cream,
  },
  filterText: {
    fontSize: 13,
    color: C.creamDim,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  activeFilterText: {
    color: C.bg,
    fontWeight: '600',
  },

  // ── Trips header ─────────────────────────────────────────────
  tripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 3,
    color: C.creamDim,
    fontWeight: '300',
  },
  addButton: {
    backgroundColor: C.cream,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Trip cards ───────────────────────────────────────────────
  tripsContainer: {
    paddingHorizontal: 20,
  },
  tripCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    overflow: 'hidden',
  },

  // Image avec gradient
  tripImageContainer: {
    height: 150,
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
    height: 80,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  destinationOverlayOnImage: {
    fontSize: 17,
    fontWeight: '600',
    color: C.white,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // Placeholder (sans image)
  tripImagePlaceholder: {
    height: 150,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.creamFaint,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderDestination: {
    fontSize: 15,
    fontWeight: '300',
    color: C.creamDim,
    letterSpacing: 1,
  },

  // Badge statut
  statusBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(245,237,214,0.06)',
    borderWidth: 1,
    borderColor: C.creamFaint,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '400',
    letterSpacing: 2,
    color: C.cream,
  },

  // Infos carte
  tripInfo: {
    padding: 18,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tripTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: C.cream,
    flex: 1,
    letterSpacing: 0.3,
  },
  tripTypeChip: {
    backgroundColor: C.creamFaint,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  tripTypeText: {
    fontSize: 11,
    color: C.creamDim,
    fontWeight: '300',
    letterSpacing: 0.5,
  },

  // Détails
  tripDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(245,237,214,0.06)',
    borderWidth: 1,
    borderColor: C.creamFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  detailText: {
    fontSize: 13,
    color: C.creamDim,
    flex: 1,
  },
  memoryTextContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: C.creamFaint,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  memoryText: {
    fontSize: 13,
    color: C.creamDim,
    lineHeight: 20,
  },

  // Barre de progression
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 10,
    color: C.creamDim,
    fontWeight: '300',
    letterSpacing: 2,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '500',
    color: C.cream,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(245,237,214,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: C.cream,
  },

  // Actions
  tripActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 14,
  },
  actionButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cream,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionTextPrimary: {
    color: C.bg,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 5,
  },
  actionButtonGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.creamFaint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionTextGhost: {
    color: C.cream,
    fontWeight: '400',
    fontSize: 13,
    marginLeft: 5,
  },
  actionButtonDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionTextDelete: {
    color: '#EF4444',
    fontWeight: '400',
    fontSize: 13,
    marginLeft: 5,
  },

  // ── Empty state ───────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: C.creamDim,
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: 1,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.creamDim,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    fontWeight: '300',
  },
  createTripButton: {
    backgroundColor: C.cream,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createTripText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.bg,
    letterSpacing: 0.5,
  },
});

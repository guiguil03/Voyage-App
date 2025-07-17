import { useAuth } from '@/hooks/useAuth';
import { getUserTripPlans } from '@/lib/trip-planning';
import { Ionicons } from '@expo/vector-icons';
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

interface TripStats {
  totalTrips: number;
  pendingTrips: number;
  completedTrips: number;
}

export default function VoyageScreen() {
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [trips, setTrips] = useState<TripPlan[]>([]);
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
      
      const result = await getUserTripPlans();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setTrips(result.data);
      
      // Calculer les statistiques
      const totalTrips = result.data.length;
      const pendingTrips = result.data.filter((trip: TripPlan) => trip.status === 'pending').length;
      const completedTrips = result.data.filter((trip: TripPlan) => trip.status === 'completed').length;
      
      setStats({ totalTrips, pendingTrips, completedTrips });
      
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
      case 'completed': return { text: 'Terminé', color: '#4ECDC4' };
      case 'failed': return { text: 'Échoué', color: '#FF4757' };
      default: return { text: status, color: '#666' };
    }
  };

  const getFilteredTrips = () => {
    if (activeFilter === 'Tous') return trips;
    
    const statusMap = {
      'En attente': 'pending',
      'En cours': 'processing', 
      'Terminé': 'completed'
    };
    
    const statusKey = statusMap[activeFilter as keyof typeof statusMap];
    return trips.filter(trip => trip.status === statusKey);
  };

  const filteredTrips = getFilteredTrips();

  const handleTripPress = (trip: TripPlan) => {
    const interests = trip.interests || [];
    Alert.alert(
      trip.destination, 
      `Voyage ${getStatusDisplay(trip.status).text}\nType: ${trip.travel_type}\nIntérêts: ${interests.join(', ')}`
    );
  };

  const handleAddTrip = () => {
    router.push('/plan-trip');
  };

  const handleTripAction = (action: string, trip: TripPlan) => {
    Alert.alert(action, `${action} pour ${trip.destination}`);
  };

  const formatDateRange = (trip: TripPlan): string => {
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

  // Affichage si pas connecté
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>Connexion requise</Text>
          <Text style={styles.emptySubtitle}>
            Connectez-vous pour voir vos voyages planifiés.
          </Text>
          <TouchableOpacity style={styles.createTripButton} onPress={() => router.push('/login')}>
            <Text style={styles.createTripText}>Se connecter</Text>
          </TouchableOpacity>
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
          <Text style={styles.title}>Mes Voyages</Text>
          <Text style={styles.subtitle}>Gérez vos aventures</Text>
          
          {/* Bouton de rechargement */}
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={loadUserTrips}
          >
            <Ionicons name="refresh" size={20} color="#2F7417" />
          </TouchableOpacity>
        </View>

        {/* Affichage des erreurs */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadUserTrips}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          {statsDisplay.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name={stat.icon as any} size={24} color="#2F7417" />
              </View>
              <Text style={styles.statNumber}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
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
                  activeFilter === filter && styles.activeFilterButton
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === filter && styles.activeFilterText
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
            {activeFilter === 'Tous' ? 'Tous mes voyages' : `Voyages ${activeFilter.toLowerCase()}`}
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddTrip}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Liste des voyages */}
        <View style={styles.tripsContainer}>
          {filteredTrips.map((trip) => {
            const statusDisplay = getStatusDisplay(trip.status);
            const dateRange = formatDateRange(trip);
            
            return (
              <TouchableOpacity 
                key={trip.id} 
                style={styles.tripCard}
                onPress={() => handleTripPress(trip)}
              >
                {/* Image par défaut basée sur la destination */}
                <View style={styles.tripImagePlaceholder}>
                  <Ionicons name="location" size={40} color="#2F7417" />
                  <Text style={styles.destinationOverlay}>{trip.destination}</Text>
                </View>
                
                {/* Badge de statut */}
                <View style={[styles.statusBadge, { backgroundColor: statusDisplay.color }]}>
                  <Text style={styles.statusText}>{statusDisplay.text}</Text>
                </View>

                <View style={styles.tripInfo}>
                  <View style={styles.tripHeader}>
                    <Text style={styles.tripTitle}>{trip.destination}</Text>
                    <View style={styles.tripType}>
                      <Text style={styles.tripTypeText}>{trip.travel_type}</Text>
                    </View>
                  </View>

                  <View style={styles.tripDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color="#666" />
                      <Text style={styles.detailText}>{dateRange}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="heart" size={16} color="#666" />
                      <Text style={styles.detailText}>{trip.interests?.join(', ')}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="fitness" size={16} color="#666" />
                      <Text style={styles.detailText}>Niveau: {trip.activity_level}</Text>
                    </View>
                  </View>

                  {/* Barre de progression basée sur le statut */}
                  {trip.status !== 'completed' && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Statut</Text>
                        <Text style={styles.progressPercent}>{statusDisplay.text}</Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: trip.status === 'pending' ? '25%' : trip.status === 'processing' ? '75%' : '100%',
                              backgroundColor: statusDisplay.color
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.tripActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleTripAction('Détails', trip)}
                    >
                      <Ionicons name="document-text" size={16} color="#2F7417" />
                      <Text style={styles.actionText}>Détails</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleTripAction('Modifier', trip)}
                    >
                      <Ionicons name="create" size={16} color="#2F7417" />
                      <Text style={styles.actionText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleTripAction('Partager', trip)}
                    >
                      <Ionicons name="share" size={16} color="#2F7417" />
                      <Text style={styles.actionText}>Partager</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* État vide */}
        {filteredTrips.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="airplane-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>Aucun voyage trouvé</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'Tous' 
                ? 'Créez votre premier voyage pour commencer votre aventure !'
                : `Aucun voyage ${activeFilter.toLowerCase()} pour le moment.`
              }
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
  refreshButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#2F7417',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
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
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeFilterButton: {
    backgroundColor: '#2F7417',
    borderColor: '#2F7417',
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
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#2F7417',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripsContainer: {
    paddingHorizontal: 20,
  },
  tripCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  tripType: {
    backgroundColor: '#e0f2f7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tripTypeText: {
    fontSize: 12,
    color: '#2F7417',
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
    color: '#1a1a1a',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
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
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#2F7417',
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
    color: '#1a1a1a',
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
    backgroundColor: '#2F7417',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createTripText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 120,
  },
}); 
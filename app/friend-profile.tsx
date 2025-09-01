import { useAuth } from '@/hooks/useAuth';
import { getProfileById } from '@/lib/profiles';
import { getUserVoyagesById } from '@/lib/voyages';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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

interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  email: string;
  bio?: string;
  city?: string;
  country?: string;
  avatar_url?: string;
  date_of_birth?: string;
  phone?: string;
  website?: string;
  created_at: string;
  // Préférences de voyage
  favorite_destinations?: string[];
  travel_style?: string;
  budget_range?: string;
  preferred_activities?: string[];
}

interface TravelStats {
  totalVoyages: number;
  favoriteDestination: string | null;
  averageRating: number;
  totalCountries: number;
  lastTripDate: string | null;
}

export default function FriendProfileScreen() {
  const { userId } = useLocalSearchParams();
  const { user } = useAuth();
  const [friendProfile, setFriendProfile] = useState<Profile | null>(null);
  const [friendVoyages, setFriendVoyages] = useState<any[]>([]);
  const [travelStats, setTravelStats] = useState<TravelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || typeof userId !== 'string') {
      setError('ID utilisateur manquant');
      setLoading(false);
      return;
    }

    // Vérifier qu'on ne consulte pas son propre profil
    if (user && userId === user.id) {
      router.replace('/profil'); // Rediriger vers son propre profil
      return;
    }

    loadFriendData();
  }, [userId, user]);

  // Fonction pour calculer les statistiques de voyage
  const calculateTravelStats = (voyages: any[]): TravelStats => {
    if (voyages.length === 0) {
      return {
        totalVoyages: 0,
        favoriteDestination: null,
        averageRating: 0,
        totalCountries: 0,
        lastTripDate: null
      };
    }

    // Calculer la destination favorite (la plus fréquente)
    const destinationCounts: { [key: string]: number } = {};
    const countries = new Set<string>();
    let totalRating = 0;
    let ratedVoyages = 0;

    voyages.forEach((voyage) => {
      // Compter les destinations
      if (voyage.destination) {
        destinationCounts[voyage.destination] = (destinationCounts[voyage.destination] || 0) + 1;
      }
      
      // Compter les pays uniques (approximatif basé sur la destination)
      if (voyage.destination) {
        countries.add(voyage.destination.split(',')[0].trim());
      }
      
      // Calculer la moyenne des notes
      if (voyage.rating && voyage.rating > 0) {
        totalRating += voyage.rating;
        ratedVoyages++;
      }
    });

    const favoriteDestination = Object.entries(destinationCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    const averageRating = ratedVoyages > 0 ? Math.round((totalRating / ratedVoyages) * 10) / 10 : 0;

    // Date du dernier voyage
    const sortedVoyages = [...voyages].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const lastTripDate = sortedVoyages[0]?.created_at || null;

    return {
      totalVoyages: voyages.length,
      favoriteDestination,
      averageRating,
      totalCountries: countries.size,
      lastTripDate
    };
  };

  const loadFriendData = async () => {
    if (!userId || typeof userId !== 'string') return;

    setLoading(true);
    setError(null);

    try {
      // Charger le profil de l'ami
      const profileResult = await getProfileById(userId);
      
      if (profileResult.error) {
        setError(profileResult.error);
        return;
      }

      if (!profileResult.data) {
        setError('Profil non trouvé');
        return;
      }

      setFriendProfile(profileResult.data);

      // Charger les voyages publics de l'ami
      const voyagesResult = await getUserVoyagesById(userId);
      
      if (voyagesResult.data) {
        // Filtrer seulement les voyages publics si nécessaire
        const publicVoyages = voyagesResult.data.filter((voyage: any) => voyage.is_public !== false);
        setFriendVoyages(publicVoyages);
        
        // Calculer les statistiques de voyage
        const stats = calculateTravelStats(publicVoyages);
        setTravelStats(stats);
      }

    } catch (error) {
      console.error('Erreur lors du chargement du profil ami:', error);
      setError('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleVoyagePress = (voyage: any) => {
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
      user: friendProfile, // Informations de l'ami
    };
    
    router.push({
      pathname: '/travel/detailMemory',
      params: { tripData: JSON.stringify(tripData) }
    });
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return '';
    }
  };

  const calculateAge = (dateString?: string): number | null => {
    if (!dateString) return null;
    try {
      const birthDate = new Date(dateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age > 0 && age < 120 ? age : null;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F7417" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </SafeAreaView>
    );
  }

  if (error || !friendProfile) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="person-remove" size={60} color="#999" />
        <Text style={styles.errorTitle}>Profil non accessible</Text>
        <Text style={styles.errorText}>{error || 'Ce profil n\'est pas disponible'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const GREEN = '#2F7417';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil d'ami</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Section Profil */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                friendProfile.avatar_url
                  ? { uri: friendProfile.avatar_url }
                  : require('@/assets/images/icon.png')
              }
              style={styles.avatar}
            />
            <View style={styles.readOnlyBadge}>
              <Ionicons name="eye" size={12} color="#666" />
              <Text style={styles.readOnlyText}>Lecture seule</Text>
            </View>
          </View>

          <Text style={styles.userName}>
            {friendProfile.full_name || friendProfile.username || 'Utilisateur'}
          </Text>
          
          {friendProfile.username && friendProfile.full_name && (
            <Text style={styles.userHandle}>@{friendProfile.username}</Text>
          )}
          
          {friendProfile.bio && (
            <Text style={styles.userBio}>{friendProfile.bio}</Text>
          )}

          {/* Informations de contact et détails */}
          <View style={styles.contactInfo}>
            {friendProfile.email && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => {
                  Alert.alert(
                    'Contact',
                    `Email : ${friendProfile.email}`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Ionicons name="mail" size={16} color={GREEN} />
                <Text style={styles.contactText}>Contacter</Text>
              </TouchableOpacity>
            )}
            
            {friendProfile.phone && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => {
                  Alert.alert(
                    'Téléphone',
                    `Numéro : ${friendProfile.phone}`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Ionicons name="call" size={16} color={GREEN} />
                <Text style={styles.contactText}>Téléphone</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.userInfo}>
            {friendProfile.city && (
              <View style={styles.infoItem}>
                <Ionicons name="location" size={16} color={GREEN} />
                <Text style={styles.infoText}>
                  {friendProfile.city}{friendProfile.country ? `, ${friendProfile.country}` : ''}
                </Text>
              </View>
            )}
            
            {friendProfile.website && (
              <TouchableOpacity 
                style={styles.infoItem}
                onPress={() => {
                  if (friendProfile.website) {
                    Alert.alert(
                      'Site web',
                      friendProfile.website,
                      [
                        { text: 'Fermer', style: 'cancel' },
                        { text: 'Ouvrir', onPress: () => {/* Linking.openURL(friendProfile.website) */} }
                      ]
                    );
                  }
                }}
              >
                <Ionicons name="globe" size={16} color={GREEN} />
                <Text style={[styles.infoText, { color: GREEN, textDecorationLine: 'underline' }]}>
                  {friendProfile.website}
                </Text>
              </TouchableOpacity>
            )}

            {friendProfile.date_of_birth && (
              <View style={styles.infoItem}>
                <Ionicons name="gift" size={16} color={GREEN} />
                <Text style={styles.infoText}>
                  Né(e) le {formatDate(friendProfile.date_of_birth)}
                  {calculateAge(friendProfile.date_of_birth) && (
                    ` (${calculateAge(friendProfile.date_of_birth)} ans)`
                  )}
                </Text>
              </View>
            )}

            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={16} color={GREEN} />
              <Text style={styles.infoText}>
                Membre depuis {formatDate(friendProfile.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Statistiques de voyage */}
        {travelStats && (
          <View style={styles.statsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics" size={20} color={GREEN} />
              <Text style={styles.sectionTitle}>Statistiques de voyage</Text>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="airplane" size={20} color={GREEN} />
                </View>
                <Text style={styles.statNumber}>{travelStats.totalVoyages}</Text>
                <Text style={styles.statLabel}>Voyages</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="flag" size={20} color={GREEN} />
                </View>
                <Text style={styles.statNumber}>{travelStats.totalCountries}</Text>
                <Text style={styles.statLabel}>Pays visités</Text>
              </View>
              
              {travelStats.averageRating > 0 && (
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="star" size={20} color="#FFD700" />
                  </View>
                  <Text style={styles.statNumber}>{travelStats.averageRating}</Text>
                  <Text style={styles.statLabel}>Note moyenne</Text>
                </View>
              )}
            </View>

            {travelStats.favoriteDestination && (
              <View style={styles.favoriteDestination}>
                <Ionicons name="heart" size={16} color="#FF6B6B" />
                <Text style={styles.favoriteText}>
                  Destination favorite : <Text style={styles.favoriteDestinationText}>{travelStats.favoriteDestination}</Text>
                </Text>
              </View>
            )}

            {travelStats.lastTripDate && (
              <View style={styles.lastTrip}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.lastTripText}>
                  Dernier voyage : {formatDate(travelStats.lastTripDate)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Section Préférences de voyage */}
        {(friendProfile.favorite_destinations || friendProfile.travel_style || friendProfile.preferred_activities) && (
          <View style={styles.preferencesSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-outline" size={20} color={GREEN} />
              <Text style={styles.sectionTitle}>Préférences de voyage</Text>
            </View>
            
            {friendProfile.travel_style && (
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Style de voyage :</Text>
                <View style={styles.preferenceTag}>
                  <Text style={styles.preferenceValue}>{friendProfile.travel_style}</Text>
                </View>
              </View>
            )}

            {friendProfile.budget_range && (
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Budget préféré :</Text>
                <View style={styles.preferenceTag}>
                  <Text style={styles.preferenceValue}>{friendProfile.budget_range}</Text>
                </View>
              </View>
            )}

            {friendProfile.preferred_activities && friendProfile.preferred_activities.length > 0 && (
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Activités préférées :</Text>
                <View style={styles.activitiesContainer}>
                  {friendProfile.preferred_activities.map((activity, index) => (
                    <View key={index} style={styles.activityTag}>
                      <Text style={styles.activityText}>{activity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {friendProfile.favorite_destinations && friendProfile.favorite_destinations.length > 0 && (
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Destinations de rêve :</Text>
                <View style={styles.activitiesContainer}>
                  {friendProfile.favorite_destinations.map((destination, index) => (
                    <View key={index} style={[styles.activityTag, { backgroundColor: '#E8F5E8' }]}>
                      <Text style={[styles.activityText, { color: GREEN }]}>{destination}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Section Voyages */}
        <View style={styles.voyagesSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="airplane" size={20} color={GREEN} />
            <Text style={styles.sectionTitle}>Voyages partagés</Text>
            <View style={styles.voyageCountBadge}>
              <Text style={styles.voyageCount}>{friendVoyages.length}</Text>
            </View>
          </View>
          
          {travelStats && friendVoyages.length > 0 && (
            <View style={styles.voyagesSummary}>
              <Text style={styles.voyagesSummaryText}>
                🌍 {travelStats.totalCountries} pays • ⭐ {travelStats.averageRating > 0 ? `${travelStats.averageRating}/5` : 'Non noté'}
                {travelStats.lastTripDate && ` • 📅 Dernier voyage : ${formatDate(travelStats.lastTripDate)}`}
              </Text>
            </View>
          )}

          {friendVoyages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="airplane-outline" size={40} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucun voyage partagé</Text>
              <Text style={styles.emptySubtitle}>
                Cet ami n'a pas encore partagé de voyages publics
              </Text>
            </View>
          ) : (
            <View style={styles.voyagesList}>
              {friendVoyages.map((voyage) => (
                <TouchableOpacity
                  key={voyage.id}
                  style={styles.voyageCard}
                  onPress={() => handleVoyagePress(voyage)}
                  activeOpacity={0.7}
                >
                  {voyage.image_url ? (
                    <Image source={{ uri: voyage.image_url }} style={styles.voyageImage} />
                  ) : (
                    <View style={styles.voyagePlaceholder}>
                      <Ionicons name="image" size={30} color="#ccc" />
                    </View>
                  )}
                  
                  <View style={styles.voyageInfo}>
                    <View style={styles.voyageHeader}>
                      <Text style={styles.voyageDestination}>
                        {voyage.trip_name || voyage.destination}
                      </Text>
                      {voyage.flag_emoji && (
                        <Text style={styles.flagEmoji}>{voyage.flag_emoji}</Text>
                      )}
                    </View>
                    
                    <Text style={styles.voyageDescription} numberOfLines={2}>
                      {voyage.description || voyage.memory_text || `Voyage à ${voyage.destination}`}
                    </Text>
                    
                    <View style={styles.voyageDetails}>
                      <View style={styles.voyageDetailItem}>
                        <Ionicons name="calendar-outline" size={12} color="#666" />
                        <Text style={styles.voyageDetailText}>
                          {formatDate(voyage.created_at)}
                        </Text>
                      </View>
                      
                      {voyage.duration && (
                        <View style={styles.voyageDetailItem}>
                          <Ionicons name="time-outline" size={12} color="#666" />
                          <Text style={styles.voyageDetailText}>{voyage.duration}</Text>
                        </View>
                      )}
                      
                      {voyage.trip_type && (
                        <View style={styles.voyageDetailItem}>
                          <Ionicons name="people-outline" size={12} color="#666" />
                          <Text style={styles.voyageDetailText}>{voyage.trip_type}</Text>
                        </View>
                      )}
                    </View>
                    
                    {voyage.rating && (
                      <View style={styles.rating}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>{voyage.rating}/5</Text>
                        <Text style={styles.ratingLabel}>• Note du voyage</Text>
                      </View>
                    )}
                  </View>
                  
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              ))}
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
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2F7417',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#2F7417',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E9ECEF',
    borderWidth: 3,
    borderColor: '#2F7417',
  },
  readOnlyBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  readOnlyText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  userHandle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  userBio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  contactText: {
    fontSize: 14,
    color: '#2F7417',
    fontWeight: '500',
  },
  userInfo: {
    alignItems: 'flex-start',
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  voyagesSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  voyageCountBadge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voyageCount: {
    fontSize: 12,
    color: '#2F7417',
    fontWeight: '600',
  },
  voyagesSummary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  voyagesSummaryText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  voyagesList: {
    gap: 12,
  },
  voyageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  voyageImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E9ECEF',
  },
  voyagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voyageInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  voyageDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  voyageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  voyageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voyageDate: {
    fontSize: 12,
    color: '#999',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  ratingLabel: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  // Styles pour les statistiques
  statsSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
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
    textAlign: 'center',
  },
  favoriteDestination: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  favoriteText: {
    fontSize: 14,
    color: '#666',
  },
  favoriteDestinationText: {
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  lastTrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  lastTripText: {
    fontSize: 14,
    color: '#666',
  },
  // Styles pour les préférences
  preferencesSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  preferenceItem: {
    marginBottom: 16,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  preferenceTag: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  preferenceValue: {
    fontSize: 14,
    color: '#2F7417',
    fontWeight: '500',
  },
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activityText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Styles pour les détails de voyage améliorés
  voyageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  flagEmoji: {
    fontSize: 18,
  },
  voyageDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  voyageDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voyageDetailText: {
    fontSize: 11,
    color: '#666',
  },
});

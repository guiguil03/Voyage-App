import { deleteTripPlan } from '@/lib/trip-planning';
import { deleteVoyage } from '@/lib/voyages';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

function groupActivitiesByDay(activities: any[], startDate: string, endDate: string) {
  if (!startDate || !endDate) return { 'Jour 1': activities.slice(0, 5) };
  const days: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nbDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  for (let i = 0; i < nbDays; i++) {
    days.push(`Jour ${i + 1}`);
  }
  const MAX_PER_DAY = 5;
  const planning: Record<string, any[]> = {};
  let idx = 0;
  days.forEach((day) => {
    planning[day] = activities.slice(idx, idx + MAX_PER_DAY);
    idx += MAX_PER_DAY;
  });
  return planning;
}

export default function DetailMemoryScreen() {
  // Récupérer les paramètres passés lors de la navigation
  const params = useLocalSearchParams();
  
  // Parser les données du voyage si elles sont passées en string
  const tripData = params.tripData ? JSON.parse(params.tripData as string) : null;

  if (!tripData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Aucune donnée de voyage trouvée</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isMemory = tripData.type === 'voyage';

  // Fonction pour supprimer le voyage/souvenir
  const handleDeleteTrip = () => {
    const isMemory = tripData.type === 'voyage';
    Alert.alert(
      isMemory ? 'Supprimer le souvenir' : 'Supprimer le voyage',
      `Êtes-vous sûr de vouloir supprimer définitivement "${tripData.trip_name || tripData.destination}" ?`,
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
              let result;
              if (isMemory) {
                result = await deleteVoyage(tripData.id);
              } else {
                result = await deleteTripPlan(tripData.id);
              }
              if (result.error) {
                Alert.alert('Erreur', 'Impossible de supprimer: ' + result.error);
              } else {
                Alert.alert(
                  'Supprimé',
                  isMemory ? 'Le souvenir a été supprimé.' : 'Le voyage a été supprimé.',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.push('/(tabs)/voyage')
                    }
                  ]
                );
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur inattendue est survenue.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton retour et suppression */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2F7417" />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isMemory ? 'Détails du souvenir' : 'Détails du voyage'}
        </Text>
        {isMemory && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTrip}>
            <Ionicons name="trash" size={20} color="#FF4757" />
          </TouchableOpacity>
        )}
        {!isMemory && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTrip}>
            <Ionicons name="trash" size={20} color="#FF4757" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Galerie d'images du voyage */}
        {((tripData.images && tripData.images.length > 0) || tripData.image_url) && (
          <View>
            {/* Image principale (hero) */}
            {(tripData.images?.[0] || tripData.image_url) && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: tripData.images?.[0] || tripData.image_url }} 
                  style={styles.heroImage} 
                />
                <View style={styles.imageOverlay}>
                  <Text style={styles.destinationTitle}>{tripData.destination}</Text>
                  {isMemory && tripData.trip_name && (
                    <Text style={styles.tripNameTitle}>{tripData.trip_name}</Text>
                  )}
                  {tripData.images && tripData.images.length > 1 && (
                    <Text style={styles.imageCount}>
                      1 / {tripData.images.length} photos
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Galerie des autres images */}
            {tripData.images && tripData.images.length > 1 && (
              <View style={styles.galleryContainer}>
                <Text style={styles.galleryTitle}>Galerie photos ({tripData.images.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                  {tripData.images.map((imageUrl: string, index: number) => (
                    <TouchableOpacity key={index} style={styles.galleryItem}>
                      <Image source={{ uri: imageUrl }} style={styles.galleryImage} />
                      <View style={styles.galleryImageOverlay}>
                        <Text style={styles.galleryImageNumber}>{index + 1}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Informations principales */}
        <View style={styles.mainInfoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.typeContainer}>
              <Ionicons name={isMemory ? "heart" : "airplane"} size={20} color="#2F7417" />
              <Text style={styles.typeText}>
                {isMemory ? 'Souvenir' : 'Plan de voyage'}
              </Text>
            </View>
            <View style={styles.travelTypeContainer}>
              <Text style={styles.travelTypeText}>{tripData.travel_type}</Text>
            </View>
          </View>

          {!tripData.image_url && (
            <Text style={styles.destinationTitleNoImage}>{tripData.destination}</Text>
          )}
          
          {isMemory && tripData.trip_name && !tripData.image_url && (
            <Text style={styles.tripNameTitleNoImage}>{tripData.trip_name}</Text>
          )}
        </View>

        {/* Détails spécifiques aux souvenirs */}
        {isMemory && (
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Détails du souvenir</Text>
            
            {tripData.description && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{tripData.description}</Text>
              </View>
            )}

            {tripData.duration && (
              <View style={styles.detailRow}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.detailLabel}>Durée</Text>
                <Text style={styles.detailValue}>{tripData.duration}</Text>
              </View>
            )}

            {tripData.rating && (
              <View style={styles.detailRow}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.detailLabel}>Note</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={16}
                      color={star <= tripData.rating ? "#FFD700" : "#E0E0E0"}
                    />
                  ))}
                  <Text style={styles.ratingText}>({tripData.rating}/5)</Text>
                </View>
              </View>
            )}

            {tripData.memory_text && (
              <View style={styles.memorySection}>
                <Text style={styles.sectionTitle}>Vos souvenirs</Text>
                <Text style={styles.memoryText}>{tripData.memory_text}</Text>
              </View>
            )}
          </View>
        )}

        {/* Détails spécifiques aux plans de voyage */}
        {!isMemory && (
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Détails du voyage</Text>
            
            {(tripData.start_date || tripData.end_date) && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.detailLabel}>Dates</Text>
                <Text style={styles.detailValue}>
                  {tripData.start_date && tripData.end_date
                    ? `Du ${new Date(tripData.start_date).toLocaleDateString('fr-FR')} au ${new Date(tripData.end_date).toLocaleDateString('fr-FR')}`
                    : tripData.start_date
                    ? `A partir du ${new Date(tripData.start_date).toLocaleDateString('fr-FR')}`
                    : 'Dates a definir'}
                </Text>
              </View>
            )}

            {tripData.interests && tripData.interests.length > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="heart" size={16} color="#666" />
                <Text style={styles.detailLabel}>Intérêts</Text>
                <Text style={styles.detailValue}>{tripData.interests.join(', ')}</Text>
              </View>
            )}

            {tripData.activity_level && (
              <View style={styles.detailRow}>
                <Ionicons name="fitness" size={16} color="#666" />
                <Text style={styles.detailLabel}>Niveau d activite</Text>
                <Text style={styles.detailValue}>{tripData.activity_level}</Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#2F7417',
    fontWeight: '500',
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  destinationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tripNameTitle: {
    fontSize: 18,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  mainInfoCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 14,
    color: '#2F7417',
    fontWeight: '500',
    marginLeft: 8,
  },
  travelTypeContainer: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  travelTypeText: {
    fontSize: 12,
    color: '#2F7417',
    fontWeight: '500',
  },
  destinationTitleNoImage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  tripNameTitleNoImage: {
    fontSize: 18,
    color: '#666',
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 24,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  memorySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  memoryText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    fontStyle: 'italic',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2F7417',
  },
  metaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Styles pour la galerie d'images
  imageCount: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
    opacity: 0.9,
    fontWeight: '500',
  },
  galleryContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  galleryScroll: {
    marginHorizontal: -5,
  },
  galleryItem: {
    marginHorizontal: 5,
    position: 'relative',
  },
  galleryImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  galleryImageOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(47, 116, 23, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  galleryImageNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
}); 
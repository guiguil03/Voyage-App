import InputField from '@/components/planning/InputField';
import SelectionButton from '@/components/planning/SelectionButton';
import { useAuth } from '@/hooks/useAuth';
import { getOpenTripMapService } from '@/lib/opentripmap';
import { createTripPlan, deleteTripPlan } from '@/lib/trip-planning';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PlanTripScreen() {
  const params = useLocalSearchParams();
  const initialTrip = params.tripData ? JSON.parse(params.tripData as string) : null;

  const [destination, setDestination] = useState(initialTrip?.destination || '');
  const [selectedTravelType, setSelectedTravelType] = useState(initialTrip?.travel_type || 'Solo');
  const [selectedThemes, setSelectedThemes] = useState<string[]>(initialTrip?.interests && initialTrip.interests.length > 0 ? initialTrip.interests : ['Culture']);
  const [selectedActivityLevel, setSelectedActivityLevel] = useState(initialTrip?.activity_level || 'Balanced');
  const [startDate, setStartDate] = useState<Date | null>(initialTrip?.start_date ? new Date(initialTrip.start_date) : null);
  const [endDate, setEndDate] = useState<Date | null>(initialTrip?.end_date ? new Date(initialTrip.end_date) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();

  const travelTypes = ['Solo', 'Couple', 'Family', 'Group'];
  const interestThemes = ['Culture', 'Gastronomy', 'Sport', 'Nature', 'Relaxation'];
  const activityLevels = ['Relax', 'Balanced', 'Intense'];

  // Calcul du pourcentage de completion
  const getCompletionPercentage = () => {
    let completed = 0;
    if (destination.trim()) completed++;
    if (startDate && endDate) completed++;
    if (selectedThemes.length > 0) completed++;
    if (selectedTravelType) completed++;
    if (selectedActivityLevel) completed++;
    return Math.round((completed / 5) * 100);
  };

  const handleThemeToggle = (theme: string) => {
    if (selectedThemes.includes(theme)) {
      setSelectedThemes(selectedThemes.filter(t => t !== theme));
    } else {
      setSelectedThemes([...selectedThemes, theme]);
    }
  };

  const handleGenerateItinerary = async () => {
    if (!destination.trim()) {
      Alert.alert('Destination requise', 'Veuillez saisir une destination');
      return;
    }

    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour créer un voyage');
      return;
    }

    setIsLoading(true);

    try {
      const tripPlanData = {
        destination: destination.trim(),
        startDate: startDate,
        endDate: endDate,
        travelType: selectedTravelType as 'Solo' | 'Couple' | 'Family' | 'Group',
        interests: selectedThemes,
        activityLevel: selectedActivityLevel as 'Relax' | 'Balanced' | 'Intense',
      };

      // Enregistrer le voyage dans la base de données
      const { data: tripPlan, error: saveError } = await createTripPlan(tripPlanData);
      if (saveError || !tripPlan) {
        Alert.alert('Erreur', 'Impossible d\'enregistrer le voyage. Veuillez réessayer.');
        setIsLoading(false);
        return;
      }

      // Appel OpenTripMap pour générer un planning personnalisé
      const otm = getOpenTripMapService();
      const otmResult = await otm.searchByCity(destination.trim(), {
        kinds: selectedThemes.map(theme => theme.toLowerCase()),
        limit: 200, // plus de lieux
        radius: 15000,
        minRate: 3
      });

      let planningMessage = '';
      if (otmResult.success && otmResult.data && otmResult.data.places.length > 0) {
        // Aller vers la page planning avec le planning et les infos du voyage
        router.push({
          pathname: '/planning',
          params: {
            planning: JSON.stringify(otmResult.data.places),
            trip: JSON.stringify({
              destination: destination.trim(),
              startDate: startDate ? startDate.toISOString() : '',
              endDate: endDate ? endDate.toISOString() : ''
            })
          }
        });
        return;
      } else {
        planningMessage = `Aucune activité trouvée pour ${destination} avec vos critères.`;
      }

      Alert.alert(
        'Itinéraire généré !',
        planningMessage,
        [
          {
            text: 'Voir mes voyages',
            onPress: () => router.push('/(tabs)/voyage')
          },
          {
            text: 'Retour à l\'accueil',
            onPress: () => router.push('/(tabs)/home')
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la création du voyage:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openDatePicker = (type: 'start' | 'end') => {
    if (type === 'end' && !startDate) {
      Alert.alert('Date de départ requise', 'Veuillez d\'abord sélectionner une date de départ');
      return;
    }
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    const startFromDate = datePickerType === 'end' && startDate ? startDate : today;
    
    // Générer les 60 prochains jours
    for (let i = 0; i < 60; i++) {
      const date = new Date(startFromDate);
      date.setDate(startFromDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const selectDate = (selectedDate: Date) => {
    if (datePickerType === 'start') {
      setStartDate(selectedDate);
      // Si la date de fin est antérieure à la nouvelle date de début, la réinitialiser
      if (endDate && selectedDate > endDate) {
        setEndDate(null);
      }
    } else {
      setEndDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `Du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`;
    } else if (startDate) {
      return `Départ: ${startDate.toLocaleDateString('fr-FR')} - Choisir date de retour`;
    }
    return '';
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header amélioré avec progression */}
      <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/create')}
          >
          <Ionicons name="arrow-back" size={24} color="#2F7417" />
          </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>Planifier un voyage</Text>
          <Text style={styles.subtitle}>Créons votre aventure parfaite</Text>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{completionPercentage}%</Text>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${completionPercentage}%` }
            ]} 
          />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section Destination */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="location" size={24} color="#2F7417" />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Destination</Text>
              <Text style={styles.sectionSubtitle}>Où souhaitez-vous aller ?</Text>
            </View>
            {destination.trim() && (
              <View style={styles.completedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color="#2F7417" />
              </View>
            )}
        </View>

          <View style={styles.cardContent}>
        <InputField
          label="Destination"
          placeholder="Ville ou Pays"
          value={destination}
          onChangeText={setDestination}
          iconName="location"
        />

            <View style={styles.dateSection}>
              <Text style={styles.dateLabel}>Dates de voyage</Text>
              
              <View style={styles.dateButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.dateButton, startDate && styles.dateButtonSelected]}
                  onPress={() => openDatePicker('start')}
                >
                  <Ionicons name="calendar" size={20} color={startDate ? "#2F7417" : "#666"} />
                  <Text style={[styles.dateButtonText, startDate && styles.dateButtonTextSelected]}>
                    {startDate ? startDate.toLocaleDateString('fr-FR') : 'Date de départ'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.dateButton, 
                    endDate && styles.dateButtonSelected,
                    !startDate && styles.dateButtonDisabled
                  ]}
                  onPress={() => openDatePicker('end')}
                  disabled={!startDate}
                >
                  <Ionicons name="calendar" size={20} color={endDate ? "#2F7417" : "#666"} />
                  <Text style={[styles.dateButtonText, endDate && styles.dateButtonTextSelected]}>
                    {endDate ? endDate.toLocaleDateString('fr-FR') : 'Date de retour'}
                  </Text>
                </TouchableOpacity>
              </View>

              {formatDateRange() && (
                <View style={styles.dateRangeDisplay}>
                  <Text style={styles.dateRangeText}>{formatDateRange()}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Section Type de voyage */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="people" size={24} color="#2F7417" />
            </View>
            <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>Type de voyage</Text>
              <Text style={styles.sectionSubtitle}>Avec qui voyagez-vous ?</Text>
            </View>
            <View style={styles.completedIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#2F7417" />
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.selectionGrid}>
            {travelTypes.map((type) => (
              <SelectionButton
                key={type}
                title={type}
                selected={selectedTravelType === type}
                onPress={() => setSelectedTravelType(type)}
                  style={styles.gridButton}
              />
            ))}
            </View>
          </View>
        </View>

        {/* Section Centres d'intérêt */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="heart" size={24} color="#2F7417" />
            </View>
            <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>Centres d&apos;intérêt</Text>
              <Text style={styles.sectionSubtitle}>Qu&apos;est-ce qui vous passionne ?</Text>
            </View>
            {selectedThemes.length > 0 && (
              <View style={styles.completedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color="#2F7417" />
              </View>
            )}
          </View>

          <View style={styles.cardContent}>
          <View style={styles.themesContainer}>
            {interestThemes.map((theme) => (
              <SelectionButton
                key={theme}
                title={theme}
                selected={selectedThemes.includes(theme)}
                onPress={() => handleThemeToggle(theme)}
                variant="theme"
                  style={styles.themeButton}
              />
            ))}
            </View>
            
            {selectedThemes.length > 0 && (
              <View style={styles.selectedThemesInfo}>
                <Text style={styles.selectedThemesText}>
                  {selectedThemes.length} thème{selectedThemes.length > 1 ? 's' : ''} sélectionné{selectedThemes.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Section Niveau d'activité */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="fitness" size={24} color="#2F7417" />
            </View>
            <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>Niveau d&apos;activité</Text>
              <Text style={styles.sectionSubtitle}>Quel rythme préférez-vous ?</Text>
            </View>
            <View style={styles.completedIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#2F7417" />
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.activityLevelContainer}>
              {activityLevels.map((level, index) => (
                <TouchableOpacity
                key={level}
                  style={[
                    styles.activityButton,
                    selectedActivityLevel === level && styles.activityButtonSelected
                  ]}
                onPress={() => setSelectedActivityLevel(level)}
                >
                  <View style={styles.activityIconContainer}>
                    <Ionicons 
                      name={index === 0 ? "bed" : index === 1 ? "walk" : "bicycle"} 
                      size={24} 
                      color={selectedActivityLevel === level ? "#2F7417" : "#666"} 
                    />
                  </View>
                  <Text style={[
                    styles.activityButtonText,
                    selectedActivityLevel === level && styles.activityButtonTextSelected
                  ]}>
                    {level}
                  </Text>
                  <Text style={[
                    styles.activityButtonSubtext,
                    selectedActivityLevel === level && styles.activityButtonSubtextSelected
                  ]}>
                    {index === 0 ? "Tranquille" : index === 1 ? "Équilibré" : "Dynamique"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Résumé et bouton de génération */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="document-text" size={24} color="#2F7417" />
            <Text style={styles.summaryTitle}>Résumé de votre voyage</Text>
          </View>
          
          <View style={styles.summaryContent}>
            {destination.trim() && (
              <View style={styles.summaryItem}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.summaryItemText}>Destination: {destination}</Text>
              </View>
            )}
            
            {startDate && endDate && (
              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.summaryItemText}>
                  Du {startDate.toLocaleDateString('fr-FR')} au {endDate.toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}
            
            <View style={styles.summaryItem}>
              <Ionicons name="people" size={16} color="#666" />
              <Text style={styles.summaryItemText}>Type: {selectedTravelType}</Text>
            </View>
            
            {selectedThemes.length > 0 && (
              <View style={styles.summaryItem}>
                <Ionicons name="heart" size={16} color="#666" />
                <Text style={styles.summaryItemText}>
                  Intérêts: {selectedThemes.join(', ')}
                </Text>
              </View>
            )}
            
            <View style={styles.summaryItem}>
              <Ionicons name="fitness" size={16} color="#666" />
              <Text style={styles.summaryItemText}>Rythme: {selectedActivityLevel}</Text>
            </View>
          </View>
        </View>

        {/* Bouton de génération amélioré */}
        <View style={styles.generateSection}>
          <TouchableOpacity 
            style={[
              styles.generateButton,
              (!destination.trim() || isLoading) && styles.generateButtonDisabled
            ]} 
            onPress={handleGenerateItinerary}
            disabled={!destination.trim() || isLoading}
          >
            <View style={styles.generateButtonContent}>
              <Ionicons 
                name={isLoading ? "hourglass" : "rocket"} 
                size={22} 
                color={(destination.trim() && !isLoading) ? "#FFFFFF" : "#999"} 
              />
              <Text style={[
                styles.generateButtonText,
                (!destination.trim() || isLoading) && styles.generateButtonTextDisabled
              ]}>
                {isLoading ? 'Enregistrement...' : 'Générer l\'itinéraire'}
              </Text>
            </View>
            <View style={[
              styles.generateButtonIcon,
              (!destination.trim() || isLoading) && styles.generateButtonIconDisabled
            ]}>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={(destination.trim() && !isLoading) ? "#FFFFFF" : "#999"} 
              />
            </View>
          </TouchableOpacity>
          {/* Bouton de suppression si modification */}
          {initialTrip && (
            <TouchableOpacity
              style={{
                marginTop: 24,
                backgroundColor: '#FF4757',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                shadowColor: '#FF4757',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 2,
              }}
              onPress={() => {
                Alert.alert(
                  'Supprimer le voyage',
                  'Êtes-vous sûr de vouloir supprimer ce voyage ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Supprimer',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const result = await deleteTripPlan(initialTrip.id);
                          if (result.error) {
                            Alert.alert('Erreur', 'Impossible de supprimer: ' + result.error);
                          } else {
                            Alert.alert('Supprimé', 'Le voyage a été supprimé.', [
                              { text: 'OK', onPress: () => router.push('/(tabs)/voyage') }
                            ]);
                          }
                        } catch (error) {
                          Alert.alert('Erreur', 'Une erreur inattendue est survenue.');
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="trash" size={20} color="#fff" style={{ marginBottom: 4 }} />
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Supprimer ce voyage</Text>
            </TouchableOpacity>
          )}
        </View>
          
          {!destination.trim() && !isLoading && (
            <Text style={styles.generateHint}>
              Veuillez renseigner une destination pour continuer
            </Text>
          )}
          
          {isLoading && (
            <Text style={styles.generateHint}>
              Enregistrement de votre demande en cours...
            </Text>
          )}
      </ScrollView>

      {/* Modal de sélection de date */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {datePickerType === 'start' ? 'Date de départ' : 'Date de retour'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dateList} showsVerticalScrollIndicator={false}>
              {generateDateOptions().map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dateOption}
                  onPress={() => selectDate(date)}
                >
                  <View style={styles.dateOptionContent}>
                    <Text style={styles.dateOptionDay}>
                      {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </Text>
                    <Text style={styles.dateOptionDate}>
                      {date.toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#2F7417" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  progressContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2F7417',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2F7417',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  completedIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 20,
    paddingTop: 16,
  },
  dateSection: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  dateButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  dateButtonSelected: {
    borderColor: '#2F7417',
    backgroundColor: '#F0F9F0',
  },
  dateButtonDisabled: {
    opacity: 0.5,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dateButtonTextSelected: {
    color: '#2F7417',
    fontWeight: '600',
  },
  dateRangeDisplay: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F9F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#2F7417',
    fontWeight: '600',
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridButton: {
    flex: 1,
    minWidth: '45%',
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  themeButton: {
    marginBottom: 8,
  },
  selectedThemesInfo: {
    backgroundColor: '#F0F9F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedThemesText: {
    fontSize: 14,
    color: '#2F7417',
    fontWeight: '500',
  },
  activityLevelContainer: {
    gap: 12,
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    backgroundColor: '#FAFAFA',
  },
  activityButtonSelected: {
    borderColor: '#2F7417',
    backgroundColor: '#F0F9F0',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  activityButtonTextSelected: {
    color: '#2F7417',
  },
  activityButtonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  activityButtonSubtextSelected: {
    color: '#2F7417',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#2F7417',
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  summaryContent: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryItemText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  generateSection: {
    marginTop: 10,
  },
  generateButton: {
    backgroundColor: '#2F7417',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateButtonDisabled: {
    backgroundColor: '#E9ECEF',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
  generateButtonTextDisabled: {
    color: '#999',
  },
  generateButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonIconDisabled: {
    backgroundColor: 'rgba(153, 153, 153, 0.2)',
  },
  generateHint: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  // Styles pour le modal de sélection de date
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  dateOptionContent: {
    flex: 1,
  },
  dateOptionDay: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
    textTransform: 'capitalize',
  },
  dateOptionDate: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
    marginTop: 2,
  },
}); 
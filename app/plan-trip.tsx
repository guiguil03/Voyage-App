import InputField from '@/features/trips/components/InputField';
import SelectionButton from '@/features/trips/components/SelectionButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useItineraryStream } from '@/features/trips/hooks/useItineraryStream';
import { TripPreferences } from '@/features/trips/types/itinerary';
import { createTripPlan, deleteTripPlan, saveGeneratedItinerary } from '@/features/trips/services/trip-planning';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
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

const C = {
  bg:         '#0D0D0D',
  card:       'rgba(18,18,18,0.95)',
  border:     'rgba(122,184,245,0.12)',
  borderMid:  'rgba(122,184,245,0.22)',
  cream:      '#7AB8F5',
  creamDim:   'rgba(122,184,245,0.50)',
  creamFaint: 'rgba(122,184,245,0.14)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.45)',
  danger:     '#EF4444',
};

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
  const { days, isLoading, isComplete, error, generate, reset } = useItineraryStream();
  const tripPlanIdRef = useRef<string | null>(null);

  const { user } = useAuth();

  const travelTypes = ['Solo', 'Couple', 'Family', 'Group'];
  const interestThemes = ['Culture', 'Gastronomy', 'Sport', 'Nature', 'Relaxation'];
  const activityLevels = ['Relax', 'Balanced', 'Intense'];

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

    const { data: tripPlan, error: saveError } = await createTripPlan({
      destination: destination.trim(),
      startDate,
      endDate,
      travelType: selectedTravelType as 'Solo' | 'Couple' | 'Family' | 'Group',
      interests: selectedThemes,
      activityLevel: selectedActivityLevel as 'Relax' | 'Balanced' | 'Intense',
    });

    if (saveError || !tripPlan) {
      Alert.alert('Erreur', "Impossible d'enregistrer le voyage.");
      return;
    }

    tripPlanIdRef.current = tripPlan.id;

    const preferences: TripPreferences = {
      destination: destination.trim(),
      startDate: startDate ? startDate.toISOString().split('T')[0] : null,
      endDate: endDate ? endDate.toISOString().split('T')[0] : null,
      travelType: selectedTravelType as 'Solo' | 'Couple' | 'Family' | 'Group',
      interests: selectedThemes,
      activityLevel: selectedActivityLevel as 'Relax' | 'Balanced' | 'Intense',
    };

    generate(preferences);
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
      if (endDate && selectedDate > endDate) setEndDate(null);
    } else {
      setEndDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `Du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`;
    } else if (startDate) {
      return `Départ: ${startDate.toLocaleDateString('fr-FR')} — choisir date de retour`;
    }
    return '';
  };

  const completionPercentage = getCompletionPercentage();

  useEffect(() => {
    if (isComplete && days.length > 0) {
      (async () => {
        if (tripPlanIdRef.current) {
          await saveGeneratedItinerary(tripPlanIdRef.current, {
            days: days as any, // Two ItineraryDay types in codebase — trip-planning.ts vs itinerary.ts
            generatedAt: new Date().toISOString(),
          });
        }
        router.push({
          pathname: '/planning',
          params: {
            itinerary: JSON.stringify(days),
            trip: JSON.stringify({
              destination: destination.trim(),
              startDate: startDate ? startDate.toISOString() : '',
              endDate: endDate ? endDate.toISOString() : '',
            }),
          },
        });
      })();
    }
  }, [isComplete]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur de génération', error, [{ text: 'OK', onPress: reset }]);
    }
  }, [error, reset]);

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/create')}>
          <Ionicons name="arrow-back" size={22} color={C.cream} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.title}>Planifier un voyage</Text>
          <Text style={styles.subtitle}>Créons votre aventure parfaite</Text>
        </View>

        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{completionPercentage}%</Text>
        </View>
      </View>

      {/* PROGRESS BAR */}
      <View style={styles.progressBarWrap}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBar, { width: `${completionPercentage}%` as any }]} />
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* DESTINATION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <Ionicons name="location" size={22} color={C.cream} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Destination</Text>
              <Text style={styles.sectionSub}>Où souhaitez-vous aller ?</Text>
            </View>
            {destination.trim() && (
              <Ionicons name="checkmark-circle" size={20} color={C.cream} />
            )}
          </View>

          <View style={styles.cardBody}>
            <InputField
              label="Destination"
              placeholder="Ville ou Pays"
              value={destination}
              onChangeText={setDestination}
              iconName="location"
            />

            <Text style={styles.dateLabel}>Dates de voyage</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateBtn, startDate && styles.dateBtnSelected]}
                onPress={() => openDatePicker('start')}
              >
                <Ionicons name="calendar" size={18} color={startDate ? C.cream : C.whiteDim} />
                <Text style={[styles.dateBtnText, startDate && styles.dateBtnTextSelected]}>
                  {startDate ? startDate.toLocaleDateString('fr-FR') : 'Date de départ'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateBtn, endDate && styles.dateBtnSelected, !startDate && styles.dateBtnDisabled]}
                onPress={() => openDatePicker('end')}
                disabled={!startDate}
              >
                <Ionicons name="calendar" size={18} color={endDate ? C.cream : C.whiteDim} />
                <Text style={[styles.dateBtnText, endDate && styles.dateBtnTextSelected]}>
                  {endDate ? endDate.toLocaleDateString('fr-FR') : 'Date de retour'}
                </Text>
              </TouchableOpacity>
            </View>

            {!!formatDateRange() && (
              <View style={styles.dateRange}>
                <Text style={styles.dateRangeText}>{formatDateRange()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* TYPE DE VOYAGE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <Ionicons name="people" size={22} color={C.cream} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Type de voyage</Text>
              <Text style={styles.sectionSub}>Avec qui voyagez-vous ?</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={C.cream} />
          </View>

          <View style={styles.cardBody}>
            <View style={styles.grid}>
              {travelTypes.map((type) => (
                <SelectionButton
                  key={type}
                  title={type}
                  selected={selectedTravelType === type}
                  onPress={() => setSelectedTravelType(type)}
                  style={styles.gridBtn}
                />
              ))}
            </View>
          </View>
        </View>

        {/* CENTRES D'INTÉRÊT */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <Ionicons name="heart" size={22} color={C.cream} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Centres d&apos;intérêt</Text>
              <Text style={styles.sectionSub}>Qu&apos;est-ce qui vous passionne ?</Text>
            </View>
            {selectedThemes.length > 0 && (
              <Ionicons name="checkmark-circle" size={20} color={C.cream} />
            )}
          </View>

          <View style={styles.cardBody}>
            <View style={styles.themesRow}>
              {interestThemes.map((theme) => (
                <SelectionButton
                  key={theme}
                  title={theme}
                  selected={selectedThemes.includes(theme)}
                  onPress={() => handleThemeToggle(theme)}
                  variant="theme"
                />
              ))}
            </View>
            {selectedThemes.length > 0 && (
              <View style={styles.themesInfo}>
                <Text style={styles.themesInfoText}>
                  {selectedThemes.length} thème{selectedThemes.length > 1 ? 's' : ''} sélectionné{selectedThemes.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* NIVEAU D'ACTIVITÉ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <Ionicons name="fitness" size={22} color={C.cream} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Niveau d&apos;activité</Text>
              <Text style={styles.sectionSub}>Quel rythme préférez-vous ?</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={C.cream} />
          </View>

          <View style={styles.cardBody}>
            <View style={styles.activityCol}>
              {activityLevels.map((level, index) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.activityBtn, selectedActivityLevel === level && styles.activityBtnSelected]}
                  onPress={() => setSelectedActivityLevel(level)}
                >
                  <View style={styles.activityIconWrap}>
                    <Ionicons
                      name={index === 0 ? 'bed' : index === 1 ? 'walk' : 'bicycle'}
                      size={22}
                      color={selectedActivityLevel === level ? C.cream : C.whiteDim}
                    />
                  </View>
                  <Text style={[styles.activityBtnText, selectedActivityLevel === level && styles.activityBtnTextSelected]}>
                    {level}
                  </Text>
                  <Text style={[styles.activityBtnSub, selectedActivityLevel === level && styles.activityBtnSubSelected]}>
                    {index === 0 ? 'Tranquille' : index === 1 ? 'Équilibré' : 'Dynamique'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* RÉSUMÉ */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHead}>
            <Ionicons name="document-text" size={22} color={C.cream} />
            <Text style={styles.summaryTitle}>Résumé de votre voyage</Text>
          </View>
          <View style={styles.summaryBody}>
            {destination.trim() && (
              <View style={styles.summaryRow}>
                <Ionicons name="location" size={15} color={C.creamDim} />
                <Text style={styles.summaryText}>Destination : {destination}</Text>
              </View>
            )}
            {startDate && endDate && (
              <View style={styles.summaryRow}>
                <Ionicons name="calendar" size={15} color={C.creamDim} />
                <Text style={styles.summaryText}>
                  Du {startDate.toLocaleDateString('fr-FR')} au {endDate.toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Ionicons name="people" size={15} color={C.creamDim} />
              <Text style={styles.summaryText}>Type : {selectedTravelType}</Text>
            </View>
            {selectedThemes.length > 0 && (
              <View style={styles.summaryRow}>
                <Ionicons name="heart" size={15} color={C.creamDim} />
                <Text style={styles.summaryText}>Intérêts : {selectedThemes.join(', ')}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Ionicons name="fitness" size={15} color={C.creamDim} />
              <Text style={styles.summaryText}>Rythme : {selectedActivityLevel}</Text>
            </View>
          </View>
        </View>

        {/* GÉNÉRER */}
        <View style={styles.generateSection}>
          <TouchableOpacity
            style={[styles.generateBtn, (!destination.trim() || isLoading) && styles.generateBtnDisabled]}
            onPress={handleGenerateItinerary}
            disabled={!destination.trim() || isLoading}
          >
            <View style={styles.generateBtnContent}>
              <Ionicons
                name={isLoading ? 'hourglass' : 'rocket'}
                size={22}
                color={(destination.trim() && !isLoading) ? C.bg : 'rgba(122,184,245,0.40)'}
              />
              <Text style={[styles.generateBtnText, (!destination.trim() || isLoading) && styles.generateBtnTextDisabled]}>
                {isLoading ? 'Génération en cours…' : "Générer l'itinéraire"}
              </Text>
            </View>
            <View style={[styles.generateBtnArrow, (!destination.trim() || isLoading) && styles.generateBtnArrowDisabled]}>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={(destination.trim() && !isLoading) ? C.bg : 'rgba(122,184,245,0.40)'}
              />
            </View>
          </TouchableOpacity>

          {initialTrip && (
            <TouchableOpacity
              style={styles.deleteBtn}
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
                            Alert.alert('Erreur', 'Impossible de supprimer : ' + result.error);
                          } else {
                            Alert.alert('Supprimé', 'Le voyage a été supprimé.', [
                              { text: 'OK', onPress: () => router.push('/(tabs)/voyage') },
                            ]);
                          }
                        } catch {
                          Alert.alert('Erreur', 'Une erreur inattendue est survenue.');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Supprimer ce voyage</Text>
            </TouchableOpacity>
          )}
        </View>

        {!destination.trim() && !isLoading && (
          <Text style={styles.hint}>Veuillez renseigner une destination pour continuer</Text>
        )}
        {isLoading && (
          <Text style={styles.hint}>Claude génère votre itinéraire…</Text>
        )}

      </ScrollView>

      {/* MODAL DATE PICKER */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {datePickerType === 'start' ? 'Date de départ' : 'Date de retour'}
              </Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={20} color={C.creamDim} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.dateList} showsVerticalScrollIndicator={false}>
              {generateDateOptions().map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dateOption}
                  onPress={() => selectDate(date)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dateDay}>
                      {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </Text>
                    <Text style={styles.dateVal}>
                      {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.cream} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {isLoading && (
        <View style={styles.streamOverlay}>
          <View style={styles.streamCard}>
            <Text style={styles.streamTitle}>Claude prépare ton voyage…</Text>
            <View style={styles.streamDays}>
              {days.map((d) => (
                <View key={d.day} style={styles.streamDayRow}>
                  <Text style={styles.streamCheck}>✅</Text>
                  <Text style={styles.streamDayText}>
                    Jour {d.day} — {d.theme}
                  </Text>
                </View>
              ))}
              <View style={styles.streamDayRow}>
                <ActivityIndicator size="small" color={C.cream} />
                <Text style={styles.streamDayText}>
                  Jour {days.length + 1} en cours…
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },

  /* HEADER */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
  },
  headerContent: { flex: 1, alignItems: 'center' },
  title:    { fontSize: 20, fontWeight: '200', letterSpacing: 1.2, color: C.white },
  subtitle: { fontSize: 12, color: C.creamDim, fontWeight: '300', marginTop: 2 },
  progressBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.borderMid,
  },
  progressText: { fontSize: 11, fontWeight: '600', color: C.cream },

  /* PROGRESS BAR */
  progressBarWrap: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: C.bg },
  progressBarBg:   { height: 3, backgroundColor: 'rgba(122,184,245,0.10)', borderRadius: 2, overflow: 'hidden' },
  progressBar:     { height: '100%', backgroundColor: C.cream, borderRadius: 2 },

  /* SCROLL */
  scroll:       { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },

  /* SECTION CARD */
  sectionCard: {
    backgroundColor: C.card,
    borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center',
    padding: 18, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sectionIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '500', color: C.white, marginBottom: 2 },
  sectionSub:   { fontSize: 12, color: C.creamDim, fontWeight: '300' },
  cardBody:     { padding: 18, paddingTop: 14 },

  /* DATES */
  dateLabel: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.50)', marginBottom: 10, letterSpacing: 0.3 },
  dateRow:   { flexDirection: 'row', gap: 10 },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    backgroundColor: 'rgba(122,184,245,0.04)',
  },
  dateBtnSelected:  { borderColor: C.borderMid, backgroundColor: 'rgba(122,184,245,0.10)' },
  dateBtnDisabled:  { opacity: 0.4 },
  dateBtnText:      { fontSize: 13, color: C.whiteDim, fontWeight: '400', flex: 1 },
  dateBtnTextSelected: { color: C.cream, fontWeight: '500' },
  dateRange: {
    marginTop: 10, padding: 10,
    backgroundColor: 'rgba(122,184,245,0.08)',
    borderRadius: 8, alignItems: 'center',
  },
  dateRangeText: { fontSize: 13, color: C.cream, fontWeight: '500' },

  /* GRID (travel type) */
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridBtn: { flex: 1, minWidth: '45%' },

  /* THEMES */
  themesRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  themesInfo:     { backgroundColor: 'rgba(122,184,245,0.08)', borderRadius: 8, padding: 10, alignItems: 'center' },
  themesInfoText: { fontSize: 13, color: C.cream, fontWeight: '500' },

  /* ACTIVITY */
  activityCol: { gap: 10 },
  activityBtn: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    backgroundColor: 'rgba(122,184,245,0.04)',
  },
  activityBtnSelected: { borderColor: C.borderMid, backgroundColor: 'rgba(122,184,245,0.10)' },
  activityIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(122,184,245,0.08)',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  activityBtnText:         { fontSize: 15, fontWeight: '500', color: C.whiteDim, flex: 1 },
  activityBtnTextSelected: { color: C.cream },
  activityBtnSub:          { fontSize: 12, color: 'rgba(255,255,255,0.30)' },
  activityBtnSubSelected:  { color: C.creamDim },

  /* SUMMARY */
  summaryCard: {
    backgroundColor: C.card, borderRadius: 16, marginBottom: 16, padding: 18,
    borderWidth: 1.5, borderColor: C.borderMid,
    shadowColor: C.cream, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  summaryHead:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  summaryTitle: { fontSize: 16, fontWeight: '500', color: C.white, marginLeft: 10 },
  summaryBody:  { gap: 10 },
  summaryRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText:  { fontSize: 14, color: C.whiteDim, flex: 1, fontWeight: '300' },

  /* GENERATE */
  generateSection: { marginTop: 4 },
  generateBtn: {
    backgroundColor: C.cream, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16,
    shadowColor: C.cream, shadowOpacity: 0.30, shadowRadius: 10, elevation: 6,
  },
  generateBtnDisabled: { backgroundColor: 'rgba(122,184,245,0.15)', shadowOpacity: 0, elevation: 0 },
  generateBtnContent:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  generateBtnText:     { color: C.bg, fontSize: 16, fontWeight: '600', marginLeft: 12 },
  generateBtnTextDisabled: { color: 'rgba(122,184,245,0.50)' },
  generateBtnArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(13,13,13,0.18)', justifyContent: 'center', alignItems: 'center',
  },
  generateBtnArrowDisabled: { backgroundColor: 'rgba(122,184,245,0.10)' },

  deleteBtn: {
    marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.30)',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  deleteBtnText: { color: C.danger, fontSize: 15, fontWeight: '500' },

  hint: { textAlign: 'center', marginTop: 12, fontSize: 13, color: C.creamDim, fontStyle: 'italic' },

  /* MODAL */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.80)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: 'rgba(18,18,18,0.98)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: '75%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1, borderColor: C.borderMid,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(122,184,245,0.30)',
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '400', color: C.white, letterSpacing: 0.5 },
  modalClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
  },
  dateList:   { flex: 1, paddingHorizontal: 20 },
  dateOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  dateDay: { fontSize: 12, color: C.creamDim, fontWeight: '300', textTransform: 'capitalize' },
  dateVal: { fontSize: 15, color: C.white, fontWeight: '400', marginTop: 2 },

  /* STREAM OVERLAY */
  streamOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(13,13,13,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  streamCard: {
    backgroundColor: 'rgba(18,18,18,0.98)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(122,184,245,0.22)',
    padding: 28,
    width: '85%',
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#7AB8F5',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  streamDays: { gap: 12 },
  streamDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streamCheck: { fontSize: 16 },
  streamDayText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '300',
    flex: 1,
  },
});

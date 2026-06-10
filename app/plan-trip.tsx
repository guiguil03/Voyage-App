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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const C = {
  bg:          '#0D0D0D',
  border:      'rgba(122,184,245,0.15)',
  borderFocus: 'rgba(122,184,245,0.50)',
  borderMid:   'rgba(122,184,245,0.22)',
  cream:       '#7AB8F5',
  creamDim:    'rgba(122,184,245,0.50)',
  creamFaint:  'rgba(122,184,245,0.14)',
  white:       '#FFFFFF',
  whiteDim:    'rgba(255,255,255,0.45)',
  inputBg:     'rgba(255,255,255,0.04)',
  danger:      '#EF4444',
};

const TRAVEL_TYPES   = ['Solo', 'Couple', 'Family', 'Group'];
const THEMES         = ['Culture', 'Gastronomy', 'Sport', 'Nature', 'Relaxation'];
const ACTIVITY_LEVELS: { key: string; label: string; sub: string }[] = [
  { key: 'Relax',    label: 'Relax',     sub: 'Tranquille' },
  { key: 'Balanced', label: 'Balanced',  sub: 'Équilibré'  },
  { key: 'Intense',  label: 'Intense',   sub: 'Dynamique'  },
];

function Divider({ title }: { title: string }) {
  return (
    <View style={styles.divider}>
      <Text style={styles.dividerText}>{title}</Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function PlanTripScreen() {
  const params     = useLocalSearchParams();
  const initialTrip = params.tripData ? JSON.parse(params.tripData as string) : null;

  const [destination, setDestination]               = useState(initialTrip?.destination || '');
  const [selectedTravelType, setSelectedTravelType] = useState(initialTrip?.travel_type || 'Solo');
  const [selectedThemes, setSelectedThemes]         = useState<string[]>(
    initialTrip?.interests?.length > 0 ? initialTrip.interests : ['Culture']
  );
  const [selectedActivityLevel, setSelectedActivityLevel] = useState(initialTrip?.activity_level || 'Balanced');
  const [startDate, setStartDate] = useState<Date | null>(initialTrip?.start_date ? new Date(initialTrip.start_date) : null);
  const [endDate,   setEndDate]   = useState<Date | null>(initialTrip?.end_date   ? new Date(initialTrip.end_date)   : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [destFocused, setDestFocused]       = useState(false);

  const { days, isLoading, isComplete, error, generate, reset } = useItineraryStream();
  const tripPlanIdRef = useRef<string | null>(null);
  const { user } = useAuth();

  const completionPct = () => {
    let n = 0;
    if (destination.trim())   n++;
    if (startDate && endDate) n++;
    if (selectedThemes.length > 0) n++;
    if (selectedTravelType)   n++;
    if (selectedActivityLevel) n++;
    return Math.round((n / 5) * 100);
  };

  const toggleTheme = (theme: string) =>
    setSelectedThemes(prev =>
      prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
    );

  const openDatePicker = (type: 'start' | 'end') => {
    if (type === 'end' && !startDate) {
      Alert.alert('Date de départ requise', 'Sélectionnez d\'abord une date de départ');
      return;
    }
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  const generateDateOptions = () => {
    const today = new Date();
    const from  = datePickerType === 'end' && startDate ? startDate : today;
    return Array.from({ length: 60 }, (_, i) => {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      return d;
    });
  };

  const selectDate = (date: Date) => {
    if (datePickerType === 'start') {
      setStartDate(date);
      if (endDate && date > endDate) setEndDate(null);
    } else {
      setEndDate(date);
    }
    setShowDatePicker(false);
  };

  const handleGenerate = async () => {
    if (!destination.trim()) {
      Alert.alert('Destination requise', 'Veuillez saisir une destination');
      return;
    }
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter');
      return;
    }
    const { data: tripPlan, error: saveError } = await createTripPlan({
      destination: destination.trim(),
      startDate,
      endDate,
      travelType: selectedTravelType as any,
      interests: selectedThemes,
      activityLevel: selectedActivityLevel as any,
    });
    if (saveError || !tripPlan) {
      Alert.alert('Erreur', "Impossible d'enregistrer le voyage.");
      return;
    }
    tripPlanIdRef.current = tripPlan.id;
    const prefs: TripPreferences = {
      destination: destination.trim(),
      startDate: startDate ? startDate.toISOString().split('T')[0] : null,
      endDate:   endDate   ? endDate.toISOString().split('T')[0]   : null,
      travelType:    selectedTravelType as any,
      interests:     selectedThemes,
      activityLevel: selectedActivityLevel as any,
    };
    generate(prefs);
  };

  useEffect(() => {
    if (isComplete && days.length > 0) {
      (async () => {
        if (tripPlanIdRef.current) {
          await saveGeneratedItinerary(tripPlanIdRef.current, {
            days: days as any,
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
              endDate:   endDate   ? endDate.toISOString()   : '',
            }),
          },
        });
      })();
    }
  }, [isComplete]);

  useEffect(() => {
    if (error) Alert.alert('Erreur de génération', error, [{ text: 'OK', onPress: reset }]);
  }, [error, reset]);

  const pct = completionPct();

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)/create')}>
          <Ionicons name="arrow-back" size={20} color={C.cream} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planifier un voyage</Text>
        <View style={styles.pctBadge}>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
      </View>

      {/* PROGRESS BAR */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── DESTINATION ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Destination <Text style={{ color: C.cream }}>*</Text></Text>
          <TextInput
            style={[styles.input, destFocused && styles.inputFocused]}
            value={destination}
            onChangeText={setDestination}
            placeholder="Ville ou pays…"
            placeholderTextColor={C.whiteDim}
            onFocus={() => setDestFocused(true)}
            onBlur={() => setDestFocused(false)}
          />
        </View>

        {/* ── DATES ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Dates de voyage</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[styles.dateBtn, startDate && styles.dateBtnSelected]}
              onPress={() => openDatePicker('start')}
            >
              <Ionicons name="calendar-outline" size={17} color={startDate ? C.cream : C.whiteDim} />
              <Text style={[styles.dateBtnText, startDate && styles.dateBtnTextSelected]}>
                {startDate ? startDate.toLocaleDateString('fr-FR') : 'Date de départ'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateBtn, endDate && styles.dateBtnSelected, !startDate && styles.dateBtnDisabled]}
              onPress={() => openDatePicker('end')}
              disabled={!startDate}
            >
              <Ionicons name="calendar-outline" size={17} color={endDate ? C.cream : C.whiteDim} />
              <Text style={[styles.dateBtnText, endDate && styles.dateBtnTextSelected]}>
                {endDate ? endDate.toLocaleDateString('fr-FR') : 'Date de retour'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Divider title="Préférences" />

        {/* ── TYPE ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Type de voyage</Text>
          <View style={styles.chips}>
            {TRAVEL_TYPES.map(t => (
              <Chip key={t} label={t} active={selectedTravelType === t} onPress={() => setSelectedTravelType(t)} />
            ))}
          </View>
        </View>

        {/* ── CENTRES D'INTÉRÊT ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Centres d'intérêt
            {selectedThemes.length > 0 && (
              <Text style={{ color: C.cream }}> · {selectedThemes.length}</Text>
            )}
          </Text>
          <View style={styles.chips}>
            {THEMES.map(t => (
              <Chip key={t} label={t} active={selectedThemes.includes(t)} onPress={() => toggleTheme(t)} />
            ))}
          </View>
        </View>

        {/* ── NIVEAU D'ACTIVITÉ ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Rythme du voyage</Text>
          <View style={styles.activityRow}>
            {ACTIVITY_LEVELS.map(({ key, label, sub }) => (
              <TouchableOpacity
                key={key}
                style={[styles.actBtn, selectedActivityLevel === key && styles.actBtnActive]}
                onPress={() => setSelectedActivityLevel(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.actBtnLabel, selectedActivityLevel === key && styles.actBtnLabelActive]}>
                  {label}
                </Text>
                <Text style={[styles.actBtnSub, selectedActivityLevel === key && styles.actBtnSubActive]}>
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Divider title="Récapitulatif" />

        {/* ── RÉSUMÉ ── */}
        <View style={styles.summary}>
          {destination.trim() ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Destination</Text>
              <Text style={styles.summaryVal}>{destination}</Text>
            </View>
          ) : (
            <Text style={styles.summaryEmpty}>Aucune destination saisie</Text>
          )}
          {startDate && endDate && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Dates</Text>
              <Text style={styles.summaryVal}>
                {startDate.toLocaleDateString('fr-FR')} → {endDate.toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Voyage</Text>
            <Text style={styles.summaryVal}>{selectedTravelType}</Text>
          </View>
          {selectedThemes.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Intérêts</Text>
              <Text style={styles.summaryVal}>{selectedThemes.join(', ')}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Rythme</Text>
            <Text style={styles.summaryVal}>{selectedActivityLevel}</Text>
          </View>
        </View>

        {/* ── GÉNÉRER ── */}
        <TouchableOpacity
          style={[styles.generateBtn, (!destination.trim() || isLoading) && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={!destination.trim() || isLoading}
          activeOpacity={0.85}
        >
          <Text style={[styles.generateBtnText, (!destination.trim() || isLoading) && styles.generateBtnTextDisabled]}>
            {isLoading ? 'Génération en cours…' : "Générer l'itinéraire"}
          </Text>
          {!isLoading && destination.trim() && (
            <Ionicons name="arrow-forward" size={18} color={C.bg} style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>

        {initialTrip && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() =>
              Alert.alert('Supprimer le voyage', 'Êtes-vous sûr ?', [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer', style: 'destructive',
                  onPress: async () => {
                    const { error: delErr } = await deleteTripPlan(initialTrip.id);
                    if (delErr) {
                      Alert.alert('Erreur', delErr);
                    } else {
                      Alert.alert('Supprimé', 'Le voyage a été supprimé.', [
                        { text: 'OK', onPress: () => router.push('/(tabs)/voyage') },
                      ]);
                    }
                  },
                },
              ])
            }
          >
            <Ionicons name="trash-outline" size={17} color={C.danger} />
            <Text style={styles.deleteBtnText}>Supprimer ce voyage</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* ── MODAL DATE ── */}
      <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
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
              {generateDateOptions().map((date, i) => (
                <TouchableOpacity key={i} style={styles.dateOption} onPress={() => selectDate(date)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dateWeekday}>
                      {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </Text>
                    <Text style={styles.dateValue}>
                      {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.cream} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── STREAM OVERLAY ── */}
      {isLoading && (
        <View style={styles.streamOverlay}>
          <View style={styles.streamCard}>
            <Text style={styles.streamTitle}>Claude prépare ton voyage…</Text>
            <View style={styles.streamDays}>
              {days.map(d => (
                <View key={d.day} style={styles.streamRow}>
                  <Text style={styles.streamCheck}>✅</Text>
                  <Text style={styles.streamDayText}>Jour {d.day} — {d.theme}</Text>
                </View>
              ))}
              <View style={styles.streamRow}>
                <ActivityIndicator size="small" color={C.cream} />
                <Text style={styles.streamDayText}>Jour {days.length + 1} en cours…</Text>
              </View>
            </View>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '300', color: C.white },
  pctBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
  },
  pctText: { fontSize: 11, fontWeight: '600', color: C.cream },

  progressWrap: { paddingHorizontal: 20, paddingVertical: 10 },
  progressBg:   { height: 2, backgroundColor: 'rgba(122,184,245,0.10)', borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.cream, borderRadius: 1 },

  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 },

  fieldGroup: { marginBottom: 24 },
  label: { fontSize: 13, color: C.creamDim, fontWeight: '400', marginBottom: 8 },

  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: C.white, fontWeight: '300',
  },
  inputFocused: { borderColor: C.borderFocus },

  dateRow: { flexDirection: 'row', gap: 10 },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
  },
  dateBtnSelected:     { borderColor: C.borderMid, backgroundColor: 'rgba(122,184,245,0.10)' },
  dateBtnDisabled:     { opacity: 0.4 },
  dateBtnText:         { fontSize: 13, color: C.whiteDim, fontWeight: '300', flex: 1 },
  dateBtnTextSelected: { color: C.cream, fontWeight: '400' },

  divider: { marginBottom: 24, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  dividerText: { fontSize: 12, color: C.creamDim, letterSpacing: 1.5, fontWeight: '300' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.inputBg,
  },
  chipActive:     { backgroundColor: 'rgba(122,184,245,0.15)', borderColor: C.cream },
  chipText:       { fontSize: 14, color: C.whiteDim, fontWeight: '300' },
  chipTextActive: { color: C.cream, fontWeight: '500' },

  activityRow: { flexDirection: 'row', gap: 8 },
  actBtn: {
    flex: 1, alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.inputBg,
  },
  actBtnActive:      { borderColor: C.cream, backgroundColor: 'rgba(122,184,245,0.15)' },
  actBtnLabel:       { fontSize: 14, color: C.whiteDim, fontWeight: '400', marginBottom: 3 },
  actBtnLabelActive: { color: C.cream, fontWeight: '500' },
  actBtnSub:         { fontSize: 11, color: 'rgba(255,255,255,0.25)' },
  actBtnSubActive:   { color: C.creamDim },

  summary: {
    backgroundColor: C.inputBg,
    borderWidth: 1, borderColor: C.border, borderRadius: 14,
    padding: 16, marginBottom: 24, gap: 10,
  },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  summaryKey:   { fontSize: 12, color: C.creamDim, fontWeight: '300' },
  summaryVal:   { fontSize: 14, color: C.white, fontWeight: '300', flex: 1, textAlign: 'right' },
  summaryEmpty: { fontSize: 13, color: 'rgba(255,255,255,0.20)', fontStyle: 'italic', textAlign: 'center', paddingVertical: 4 },

  generateBtn: {
    backgroundColor: C.cream, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14,
  },
  generateBtnDisabled: { backgroundColor: 'rgba(122,184,245,0.15)' },
  generateBtnText:     { fontSize: 16, fontWeight: '600', color: C.bg },
  generateBtnTextDisabled: { color: 'rgba(122,184,245,0.50)' },

  deleteBtn: {
    marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.30)',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  deleteBtnText: { color: C.danger, fontSize: 15, fontWeight: '400' },

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
  modalTitle: { fontSize: 17, fontWeight: '300', color: C.white },
  modalClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
  },
  dateList:    { flex: 1, paddingHorizontal: 20 },
  dateOption:  {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  dateWeekday: { fontSize: 12, color: C.creamDim, fontWeight: '300', textTransform: 'capitalize' },
  dateValue:   { fontSize: 15, color: C.white, fontWeight: '300', marginTop: 2 },

  /* STREAM */
  streamOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(13,13,13,0.92)',
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  streamCard: {
    backgroundColor: 'rgba(18,18,18,0.98)',
    borderRadius: 20, borderWidth: 1, borderColor: C.borderMid,
    padding: 28, width: '85%',
  },
  streamTitle: {
    fontSize: 16, fontWeight: '300', color: C.cream,
    marginBottom: 20, textAlign: 'center', letterSpacing: 0.5,
  },
  streamDays:    { gap: 12 },
  streamRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streamCheck:   { fontSize: 16 },
  streamDayText: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '300', flex: 1 },
});

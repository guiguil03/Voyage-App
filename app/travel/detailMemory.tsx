import { ItineraryActivity, ItineraryDay } from '@/features/trips/types/itinerary';
import { deleteTripPlan } from '@/features/trips/services/trip-planning';
import { deleteVoyage } from '@/features/trips/services/voyages';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
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
  whiteDim:   'rgba(255,255,255,0.55)',
  danger:     '#EF4444',
};

const CATEGORY_MAP: Record<string, { icon: string; color: string }> = {
  'Culture':     { icon: 'library',       color: '#A78BFA' },
  'Gastronomie': { icon: 'restaurant',    color: '#F59E0B' },
  'Gastronomy':  { icon: 'restaurant',    color: '#F59E0B' },
  'Nature':      { icon: 'leaf',          color: '#34D399' },
  'Sport':       { icon: 'bicycle',       color: '#F87171' },
  'Relaxation':  { icon: 'flower',        color: '#C084FC' },
  'Shopping':    { icon: 'bag',           color: '#60A5FA' },
  'Nightlife':   { icon: 'moon',          color: '#818CF8' },
  'Histoire':    { icon: 'time',          color: '#A78BFA' },
  'History':     { icon: 'time',          color: '#A78BFA' },
  'Art':         { icon: 'color-palette', color: '#E879F9' },
};

function getCat(cat: string) {
  return CATEGORY_MAP[cat] ?? { icon: 'compass', color: C.cream };
}

function fmtShort(iso: string) {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); }
  catch { return iso; }
}

function fmtLong(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch { return iso; }
}

function ActivityRow({ activity }: { activity: ItineraryActivity }) {
  const cat = getCat(activity.category);
  return (
    <View style={[styles.actCard, { borderLeftColor: cat.color }]}>
      <Text style={styles.actTime}>
        {activity.time}  ·  <Text style={[styles.actCat, { color: cat.color }]}>{activity.category}</Text>
      </Text>
      <Text style={styles.actName}>{activity.name}</Text>
      <Text style={styles.actDesc}>{activity.description}</Text>
      {!!activity.tips && (
        <Text style={styles.actTips}>💡 {activity.tips}</Text>
      )}
    </View>
  );
}

export default function DetailMemoryScreen() {
  const params = useLocalSearchParams();
  const tripData = (() => {
    try { return params.tripData ? JSON.parse(params.tripData as string) : null; }
    catch { return null; }
  })();
  const [selectedDay, setSelectedDay] = useState(0);

  if (!tripData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={C.creamDim} />
          <Text style={styles.errText}>Aucune donnée trouvée</Text>
          <TouchableOpacity style={styles.errBtn} onPress={() => router.back()}>
            <Text style={styles.errBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isMemory = tripData.type === 'voyage';
  const days: ItineraryDay[] = tripData.generated_itinerary?.days ?? [];
  const hasItinerary = days.length > 0;

  const handleDelete = () => {
    Alert.alert(
      isMemory ? 'Supprimer le souvenir' : 'Supprimer le voyage',
      `Supprimer "${tripData.trip_name || tripData.destination}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              const result = isMemory
                ? await deleteVoyage(tripData.id)
                : await deleteTripPlan(tripData.id);
              if (result.error) Alert.alert('Erreur', result.error);
              else Alert.alert('Supprimé', '', [{ text: 'OK', onPress: () => router.push('/(tabs)/voyage') }]);
            } catch { Alert.alert('Erreur', 'Une erreur inattendue.'); }
          },
        },
      ]
    );
  };

  const cur = days[selectedDay];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={20} color={C.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerDest}>{tripData.destination}</Text>
          <Text style={styles.headerSub}>{isMemory ? 'Souvenir' : 'Plan de voyage'}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.iconBtnDanger}>
          <Ionicons name="trash-outline" size={18} color={C.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* HERO IMAGE */}
        {!!(tripData.image_url || tripData.images?.[0]) && (
          <View style={styles.heroWrap}>
            <Image source={{ uri: tripData.image_url || tripData.images[0] }} style={styles.heroImg} />
            <View style={styles.heroOverlay} />
          </View>
        )}

        {/* TRIP INFO CARD */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={C.creamDim} />
            <Text style={styles.infoText}>{tripData.destination}</Text>
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{tripData.travel_type}</Text>
            </View>
          </View>

          {(tripData.start_date || tripData.end_date) && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color={C.creamDim} />
              <Text style={styles.infoText}>
                {tripData.start_date && tripData.end_date
                  ? `${fmtShort(tripData.start_date)} → ${fmtShort(tripData.end_date)}`
                  : tripData.start_date ? `À partir du ${fmtShort(tripData.start_date)}` : ''}
              </Text>
            </View>
          )}

          {tripData.interests && tripData.interests.length > 0 && (
            <View style={styles.tagsRow}>
              {tripData.interests.map((i: string) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{i}</Text>
                </View>
              ))}
            </View>
          )}

          {tripData.activity_level && (
            <View style={styles.infoRow}>
              <Ionicons name="fitness-outline" size={14} color={C.creamDim} />
              <Text style={styles.infoText}>Rythme : {tripData.activity_level}</Text>
            </View>
          )}
        </View>

        {/* MEMORY SECTION (voyage type) */}
        {isMemory && (
          <View style={styles.memCard}>
            {tripData.rating && (
              <View style={styles.starsRow}>
                {[1,2,3,4,5].map(s => (
                  <Ionicons key={s} name="star" size={18} color={s <= tripData.rating ? '#F59E0B' : C.border} />
                ))}
              </View>
            )}
            {tripData.description && <Text style={styles.memDesc}>{tripData.description}</Text>}
            {tripData.memory_text && (
              <View style={styles.memTextWrap}>
                <Ionicons name="journal-outline" size={16} color={C.creamDim} />
                <Text style={styles.memText}>{tripData.memory_text}</Text>
              </View>
            )}
          </View>
        )}

        {/* ITINERARY CALENDAR */}
        {hasItinerary && (
          <View style={styles.calSection}>
            <View style={styles.calHeader}>
              <Ionicons name="calendar" size={16} color={C.cream} />
              <Text style={styles.calTitle}>ITINÉRAIRE</Text>
              <Text style={styles.calSub}>{days.length} jours</Text>
            </View>

            {/* Day strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayStrip}
            >
              {days.map((day, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dayPill, selectedDay === idx && styles.dayPillActive]}
                  onPress={() => setSelectedDay(idx)}
                >
                  <Text style={[styles.dayPillNum, selectedDay === idx && styles.dayPillNumActive]}>
                    J{day.day}
                  </Text>
                  <Text style={[styles.dayPillDate, selectedDay === idx && styles.dayPillDateActive]}>
                    {fmtShort(day.date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Selected day card */}
            {cur && (
              <View style={styles.dayCard}>
                <Text style={styles.dayCardDate}>{fmtLong(cur.date)}</Text>
                <Text style={styles.dayCardTheme}>{cur.theme}</Text>
                {!!cur.intro && <Text style={styles.dayCardIntro}>{cur.intro}</Text>}
                <View style={styles.actList}>
                  {(cur.activities ?? []).map((act, aidx) => (
                    <ActivityRow key={`${cur.day}-${aidx}`} activity={act} />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* No itinerary yet */}
        {!isMemory && !hasItinerary && (
          <View style={styles.noItinerary}>
            <Ionicons name="map-outline" size={40} color={C.creamDim} />
            <Text style={styles.noItineraryText}>Itinéraire non encore généré</Text>
            <TouchableOpacity
              style={styles.genBtn}
              onPress={() => router.push({ pathname: '/plan-trip', params: { tripData: JSON.stringify(tripData) } })}
            >
              <Text style={styles.genBtnText}>Générer l'itinéraire</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  errWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errText: { fontSize: 15, color: C.whiteDim },
  errBtn:  { backgroundColor: C.creamFaint, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  errBtnText: { color: C.cream, fontSize: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
  },
  iconBtnDanger: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.10)', justifyContent: 'center', alignItems: 'center',
  },
  headerDest: { fontSize: 17, fontWeight: '300', color: C.white, letterSpacing: 0.5 },
  headerSub:  { fontSize: 11, color: C.creamDim, marginTop: 2 },

  scroll: { paddingBottom: 80 },

  heroWrap: { height: 200, position: 'relative' },
  heroImg:  { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'transparent' },

  infoCard: {
    margin: 16, padding: 16,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    gap: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: C.whiteDim, flex: 1 },
  typePill: {
    backgroundColor: C.creamFaint, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },
  typePillText: { fontSize: 11, color: C.cream, fontWeight: '500' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: 'rgba(122,184,245,0.08)', borderRadius: 8, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  tagText: { fontSize: 11, color: C.creamDim },

  memCard: {
    marginHorizontal: 16, marginBottom: 16, padding: 16,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    gap: 12,
  },
  starsRow: { flexDirection: 'row', gap: 4 },
  memDesc: { fontSize: 14, color: C.whiteDim, lineHeight: 20 },
  memTextWrap: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  memText: { fontSize: 13, color: C.whiteDim, lineHeight: 20, flex: 1, fontStyle: 'italic' },

  calSection: { marginHorizontal: 16, marginBottom: 16 },
  calHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 14,
  },
  calTitle: { fontSize: 11, letterSpacing: 2.5, color: C.creamDim, fontWeight: '400', flex: 1 },
  calSub:   { fontSize: 11, color: C.creamDim },

  dayStrip: { paddingBottom: 14, gap: 8 },
  dayPill: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card, minWidth: 56,
  },
  dayPillActive: { backgroundColor: C.creamFaint, borderColor: C.borderMid },
  dayPillNum:    { fontSize: 15, fontWeight: '600', color: C.whiteDim },
  dayPillNumActive: { color: C.cream },
  dayPillDate:   { fontSize: 10, color: C.creamDim, marginTop: 2 },
  dayPillDateActive: { color: C.creamDim },

  dayCard: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    padding: 18, gap: 6,
  },
  dayCardDate:  { fontSize: 12, color: C.creamDim, textTransform: 'capitalize' },
  dayCardTheme: { fontSize: 20, fontWeight: '300', color: C.white, lineHeight: 28, marginBottom: 4 },
  dayCardIntro: {
    fontSize: 14, color: C.whiteDim, fontStyle: 'italic', lineHeight: 21,
    paddingTop: 4, borderTopWidth: 1, borderTopColor: C.border,
  },

  actList: { gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  actCard: {
    borderLeftWidth: 3, borderLeftColor: C.cream,
    paddingLeft: 14, gap: 4,
  },
  actTime: { fontSize: 12, color: C.creamDim },
  actCat:  { fontSize: 12, fontWeight: '600' },
  actName: { fontSize: 16, fontWeight: '500', color: C.white, lineHeight: 22 },
  actDesc: { fontSize: 14, color: C.whiteDim, lineHeight: 21 },
  actTips: { fontSize: 13, color: C.cream, lineHeight: 19, paddingTop: 4 },

  noItinerary: { alignItems: 'center', padding: 32, gap: 12 },
  noItineraryText: { fontSize: 14, color: C.whiteDim },
  genBtn: { backgroundColor: C.cream, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 4 },
  genBtnText: { fontSize: 13, fontWeight: '600', color: C.bg },
});

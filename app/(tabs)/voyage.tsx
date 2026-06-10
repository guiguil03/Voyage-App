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
  View,
} from 'react-native';

const C = {
  bg:         '#0D0D0D',
  card:       'rgba(13,13,13,0.92)',
  border:     'rgba(122,184,245,0.14)',
  cream:      '#7AB8F5',
  creamDim:   'rgba(122,184,245,0.50)',
  creamFaint: 'rgba(122,184,245,0.18)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.40)',
};

interface TripPlan {
  id: string; user_id: string; destination: string;
  start_date: string | null; end_date: string | null;
  travel_type: string; interests: string[] | null;
  activity_level: string; status: string;
  generated_itinerary: any; created_at: string; updated_at: string;
}

interface UnifiedTrip {
  id: string; destination: string;
  start_date: string | null; end_date: string | null;
  travel_type: string; interests: string[] | null;
  activity_level?: string; status: string;
  type: 'trip_plan' | 'voyage'; created_at: string;
  trip_name?: string; description?: string;
  memory_text?: string; rating?: number; duration?: string;
  image_url?: string; images?: string[];
  generated_itinerary?: any;
}

interface TripStats { totalTrips: number; pendingTrips: number; completedTrips: number; }

function SectionHead({ title }: { title: string }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row:   { paddingHorizontal: 22, paddingBottom: 12, paddingTop: 24 },
  title: { fontSize: 13, color: C.creamDim, fontWeight: '300', letterSpacing: 1 },
});

export default function VoyageScreen() {
  const [activeFilter, setActiveFilter]   = useState('Tous');
  const [trips, setTrips]                 = useState<TripPlan[]>([]);
  const [voyages, setVoyages]             = useState<any[]>([]);
  const [unifiedTrips, setUnifiedTrips]   = useState<UnifiedTrip[]>([]);
  const [stats, setStats]                 = useState<TripStats>({ totalTrips: 0, pendingTrips: 0, completedTrips: 0 });
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const { user } = useAuth();
  const filters = ['Tous', 'En attente', 'Terminé', 'En cours'];

  useEffect(() => {
    if (user) loadUserTrips();
    else setIsLoading(false);
  }, [user]);

  const loadUserTrips = async () => {
    try {
      setIsLoading(true); setError(null);
      const [tripRes, voyRes] = await Promise.all([getUserTripPlans(), getUserVoyages()]);
      if (tripRes.error) throw new Error(tripRes.error);
      const tripData  = tripRes.data || [];
      const voyData   = voyRes.data  || [];
      setTrips(tripData); setVoyages(voyData);
      const unified: UnifiedTrip[] = [
        ...tripData.map((t: TripPlan): UnifiedTrip => ({
          id: t.id, destination: t.destination, start_date: t.start_date, end_date: t.end_date,
          travel_type: t.travel_type, interests: t.interests, activity_level: t.activity_level,
          status: t.status, type: 'trip_plan', created_at: t.created_at,
          generated_itinerary: t.generated_itinerary,
        })),
        ...voyData.map((v: any): UnifiedTrip => ({
          id: v.id, destination: v.destination, start_date: null, end_date: null,
          travel_type: v.trip_type, interests: [], status: 'completed', type: 'voyage',
          created_at: v.created_at, trip_name: v.trip_name, description: v.description,
          memory_text: v.memory_text, rating: v.rating, duration: v.duration,
          image_url: v.image_url, images: v.images || [],
        })),
      ];
      setUnifiedTrips(unified);
      setStats({
        totalTrips: tripData.length + voyData.length,
        pendingTrips:   tripData.filter((t: TripPlan) => t.status === 'pending').length,
        completedTrips: tripData.filter((t: TripPlan) => t.status === 'completed').length + voyData.length,
      });
    } catch (e) {
      setError('Impossible de charger vos voyages.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':    return { text: 'En attente', color: '#FF6B35' };
      case 'processing': return { text: 'En cours',   color: '#2F7417' };
      case 'completed':
      case 'Terminé':    return { text: 'Terminé',    color: '#4ECDC4' };
      case 'failed':     return { text: 'Échoué',     color: '#FF4757' };
      default:           return { text: status,        color: '#666' };
    }
  };

  const getFilteredTrips = () => {
    if (activeFilter === 'Tous') return unifiedTrips;
    if (activeFilter === 'Terminé') return unifiedTrips.filter(t => t.status === 'completed' || t.status === 'Terminé' || t.type === 'voyage');
    const map: Record<string, string> = { 'En attente': 'pending', 'En cours': 'processing' };
    return unifiedTrips.filter(t => t.status === map[activeFilter]);
  };

  const handleTripPress = (trip: UnifiedTrip) => {
    router.push({ pathname: '/travel/detailMemory', params: { tripData: JSON.stringify(trip) } });
  };

  const handleAddTrip = () => {
    Alert.alert('Ajouter un voyage', '', [
      { text: 'Planifier un voyage', onPress: () => router.push('/plan-trip') },
      { text: 'Ajouter un souvenir', onPress: () => router.push('/Memory') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleDelete = (trip: UnifiedTrip) => {
    const isMemory = trip.type === 'voyage';
    Alert.alert(
      isMemory ? 'Supprimer le souvenir' : 'Supprimer le voyage',
      `Supprimer "${isMemory ? trip.trip_name || trip.destination : trip.destination}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              if (isMemory) {
                const { deleteVoyage } = await import('@/features/trips/services/voyages');
                const r = await deleteVoyage(trip.id);
                if (r.error) Alert.alert('Erreur', r.error);
                else loadUserTrips();
              } else {
                const r = await deleteTripPlan(trip.id);
                if (r.error) Alert.alert('Erreur', r.error);
                else loadUserTrips();
              }
            } catch { Alert.alert('Erreur', 'Une erreur est survenue.'); }
          },
        },
      ]
    );
  };

  const formatDateRange = (t: UnifiedTrip) => {
    if (t.start_date && t.end_date) {
      return `${new Date(t.start_date).toLocaleDateString('fr-FR')} → ${new Date(t.end_date).toLocaleDateString('fr-FR')}`;
    }
    if (t.start_date) return `À partir du ${new Date(t.start_date).toLocaleDateString('fr-FR')}`;
    return 'Dates non spécifiées';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.cream} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filtered = getFilteredTrips();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>MES VOYAGES</Text>
              <Text style={styles.subtitle}>Gérez vos aventures</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddTrip}>
              <Ionicons name="add" size={22} color={C.bg} />
            </TouchableOpacity>
          </View>

          {/* Stats inline */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.totalTrips}</Text>
              <Text style={styles.statLabel}>total</Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.pendingTrips}</Text>
              <Text style={styles.statLabel}>en attente</Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.completedTrips}</Text>
              <Text style={styles.statLabel}>terminés</Text>
            </View>
          </View>
        </View>

        {/* FILTERS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TRIP LIST */}
        <SectionHead title={activeFilter === 'Tous' ? 'TOUS MES VOYAGES' : `VOYAGES — ${activeFilter.toUpperCase()}`} />
        <View style={styles.list}>
          {filtered.map(trip => {
            const isMemory   = trip.type === 'voyage';
            const mainImage  = trip.image_url || trip.images?.[0];
            const statusDisp = getStatusDisplay(trip.status);

            return (
              <TouchableOpacity
                key={trip.id}
                style={styles.card}
                onPress={() => handleTripPress(trip)}
                activeOpacity={0.88}
              >
                {/* IMAGE HEADER */}
                {mainImage ? (
                  <View style={styles.cardImgWrap}>
                    <Image source={{ uri: mainImage }} style={styles.cardImg} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={styles.cardImgOverlay}>
                      <Text style={styles.cardImgTitle} numberOfLines={1}>
                        {isMemory ? trip.trip_name || trip.destination : trip.destination}
                      </Text>
                      <Text style={styles.cardImgSub}>{trip.travel_type}</Text>
                    </LinearGradient>
                    <View style={styles.badgeWrap}>
                      <Text style={styles.badgeText}>{isMemory ? 'SOUVENIR' : statusDisp.text.toUpperCase()}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.cardPlaceholder}>
                    <View style={styles.placeholderIcon}>
                      <Ionicons name={isMemory ? 'heart-outline' : 'location-outline'} size={28} color={C.cream} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardImgTitle} numberOfLines={1}>
                        {isMemory ? trip.trip_name || trip.destination : trip.destination}
                      </Text>
                      <Text style={styles.cardImgSub}>{trip.travel_type}</Text>
                    </View>
                    <View style={styles.badgeWrap}>
                      <Text style={styles.badgeText}>{isMemory ? 'SOUVENIR' : statusDisp.text.toUpperCase()}</Text>
                    </View>
                  </View>
                )}

                {/* INFO */}
                <View style={styles.cardInfo}>
                  {isMemory ? (
                    <View style={styles.detailsRow}>
                      {trip.duration && (
                        <View style={styles.detailItem}>
                          <Ionicons name="time-outline" size={13} color={C.creamDim} />
                          <Text style={styles.detailText}>{trip.duration}</Text>
                        </View>
                      )}
                      {trip.rating && (
                        <View style={styles.detailItem}>
                          <Ionicons name="star-outline" size={13} color={C.creamDim} />
                          <Text style={styles.detailText}>{trip.rating}/5</Text>
                        </View>
                      )}
                      <View style={styles.detailItem}>
                        <Ionicons name="location-outline" size={13} color={C.creamDim} />
                        <Text style={styles.detailText}>{trip.destination}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.detailsRow}>
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={13} color={C.creamDim} />
                        <Text style={styles.detailText} numberOfLines={1}>{formatDateRange(trip)}</Text>
                      </View>
                    </View>
                  )}

                  {/* Progress bar for pending trips */}
                  {!isMemory && trip.status !== 'completed' && (
                    <View style={styles.progressWrap}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, {
                          width: trip.status === 'pending' ? '25%' : trip.status === 'processing' ? '75%' : '100%',
                        }]} />
                      </View>
                      <Text style={styles.progressLabel}>{statusDisp.text}</Text>
                    </View>
                  )}

                  {/* ACTIONS */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.actionPrimary}
                      onPress={() => handleTripPress(trip)}
                    >
                      <Ionicons name="document-text-outline" size={14} color={C.bg} />
                      <Text style={styles.actionPrimaryText}>Détails</Text>
                    </TouchableOpacity>

                    {!isMemory && (
                      <TouchableOpacity
                        style={styles.actionGhost}
                        onPress={() => router.push({ pathname: '/plan-trip', params: { tripData: JSON.stringify(trip) } })}
                      >
                        <Ionicons name="create-outline" size={14} color={C.cream} />
                        <Text style={styles.actionGhostText}>Modifier</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.actionDelete} onPress={() => handleDelete(trip)}>
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* EMPTY */}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="airplane-outline" size={48} color={C.creamFaint} />
            <Text style={styles.emptyTitle}>Aucun voyage trouvé</Text>
            <Text style={styles.emptySub}>
              {activeFilter === 'Tous'
                ? 'Créez votre premier voyage !'
                : `Aucun voyage ${activeFilter.toLowerCase()}.`}
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleAddTrip}>
              <Text style={styles.emptyBtnText}>Créer un voyage</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  scroll:      { paddingBottom: 120 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingTop: 100 },
  loadingText: { fontSize: 14, color: C.creamDim, fontWeight: '300' },

  /* HEADER */
  header: {
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  title:   { fontSize: 28, fontWeight: '200', letterSpacing: 5, color: C.cream, marginBottom: 4 },
  subtitle:{ fontSize: 13, color: C.creamDim, fontWeight: '300', letterSpacing: 0.5 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.cream,
    justifyContent: 'center', alignItems: 'center',
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  statItem: { alignItems: 'flex-start' },
  statNum:  { fontSize: 24, fontWeight: '200', color: C.white, letterSpacing: 0.5 },
  statLabel:{ fontSize: 11, color: C.creamDim, fontWeight: '300', marginTop: 1 },
  statDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 8 },

  /* FILTERS */
  filterScroll: { paddingHorizontal: 22, paddingVertical: 16, gap: 10 },
  filterPill: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 30, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card,
  },
  filterPillActive: { backgroundColor: C.cream, borderColor: C.cream },
  filterText:       { fontSize: 13, color: C.creamDim, fontWeight: '300' },
  filterTextActive: { color: C.bg, fontWeight: '600' },

  /* LIST */
  list: { paddingHorizontal: 22, gap: 16 },

  /* CARD */
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },

  /* Image header */
  cardImgWrap: { height: 170, position: 'relative' },
  cardImg:     { width: '100%', height: '100%', resizeMode: 'cover' },
  cardImgOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 14,
  },
  cardImgTitle: { fontSize: 18, fontWeight: '500', color: C.white, marginBottom: 2 },
  cardImgSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

  /* Placeholder header */
  cardPlaceholder: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 14,
    backgroundColor: 'rgba(122,184,245,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  placeholderIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(122,184,245,0.08)',
    borderWidth: 1, borderColor: C.creamFaint,
    justifyContent: 'center', alignItems: 'center',
  },

  /* Badge */
  badgeWrap: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(122,184,245,0.3)',
  },
  badgeText: { fontSize: 9, color: C.cream, letterSpacing: 1.5, fontWeight: '400' },

  /* Info section */
  cardInfo: { padding: 16 },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: 12, color: C.creamDim, fontWeight: '300' },

  /* Progress */
  progressWrap: { marginBottom: 14, gap: 6 },
  progressBar:  { height: 3, backgroundColor: 'rgba(122,184,245,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: C.cream },
  progressLabel:{ fontSize: 10, color: C.creamDim, letterSpacing: 1 },

  /* Actions */
  actions:      { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14 },
  actionPrimary:{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.cream, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  actionPrimaryText: { color: C.bg, fontSize: 13, fontWeight: '600' },
  actionGhost:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.creamFaint, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  actionGhostText: { color: C.cream, fontSize: 13, fontWeight: '300' },
  actionDelete: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },

  /* Empty */
  empty:       { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 40, gap: 12 },
  emptyTitle:  { fontSize: 18, fontWeight: '300', color: C.creamDim, letterSpacing: 0.5 },
  emptySub:    { fontSize: 13, color: C.creamDim, textAlign: 'center', lineHeight: 20 },
  emptyBtn:    { backgroundColor: C.cream, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 20, marginTop: 4 },
  emptyBtnText:{ fontSize: 14, fontWeight: '600', color: C.bg, letterSpacing: 0.5 },
});

import TripCard from '@/features/trips/components/TripCard';
import city from '@/data/city.json';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getFriendsVoyages, getMyFriends } from '@/features/social/services/friends';
import { getUserTripPlans } from '@/features/trips/services/trip-planning';
import { getUserVoyages } from '@/features/trips/services/voyages';
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
  View,
} from 'react-native';

interface TripPlan {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  travel_type: string;
  interests: string[] | null;
  activity_level: string;
  status: string;
  created_at: string;
}

const C = {
  bg:         '#0D0D0D',
  card:       'rgba(18,18,18,0.95)',
  cardLight:  'rgba(245,237,214,0.05)',
  border:     'rgba(245,237,214,0.12)',
  borderMid:  'rgba(245,237,214,0.22)',
  cream:      '#F5EDD6',
  creamDim:   'rgba(245,237,214,0.50)',
  creamFaint: 'rgba(245,237,214,0.15)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.45)',
  danger:     '#EF4444',
};

export default function HomeScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const [userVoyages, setUserVoyages]             = useState<any[]>([]);
  const [loadingVoyages, setLoadingVoyages]       = useState(true);
  const [nextTrip, setNextTrip]                   = useState<TripPlan | null>(null);
  const [loadingNextTrip, setLoadingNextTrip]     = useState(true);
  const [friends, setFriends]                     = useState<any[]>([]);
  const [friendsVoyages, setFriendsVoyages]       = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingVoyages(true);
    getUserVoyages()
      .then(r => { if (r.data) setUserVoyages(r.data); })
      .finally(() => setLoadingVoyages(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingNextTrip(true);
    getUserTripPlans().then(r => {
      if (r.data?.length) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const upcoming = r.data
          .filter((t: TripPlan) => t.start_date && new Date(t.start_date) >= today)
          .sort((a: TripPlan, b: TripPlan) =>
            new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());
        setNextTrip(upcoming[0] ?? [...r.data].sort((a: TripPlan, b: TripPlan) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]);
      }
    }).finally(() => setLoadingNextTrip(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getMyFriends().then(({ data }) => {
      setFriends(data);
      getFriendsVoyages(data).then(({ data: v }) => setFriendsVoyages(v ?? []));
    });
  }, [isAuthenticated]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  const handleLastVoyage = () => {
    if (!userVoyages.length) return;
    const v = userVoyages[0];
    router.push({ pathname: '/travel/detailMemory', params: { tripData: JSON.stringify({ ...v, type: 'voyage', interests: [], start_date: null, end_date: null }) } });
  };

  const handleFriendVoyage = (voyage: any) => {
    router.push({ pathname: '/travel/detailMemory', params: { tripData: JSON.stringify({ ...voyage, type: 'voyage', interests: voyage.interests || [], start_date: null, end_date: null }) } });
  };

  if (loading || !isAuthenticated || !user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.cream} />
      </View>
    );
  }

  const username = user.email?.split('@')[0] ?? 'Voyageur';
  const voyagesByFriend = friends.reduce((acc: Record<string, any[]>, f) => {
    acc[f.id] = friendsVoyages.filter(v => v.user_id === f.id);
    return acc;
  }, {});

  const statusLabel: Record<string, string> = {
    pending: 'En attente', processing: 'En cours',
    completed: 'Terminé', failed: 'Échoué',
  };

  return (
    <View style={styles.bg}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >

          {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>BONJOUR</Text>
                <Text style={styles.heroName}>{username}</Text>
              </View>
              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={() => router.push('/(tabs)/account')}
              >
                <Ionicons name="person-circle-outline" size={40} color={C.cream} />
              </TouchableOpacity>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{loadingVoyages ? '—' : userVoyages.length}</Text>
                <Text style={styles.statLabel}>VOYAGES</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{friends.length}</Text>
                <Text style={styles.statLabel}>AMIS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{city.city.length}+</Text>
                <Text style={styles.statLabel}>DESTINATIONS</Text>
              </View>
            </View>
          </View>

          {/* ━━━ ACTIONS RAPIDES ━━━━━━━━━━━━━━━━━━━ */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/Memory')}>
              <View style={styles.actionIcon}>
                <Ionicons name="camera-outline" size={22} color={C.cream} />
              </View>
              <Text style={styles.actionLabel}>Souvenir</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => router.push('/plan-trip')}>
              <View style={[styles.actionIcon, styles.actionIconPrimary]}>
                <Ionicons name="airplane-outline" size={22} color={C.bg} />
              </View>
              <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>Planifier</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/explore')}>
              <View style={styles.actionIcon}>
                <Ionicons name="compass-outline" size={22} color={C.cream} />
              </View>
              <Text style={styles.actionLabel}>Explorer</Text>
            </TouchableOpacity>
          </View>

          {/* ━━━ DERNIER VOYAGE ━━━━━━━━━━━━━━━━━━━━ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>DERNIER VOYAGE</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/voyage')}>
                <Text style={styles.sectionLink}>Voir tout →</Text>
              </TouchableOpacity>
            </View>

            {loadingVoyages ? (
              <View style={[styles.card, styles.cardCenter]}>
                <ActivityIndicator color={C.cream} />
              </View>
            ) : userVoyages.length > 0 ? (
              <View style={styles.tripCardWrap}>
                <TripCard
                  date={new Date(userVoyages[0].created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  country={userVoyages[0].destination}
                  flagEmoji={userVoyages[0].flag_emoji || '🌍'}
                  image={userVoyages[0].image_url ? { uri: userVoyages[0].image_url } : require('@/assets/images/mountain-background.jpg')}
                  onPress={handleLastVoyage}
                />
              </View>
            ) : (
              <View style={[styles.card, styles.emptyCard]}>
                <Ionicons name="map-outline" size={32} color={C.creamDim} />
                <Text style={styles.emptyTitle}>Pas encore de voyage</Text>
                <Text style={styles.emptyDesc}>Ajoute ton premier souvenir</Text>
                <TouchableOpacity style={styles.creamBtn} onPress={() => router.push('/Memory')}>
                  <Text style={styles.creamBtnText}>Commencer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ━━━ PROCHAIN DÉPART ━━━━━━━━━━━━━━━━━━━ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>PROCHAIN DÉPART</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/voyage')}>
                <Text style={styles.sectionLink}>Voir tout →</Text>
              </TouchableOpacity>
            </View>

            {loadingNextTrip ? (
              <View style={[styles.card, styles.cardCenter]}>
                <ActivityIndicator color={C.cream} />
              </View>
            ) : nextTrip ? (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: '/travel/detailMemory', params: { tripData: JSON.stringify({ ...nextTrip, type: 'trip_plan' }) } })}
                activeOpacity={0.8}
              >
                <View style={styles.nextTripRow}>
                  <View style={styles.nextTripIcon}>
                    <Ionicons name="airplane-outline" size={20} color={C.cream} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nextTripDest}>{nextTrip.destination}</Text>
                    <Text style={styles.nextTripMeta}>
                      {nextTrip.travel_type}
                      {nextTrip.start_date ? `  ·  ${formatDate(nextTrip.start_date)}` : ''}
                    </Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{statusLabel[nextTrip.status] ?? nextTrip.status}</Text>
                  </View>
                </View>

                {nextTrip.interests?.length ? (
                  <View style={styles.tagRow}>
                    {nextTrip.interests.slice(0, 3).map((tag: string, i: number) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterLink}>Voir les détails  →</Text>
                  {nextTrip.status === 'pending' && (
                    <TouchableOpacity onPress={() => router.push('/plan-trip')}>
                      <Text style={styles.cardFooterGhost}>Modifier</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.card, styles.emptyCard]}>
                <Ionicons name="calendar-outline" size={32} color={C.creamDim} />
                <Text style={styles.emptyTitle}>Aucun voyage planifié</Text>
                <Text style={styles.emptyDesc}>Laisse l'IA construire ton itinéraire</Text>
                <TouchableOpacity style={styles.creamBtn} onPress={() => router.push('/plan-trip')}>
                  <Text style={styles.creamBtnText}>Planifier</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ━━━ DESTINATIONS ━━━━━━━━━━━━━━━━━━━━━━ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>DESTINATIONS</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                <Text style={styles.sectionLink}>Explorer →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
              {city.city.slice(0, 8).map((c: { name: string; country: string }, i: number) => (
                <TouchableOpacity
                  key={i}
                  style={styles.cityPill}
                  onPress={() => Alert.alert(c.name, c.country)}
                >
                  <Ionicons name="location-outline" size={14} color={C.creamDim} />
                  <Text style={styles.cityName}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ━━━ AMIS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>AMIS</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/amis')}>
                <Text style={styles.sectionLink}>Voir tout →</Text>
              </TouchableOpacity>
            </View>

            {friends.length === 0 ? (
              <View style={[styles.card, styles.emptyCard]}>
                <Ionicons name="people-outline" size={32} color={C.creamDim} />
                <Text style={styles.emptyTitle}>Aucun ami pour l'instant</Text>
                <TouchableOpacity style={styles.creamBtn} onPress={() => router.push('/(tabs)/amis')}>
                  <Text style={styles.creamBtnText}>Trouver des amis</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.card}>
                {friends.slice(0, 4).map((friend, idx) => {
                  const fvoyages = voyagesByFriend[friend.id] ?? [];
                  return (
                    <View key={friend.id}>
                      {idx > 0 && <View style={styles.friendDivider} />}
                      <View style={styles.friendRow}>
                        <View style={styles.friendAvatar}>
                          <Ionicons name="person-outline" size={16} color={C.cream} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.friendName}>
                            {friend.full_name || friend.username || friend.email?.split('@')[0]}
                          </Text>
                          <Text style={styles.friendMeta}>
                            {fvoyages.length} voyage{fvoyages.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        {fvoyages[0] && (
                          <TouchableOpacity
                            style={styles.friendVoyageChip}
                            onPress={() => handleFriendVoyage(fvoyages[0])}
                          >
                            <Text style={styles.friendVoyageFlag}>{fvoyages[0].flag_emoji || '🌍'}</Text>
                            <Text style={styles.friendVoyageName}>{fvoyages[0].destination}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
                {friends.length > 4 && (
                  <TouchableOpacity style={styles.seeMoreBtn} onPress={() => router.push('/(tabs)/amis')}>
                    <Text style={styles.seeMoreText}>+{friends.length - 4} autres amis</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg:      { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  scroll:  { paddingBottom: 120 },

  /* ── HERO ── */
  hero: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  heroLabel: {
    fontSize: 11,
    letterSpacing: 4,
    color: C.creamDim,
    fontWeight: '300',
    marginBottom: 4,
  },
  heroName: {
    fontSize: 30,
    fontWeight: '200',
    letterSpacing: 2,
    color: C.cream,
  },
  avatarBtn: { marginTop: 2 },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum:  { fontSize: 22, fontWeight: '200', color: C.cream, letterSpacing: 1 },
  statLabel:{ fontSize: 9, letterSpacing: 2, color: C.creamDim, marginTop: 3, fontWeight: '300' },
  statDivider: { width: 1, height: 30, backgroundColor: C.border },

  /* ── ACTIONS ── */
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  actionBtnPrimary: {
    backgroundColor: C.cream,
    borderColor: C.cream,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.creamFaint,
    backgroundColor: 'rgba(245,237,214,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconPrimary: {
    backgroundColor: 'rgba(13,13,13,0.15)',
    borderColor: 'rgba(13,13,13,0.2)',
  },
  actionLabel: { fontSize: 11, color: C.cream, fontWeight: '300', letterSpacing: 0.5 },
  actionLabelPrimary: { color: C.bg, fontWeight: '500' },

  /* ── SECTIONS ── */
  section:     { marginBottom: 8 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 11, letterSpacing: 3, color: C.creamDim, fontWeight: '300' },
  sectionLink:  { fontSize: 11, letterSpacing: 1, color: C.cream,    fontWeight: '300' },

  /* ── CARD ── */
  card: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: C.cream,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },
  cardCenter:  { padding: 32, alignItems: 'center', justifyContent: 'center' },
  tripCardWrap:{ borderRadius: 20, overflow: 'hidden' },

  /* Empty */
  emptyCard:  { padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, color: C.cream, fontWeight: '300', letterSpacing: 0.5 },
  emptyDesc:  { fontSize: 12, color: C.creamDim, marginBottom: 8 },

  /* Buttons */
  creamBtn:     { backgroundColor: C.cream, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  creamBtnText: { color: C.bg, fontSize: 13, fontWeight: '500', letterSpacing: 0.5 },

  /* Next trip */
  nextTripRow:  { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  nextTripIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(245,237,214,0.06)',
    borderWidth: 1, borderColor: C.creamFaint,
    justifyContent: 'center', alignItems: 'center',
  },
  nextTripDest: { fontSize: 17, fontWeight: '300', color: C.white, letterSpacing: 0.5, marginBottom: 3 },
  nextTripMeta: { fontSize: 12, color: C.creamDim },
  statusPill: {
    borderWidth: 1, borderColor: C.creamFaint, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(245,237,214,0.05)',
  },
  statusText: { fontSize: 10, color: C.cream, letterSpacing: 1 },
  tagRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 18, paddingBottom: 14 },
  tag: {
    borderWidth: 1, borderColor: C.border, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tagText: { fontSize: 11, color: C.creamDim },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingBottom: 16, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: C.border,
    marginTop: 4,
  },
  cardFooterLink:  { fontSize: 12, color: C.cream, fontWeight: '300', letterSpacing: 0.5 },
  cardFooterGhost: { fontSize: 12, color: C.creamDim },

  /* Cities */
  cityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: C.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
    backgroundColor: C.card,
  },
  cityName: { fontSize: 12, color: C.cream, fontWeight: '300' },

  /* Friends */
  friendRow:    { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  friendDivider:{ height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  friendAvatar: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: C.creamFaint,
    backgroundColor: 'rgba(245,237,214,0.05)',
    justifyContent: 'center', alignItems: 'center',
  },
  friendName:    { fontSize: 14, fontWeight: '300', color: C.white, letterSpacing: 0.3 },
  friendMeta:    { fontSize: 11, color: C.creamDim, marginTop: 1 },
  friendVoyageChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(245,237,214,0.04)',
  },
  friendVoyageFlag: { fontSize: 14 },
  friendVoyageName: { fontSize: 11, color: C.creamDim, maxWidth: 70 },
  seeMoreBtn:   { padding: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: C.border },
  seeMoreText:  { fontSize: 12, color: C.creamDim, letterSpacing: 1 },
});

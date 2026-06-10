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
  cardLight:  'rgba(122,184,245,0.05)',
  border:     'rgba(122,184,245,0.12)',
  borderMid:  'rgba(122,184,245,0.22)',
  cream:      '#7AB8F5',
  creamDim:   'rgba(122,184,245,0.52)',
  creamFaint: 'rgba(122,184,245,0.15)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.45)',
  danger:     '#EF4444',
};

function SectionHead({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      {link && onLink && (
        <TouchableOpacity onPress={onLink}>
          <Text style={sh.link}>{link} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const sh = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, paddingTop: 24 },
  title: { fontSize: 13, color: C.creamDim, fontWeight: '300', letterSpacing: 1 },
  link:  { fontSize: 13, color: C.cream },
});

export default function HomeScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const [userVoyages, setUserVoyages]         = useState<any[]>([]);
  const [loadingVoyages, setLoadingVoyages]   = useState(true);
  const [nextTrip, setNextTrip]               = useState<TripPlan | null>(null);
  const [loadingNextTrip, setLoadingNextTrip] = useState(true);
  const [friends, setFriends]                 = useState<any[]>([]);
  const [friendsVoyages, setFriendsVoyages]   = useState<any[]>([]);

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
  const todayStr = new Date()
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase();

  return (
    <View style={styles.bg}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── HERO ──────────────────────────────── */}
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroDate}>{todayStr}</Text>
                <Text style={styles.heroGreeting}>Bonjour,</Text>
                <Text style={styles.heroName}>{username}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/account')}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={20} color={C.cream} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{loadingVoyages ? '—' : userVoyages.length}</Text>
                <Text style={styles.statLabel}>voyages</Text>
              </View>
              <View style={styles.statDot} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{friends.length}</Text>
                <Text style={styles.statLabel}>amis</Text>
              </View>
              <View style={styles.statDot} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{city.city.length}+</Text>
                <Text style={styles.statLabel}>destinations</Text>
              </View>
            </View>
          </View>

          {/* ── ACTIONS ───────────────────────────── */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/Memory')}>
              <Ionicons name="camera-outline" size={15} color={C.cream} />
              <Text style={styles.actionLabel}>Souvenir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionPill, styles.actionPillPrimary]} onPress={() => router.push('/plan-trip')}>
              <Ionicons name="airplane-outline" size={15} color={C.bg} />
              <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>Planifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/(tabs)/explore')}>
              <Ionicons name="compass-outline" size={15} color={C.cream} />
              <Text style={styles.actionLabel}>Explorer</Text>
            </TouchableOpacity>
          </View>

          {/* ── PROCHAIN DÉPART ───────────────────── */}
          <SectionHead title="PROCHAIN DÉPART" link="Voir tout" onLink={() => router.push('/(tabs)/voyage')} />
          <View style={styles.body}>
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
                <View style={styles.nextRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nextDest}>{nextTrip.destination}</Text>
                    <Text style={styles.nextMeta}>
                      {nextTrip.travel_type}
                      {nextTrip.start_date ? `  ·  ${formatDate(nextTrip.start_date)}` : ''}
                    </Text>
                  </View>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{statusLabel[nextTrip.status] ?? nextTrip.status}</Text>
                  </View>
                </View>
                {nextTrip.interests?.length ? (
                  <View style={styles.tagRow}>
                    {nextTrip.interests.slice(0, 3).map((tag: string, i: number) => (
                      <View key={i} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                    ))}
                  </View>
                ) : null}
                <View style={styles.cardFooter}>
                  <Text style={styles.footerLink}>Voir les détails  →</Text>
                  {nextTrip.status === 'pending' && (
                    <TouchableOpacity onPress={() => router.push('/plan-trip')}>
                      <Text style={styles.footerGhost}>Modifier</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.card, styles.emptyCard]}>
                <Ionicons name="calendar-outline" size={32} color={C.creamFaint} />
                <Text style={styles.emptyTitle}>Aucun voyage planifié</Text>
                <Text style={styles.emptyDesc}>Laisse l'IA construire ton itinéraire</Text>
                <TouchableOpacity style={styles.creamBtn} onPress={() => router.push('/plan-trip')}>
                  <Text style={styles.creamBtnText}>Planifier</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── DERNIER VOYAGE ────────────────────── */}
          <SectionHead title="DERNIER VOYAGE" link="Voir tout" onLink={() => router.push('/(tabs)/voyage')} />
          <View style={styles.body}>
            {loadingVoyages ? (
              <View style={[styles.card, styles.cardCenter]}>
                <ActivityIndicator color={C.cream} />
              </View>
            ) : userVoyages.length > 0 ? (
              <View style={styles.tripWrap}>
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
                <Ionicons name="map-outline" size={32} color={C.creamFaint} />
                <Text style={styles.emptyTitle}>Pas encore de voyage</Text>
                <Text style={styles.emptyDesc}>Ajoute ton premier souvenir</Text>
                <TouchableOpacity style={styles.creamBtn} onPress={() => router.push('/Memory')}>
                  <Text style={styles.creamBtnText}>Commencer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── AMIS ──────────────────────────────── */}
          <SectionHead title="AMIS" link="Voir tout" onLink={() => router.push('/(tabs)/amis')} />
          <View style={{ paddingBottom: 8 }}>
            {friends.length === 0 ? (
              <View style={[styles.card, styles.emptyCard, { marginHorizontal: 22 }]}>
                <Ionicons name="people-outline" size={32} color={C.creamFaint} />
                <Text style={styles.emptyTitle}>Aucun ami pour l'instant</Text>
                <TouchableOpacity style={styles.creamBtn} onPress={() => router.push('/(tabs)/amis')}>
                  <Text style={styles.creamBtnText}>Trouver des amis</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.friendScroll}
              >
                {friends.slice(0, 8).map(friend => {
                  const fv = voyagesByFriend[friend.id] ?? [];
                  return (
                    <View key={friend.id} style={styles.friendCard}>
                      <View style={styles.friendAvatar}>
                        <Ionicons name="person-outline" size={18} color={C.cream} />
                      </View>
                      <Text style={styles.friendName} numberOfLines={1}>
                        {friend.full_name || friend.username || friend.email?.split('@')[0]}
                      </Text>
                      <Text style={styles.friendMeta}>{fv.length} voyage{fv.length !== 1 ? 's' : ''}</Text>
                      {fv[0] && (
                        <TouchableOpacity onPress={() => handleFriendVoyage(fv[0])}>
                          <Text style={{ fontSize: 18, marginTop: 2 }}>{fv[0].flag_emoji || '🌍'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
                <TouchableOpacity
                  style={[styles.friendCard, styles.friendCardMore]}
                  onPress={() => router.push('/(tabs)/amis')}
                >
                  <Ionicons name="people-outline" size={20} color={C.cream} />
                  <Text style={styles.friendMoreText}>Tous les{'\n'}amis</Text>
                </TouchableOpacity>
              </ScrollView>
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

  /* HERO */
  hero: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  heroDate: {
    fontSize: 10,
    letterSpacing: 2,
    color: C.creamDim,
    fontWeight: '300',
    marginBottom: 10,
  },
  heroGreeting: {
    fontSize: 16,
    color: C.creamDim,
    fontWeight: '300',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  heroName: {
    fontSize: 38,
    fontWeight: '200',
    letterSpacing: 1.5,
    color: C.white,
    textTransform: 'capitalize',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    backgroundColor: C.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  statItem: { alignItems: 'flex-start' },
  statNum:  { fontSize: 26, fontWeight: '200', color: C.cream, letterSpacing: 0.5 },
  statLabel:{ fontSize: 11, color: C.creamDim, fontWeight: '300', marginTop: 1 },
  statDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 8 },

  /* ACTIONS */
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 10,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  actionPillPrimary: { backgroundColor: C.cream, borderColor: C.cream },
  actionLabel:       { fontSize: 12, color: C.cream, fontWeight: '300' },
  actionLabelPrimary:{ color: C.bg, fontWeight: '600' },

  /* BODY */
  body: { paddingHorizontal: 22, paddingBottom: 4 },

  /* CARD */
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  cardCenter: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  tripWrap:   { borderRadius: 20, overflow: 'hidden' },

  /* Empty */
  emptyCard:  { padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, color: C.white, fontWeight: '300', letterSpacing: 0.5 },
  emptyDesc:  { fontSize: 12, color: C.creamDim, marginBottom: 8 },
  creamBtn:     { backgroundColor: C.cream, borderRadius: 20, paddingHorizontal: 22, paddingVertical: 10, marginTop: 4 },
  creamBtnText: { color: C.bg, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },

  /* Next trip card */
  nextRow:  { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  nextDest: { fontSize: 20, fontWeight: '300', color: C.white, marginBottom: 4 },
  nextMeta: { fontSize: 13, color: C.creamDim },
  pill:     { borderWidth: 1, borderColor: C.creamFaint, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.cardLight },
  pillText: { fontSize: 10, color: C.cream, letterSpacing: 1 },
  tagRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 18, paddingBottom: 14 },
  tag:      { borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText:  { fontSize: 11, color: C.creamDim },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingBottom: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  footerLink:  { fontSize: 12, color: C.cream, fontWeight: '300', letterSpacing: 0.5 },
  footerGhost: { fontSize: 12, color: C.creamDim },

  /* Friends */
  friendScroll: { paddingHorizontal: 22, gap: 12, paddingBottom: 4 },
  friendCard: {
    width: 96,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  friendAvatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: C.creamFaint,
    backgroundColor: C.cardLight,
    justifyContent: 'center', alignItems: 'center',
  },
  friendName:     { fontSize: 11, color: C.white, fontWeight: '300', textAlign: 'center' },
  friendMeta:     { fontSize: 10, color: C.creamDim, textAlign: 'center' },
  friendCardMore: { justifyContent: 'center', backgroundColor: C.cardLight, borderStyle: 'dashed' },
  friendMoreText: { fontSize: 11, color: C.cream, fontWeight: '300', textAlign: 'center', marginTop: 6 },
});

import { ItineraryActivity, ItineraryDay } from '@/features/trips/types/itinerary';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  Share,
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
};

const CATEGORY_MAP: Record<string, { icon: string; color: string }> = {
  'Culture':      { icon: 'library',        color: '#A78BFA' },
  'Gastronomie':  { icon: 'restaurant',     color: '#F59E0B' },
  'Gastronomy':   { icon: 'restaurant',     color: '#F59E0B' },
  'Nature':       { icon: 'leaf',           color: '#34D399' },
  'Sport':        { icon: 'bicycle',        color: '#F87171' },
  'Relaxation':   { icon: 'flower',         color: '#C084FC' },
  'Shopping':     { icon: 'bag',            color: '#60A5FA' },
  'Nightlife':    { icon: 'moon',           color: '#818CF8' },
  'Histoire':     { icon: 'time',           color: '#A78BFA' },
  'History':      { icon: 'time',           color: '#A78BFA' },
  'Art':          { icon: 'color-palette',  color: '#E879F9' },
};

function getCat(category: string) {
  return CATEGORY_MAP[category] ?? { icon: 'compass', color: C.cream };
}

function formatItineraryText(destination: string, days: ItineraryDay[]): string {
  let text = `🗺️ Itinéraire — ${destination}\n${'─'.repeat(36)}\n\n`;
  for (const day of days) {
    text += `📅 Jour ${day.day} — ${day.theme}\n${day.date}\n`;
    if (day.intro) text += `${day.intro}\n`;
    text += '\n';
    for (const act of day.activities ?? []) {
      text += `  ⏰ ${act.time}\n  📍 ${act.name} [${act.category}]\n  ${act.description}\n`;
      if (act.tips) text += `  💡 ${act.tips}\n`;
      text += '\n';
    }
    text += `${'─'.repeat(36)}\n\n`;
  }
  return text;
}

function ActivityCard({ activity }: { activity: ItineraryActivity }) {
  const cat = getCat(activity.category);
  return (
    <View style={[styles.activityCard, { borderLeftColor: cat.color }]}>
      <View style={styles.activityHeader}>
        <View style={[styles.activityIconWrap, { backgroundColor: `${cat.color}1A` }]}>
          <Ionicons name={cat.icon as any} size={16} color={cat.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.activityName}>{activity.name}</Text>
          <View style={styles.activityMeta}>
            <Ionicons name="time-outline" size={11} color={C.creamDim} />
            <Text style={styles.activityTime}>{activity.time}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: `${cat.color}1A` }]}>
              <Text style={[styles.categoryText, { color: cat.color }]}>{activity.category}</Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.activityDesc}>{activity.description}</Text>
      {!!activity.tips && (
        <View style={styles.tipsRow}>
          <Ionicons name="bulb-outline" size={13} color={C.cream} />
          <Text style={styles.tipsText}>{activity.tips}</Text>
        </View>
      )}
    </View>
  );
}

export default function PlanningScreen() {
  const params = useLocalSearchParams();
  const days: ItineraryDay[] = (() => {
    try { return params.itinerary ? JSON.parse(params.itinerary as string) : []; }
    catch { return []; }
  })();
  const trip: { destination?: string; startDate?: string; endDate?: string } = (() => {
    try { return params.trip ? JSON.parse(params.trip as string) : {}; }
    catch { return {}; }
  })();

  const destination = trip.destination || 'Mon voyage';
  const totalActivities = days.reduce((acc, d) => acc + (d.activities?.length ?? 0), 0);

  const handleShare = async () => {
    try {
      await Share.share({
        message: formatItineraryText(destination, days),
        title: `Itinéraire ${destination}`,
      });
    } catch {}
  };

  const fmtDate = (iso?: string) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); }
    catch { return ''; }
  };

  const fmtDayDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch { return dateStr; }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={20} color={C.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerDestination}>{destination}</Text>
          {(trip.startDate || trip.endDate) && (
            <Text style={styles.headerDates}>{fmtDate(trip.startDate)} → {fmtDate(trip.endDate)}</Text>
          )}
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
          <Ionicons name="share-outline" size={20} color={C.cream} />
        </TouchableOpacity>
      </View>

      {/* STATS BAR */}
      {days.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={13} color={C.creamDim} />
            <Text style={styles.statText}>{days.length} jour{days.length > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="compass-outline" size={13} color={C.creamDim} />
            <Text style={styles.statText}>{totalActivities} activités</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={handleShare}>
            <Ionicons name="download-outline" size={13} color={C.cream} />
            <Text style={[styles.statText, { color: C.cream }]}>Exporter</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {days.map((day) => (
          <View key={`day-${day.day}-${day.date}`} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <View style={styles.dayBadgeWrap}>
                <Text style={styles.dayBadgeLabel}>JOUR</Text>
                <Text style={styles.dayBadgeNum}>{day.day}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayTheme}>{day.theme}</Text>
                <Text style={styles.dayDate}>{fmtDayDate(day.date)}</Text>
              </View>
            </View>
            <View style={styles.daySep} />
            {!!day.intro && <Text style={styles.dayIntro}>{day.intro}</Text>}
            <View style={styles.activitiesList}>
              {(day.activities ?? []).map((act, idx) => (
                <ActivityCard key={`${day.day}-${idx}`} activity={act} />
              ))}
            </View>
          </View>
        ))}

        {days.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={56} color={C.creamDim} />
            <Text style={styles.emptyTitle}>Aucun itinéraire disponible</Text>
            <Text style={styles.emptyHint}>Retournez à l'accueil pour créer un voyage</Text>
          </View>
        )}
      </ScrollView>

      {days.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleShare} activeOpacity={0.85}>
          <Ionicons name="share-social-outline" size={22} color={C.bg} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
  },
  headerDestination: { fontSize: 18, fontWeight: '300', color: C.white, letterSpacing: 0.8 },
  headerDates: { fontSize: 11, color: C.creamDim, marginTop: 2 },

  statsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: C.border,
    gap: 16,
  },
  statItem:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText:   { fontSize: 12, color: C.whiteDim },
  statDivider:{ width: 1, height: 14, backgroundColor: C.border },

  scroll: { padding: 16, paddingBottom: 100 },

  daySection: {
    backgroundColor: C.card,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    marginBottom: 16, overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 18, paddingBottom: 16,
  },
  dayBadgeWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: C.creamFaint, borderWidth: 1, borderColor: C.borderMid,
    justifyContent: 'center', alignItems: 'center',
  },
  dayBadgeLabel: { fontSize: 8, fontWeight: '700', color: C.creamDim, letterSpacing: 1.5 },
  dayBadgeNum:   { fontSize: 20, fontWeight: '600', color: C.cream, lineHeight: 24 },
  dayTheme:  { fontSize: 15, fontWeight: '500', color: C.white, lineHeight: 21 },
  dayDate:   { fontSize: 12, color: C.creamDim, marginTop: 3, textTransform: 'capitalize' },
  daySep:    { height: 1, backgroundColor: C.border, marginHorizontal: 18, marginBottom: 14 },
  dayIntro: {
    fontSize: 13, color: C.whiteDim, fontStyle: 'italic', lineHeight: 20,
    marginHorizontal: 18, marginBottom: 14,
  },

  activitiesList: { gap: 10, paddingHorizontal: 14, paddingBottom: 16 },
  activityCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    borderLeftWidth: 3,
    padding: 14,
  },
  activityHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10,
  },
  activityIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  activityName: { fontSize: 14, fontWeight: '600', color: C.white, lineHeight: 20 },
  activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  activityTime: { fontSize: 11, color: C.creamDim, flex: 1 },
  categoryBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  categoryText:  { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  activityDesc:  { fontSize: 13, color: C.whiteDim, lineHeight: 19, marginBottom: 8 },
  tipsRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: 'rgba(122,184,245,0.07)',
    borderRadius: 8, padding: 9,
  },
  tipsText: { fontSize: 12, color: C.cream, flex: 1, lineHeight: 17 },

  empty: { alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyTitle: { fontSize: 16, color: C.whiteDim, fontWeight: '300' },
  emptyHint:  { fontSize: 13, color: C.creamDim },

  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: C.cream,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.cream, shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 8,
  },
});

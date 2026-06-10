import { ItineraryActivity, ItineraryDay } from '@/features/trips/types/itinerary';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
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
};

function ActivityCard({ activity }: { activity: ItineraryActivity }) {
  return (
    <View style={styles.activityCard}>
      <View style={styles.activityTimeRow}>
        <Ionicons name="time-outline" size={13} color={C.creamDim} />
        <Text style={styles.activityTime}>{activity.time}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{activity.category}</Text>
        </View>
      </View>
      <Text style={styles.activityName}>{activity.name}</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/home')}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mon voyage</Text>
          {!!trip.destination && (
            <Text style={styles.headerSub}>{trip.destination}</Text>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {days.map((day) => (
          <View key={`day-${day.day}-${day.date}`} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>{day.day}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayTheme}>{day.theme}</Text>
                <Text style={styles.dayDate}>{day.date}</Text>
              </View>
            </View>
            {!!day.intro && (
              <Text style={styles.dayIntro}>{day.intro}</Text>
            )}
            <View style={styles.activitiesList}>
              {(day.activities || []).map((act, idx) => (
                <ActivityCard key={`${day.day}-${idx}`} activity={act} />
              ))}
            </View>
          </View>
        ))}

        {days.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={48} color={C.creamDim} />
            <Text style={styles.emptyText}>Aucun itinéraire disponible</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '200', color: C.white, letterSpacing: 1 },
  headerSub:   { fontSize: 12, color: C.creamDim, marginTop: 2 },

  scroll: { padding: 20, paddingBottom: 80 },

  daySection: {
    backgroundColor: C.card,
    borderRadius: 18, borderWidth: 1, borderColor: C.border,
    padding: 18, marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 12,
  },
  dayBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.creamFaint, borderWidth: 1, borderColor: C.borderMid,
    justifyContent: 'center', alignItems: 'center',
  },
  dayBadgeText: { fontSize: 16, fontWeight: '600', color: C.cream },
  dayTheme:     { fontSize: 16, fontWeight: '400', color: C.white, lineHeight: 22 },
  dayDate:      { fontSize: 12, color: C.creamDim, marginTop: 2 },
  dayIntro: {
    fontSize: 13, color: C.whiteDim, fontStyle: 'italic', lineHeight: 20,
    marginBottom: 16, paddingLeft: 4,
  },

  activitiesList: { gap: 10 },
  activityCard: {
    backgroundColor: 'rgba(122,184,245,0.04)',
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 14,
  },
  activityTimeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
  },
  activityTime: { fontSize: 12, color: C.creamDim, flex: 1 },
  categoryBadge: {
    backgroundColor: 'rgba(122,184,245,0.12)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  categoryText: { fontSize: 10, color: C.cream, fontWeight: '500' },
  activityName: { fontSize: 15, fontWeight: '500', color: C.white, marginBottom: 6 },
  activityDesc: { fontSize: 13, color: C.whiteDim, lineHeight: 19, marginBottom: 8 },
  tipsRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: 'rgba(122,184,245,0.06)',
    borderRadius: 8, padding: 8,
  },
  tipsText: { fontSize: 12, color: C.cream, flex: 1, lineHeight: 17 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 14, color: C.creamDim, fontWeight: '300' },
});

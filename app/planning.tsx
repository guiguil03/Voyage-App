import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Image, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

export default function PlanningScreen() {
  const params = useLocalSearchParams();
  const planning: any[] = params.planning ? JSON.parse(params.planning as string) : [];
  const trip: any = params.trip ? JSON.parse(params.trip as string) : {};
  const grouped = groupActivitiesByDay(planning, trip.startDate, trip.endDate);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#2F7417" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title}>Mon planning à {trip.destination}</Text>
          {planning.length > 0 && (
            <Text style={styles.subtitle}>{planning.length} activités • Planning sauvegardé</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.saveIndicator}
          onPress={() => {
            Alert.alert(
              'Planning sauvegardé ✅', 
              'Ce planning est automatiquement sauvegardé et accessible depuis vos voyages.',
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons name="checkmark-circle" size={24} color="#2F7417" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {Object.entries(grouped).map(([day, acts], i) => (
          <View key={day} style={[styles.daySection, i % 2 === 0 ? styles.daySectionAlt : null]}>
            <Text style={styles.dayTitle}>{day}</Text>
            {(acts as any[]).length === 0 ? (
              <Text style={styles.emptyText}>Pas d&apos;activité ce jour-là, profitez pour flâner ou découvrir par vous-même !</Text>
            ) : (
              (acts as any[]).map((act, idx) => (
                <TouchableOpacity key={act.xid || idx} style={styles.activityCardGlass} activeOpacity={0.88}>
                  <Image source={act.image ? { uri: act.image } : require('@/assets/images/temple-bali-sunset.jpg')} style={styles.activityImgBig} />
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{act.name}</Text>
                    <Text style={styles.activityType}>{act.kinds?.split(',')[0]}</Text>
                    {act.address && (
                      <Text style={styles.activityAddress}>{act.address.road || ''} {act.address.city || ''}</Text>
                    )}
                    {act.wikipedia && (
                      <TouchableOpacity style={styles.wikiBtn} onPress={() => Linking.openURL(act.wikipedia)}>
                        <Ionicons name="book" size={14} color="#1976D2" />
                        <Text style={styles.activityLink}>Wikipedia</Text>
                      </TouchableOpacity>
                    )}
                    {act.description && (
                      <Text style={styles.activityDesc}>{act.description}</Text>
                    )}
                    {act.distance && <Text style={styles.activityDistance}>{Math.round(act.distance)} m</Text>}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  backBtn: { marginRight: 12, backgroundColor: '#e0ffe0', borderRadius: 20, padding: 6 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2F7417' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  saveIndicator: { marginLeft: 12, backgroundColor: '#e0ffe0', borderRadius: 20, padding: 6 },
  scrollContent: { padding: 18, paddingBottom: 60 },
  daySection: { marginBottom: 32, padding: 10, borderRadius: 18 },
  daySectionAlt: { backgroundColor: '#f6f8f7' },
  dayTitle: { fontSize: 22, fontWeight: 'bold', color: '#2F7417', marginBottom: 14, letterSpacing: 0.2 },
  emptyText: { color: '#888', fontStyle: 'italic', marginBottom: 10, fontSize: 15 },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, marginBottom: 16, padding: 12, shadowColor: '#2F7417', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  activityCardGlass: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 18, marginBottom: 18, padding: 14, shadowColor: '#2F7417', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: '#e9ecef' },
  activityImgBig: { width: 90, height: 90, borderRadius: 14, marginRight: 16, backgroundColor: '#eee' },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 17, fontWeight: 'bold', color: '#1a1a1a' },
  activityType: { fontSize: 13, color: '#2F7417', marginTop: 2 },
  activityAddress: { fontSize: 12, color: '#888', marginTop: 2 },
  activityLink: { fontSize: 13, color: '#1976D2', marginLeft: 4, textDecorationLine: 'underline' },
  activityDesc: { fontSize: 12, color: '#555', marginTop: 4, fontStyle: 'italic' },
  activityDistance: { fontSize: 12, color: '#888', marginTop: 2 },
  wikiBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 2 },
}); 
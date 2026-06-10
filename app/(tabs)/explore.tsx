import { searchWikipediaPlaces } from '@/features/explore/services/wikipedia';
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
  TextInput,
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

const categories = [
  { id: 1, name: 'Aventure',    icon: 'trail-sign-outline' },
  { id: 2, name: 'Plage',       icon: 'sunny-outline' },
  { id: 3, name: 'Ville',       icon: 'business-outline' },
  { id: 4, name: 'Culture',     icon: 'library-outline' },
  { id: 5, name: 'Nature',      icon: 'leaf-outline' },
  { id: 6, name: 'Gastronomie', icon: 'restaurant-outline' },
];

const popularDestinations = [
  { name: 'Paris',    country: 'France',        image: require('@/assets/images/temple-bali-sunset.jpg') },
  { name: 'Rome',     country: 'Italie',         image: require('@/assets/images/temple-water-sunset.jpg') },
  { name: 'Tokyo',    country: 'Japon',          image: require('@/assets/images/mountain-background.jpg') },
  { name: 'New York', country: 'États-Unis',     image: require('@/assets/images/temple-bali-sunset.jpg') },
  { name: 'Bali',     country: 'Indonésie',      image: require('@/assets/images/temple-bali-sunset.jpg') },
  { name: 'Le Cap',   country: 'Afrique du Sud', image: require('@/assets/images/temple-water-sunset.jpg') },
];

function SectionHead({ title }: { title: string }) {
  return (
    <View style={sh.row}>
      <View style={sh.accent} />
      <Text style={sh.title}>{title}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingBottom: 14, paddingTop: 28 },
  accent: { width: 3, height: 16, backgroundColor: C.cream, borderRadius: 2, marginRight: 12 },
  title:  { fontSize: 11, letterSpacing: 3, color: C.creamDim, fontWeight: '400' },
});

export default function ExploreScreen() {
  const [searchText, setSearchText]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity]     = useState<any | null>(null);
  const [loading, setLoading]               = useState(false);
  const [destinations, setDestinations]     = useState<any[]>([]);
  const [searchFocused, setSearchFocused]   = useState(false);

  useEffect(() => {
    if (!selectedCity) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const places = await searchWikipediaPlaces(selectedCity.name, {
          limit: 50,
          radius: 10000,
        });
        setDestinations(places);
      } catch { setDestinations([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [selectedCity, selectedCategory]);

  const filteredCities = popularDestinations.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase()) ||
    c.country.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleDestinationPress = (destination: any) => {
    Alert.alert(destination.name, `Découvrir ${destination.name}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>EXPLORER</Text>
          <Text style={styles.subtitle}>Trouvez votre prochaine aventure</Text>
        </View>

        {/* SEARCH */}
        <View style={styles.searchWrap}>
          <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
            <Ionicons name="search-outline" size={18} color={searchFocused ? C.cream : C.creamDim} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une destination…"
              placeholderTextColor={C.whiteDim}
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={18} color={C.creamDim} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* CATEGORIES */}
        <SectionHead title="CATÉGORIES" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {categories.map(cat => {
            const active = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, active && styles.catPillActive]}
                onPress={() => setSelectedCategory(active ? null : cat.name)}
              >
                <Ionicons name={cat.icon as any} size={16} color={active ? C.bg : C.cream} />
                <Text style={[styles.catLabel, active && styles.catLabelActive]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* DESTINATIONS POPULAIRES — grid 2 colonnes */}
        {!selectedCity && (
          <>
            <SectionHead title="DESTINATIONS POPULAIRES" />
            {filteredCities.length > 0 ? (
              <View style={styles.grid}>
                {filteredCities.map((c, idx) => (
                  <TouchableOpacity key={c.name + idx} style={styles.gridCard} onPress={() => setSelectedCity(c)}>
                    <Image source={c.image} style={styles.gridImage} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.78)']}
                      style={styles.gridOverlay}
                    >
                      <Text style={styles.gridName}>{c.name}</Text>
                      <Text style={styles.gridCountry}>{c.country}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyInline}>
                <Text style={styles.emptyText}>Aucune destination trouvée</Text>
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Text style={styles.resetText}>Réinitialiser</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* LIEUX D'UNE VILLE */}
        {selectedCity && (
          <>
            <View style={styles.cityHeader}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedCity(null)}>
                <Ionicons name="arrow-back" size={20} color={C.cream} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.cityTitle}>{selectedCity.name}</Text>
                <Text style={styles.cityCountry}>{selectedCity.country}</Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={C.cream} />
              </View>
            ) : destinations.length > 0 ? (
              <View style={styles.placesList}>
                {destinations.map(dest => {
                  const hasImg = !!(dest.preview?.source || dest.image);
                  return hasImg ? (
                    <TouchableOpacity
                      key={dest.xid || dest.id}
                      style={styles.placeCard}
                      onPress={() => handleDestinationPress(dest)}
                    >
                      <Image source={{ uri: dest.preview?.source || dest.image }} style={styles.placeImage} />
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={styles.placeOverlay}>
                        <Text style={styles.placeName}>{dest.name}</Text>
                        {dest.kinds && <Text style={styles.placeKind}>{dest.kinds.split(',')[0]}</Text>}
                      </LinearGradient>
                      {!!dest.rate && (
                        <View style={styles.rateBadge}>
                          <Ionicons name="star" size={11} color={C.cream} />
                          <Text style={styles.rateText}>{dest.rate}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      key={dest.xid || dest.id}
                      style={styles.placeCardSimple}
                      onPress={() => handleDestinationPress(dest)}
                    >
                      <View style={styles.placeSimpleIcon}>
                        <Ionicons name="location-outline" size={18} color={C.cream} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.placeSimpleName}>{dest.name}</Text>
                        {dest.kinds && <Text style={styles.placeSimpleKind}>{dest.kinds.split(',')[0]}</Text>}
                      </View>
                      {!!dest.rate && <Text style={styles.placeSimpleRate}>★ {dest.rate}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyInline}>
                <Text style={styles.emptyText}>Aucun lieu trouvé</Text>
              </View>
            )}
          </>
        )}

        {/* PLANIFICATEUR IA */}
        <SectionHead title="BESOIN D'AIDE ?" />
        <TouchableOpacity style={styles.plannerCard} onPress={() => router.push('/plan-trip')}>
          <View style={styles.plannerLeft}>
            <View style={styles.plannerIcon}>
              <Ionicons name="bulb-outline" size={26} color={C.cream} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.plannerTitle}>Planificateur IA</Text>
            <Text style={styles.plannerSub}>Laissez notre IA créer votre voyage parfait</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.creamDim} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll:    { paddingBottom: 120 },

  header: { paddingHorizontal: 22, paddingTop: 56, paddingBottom: 20 },
  title: {
    fontSize: 30,
    fontWeight: '200',
    letterSpacing: 6,
    color: C.cream,
    marginBottom: 6,
  },
  subtitle: { fontSize: 13, color: C.creamDim, fontWeight: '300', letterSpacing: 0.5 },

  searchWrap: { paddingHorizontal: 22, marginBottom: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchBarFocused: { borderColor: C.cream },
  searchInput: { flex: 1, fontSize: 14, color: C.white, fontWeight: '300' },

  catScroll: { paddingHorizontal: 22, paddingBottom: 4, gap: 10 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  catPillActive: { backgroundColor: C.cream, borderColor: C.cream },
  catLabel:       { fontSize: 13, color: C.cream, fontWeight: '300' },
  catLabelActive: { color: C.bg, fontWeight: '500' },

  /* 2-col grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 22,
    gap: 12,
  },
  gridCard: {
    width: '47%',
    height: 155,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  gridImage:   { width: '100%', height: '100%', resizeMode: 'cover' },
  gridOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  gridName:    { fontSize: 16, fontWeight: '500', color: C.white, letterSpacing: 0.3 },
  gridCountry: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  emptyInline: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText:   { fontSize: 14, color: C.creamDim, fontWeight: '300' },
  resetText:   { fontSize: 13, color: C.cream, fontWeight: '400', letterSpacing: 0.5 },

  /* City header */
  cityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 14,
    gap: 14,
  },
  backBtn:     { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center' },
  cityTitle:   { fontSize: 22, fontWeight: '200', color: C.white, letterSpacing: 1 },
  cityCountry: { fontSize: 12, color: C.creamDim, marginTop: 2 },

  loadingWrap: { alignItems: 'center', paddingVertical: 40 },

  placesList: { paddingHorizontal: 22, gap: 12 },
  placeCard: {
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  placeImage:   { width: '100%', height: '100%', resizeMode: 'cover' },
  placeOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  placeName:    { fontSize: 17, fontWeight: '500', color: C.white },
  placeKind:    { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  rateBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  rateText: { fontSize: 11, color: C.cream, fontWeight: '500' },

  placeCardSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 12,
  },
  placeSimpleIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(122,184,245,0.08)',
    borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  placeSimpleName:  { fontSize: 15, color: C.white, fontWeight: '300', marginBottom: 2 },
  placeSimpleKind:  { fontSize: 11, color: C.creamDim },
  placeSimpleRate:  { fontSize: 13, color: C.cream },

  plannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 22,
    padding: 20,
    gap: 14,
  },
  plannerLeft: {},
  plannerIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(122,184,245,0.07)',
    borderWidth: 1, borderColor: C.creamFaint,
    justifyContent: 'center', alignItems: 'center',
  },
  plannerTitle: { fontSize: 16, fontWeight: '300', color: C.white, marginBottom: 4 },
  plannerSub:   { fontSize: 12, color: C.creamDim, lineHeight: 18, fontWeight: '300' },
});

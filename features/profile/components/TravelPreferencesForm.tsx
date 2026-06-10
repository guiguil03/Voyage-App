import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Profile } from '@/features/profile/services/profiles';

const C = {
  bg:         '#0D0D0D',
  border:     'rgba(122,184,245,0.12)',
  borderMid:  'rgba(122,184,245,0.22)',
  cream:      '#7AB8F5',
  creamDim:   'rgba(122,184,245,0.50)',
  creamFaint: 'rgba(122,184,245,0.10)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.45)',
};

interface TravelPreferencesFormProps {
  profile: Profile | null;
  onSave: (preferences: Profile['travel_preferences']) => Promise<void>;
  loading?: boolean;
}

export default function TravelPreferencesForm({ profile, onSave, loading = false }: TravelPreferencesFormProps) {
  const [preferences, setPreferences] = useState({
    budget_range:       profile?.travel_preferences?.budget_range       || '',
    travel_style:       profile?.travel_preferences?.travel_style       || [] as string[],
    interests:          profile?.travel_preferences?.interests          || [] as string[],
    accommodation_type: profile?.travel_preferences?.accommodation_type || [] as string[],
  });

  const [saving, setSaving] = useState(false);

  const budgetOptions = [
    { id: 'budget',    label: '€ Petit budget',   icon: 'wallet' },
    { id: 'mid-range', label: '€€ Budget moyen',  icon: 'card' },
    { id: 'luxury',    label: '€€€ Luxe',         icon: 'diamond' },
    { id: 'unlimited', label: '💸 Sans limite',    icon: 'infinite' },
  ];

  const travelStyleOptions = [
    { id: 'adventure',   label: 'Aventure',    icon: 'bicycle' },
    { id: 'cultural',    label: 'Culture',     icon: 'library' },
    { id: 'relaxation',  label: 'Détente',     icon: 'leaf' },
    { id: 'family',      label: 'Famille',     icon: 'people' },
    { id: 'romantic',    label: 'Romantique',  icon: 'heart' },
    { id: 'business',    label: 'Business',    icon: 'briefcase' },
    { id: 'backpacking', label: 'Backpacking', icon: 'bag' },
    { id: 'luxury',      label: 'Luxe',        icon: 'diamond' },
  ];

  const interestOptions = [
    { id: 'history',      label: 'Histoire',       icon: 'library' },
    { id: 'food',         label: 'Gastronomie',    icon: 'restaurant' },
    { id: 'nature',       label: 'Nature',         icon: 'leaf' },
    { id: 'photography',  label: 'Photo',          icon: 'camera' },
    { id: 'sports',       label: 'Sports',         icon: 'fitness' },
    { id: 'art',          label: 'Art',            icon: 'color-palette' },
    { id: 'music',        label: 'Musique',        icon: 'musical-notes' },
    { id: 'architecture', label: 'Architecture',   icon: 'business' },
    { id: 'shopping',     label: 'Shopping',       icon: 'bag' },
    { id: 'nightlife',    label: 'Vie nocturne',   icon: 'wine' },
  ];

  const accommodationOptions = [
    { id: 'hotel',      label: 'Hôtel',    icon: 'bed' },
    { id: 'hostel',     label: 'Auberge',  icon: 'people' },
    { id: 'airbnb',     label: 'Airbnb',   icon: 'home' },
    { id: 'resort',     label: 'Resort',   icon: 'umbrella' },
    { id: 'camping',    label: 'Camping',  icon: 'leaf' },
    { id: 'guesthouse', label: 'Pension',  icon: 'business' },
  ];

  const handleSave = async () => {
    if (saving || loading) return;
    setSaving(true);
    try {
      await onSave(preferences);
      Alert.alert('Succès', 'Préférences mises à jour !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

  const has = (arr: string[], id: string) => arr.includes(id);

  const Section = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.accent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {sub && <Text style={styles.sectionSub}>{sub}</Text>}
      {children}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

      {/* BUDGET */}
      <Section title="Budget préféré">
        <View style={styles.grid}>
          {budgetOptions.map(opt => {
            const sel = preferences.budget_range === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, sel && styles.chipSelected]}
                onPress={() => setPreferences(p => ({ ...p, budget_range: opt.id }))}
              >
                <Ionicons name={opt.icon as any} size={20} color={sel ? C.bg : C.cream} />
                <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Section>

      {/* STYLE DE VOYAGE */}
      <Section title="Style de voyage" sub="Sélectionnez tous ceux qui vous intéressent">
        <View style={styles.grid}>
          {travelStyleOptions.map(opt => {
            const sel = has(preferences.travel_style, opt.id);
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, sel && styles.chipSelected]}
                onPress={() => setPreferences(p => ({ ...p, travel_style: toggle(p.travel_style, opt.id) }))}
              >
                <Ionicons name={opt.icon as any} size={20} color={sel ? C.bg : C.cream} />
                <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Section>

      {/* INTÉRÊTS */}
      <Section title="Centres d'intérêt" sub="Qu'est-ce qui vous passionne en voyage ?">
        <View style={styles.grid}>
          {interestOptions.map(opt => {
            const sel = has(preferences.interests, opt.id);
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, sel && styles.chipSelected]}
                onPress={() => setPreferences(p => ({ ...p, interests: toggle(p.interests, opt.id) }))}
              >
                <Ionicons name={opt.icon as any} size={20} color={sel ? C.bg : C.cream} />
                <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Section>

      {/* HÉBERGEMENT */}
      <Section title="Hébergements préférés" sub="Où aimez-vous séjourner ?">
        <View style={styles.grid}>
          {accommodationOptions.map(opt => {
            const sel = has(preferences.accommodation_type, opt.id);
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, sel && styles.chipSelected]}
                onPress={() => setPreferences(p => ({ ...p, accommodation_type: toggle(p.accommodation_type, opt.id) }))}
              >
                <Ionicons name={opt.icon as any} size={20} color={sel ? C.bg : C.cream} />
                <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Section>

      <TouchableOpacity
        style={[styles.saveBtn, (saving || loading) && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving || loading}
      >
        <Ionicons name="checkmark" size={20} color={C.bg} style={{ marginRight: 8 }} />
        <Text style={styles.saveBtnText}>{saving ? 'Sauvegarde…' : 'Sauvegarder les préférences'}</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content:   { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 60 },

  section:      { marginBottom: 28 },
  sectionHead:  { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  accent:       { width: 3, height: 16, backgroundColor: '#7AB8F5', borderRadius: 2, marginRight: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '400', color: C.white, letterSpacing: 0.4 },
  sectionSub:   { fontSize: 12, color: C.creamDim, marginBottom: 12, fontWeight: '300' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(122,184,245,0.06)',
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingVertical: 9, paddingHorizontal: 14,
  },
  chipSelected:     { backgroundColor: C.cream, borderColor: C.cream },
  chipText:         { fontSize: 13, color: C.whiteDim, fontWeight: '400' },
  chipTextSelected: { color: C.bg, fontWeight: '600' },

  saveBtn: {
    backgroundColor: C.cream, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, marginTop: 4,
    shadowColor: C.cream, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5,
  },
  saveBtnDisabled: { backgroundColor: 'rgba(122,184,245,0.25)', shadowOpacity: 0, elevation: 0 },
  saveBtnText: { color: C.bg, fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
});

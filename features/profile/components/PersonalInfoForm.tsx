import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Profile, ProfileUpdate } from '@/features/profile/services/profiles';

const C = {
  bg:         '#0D0D0D',
  card:       'rgba(18,18,18,0.95)',
  border:     'rgba(122,184,245,0.12)',
  borderMid:  'rgba(122,184,245,0.22)',
  cream:      '#7AB8F5',
  creamDim:   'rgba(122,184,245,0.50)',
  creamFaint: 'rgba(122,184,245,0.10)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.45)',
};

interface PersonalInfoFormProps {
  profile: Profile | null;
  onSave: (data: ProfileUpdate) => Promise<void>;
  loading?: boolean;
}

export default function PersonalInfoForm({ profile, onSave, loading = false }: PersonalInfoFormProps) {
  const [formData, setFormData] = useState({
    full_name:     profile?.full_name     || '',
    username:      profile?.username      || '',
    bio:           profile?.bio           || '',
    phone:         profile?.phone         || '',
    country:       profile?.country       || '',
    city:          profile?.city          || '',
    website:       profile?.website       || '',
    date_of_birth: profile?.date_of_birth || '',
  });

  const [saving, setSaving]           = useState(false);
  const [focused, setFocused]         = useState<string | null>(null);

  const update = (key: string, value: string) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (saving || loading) return;
    if (!formData.full_name.trim()) {
      Alert.alert('Erreur', 'Le nom complet est requis');
      return;
    }
    setSaving(true);
    try {
      await onSave(formData);
      Alert.alert('Succès', 'Informations mises à jour !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof typeof formData; icon: string; placeholder: string; extra?: object }[] = [
    { key: 'full_name',     icon: 'person',            placeholder: 'Votre nom complet' },
    { key: 'username',      icon: 'at',                placeholder: 'votre_pseudo' },
    { key: 'phone',         icon: 'call',              placeholder: '+33 6 12 34 56 78', extra: { keyboardType: 'phone-pad' } },
    { key: 'country',       icon: 'flag',              placeholder: 'France' },
    { key: 'city',          icon: 'location',          placeholder: 'Paris' },
    { key: 'website',       icon: 'globe',             placeholder: 'https://votre-site.com', extra: { autoCapitalize: 'none', keyboardType: 'url' } },
    { key: 'date_of_birth', icon: 'calendar',          placeholder: 'JJ/MM/AAAA', extra: { keyboardType: 'numeric' } },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

      <View style={styles.sectionHead}>
        <View style={styles.accent} />
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
      </View>
      <Text style={styles.sectionSub}>Complétez votre profil pour une meilleure expérience</Text>

      {/* BIO — champ séparé car multiline */}
      <View style={[styles.field, focused === 'bio' && styles.fieldFocused]}>
        <View style={styles.fieldIcon}>
          <Ionicons name="chatbubble-ellipses" size={18} color={C.cream} />
        </View>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={formData.bio}
          onChangeText={v => update('bio', v)}
          placeholder="Parlez-nous de vous et de votre passion pour les voyages…"
          placeholderTextColor="rgba(255,255,255,0.28)"
          multiline
          textAlignVertical="top"
          onFocus={() => setFocused('bio')}
          onBlur={() => setFocused(null)}
        />
      </View>

      {fields.map(({ key, icon, placeholder, extra = {} }) => (
        <View key={key} style={[styles.field, focused === key && styles.fieldFocused]}>
          <View style={styles.fieldIcon}>
            <Ionicons name={icon as any} size={18} color={C.cream} />
          </View>
          <TextInput
            style={styles.input}
            value={formData[key]}
            onChangeText={v => update(key, key === 'username' ? v.toLowerCase() : v)}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.28)"
            onFocus={() => setFocused(key)}
            onBlur={() => setFocused(null)}
            {...(extra as any)}
          />
        </View>
      ))}

      <TouchableOpacity
        style={[styles.saveBtn, (saving || loading) && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving || loading}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark" size={20} color={C.bg} style={{ marginRight: 8 }} />
        <Text style={styles.saveBtnText}>{saving ? 'Sauvegarde…' : 'Sauvegarder'}</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content:   { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 60 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  accent:      { width: 3, height: 16, backgroundColor: '#7AB8F5', borderRadius: 2, marginRight: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '400', color: C.white, letterSpacing: 0.5 },
  sectionSub:   { fontSize: 13, color: C.creamDim, marginBottom: 22, fontWeight: '300' },

  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(122,184,245,0.06)',
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12,
  },
  fieldFocused: { borderColor: 'rgba(122,184,245,0.40)', backgroundColor: 'rgba(122,184,245,0.09)' },
  fieldIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  input: { flex: 1, fontSize: 15, color: C.white, fontWeight: '300' },
  bioInput: { minHeight: 80, textAlignVertical: 'top', paddingTop: 2 },

  saveBtn: {
    backgroundColor: C.cream, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, marginTop: 8,
    shadowColor: C.cream, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5,
  },
  saveBtnDisabled: { backgroundColor: 'rgba(122,184,245,0.25)', shadowOpacity: 0, elevation: 0 },
  saveBtnText: { color: C.bg, fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
});

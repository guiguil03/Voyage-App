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
  bg:          '#0D0D0D',
  border:      'rgba(122,184,245,0.15)',
  borderFocus: 'rgba(122,184,245,0.50)',
  cream:       '#7AB8F5',
  creamDim:    'rgba(122,184,245,0.50)',
  white:       '#FFFFFF',
  whiteDim:    'rgba(255,255,255,0.28)',
  inputBg:     'rgba(255,255,255,0.04)',
};

interface PersonalInfoFormProps {
  profile: Profile | null;
  onSave: (data: ProfileUpdate) => Promise<void>;
  loading?: boolean;
}

const FIELDS: { key: string; label: string; placeholder: string; extra?: object }[] = [
  { key: 'full_name',     label: 'Nom complet',         placeholder: 'Votre nom complet' },
  { key: 'username',      label: 'Pseudo',               placeholder: 'votre_pseudo' },
  { key: 'phone',         label: 'Téléphone',            placeholder: '+33 6 12 34 56 78', extra: { keyboardType: 'phone-pad' } },
  { key: 'country',       label: 'Pays',                 placeholder: 'France' },
  { key: 'city',          label: 'Ville',                placeholder: 'Paris' },
  { key: 'website',       label: 'Site web',             placeholder: 'https://votre-site.com', extra: { autoCapitalize: 'none', keyboardType: 'url' } },
  { key: 'date_of_birth', label: 'Date de naissance',   placeholder: 'JJ/MM/AAAA', extra: { keyboardType: 'numeric' } },
];

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

  const [saving, setSaving]   = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

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

  const inp = (key: string) => ({
    onFocus: () => setFocused(key),
    onBlur:  () => setFocused(null),
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

      {/* BIO */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput, focused === 'bio' && styles.inputFocused]}
          value={formData.bio}
          onChangeText={v => update('bio', v)}
          placeholder="Votre passion pour les voyages…"
          placeholderTextColor={C.whiteDim}
          multiline
          textAlignVertical="top"
          {...inp('bio')}
        />
      </View>

      {FIELDS.map(({ key, label, placeholder, extra = {} }) => (
        <View key={key} style={styles.fieldGroup}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[styles.input, focused === key && styles.inputFocused]}
            value={(formData as any)[key]}
            onChangeText={v => update(key, key === 'username' ? v.toLowerCase() : v)}
            placeholder={placeholder}
            placeholderTextColor={C.whiteDim}
            {...inp(key)}
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
        <Text style={styles.saveBtnText}>{saving ? 'Sauvegarde…' : 'Sauvegarder'}</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content:   { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 60 },

  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 13, color: C.creamDim, fontWeight: '400', marginBottom: 8 },

  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: C.white, fontWeight: '300',
  },
  inputFocused: { borderColor: C.borderFocus },
  bioInput: { minHeight: 90, textAlignVertical: 'top', lineHeight: 22 },

  saveBtn: {
    backgroundColor: C.cream,
    paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnDisabled: { backgroundColor: 'rgba(122,184,245,0.25)' },
  saveBtnText: { color: C.bg, fontSize: 16, fontWeight: '600' },
});

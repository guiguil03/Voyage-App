import { createVoyage } from '@/features/trips/services/voyages';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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
  bg:       '#0D0D0D',
  border:   'rgba(122,184,245,0.15)',
  borderFocus: 'rgba(122,184,245,0.50)',
  cream:    '#7AB8F5',
  creamDim: 'rgba(122,184,245,0.50)',
  white:    '#FFFFFF',
  whiteDim: 'rgba(255,255,255,0.45)',
  inputBg:  'rgba(255,255,255,0.04)',
  danger:   '#EF4444',
};

const TRIP_TYPES = ['Solo', 'Couple', 'Famille', 'Groupe', 'Amis'];
const DURATIONS  = ['1-3 jours', '4-7 jours', '1-2 semaines', '2+ semaines'];

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}{required && <Text style={{ color: C.cream }}> *</Text>}
    </Text>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Label text={label} required={required} />
      {children}
    </View>
  );
}

function Divider({ title }: { title: string }) {
  return (
    <View style={styles.divider}>
      <Text style={styles.dividerText}>{title}</Text>
    </View>
  );
}

export default function CreateMemoryScreen() {
  const [tripName, setTripName]           = useState('');
  const [destination, setDestination]     = useState('');
  const [description, setDescription]     = useState('');
  const [imageUrl, setImageUrl]           = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedTripType, setSelectedTripType] = useState('Solo');
  const [selectedRating, setSelectedRating]     = useState(5);
  const [selectedDuration, setSelectedDuration] = useState('1-3 jours');
  const [memoryText, setMemoryText]             = useState('');
  const [focused, setFocused]                   = useState<string | null>(null);

  const pickImages = async () => {
    Alert.alert('Ajouter des photos', '', [
      {
        text: 'Galerie', onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permission requise', "Accès à la galerie nécessaire."); return; }
          const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8, selectionLimit: 10 });
          if (!res.canceled) setSelectedImages(prev => [...prev, ...res.assets.map(a => a.uri)]);
        },
      },
      {
        text: 'Appareil photo', onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permission requise', "Accès à l'appareil photo nécessaire."); return; }
          const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.8 });
          if (!res.canceled) setSelectedImages(prev => [...prev, res.assets[0].uri]);
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!tripName.trim() || !destination.trim()) {
      Alert.alert('Champs requis', 'Nom du voyage et destination sont obligatoires.');
      return;
    }
    const allImages = [...selectedImages, ...(imageUrl.trim() ? [imageUrl.trim()] : [])];
    const { error } = await createVoyage({
      tripName, destination, description,
      imageUrl: allImages[0] || '',
      images: allImages,
      tripType: selectedTripType,
      rating: selectedRating,
      duration: selectedDuration,
      memoryText,
    });
    if (error) { Alert.alert('Erreur', error); return; }
    Alert.alert('Souvenir sauvegardé !', `"${tripName}" a été ajouté.`, [
      { text: 'Voir mes voyages', onPress: () => router.push('/(tabs)/voyage') },
      { text: "Retour à l'accueil",  onPress: () => router.push('/(tabs)/home') },
    ]);
  };

  const inp = (key: string) => ({
    onFocus: () => setFocused(key),
    onBlur:  () => setFocused(null),
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={C.cream} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau souvenir</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── INFO ── */}
        <Field label="Nom du voyage" required>
          <TextInput
            style={[styles.input, focused === 'name' && styles.inputFocused]}
            value={tripName}
            onChangeText={setTripName}
            placeholder="Ex : Escapade à Kyoto"
            placeholderTextColor={C.whiteDim}
            {...inp('name')}
          />
        </Field>

        <Field label="Destination" required>
          <TextInput
            style={[styles.input, focused === 'dest' && styles.inputFocused]}
            value={destination}
            onChangeText={setDestination}
            placeholder="Ex : Kyoto, Japon"
            placeholderTextColor={C.whiteDim}
            {...inp('dest')}
          />
        </Field>

        <Field label="Description">
          <TextInput
            style={[styles.input, styles.textarea, focused === 'desc' && styles.inputFocused]}
            value={description}
            onChangeText={setDescription}
            placeholder="Un résumé de votre voyage…"
            placeholderTextColor={C.whiteDim}
            multiline textAlignVertical="top"
            {...inp('desc')}
          />
        </Field>

        {/* ── PHOTOS ── */}
        <Field label="Photos">
          <TouchableOpacity style={styles.photoBtn} onPress={pickImages}>
            <Ionicons name="camera-outline" size={20} color={C.cream} />
            <Text style={styles.photoBtnText}>Ajouter des photos</Text>
          </TouchableOpacity>
          {selectedImages.length > 0 && (
            <View style={styles.photoGrid}>
              {selectedImages.map((uri, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImg} />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => setSelectedImages(p => p.filter((_, idx) => idx !== i))}>
                    <Ionicons name="close-circle" size={20} color={C.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TextInput
            style={[styles.input, { marginTop: 8 }, focused === 'url' && styles.inputFocused]}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="Ou coller une URL d'image"
            placeholderTextColor={C.whiteDim}
            autoCapitalize="none"
            {...inp('url')}
          />
        </Field>

        <Divider title="Détails" />

        {/* ── TYPE ── */}
        <Field label="Type de voyage">
          <View style={styles.chips}>
            {TRIP_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, selectedTripType === t && styles.chipActive]}
                onPress={() => setSelectedTripType(t)}
              >
                <Text style={[styles.chipText, selectedTripType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* ── DURÉE ── */}
        <Field label="Durée">
          <View style={styles.chips}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, selectedDuration === d && styles.chipActive]}
                onPress={() => setSelectedDuration(d)}
              >
                <Text style={[styles.chipText, selectedDuration === d && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* ── NOTE ── */}
        <Field label="Note">
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(s => (
              <TouchableOpacity key={s} onPress={() => setSelectedRating(s)}>
                <Ionicons
                  name="star"
                  size={32}
                  color={s <= selectedRating ? '#F59E0B' : 'rgba(255,255,255,0.12)'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Divider title="Souvenir" />

        {/* ── TEXTE ── */}
        <Field label="Racontez votre expérience">
          <TextInput
            style={[styles.input, styles.memArea, focused === 'mem' && styles.inputFocused]}
            value={memoryText}
            onChangeText={setMemoryText}
            placeholder="Vos meilleurs moments, anecdotes, conseils…"
            placeholderTextColor={C.whiteDim}
            multiline textAlignVertical="top"
            {...inp('mem')}
          />
        </Field>

        {/* ── SAVE ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Sauvegarder le souvenir</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(122,184,245,0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '300', color: C.white },

  scroll: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 100 },

  fieldGroup: { marginBottom: 24 },
  label: { fontSize: 13, color: C.creamDim, fontWeight: '400', marginBottom: 8 },

  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: C.white, fontWeight: '300',
  },
  inputFocused: { borderColor: C.borderFocus },
  textarea: { minHeight: 90, textAlignVertical: 'top', lineHeight: 22 },
  memArea:  { minHeight: 140, textAlignVertical: 'top', lineHeight: 22 },

  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: C.inputBg,
  },
  photoBtnText: { fontSize: 15, color: C.cream, fontWeight: '300' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  photoThumb: { width: '47%', borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoImg:   { width: '100%', height: 110, borderRadius: 10 },
  photoRemove:{ position: 'absolute', top: 6, right: 6 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.inputBg,
  },
  chipActive: { backgroundColor: 'rgba(122,184,245,0.15)', borderColor: C.cream },
  chipText:       { fontSize: 14, color: C.whiteDim, fontWeight: '300' },
  chipTextActive: { color: C.cream, fontWeight: '500' },

  stars: { flexDirection: 'row', gap: 8, paddingVertical: 4 },

  divider: { marginBottom: 24, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  dividerText: { fontSize: 12, color: C.creamDim, letterSpacing: 1.5, fontWeight: '300' },

  saveBtn: {
    backgroundColor: C.cream, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: C.bg },
});

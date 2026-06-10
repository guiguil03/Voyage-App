import InputField from '@/features/trips/components/InputField';
import SelectionButton from '@/features/trips/components/SelectionButton';
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
  bg:         '#0D0D0D',
  card:       'rgba(18,18,18,0.95)',
  border:     'rgba(122,184,245,0.12)',
  borderMid:  'rgba(122,184,245,0.22)',
  cream:      '#7AB8F5',
  creamDim:   'rgba(122,184,245,0.50)',
  creamFaint: 'rgba(122,184,245,0.14)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.45)',
  danger:     '#EF4444',
};

export default function CreateMemoryScreen() {
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageSource, setImageSource] = useState<'url' | 'gallery'>('url');
  const [selectedTripType, setSelectedTripType] = useState('Solo');
  const [selectedRating, setSelectedRating] = useState('5');
  const [selectedDuration, setSelectedDuration] = useState('1-3 jours');
  const [memoryText, setMemoryText] = useState('');

  const tripTypes = ['Solo', 'Couple', 'Famille', 'Groupe', 'Amis'];
  const ratings = ['1', '2', '3', '4', '5'];
  const durations = ['1-3 jours', '4-7 jours', '1-2 semaines', '2+ semaines'];

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission requise', "L'accès à la galerie photo est nécessaire pour sélectionner une image.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages]);
        setImageSource('gallery');
        setImageUrl('');
      }
    } catch (error) {
      console.error("Erreur lors de la sélection d'image:", error);
      Alert.alert('Erreur', "Impossible de sélectionner l'image");
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission requise', "L'accès à l'appareil photo est nécessaire pour prendre une photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        setSelectedImages(prev => [...prev, result.assets[0].uri]);
        setImageSource('gallery');
        setImageUrl('');
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const chooseImageSource = () => {
    Alert.alert(
      'Ajouter des images',
      'Comment souhaitez-vous ajouter des images ?',
      [
        { text: 'Galerie (multiple)', onPress: pickImageFromGallery },
        { text: 'Prendre une photo', onPress: takePhotoWithCamera },
        { text: "URL d'image", onPress: () => setImageSource('url') },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const removeImage = (imageToRemove: string) => {
    setSelectedImages(prev => prev.filter(img => img !== imageToRemove));
  };

  const handleSaveMemory = async () => {
    if (!tripName.trim() || !destination.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner au moins le nom du voyage et la destination');
      return;
    }
    try {
      const allImages = [...selectedImages];
      if (imageUrl.trim()) allImages.push(imageUrl.trim());
      const { error } = await createVoyage({
        tripName, destination, description,
        imageUrl: allImages[0] || '',
        images: allImages,
        tripType: selectedTripType,
        rating: parseInt(selectedRating),
        duration: selectedDuration,
        memoryText,
      });
      if (error) {
        Alert.alert('Erreur', `Impossible de sauvegarder le voyage: ${error}`);
        return;
      }
      Alert.alert(
        'Souvenir sauvegardé !',
        `Votre voyage "${tripName}" à ${destination} a été ajouté à vos souvenirs.`,
        [
          { text: 'Voir mes voyages', onPress: () => router.push('/(tabs)/voyage') },
          { text: "Retour à l'accueil", onPress: () => router.push('/(tabs)/home') },
          {
            text: 'Ajouter un autre',
            onPress: () => {
              setTripName(''); setDestination(''); setDescription('');
              setImageUrl(''); setSelectedImages([]); setMemoryText('');
              setSelectedTripType('Solo'); setSelectedRating('5'); setSelectedDuration('1-3 jours');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur inattendue est survenue lors de la sauvegarde.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Nouveau Souvenir</Text>
          <Text style={styles.subtitle}>Immortalisez vos plus beaux moments</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* INFORMATIONS GÉNÉRALES */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <Ionicons name="information-circle" size={22} color={C.cream} />
            </View>
            <Text style={styles.sectionTitle}>Informations générales</Text>
          </View>

          <View style={styles.cardBody}>
            <InputField
              label="Nom du voyage"
              placeholder="Ex : Escapade à Paris"
              value={tripName}
              onChangeText={setTripName}
              iconName="airplane"
            />

            <InputField
              label="Destination"
              placeholder="Ex : Paris, France"
              value={destination}
              onChangeText={setDestination}
              iconName="location"
            />

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Décrivez votre voyage en quelques mots…"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="rgba(255,255,255,0.28)"
              />
            </View>

            {/* IMAGES */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Images du voyage</Text>
              <Text style={styles.fieldSub}>Ajoutez des photos pour illustrer votre souvenir</Text>

              <TouchableOpacity style={styles.imagePickerBtn} onPress={chooseImageSource}>
                <Ionicons name="camera" size={30} color={C.cream} />
                <Text style={styles.imagePickerText}>Ajouter des images</Text>
                <Text style={styles.imagePickerSub}>Sélection multiple depuis la galerie</Text>
              </TouchableOpacity>

              {selectedImages.length > 0 && (
                <View style={styles.imagesGrid}>
                  {selectedImages.map((uri, index) => (
                    <View key={index} style={styles.imageThumb}>
                      <Image source={{ uri }} style={styles.thumbImg} />
                      <View style={styles.thumbBadge}>
                        <Text style={styles.thumbNum}>{index + 1}</Text>
                      </View>
                      <TouchableOpacity style={styles.thumbRemove} onPress={() => removeImage(uri)}>
                        <Ionicons name="close-circle" size={22} color={C.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {imageUrl.trim() !== '' && (
                <View style={styles.imageThumb}>
                  <Image source={{ uri: imageUrl }} style={styles.thumbImg} />
                  <View style={styles.thumbBadge}>
                    <Text style={styles.thumbNum}>URL</Text>
                  </View>
                  <TouchableOpacity style={styles.thumbRemove} onPress={() => setImageUrl('')}>
                    <Ionicons name="close-circle" size={22} color={C.danger} />
                  </TouchableOpacity>
                </View>
              )}

              {imageSource === 'url' && (
                <InputField
                  label="URL de l'image"
                  placeholder="https://exemple.com/image.jpg"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  iconName="link"
                />
              )}
            </View>
          </View>
        </View>

        {/* DÉTAILS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <Ionicons name="calendar" size={22} color={C.cream} />
            </View>
            <Text style={styles.sectionTitle}>Détails du voyage</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.selectionGroup}>
              <Text style={styles.fieldLabel}>Type de voyage</Text>
              <View style={styles.selectionRow}>
                {tripTypes.map((type) => (
                  <SelectionButton
                    key={type}
                    title={type}
                    selected={selectedTripType === type}
                    onPress={() => setSelectedTripType(type)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.selectionGroup}>
              <Text style={styles.fieldLabel}>Durée</Text>
              <View style={styles.selectionRow}>
                {durations.map((d) => (
                  <SelectionButton
                    key={d}
                    title={d}
                    selected={selectedDuration === d}
                    onPress={() => setSelectedDuration(d)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.selectionGroup}>
              <Text style={styles.fieldLabel}>Note globale</Text>
              <View style={styles.ratingRow}>
                {ratings.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.starBtn, selectedRating >= r && styles.starBtnSelected]}
                    onPress={() => setSelectedRating(r)}
                  >
                    <Ionicons name="star" size={26} color={selectedRating >= r ? '#FFD700' : 'rgba(255,255,255,0.18)'} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* SOUVENIRS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <Ionicons name="heart" size={22} color={C.cream} />
            </View>
            <Text style={styles.sectionTitle}>Vos souvenirs</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Racontez votre expérience</Text>
              <TextInput
                style={styles.memoryArea}
                placeholder="Partagez vos meilleurs moments, anecdotes, conseils…"
                value={memoryText}
                onChangeText={setMemoryText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="rgba(255,255,255,0.28)"
              />
            </View>
          </View>
        </View>

        {/* SAUVEGARDER */}
        <View style={styles.saveSection}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMemory}>
            <View style={styles.saveBtnContent}>
              <Ionicons name="bookmark" size={20} color={C.bg} />
              <Text style={styles.saveBtnText}>Sauvegarder le souvenir</Text>
            </View>
            <View style={styles.saveBtnArrow}>
              <Ionicons name="arrow-forward" size={18} color={C.bg} />
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  /* HEADER */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
  },
  headerContent: { flex: 1, alignItems: 'center' },
  title:    { fontSize: 20, fontWeight: '200', letterSpacing: 1.2, color: C.white },
  subtitle: { fontSize: 12, color: C.creamDim, fontWeight: '300', marginTop: 2 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },

  /* SECTION CARD */
  sectionCard: {
    backgroundColor: C.card, borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center',
    padding: 18, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sectionIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '500', color: C.white },
  cardBody:     { padding: 18, paddingTop: 14 },

  /* FIELDS */
  fieldWrap:  { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.50)', marginBottom: 8, letterSpacing: 0.4 },
  fieldSub:   { fontSize: 12, color: C.creamDim, marginBottom: 10, fontStyle: 'italic' },
  textArea: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    padding: 14, fontSize: 15, backgroundColor: 'rgba(122,184,245,0.06)',
    minHeight: 80, color: C.white, lineHeight: 22,
  },
  memoryArea: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    padding: 14, fontSize: 15, backgroundColor: 'rgba(122,184,245,0.06)',
    minHeight: 140, color: C.white, lineHeight: 22,
  },

  /* IMAGE PICKER */
  imagePickerBtn: {
    borderWidth: 1.5, borderColor: C.borderMid, borderStyle: 'dashed',
    borderRadius: 16, padding: 28, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(122,184,245,0.04)', marginTop: 4,
  },
  imagePickerText: { fontSize: 15, fontWeight: '500', color: C.cream, marginTop: 8 },
  imagePickerSub:  { fontSize: 12, color: C.creamDim, marginTop: 4 },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  imageThumb: { width: '47%', borderRadius: 12, overflow: 'hidden', marginTop: 10, position: 'relative' },
  thumbImg:   { width: '100%', height: 120, borderRadius: 12 },
  thumbBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(122,184,245,0.80)',
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
  },
  thumbNum:   { fontSize: 11, fontWeight: '700', color: '#0D0D0D' },
  thumbRemove: { position: 'absolute', top: 6, right: 6 },

  /* SELECTION */
  selectionGroup: { marginBottom: 20 },
  selectionRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ratingRow: { flexDirection: 'row', gap: 4, paddingVertical: 8 },
  starBtn: {
    padding: 8, borderRadius: 8,
    backgroundColor: 'rgba(122,184,245,0.06)', borderWidth: 1, borderColor: C.border,
  },
  starBtnSelected: { backgroundColor: 'rgba(255,215,0,0.10)', borderColor: 'rgba(255,215,0,0.40)' },

  /* SAVE */
  saveSection: { marginTop: 4, marginBottom: 16 },
  saveBtn: {
    backgroundColor: C.cream, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 24,
    borderRadius: 16, shadowColor: C.cream, shadowOpacity: 0.30, shadowRadius: 10, elevation: 6,
  },
  saveBtnContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  saveBtnText: { color: C.bg, fontSize: 16, fontWeight: '600', marginLeft: 12 },
  saveBtnArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(13,13,13,0.18)', justifyContent: 'center', alignItems: 'center',
  },
});

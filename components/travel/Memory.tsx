import InputField from '@/components/planning/InputField';
import SelectionButton from '@/components/planning/SelectionButton';
import { createVoyage } from '@/lib/voyages';
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

export default function CreateMemoryScreen() {
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // Tableau d'images
  const [imageSource, setImageSource] = useState<'url' | 'gallery'>('url');
  const [selectedTripType, setSelectedTripType] = useState('Solo');
  const [selectedRating, setSelectedRating] = useState('5');
  const [selectedDuration, setSelectedDuration] = useState('1-3 jours');
  const [memoryText, setMemoryText] = useState('');

  const tripTypes = ['Solo', 'Couple', 'Famille', 'Groupe', 'Amis'];
  const ratings = ['1', '2', '3', '4', '5'];
  const durations = ['1-3 jours', '4-7 jours', '1-2 semaines', '2+ semaines'];

  // Fonction pour sélectionner une image depuis la galerie
  const pickImageFromGallery = async () => {
    try {
      // Demander la permission d'accès à la galerie
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission requise',
          'L\'accès à la galerie photo est nécessaire pour sélectionner une image.'
        );
        return;
      }

      // Ouvrir la galerie avec sélection multiple
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true, // Permettre la sélection multiple
        quality: 0.8,
        selectionLimit: 10, // Limiter à 10 images max
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Ajouter toutes les images sélectionnées
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages]);
        setImageSource('gallery');
        setImageUrl(''); // Effacer l'URL si des images de galerie sont sélectionnées
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Fonction pour prendre une photo avec l'appareil photo
  const takePhotoWithCamera = async () => {
    try {
      // Demander la permission d'accès à l'appareil photo
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission requise',
          'L\'accès à l\'appareil photo est nécessaire pour prendre une photo.'
        );
        return;
      }

      // Ouvrir l'appareil photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImages(prev => [...prev, result.assets[0].uri]);
        setImageSource('gallery');
        setImageUrl(''); // Effacer l'URL si une photo est prise
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  // Fonction pour choisir le type d'image
  const chooseImageSource = () => {
    Alert.alert(
      'Ajouter des images',
      'Comment souhaitez-vous ajouter des images ?',
      [
        {
          text: 'Galerie (multiple)',
          onPress: pickImageFromGallery,
          style: 'default'
        },
        {
          text: 'Prendre une photo',
          onPress: takePhotoWithCamera,
          style: 'default'
        },
        {
          text: 'URL d\'image',
          onPress: () => {
            setImageSource('url');
            // Pas besoin de vider selectedImages ici
          },
          style: 'default'
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  // Fonction pour supprimer une image spécifique
  const removeImage = (imageToRemove: string) => {
    setSelectedImages(prev => prev.filter(img => img !== imageToRemove));
  };

  // Fonction pour supprimer toutes les images
  const removeAllImages = () => {
    setSelectedImages([]);
    setImageUrl('');
  };

  const handleSaveMemory = async () => {
    if (!tripName.trim() || !destination.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner au moins le nom du voyage et la destination');
      return;
    }
    
    try {
      // Créer un tableau avec toutes les images (galerie + URL si renseignée)
      const allImages = [...selectedImages];
      if (imageUrl.trim()) {
        allImages.push(imageUrl.trim());
      }
      
      // Sauvegarder le souvenir dans la base de données
      const { data, error } = await createVoyage({
        tripName,
        destination,
        description,
        imageUrl: allImages[0] || '', // Image principale (première)
        images: allImages, // Toutes les images
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
          {
            text: 'Voir mes voyages',
            onPress: () => router.push('/(tabs)/voyage')
          },
          {
            text: 'Retour à l\'accueil',
            onPress: () => router.push('/(tabs)/home')
          },
          {
            text: 'Ajouter un autre',
            onPress: () => {
              // Réinitialiser le formulaire
              setTripName('');
              setDestination('');
              setDescription('');
              setImageUrl('');
              setSelectedImages([]);
              setMemoryText('');
              setSelectedTripType('Solo');
              setSelectedRating('5');
              setSelectedDuration('1-3 jours');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur inattendue est survenue lors de la sauvegarde.');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header amélioré */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#2F7417" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Nouveau Souvenir</Text>
          <Text style={styles.headerSubtitle}>Immortalisez vos plus beaux moments</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section Informations générales */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="information-circle" size={24} color="#2F7417" />
            </View>
            <Text style={styles.sectionTitle}>Informations générales</Text>
          </View>
          
          <View style={styles.cardContent}>
            <InputField
              label="Nom du voyage"
              placeholder="Ex: Escapade à Paris"
              value={tripName}
              onChangeText={setTripName}
              iconName="airplane"
            />

            <InputField
              label="Destination"
              placeholder="Ex: Paris, France"
              value={destination}
              onChangeText={setDestination}
              iconName="location"
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.textAreaInput}
                placeholder="Décrivez votre voyage en quelques mots..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>

            {/* Section Image avec options multiples */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Image du voyage</Text>
              <Text style={styles.sublabel}>Ajoutez une photo pour illustrer votre souvenir</Text>
              
              {/* Bouton principal pour choisir une image */}
              <TouchableOpacity style={styles.imagePickerButton} onPress={chooseImageSource}>
                <Ionicons name="camera" size={32} color="#2F7417" />
                <Text style={styles.imagePickerText}>Ajouter des images</Text>
                <Text style={styles.imagePickerSubtext}>Sélection multiple depuis la galerie</Text>
              </TouchableOpacity>

              {/* Affichage de toutes les images sélectionnées */}
              {selectedImages.length > 0 && (
                <View style={styles.imagesGrid}>
                  {selectedImages.map((imageUri, index) => (
                    <View key={index} style={styles.imagePreview}>
                      <Image source={{ uri: imageUri }} style={styles.previewImage} />
                      <View style={styles.imageOverlay}>
                        <Text style={styles.imageNumber}>{index + 1}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeImageButton} 
                        onPress={() => removeImage(imageUri)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF4757" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Affichage de l'image URL si renseignée */}
              {imageUrl.trim() && (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                  <View style={styles.imageOverlay}>
                    <Text style={styles.imageLabel}>URL</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeImageButton} 
                    onPress={() => setImageUrl('')}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF4757" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Champ URL uniquement si on est en mode URL */}
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

        {/* Section Détails du voyage */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="calendar" size={24} color="#2F7417" />
            </View>
            <Text style={styles.sectionTitle}>Détails du voyage</Text>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.selectionGroup}>
              <Text style={styles.label}>Type de voyage</Text>
              <View style={styles.selectionContainer}>
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
              <Text style={styles.label}>Durée</Text>
              <View style={styles.selectionContainer}>
                {durations.map((duration) => (
                  <SelectionButton
                    key={duration}
                    title={duration}
                    selected={selectedDuration === duration}
                    onPress={() => setSelectedDuration(duration)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.selectionGroup}>
              <Text style={styles.label}>Note globale</Text>
              <View style={styles.ratingContainer}>
                {ratings.map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.starButton,
                      selectedRating >= rating && styles.starButtonSelected
                    ]}
                    onPress={() => setSelectedRating(rating)}
                  >
                    <Ionicons 
                      name="star" 
                      size={28} 
                      color={selectedRating >= rating ? "#FFD700" : "#E0E0E0"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Section Souvenirs */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="heart" size={24} color="#2F7417" />
            </View>
            <Text style={styles.sectionTitle}>Vos souvenirs</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Racontez votre expérience</Text>
              <TextInput
                style={styles.memoryInput}
                placeholder="Partagez vos meilleurs moments, anecdotes, conseils..."
                value={memoryText}
                onChangeText={setMemoryText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Bouton de sauvegarde amélioré */}
        <View style={styles.saveSection}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveMemory}>
            <View style={styles.saveButtonContent}>
              <Ionicons name="bookmark" size={22} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Sauvegarder le souvenir</Text>
            </View>
            <View style={styles.saveButtonIcon}>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cardContent: {
    padding: 20,
    paddingTop: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    minHeight: 80,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  memoryInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    minHeight: 140,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  selectionGroup: {
    marginBottom: 24,
  },
  selectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    paddingVertical: 8,
  },
  starButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  starButtonSelected: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD700',
  },
  imagePreview: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveSection: {
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#2F7417',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
  saveButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Nouveaux styles pour la sélection d'image
  sublabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#2F7417',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FFF8',
    marginTop: 8,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F7417',
    marginTop: 8,
  },
  imagePickerSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  imageActions: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  imageActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imageActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2F7417',
    marginLeft: 4,
  },
  // Nouveaux styles pour la galerie multiple
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  imageNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(47, 116, 23, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(47, 116, 23, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
import InputField from '@/components/planning/InputField';
import SelectionButton from '@/components/planning/SelectionButton';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PlanTripScreen() {
  const [destination, setDestination] = useState('');
  const [selectedTravelType, setSelectedTravelType] = useState('Solo');
  const [selectedThemes, setSelectedThemes] = useState<string[]>(['Culture']);
  const [selectedActivityLevel, setSelectedActivityLevel] = useState('Balanced');
  const [selectedDates, setSelectedDates] = useState('');

  const travelTypes = ['Solo', 'Couple', 'Family', 'Group'];
  const interestThemes = ['Culture', 'Gastronomy', 'Sport', 'Nature', 'Relaxation'];
  const activityLevels = ['Relax', 'Balanced', 'Intense'];

  const handleThemeToggle = (theme: string) => {
    if (selectedThemes.includes(theme)) {
      setSelectedThemes(selectedThemes.filter(t => t !== theme));
    } else {
      setSelectedThemes([...selectedThemes, theme]);
    }
  };

  const handleGenerateItinerary = () => {
    if (!destination.trim()) {
      Alert.alert('Destination requise', 'Veuillez saisir une destination');
      return;
    }
    
    Alert.alert(
      'Itinéraire généré !',
      `Destination: ${destination}\nType: ${selectedTravelType}\nThèmes: ${selectedThemes.join(', ')}\nNiveau: ${selectedActivityLevel}`,
      [
        {
          text: 'OK',
          onPress: () => router.push('/(tabs)/home')
        }
      ]
    );
  };

  const handleDatePicker = () => {
    Alert.alert('Sélection de dates', 'Fonctionnalité de sélection de dates à venir');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header avec bouton retour */}
        <View style={styles.headerInline}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        {/* Titre principal */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Planifiez votre prochaine aventure</Text>
          <Text style={styles.subtitle}>Dites-nous vos préférences de voyage.</Text>
        </View>

        {/* Destination */}
        <InputField
          label="Destination"
          placeholder="Ville ou Pays"
          value={destination}
          onChangeText={setDestination}
          iconName="location"
        />

        {/* Travel Dates */}
        <InputField
          label="Dates de voyage"
          placeholder="Sélectionner les dates"
          value={selectedDates}
          onPress={handleDatePicker}
          iconName="calendar"
          editable={false}
        />

        {/* Travel Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de voyage</Text>
          <View style={styles.buttonRow}>
            {travelTypes.map((type) => (
              <SelectionButton
                key={type}
                title={type}
                selected={selectedTravelType === type}
                onPress={() => setSelectedTravelType(type)}
              />
            ))}
          </View>
        </View>

        {/* Interest Themes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Centres d&apos;intérêt</Text>
          <View style={styles.themesContainer}>
            {interestThemes.map((theme) => (
              <SelectionButton
                key={theme}
                title={theme}
                selected={selectedThemes.includes(theme)}
                onPress={() => handleThemeToggle(theme)}
                variant="theme"
                style={styles.themeButtonSpacing}
              />
            ))}
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Niveau d&apos;activité</Text>
          <View style={styles.buttonRow}>
            {activityLevels.map((level) => (
              <SelectionButton
                key={level}
                title={level}
                selected={selectedActivityLevel === level}
                onPress={() => setSelectedActivityLevel(level)}
              />
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <View style={styles.generateSection}>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateItinerary}>
            <Text style={styles.generateButtonText}>Générer l&apos;itinéraire</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerInline: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeButtonSpacing: {
    marginBottom: 8,
  },
  generateSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  generateButton: {
    backgroundColor: '#2F7417',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2F7417',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 40,
  },
}); 
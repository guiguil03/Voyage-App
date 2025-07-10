import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CreateScreen() {
  const handleCreateTrip = () => {
    console.log('Créer un nouveau voyage');
    // TODO: Navigation vers la création de voyage
  };

  const handleCreateMemory = () => {
    console.log('Ajouter un souvenir');
    // TODO: Navigation vers l'ajout de souvenir
  };

  const handleCreateItinerary = () => {
    console.log('Créer un itinéraire');
    // TODO: Navigation vers la création d'itinéraire
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Créer</Text>
          <Text style={styles.subtitle}>Que veux-tu créer aujourd&rsquo;hui ?</Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionCard} onPress={handleCreateTrip}>
            <View style={styles.iconContainer}>
              <Ionicons name="airplane" size={32} color="#007AFF" />
            </View>
            <Text style={styles.optionTitle}>Nouveau Voyage</Text>
            <Text style={styles.optionDescription}>
              Planifie ton prochain voyage et organise tes destinations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleCreateMemory}>
            <View style={styles.iconContainer}>
              <Ionicons name="camera" size={32} color="#FF6B6B" />
            </View>
            <Text style={styles.optionTitle}>Ajouter un Souvenir</Text>
            <Text style={styles.optionDescription}>
              Capture et sauvegarde tes meilleurs moments de voyage
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleCreateItinerary}>
            <View style={styles.iconContainer}>
              <Ionicons name="map" size={32} color="#4ECDC4" />
            </View>
            <Text style={styles.optionTitle}>Créer un Itinéraire</Text>
            <Text style={styles.optionDescription}>
              Planifie jour par jour tes activités et visites
            </Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
}); 
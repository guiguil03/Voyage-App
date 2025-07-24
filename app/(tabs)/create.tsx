import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const GREEN = '#2F7417';
const BG = '#F8F9FA';
const BORDER = '#E9ECEF';

export default function CreateScreen() {
  const handleCreateTrip = () => {
    router.push('/plan-trip');
  };

  const handleCreateMemory = () => {
    router.push('/Memory');
    // TODO: Navigation vers l'ajout de souvenir
  };

  const handleCreateItinerary = () => {
    router.push('/search-activities');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Créer</Text>
          <Text style={styles.subtitle}>Que veux-tu créer aujourd&apos;hui ?</Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionCard} onPress={handleCreateTrip}>
            <View style={styles.iconContainer}>
              <Ionicons name="airplane" size={32} color={GREEN} />
            </View>
            <Text style={styles.optionTitle}>Planifier un Voyage</Text>
            <Text style={styles.optionDescription}>
             Donne nous ta destination des envies et nous te proposons un plannig détaillé de tous ce que tu pourrais faire sur place
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleCreateMemory}>
            <View style={styles.iconContainer}>
              <Ionicons name="camera" size={32} color={GREEN} />
            </View>
            <Text style={styles.optionTitle}>Ajouter un Souvenir</Text>
            <Text style={styles.optionDescription}>
              Fais toi un recap de tes meilleurs moments de voyage pour les partager avec tes amis
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleCreateItinerary}>
            <View style={styles.iconContainer}>
              <Ionicons name="map" size={32} color={GREEN} />
            </View>
            <Text style={styles.optionTitle}>Suggestion d&apos;activités</Text>
            <Text style={styles.optionDescription}>
              Renseigne nous sur tes envies et nous te proposons des activités et des visites en fonction de tes envies et de ton budget
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
    backgroundColor: BG,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 18,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  optionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  scrollContent: {
    paddingBottom: 120,
  },
}); 
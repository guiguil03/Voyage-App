import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
      {/* Dégradé premium en haut */}
      <LinearGradient
        colors={["#E8F5E8", "#F8F9FA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220, zIndex: 0 }}
      />
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'transparent', borderBottomWidth: 0, marginTop: 10, marginBottom: 18, zIndex: 1 }]}>
          <Text style={[styles.title, { fontSize: 30 }]}>Créer</Text>
          <Text style={[styles.subtitle, { fontSize: 17 }]}>Que veux-tu créer aujourd&apos;hui ?</Text>
        </View>

        <View style={styles.optionsContainer}>
          <BlurView intensity={30} tint="light" style={styles.optionCardBlur}>
            <TouchableOpacity style={styles.optionCard} onPress={handleCreateTrip}>
              <View style={styles.iconContainer}>
                <Ionicons name="airplane" size={32} color={GREEN} />
              </View>
              <Text style={styles.optionTitle}>Planifier un Voyage</Text>
              <Text style={styles.optionDescription}>
               Donne-nous ta destination et tes envies, nous te proposons un planning détaillé de tout ce que tu pourrais faire sur place
              </Text>
            </TouchableOpacity>
          </BlurView>

          <BlurView intensity={30} tint="light" style={styles.optionCardBlur}>
            <TouchableOpacity style={styles.optionCard} onPress={handleCreateMemory}>
              <View style={styles.iconContainer}>
                <Ionicons name="camera" size={32} color={GREEN} />
              </View>
              <Text style={styles.optionTitle}>Ajouter un Souvenir</Text>
              <Text style={styles.optionDescription}>
                Fais-toi un récap de tes meilleurs moments de voyage pour les partager avec tes amis
              </Text>
            </TouchableOpacity>
          </BlurView>

          <BlurView intensity={30} tint="light" style={styles.optionCardBlur}>
            <TouchableOpacity style={styles.optionCard} onPress={handleCreateItinerary}>
              <View style={styles.iconContainer}>
                <Ionicons name="map" size={32} color={GREEN} />
              </View>
              <Text style={styles.optionTitle}>Suggestion d&apos;activités</Text>
              <Text style={styles.optionDescription}>
                Renseigne-nous sur tes envies et nous te proposons des activités et des visites en fonction de tes envies et de ton budget
              </Text>
            </TouchableOpacity>
          </BlurView>
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
  optionCardBlur: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 26,
    marginBottom: 4,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  optionCard: {
    padding: 24,
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
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
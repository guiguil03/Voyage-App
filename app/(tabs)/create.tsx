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

const C = {
  bg:         '#0D0D0D',
  card:       'rgba(13,13,13,0.82)',
  border:     'rgba(122,184,245,0.14)',
  cream:      '#7AB8F5',
  creamDim:   'rgba(122,184,245,0.50)',
  creamFaint: 'rgba(122,184,245,0.18)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.40)',
};

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
          <Text style={styles.title}>CRÉER</Text>
          <Text style={styles.subtitle}>Que veux-tu créer aujourd&apos;hui ?</Text>
        </View>

        <View style={styles.optionsContainer}>
          {/* Planifier un Voyage */}
          <TouchableOpacity style={styles.optionCard} onPress={handleCreateTrip} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <Ionicons name="airplane-outline" size={22} color={C.cream} />
              <View style={styles.cardTextBlock}>
                <Text style={styles.optionTitle}>Planifier un Voyage</Text>
                <Text style={styles.optionDescription}>
                  Donne-nous ta destination et tes envies, on génère un planning jour par jour avec Claude.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.creamDim} />
            </View>
          </TouchableOpacity>

          {/* Ajouter un Souvenir */}
          <TouchableOpacity style={styles.optionCard} onPress={handleCreateMemory} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <Ionicons name="camera-outline" size={22} color={C.cream} />
              <View style={styles.cardTextBlock}>
                <Text style={styles.optionTitle}>Ajouter un Souvenir</Text>
                <Text style={styles.optionDescription}>
                  Garde une trace de tes meilleurs moments et partage-les avec tes amis.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.creamDim} />
            </View>
          </TouchableOpacity>

          {/* Suggestion d'activités */}
          <TouchableOpacity style={styles.optionCard} onPress={handleCreateItinerary} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <Ionicons name="map-outline" size={22} color={C.cream} />
              <View style={styles.cardTextBlock}>
                <Text style={styles.optionTitle}>Suggestions d&apos;activités</Text>
                <Text style={styles.optionDescription}>
                  Explore des activités et visites adaptées à tes envies et à ta destination.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.creamDim} />
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
    backgroundColor: C.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '200',
    letterSpacing: 6,
    color: C.cream,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: C.creamDim,
    fontWeight: '300',
    letterSpacing: 1,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  optionCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  cardTextBlock: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: C.white,
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: C.whiteDim,
    lineHeight: 21,
    fontWeight: '300',
  },
});

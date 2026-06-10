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
              <View style={styles.iconContainer}>
                <Ionicons name="airplane" size={26} color={C.cream} />
              </View>
              <View style={styles.cardTextBlock}>
                <Text style={styles.optionTitle}>Planifier un Voyage</Text>
                <Text style={styles.optionDescription}>
                  Donne nous ta destination des envies et nous te proposons un planning détaillé de tous ce que tu pourrais faire sur place
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.cream} style={styles.arrow} />
            </View>
          </TouchableOpacity>

          {/* Ajouter un Souvenir */}
          <TouchableOpacity style={styles.optionCard} onPress={handleCreateMemory} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="camera" size={26} color={C.cream} />
              </View>
              <View style={styles.cardTextBlock}>
                <Text style={styles.optionTitle}>Ajouter un Souvenir</Text>
                <Text style={styles.optionDescription}>
                  Fais toi un recap de tes meilleurs moments de voyage pour les partager avec tes amis
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.cream} style={styles.arrow} />
            </View>
          </TouchableOpacity>

          {/* Suggestion d'activités */}
          <TouchableOpacity style={styles.optionCard} onPress={handleCreateItinerary} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="map" size={26} color={C.cream} />
              </View>
              <View style={styles.cardTextBlock}>
                <Text style={styles.optionTitle}>Suggestion d&apos;activités</Text>
                <Text style={styles.optionDescription}>
                  Renseigne nous sur tes envies et nous te proposons des activités et des visites en fonction de tes envies et de ton budget
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.cream} style={styles.arrow} />
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 28,
    paddingHorizontal: 22,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(122,184,245,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: C.creamFaint,
    flexShrink: 0,
  },
  cardTextBlock: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: C.cream,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  optionDescription: {
    fontSize: 13,
    color: C.creamDim,
    lineHeight: 20,
    fontWeight: '300',
  },
  arrow: {
    marginLeft: 12,
    flexShrink: 0,
    opacity: 0.7,
  },
});

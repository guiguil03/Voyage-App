import RechercheActivites from '@/components/search/RechercheActivites';
import type { POI } from '@/lib/recherche';
import { createCoordinates } from '@/lib/recherche';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SearchAdvancedScreen() {
  // Géolocalisation par défaut (Paris)
  const defaultCoordinates = createCoordinates(48.8566, 2.3522);

  const handleSelectPOI = (poi: POI) => {
    console.log('POI sélectionné:', poi);
    // Pour l'instant, on affiche juste les informations dans une alerte
    // Vous pouvez plus tard créer une page de détails dédiée
    alert(`${poi.name}\n\nCatégories: ${poi.kinds}\nNote: ${poi.rate || 'N/A'}/7\nDistance: ${poi.distance ? Math.round(poi.distance) + 'm' : 'N/A'}`);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* Composant de recherche */}
      <RechercheActivites
        coordinates={defaultCoordinates}
        onSelectPOI={handleSelectPOI}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
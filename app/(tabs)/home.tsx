import FormTravel from '@/components/travel/FormTravel';
import TripCard from '@/components/travel/TripCard';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function HomeScreen() {
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading]);

  const handleTripDetail = () => {
    // TODO: Navigation vers les détails du voyage
    console.log('Navigation vers les détails du voyage');
  };

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  // Si l'utilisateur n'est pas authentifié, ne rien afficher (redirection en cours)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bienvenue, {user.name}</Text>
        </View>

        {/* Last Trip Section */}
        <View style={styles.tripSection}>
          <Text style={styles.sectionTitle}>Ton Dernier Voyage</Text>
          
          <TripCard
            date="21 Juillet 2024 - 1 Août 2024"
            country="Canada"
            flagEmoji="🇨🇦"
            image={require('@/assets/images/mountain-background.jpg')}
            onPress={handleTripDetail}
          />
        </View>

        {/* Additional Content Space */}
        <View style={styles.additionalContent}>
          {/* Espace pour d'autres fonctionnalités */}
          <Text style={styles.comingSoonText}>
            Plus de fonctionnalités arrivent bientôt...
          </Text>
          <FormTravel />
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
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  tripSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  additionalContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 50,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
}); 
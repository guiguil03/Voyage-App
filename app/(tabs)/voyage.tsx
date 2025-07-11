import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const trips = [
  {
    id: 1,
    title: 'Escapade à Bali',
    destination: 'Bali, Indonésie',
    dates: '15-25 Mars 2024',
    status: 'À venir',
    image: require('@/assets/images/temple-bali-sunset.jpg'),
    progress: 85,
    budget: '€1200',
    days: 10,
  },
  {
    id: 2,
    title: 'Tokyo Express',
    destination: 'Tokyo, Japon',
    dates: '5-12 Février 2024',
    status: 'Terminé',
    image: require('@/assets/images/temple-water-sunset.jpg'),
    progress: 100,
    budget: '€1800',
    days: 7,
  },
  {
    id: 3,
    title: 'Aventure Patagonie',
    destination: 'Patagonie, Argentine',
    dates: '10-20 Juin 2024',
    status: 'Planifié',
    image: require('@/assets/images/mountain-background.jpg'),
    progress: 45,
    budget: '€2200',
    days: 10,
  },
];

const stats = [
  { label: 'Voyages', value: '12', icon: 'airplane' },
  { label: 'Pays', value: '8', icon: 'globe' },
  { label: 'Jours', value: '247', icon: 'calendar' },
];

export default function VoyageScreen() {
  const [activeFilter, setActiveFilter] = useState('Tous');
  const filters = ['Tous', 'À venir', 'Terminé', 'Planifié'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'À venir': return '#2F7417';
      case 'Terminé': return '#4ECDC4';
      case 'Planifié': return '#FF6B35';
      default: return '#666';
    }
  };

  const filteredTrips = activeFilter === 'Tous' 
    ? trips 
    : trips.filter(trip => trip.status === activeFilter);

  const handleTripPress = (trip: any) => {
    Alert.alert(trip.title, `Gérer votre voyage à ${trip.destination}`);
  };

  const handleAddTrip = () => {
    Alert.alert('Nouveau voyage', 'Créer un nouveau voyage');
  };

  const handleTripAction = (action: string, trip: any) => {
    Alert.alert(action, `${action} pour ${trip.title}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mes Voyages</Text>
          <Text style={styles.subtitle}>Gérez vos aventures</Text>
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name={stat.icon as any} size={24} color="#2F7417" />
              </View>
              <Text style={styles.statNumber}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Filtres */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.activeFilterButton
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === filter && styles.activeFilterText
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Header des voyages */}
        <View style={styles.tripsHeader}>
          <Text style={styles.sectionTitle}>
            {activeFilter === 'Tous' ? 'Tous mes voyages' : `Voyages ${activeFilter.toLowerCase()}`}
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddTrip}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Liste des voyages */}
        <View style={styles.tripsContainer}>
          {filteredTrips.map((trip) => (
            <TouchableOpacity 
              key={trip.id} 
              style={styles.tripCard}
              onPress={() => handleTripPress(trip)}
            >
              <Image source={trip.image} style={styles.tripImage} />
              
              {/* Badge de statut */}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
                <Text style={styles.statusText}>{trip.status}</Text>
              </View>

              <View style={styles.tripInfo}>
                <View style={styles.tripHeader}>
                  <Text style={styles.tripTitle}>{trip.title}</Text>
                  <Text style={styles.tripBudget}>{trip.budget}</Text>
                </View>

                <View style={styles.tripDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.detailText}>{trip.destination}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.detailText}>{trip.dates}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.detailText}>{trip.days} jours</Text>
                  </View>
                </View>

                {/* Barre de progression */}
                {trip.status !== 'Terminé' && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Progression</Text>
                      <Text style={styles.progressPercent}>{trip.progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${trip.progress}%`,
                            backgroundColor: getStatusColor(trip.status)
                          }
                        ]} 
                      />
                    </View>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.tripActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleTripAction('Détails', trip)}
                  >
                    <Ionicons name="document-text" size={16} color="#2F7417" />
                    <Text style={styles.actionText}>Détails</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleTripAction('Modifier', trip)}
                  >
                    <Ionicons name="create" size={16} color="#2F7417" />
                    <Text style={styles.actionText}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleTripAction('Partager', trip)}
                  >
                    <Ionicons name="share" size={16} color="#2F7417" />
                    <Text style={styles.actionText}>Partager</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* État vide */}
        {filteredTrips.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="airplane-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>Aucun voyage trouvé</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'Tous' 
                ? 'Créez votre premier voyage pour commencer votre aventure !'
                : `Aucun voyage ${activeFilter.toLowerCase()} pour le moment.`
              }
            </Text>
            <TouchableOpacity style={styles.createTripButton} onPress={handleAddTrip}>
              <Text style={styles.createTripText}>Créer un voyage</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersScroll: {
    paddingLeft: 20,
  },
  filterButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeFilterButton: {
    backgroundColor: '#2F7417',
    borderColor: '#2F7417',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  tripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#2F7417',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripsContainer: {
    paddingHorizontal: 20,
  },
  tripCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  tripImage: {
    width: '100%',
    height: 120,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  tripInfo: {
    padding: 16,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  tripBudget: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2F7417',
  },
  tripDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tripActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#2F7417',
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  createTripButton: {
    backgroundColor: '#2F7417',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createTripText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 120,
  },
}); 
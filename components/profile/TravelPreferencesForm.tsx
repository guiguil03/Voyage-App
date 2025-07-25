import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Profile } from '../../lib/profiles';

interface TravelPreferencesFormProps {
  profile: Profile | null;
  onSave: (preferences: Profile['travel_preferences']) => Promise<void>;
  loading?: boolean;
}

export default function TravelPreferencesForm({ profile, onSave, loading = false }: TravelPreferencesFormProps) {
  const [preferences, setPreferences] = useState({
    budget_range: profile?.travel_preferences?.budget_range || '',
    travel_style: profile?.travel_preferences?.travel_style || [],
    interests: profile?.travel_preferences?.interests || [],
    accommodation_type: profile?.travel_preferences?.accommodation_type || [],
  });

  const [saving, setSaving] = useState(false);

  // Options disponibles
  const budgetOptions = [
    { id: 'budget', label: '€ - Petit budget', icon: 'wallet' },
    { id: 'mid-range', label: '€€ - Budget moyen', icon: 'card' },
    { id: 'luxury', label: '€€€ - Luxe', icon: 'diamond' },
    { id: 'unlimited', label: '💸 - Pas de limite', icon: 'infinite' },
  ];

  const travelStyleOptions = [
    { id: 'adventure', label: 'Aventure', icon: 'bicycle' },
    { id: 'cultural', label: 'Culture', icon: 'library' },
    { id: 'relaxation', label: 'Détente', icon: 'leaf' },
    { id: 'family', label: 'Famille', icon: 'people' },
    { id: 'romantic', label: 'Romantique', icon: 'heart' },
    { id: 'business', label: 'Business', icon: 'briefcase' },
    { id: 'backpacking', label: 'Backpacking', icon: 'bag' },
    { id: 'luxury', label: 'Luxe', icon: 'diamond' },
  ];

  const interestOptions = [
    { id: 'history', label: 'Histoire', icon: 'library' },
    { id: 'food', label: 'Gastronomie', icon: 'restaurant' },
    { id: 'nature', label: 'Nature', icon: 'leaf' },
    { id: 'photography', label: 'Photo', icon: 'camera' },
    { id: 'sports', label: 'Sports', icon: 'fitness' },
    { id: 'art', label: 'Art', icon: 'color-palette' },
    { id: 'music', label: 'Musique', icon: 'musical-notes' },
    { id: 'architecture', label: 'Architecture', icon: 'business' },
    { id: 'shopping', label: 'Shopping', icon: 'bag' },
    { id: 'nightlife', label: 'Vie nocturne', icon: 'wine' },
  ];

  const accommodationOptions = [
    { id: 'hotel', label: 'Hôtel', icon: 'bed' },
    { id: 'hostel', label: 'Auberge', icon: 'people' },
    { id: 'airbnb', label: 'Airbnb', icon: 'home' },
    { id: 'resort', label: 'Resort', icon: 'umbrella' },
    { id: 'camping', label: 'Camping', icon: 'leaf' },
    { id: 'guesthouse', label: 'Pension', icon: 'business' },
  ];

  const handleSave = async () => {
    if (saving || loading) return;

    setSaving(true);
    try {
      await onSave(preferences);
      Alert.alert('Succès', 'Préférences mises à jour avec succès !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayOption = (array: string[], option: string) => {
    if (array.includes(option)) {
      return array.filter(item => item !== option);
    } else {
      return [...array, option];
    }
  };

  const isSelected = (array: string[], option: string) => {
    return array.includes(option);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Préférences de Voyage</Text>
        <Text style={styles.subtitle}>Personnalisez vos recommandations de voyage</Text>
      </View>

      <View style={styles.form}>
        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget préféré</Text>
          <View style={styles.optionsGrid}>
            {budgetOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  preferences.budget_range === option.id && styles.optionCardSelected
                ]}
                onPress={() => setPreferences(prev => ({ ...prev, budget_range: option.id }))}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={preferences.budget_range === option.id ? '#FFFFFF' : '#2F7417'} 
                />
                <Text style={[
                  styles.optionText,
                  preferences.budget_range === option.id && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Style de voyage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Style de voyage</Text>
          <Text style={styles.sectionSubtitle}>Sélectionnez tous ceux qui vous intéressent</Text>
          <View style={styles.optionsGrid}>
            {travelStyleOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected(preferences.travel_style, option.id) && styles.optionCardSelected
                ]}
                onPress={() => setPreferences(prev => ({
                  ...prev,
                  travel_style: toggleArrayOption(prev.travel_style, option.id)
                }))}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={isSelected(preferences.travel_style, option.id) ? '#FFFFFF' : '#2F7417'} 
                />
                <Text style={[
                  styles.optionText,
                  isSelected(preferences.travel_style, option.id) && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Centres d'intérêt */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Centres d&apos;intérêt</Text>
          <Text style={styles.sectionSubtitle}>Qu&apos;est-ce qui vous passionne en voyage ?</Text>
          <View style={styles.optionsGrid}>
            {interestOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected(preferences.interests, option.id) && styles.optionCardSelected
                ]}
                onPress={() => setPreferences(prev => ({
                  ...prev,
                  interests: toggleArrayOption(prev.interests, option.id)
                }))}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={isSelected(preferences.interests, option.id) ? '#FFFFFF' : '#2F7417'} 
                />
                <Text style={[
                  styles.optionText,
                  isSelected(preferences.interests, option.id) && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Types d'hébergement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hébergements préférés</Text>
          <Text style={styles.sectionSubtitle}>Où aimez-vous séjourner ?</Text>
          <View style={styles.optionsGrid}>
            {accommodationOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected(preferences.accommodation_type, option.id) && styles.optionCardSelected
                ]}
                onPress={() => setPreferences(prev => ({
                  ...prev,
                  accommodation_type: toggleArrayOption(prev.accommodation_type, option.id)
                }))}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={isSelected(preferences.accommodation_type, option.id) ? '#FFFFFF' : '#2F7417'} 
                />
                <Text style={[
                  styles.optionText,
                  isSelected(preferences.accommodation_type, option.id) && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bouton de sauvegarde */}
        <TouchableOpacity 
          style={[styles.saveButton, (saving || loading) && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving || loading}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: '45%',
    flexGrow: 1,
  },
  optionCardSelected: {
    backgroundColor: '#2F7417',
    borderColor: '#2F7417',
  },
  optionText: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#2F7417',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 
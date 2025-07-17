import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Profile, ProfileUpdate } from '../../lib/profiles';

interface PersonalInfoFormProps {
  profile: Profile | null;
  onSave: (data: ProfileUpdate) => Promise<void>;
  loading?: boolean;
}

export default function PersonalInfoForm({ profile, onSave, loading = false }: PersonalInfoFormProps) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    phone: profile?.phone || '',
    country: profile?.country || '',
    city: profile?.city || '',
    website: profile?.website || '',
    date_of_birth: profile?.date_of_birth || '',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving || loading) return;

    // Validation basique
    if (!formData.full_name.trim()) {
      Alert.alert('Erreur', 'Le nom complet est requis');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      Alert.alert('Succès', 'Informations mises à jour avec succès !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Informations Personnelles</Text>
        <Text style={styles.subtitle}>Complétez votre profil pour une meilleure expérience</Text>
      </View>

      <View style={styles.form}>
        {/* Nom complet */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom complet *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.full_name}
              onChangeText={(value) => updateFormData('full_name', value)}
              placeholder="Votre nom complet"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Nom d'utilisateur */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom d'utilisateur</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="at" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(value) => updateFormData('username', value.toLowerCase())}
              placeholder="votre_nom_utilisateur"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Bio */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(value) => updateFormData('bio', value)}
              placeholder="Parlez-nous de vous et de votre passion pour les voyages..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Téléphone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Téléphone</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              placeholder="+33 6 12 34 56 78"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Pays */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pays</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="globe" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.country}
              onChangeText={(value) => updateFormData('country', value)}
              placeholder="France"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Ville */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ville</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(value) => updateFormData('city', value)}
              placeholder="Paris"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Site web */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Site web</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="link" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.website}
              onChangeText={(value) => updateFormData('website', value)}
              placeholder="https://monsite.com"
              placeholderTextColor="#999"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Date de naissance */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date de naissance</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.date_of_birth}
              onChangeText={(value) => updateFormData('date_of_birth', value)}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor="#999"
            />
          </View>
          <Text style={styles.helperText}>Format: AAAA-MM-JJ (ex: 1990-12-25)</Text>
        </View>

        {/* Bouton de sauvegarde */}
        <TouchableOpacity 
          style={[styles.saveButton, (saving || loading) && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving || loading}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
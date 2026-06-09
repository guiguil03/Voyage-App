import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { GREEN } from '@/constants/Colors';
import { Profile, ProfileUpdate } from '@/features/profile/services/profiles';

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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
        <BlurView intensity={30} tint="light" style={styles.inputContainerGlass}>
          <View style={styles.iconCircle}><Ionicons name="person" size={22} color={GREEN} /></View>
          <TextInput
            style={[styles.inputPremium, focusedField === 'full_name' && styles.inputFocused]}
            value={formData.full_name}
            onChangeText={(value) => updateFormData('full_name', value)}
            placeholder="Votre nom complet"
            placeholderTextColor="#bbb"
            onFocus={() => setFocusedField('full_name')}
            onBlur={() => setFocusedField(null)}
          />
        </BlurView>
        {/* Nom d'utilisateur */}
        <BlurView intensity={30} tint="light" style={styles.inputContainerGlass}>
          <View style={styles.iconCircle}><Ionicons name="at" size={22} color={GREEN} /></View>
          <TextInput
            style={[styles.inputPremium, focusedField === 'username' && styles.inputFocused]}
            value={formData.username}
            onChangeText={(value) => updateFormData('username', value.toLowerCase())}
            placeholder="votre_nom_utilisateur"
            placeholderTextColor="#bbb"
            autoCapitalize="none"
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
          />
        </BlurView>
        {/* Bio */}
        <BlurView intensity={30} tint="light" style={[styles.inputContainerGlass, { alignItems: 'flex-start', minHeight: 90 }]}> 
          <View style={[styles.iconCircle, { marginTop: 8 }]}><Ionicons name="chatbubble-ellipses" size={22} color={GREEN} /></View>
          <TextInput
            style={[styles.inputPremium, { minHeight: 90, textAlignVertical: 'top' }, focusedField === 'bio' && styles.inputFocused]}
            value={formData.bio}
            onChangeText={(value) => updateFormData('bio', value)}
            placeholder="Parlez-nous de vous et de votre passion pour les voyages..."
            placeholderTextColor="#bbb"
            multiline
            onFocus={() => setFocusedField('bio')}
            onBlur={() => setFocusedField(null)}
          />
        </BlurView>
        {/* Téléphone */}
        <BlurView intensity={30} tint="light" style={styles.inputContainerGlass}>
          <View style={styles.iconCircle}><Ionicons name="call" size={22} color={GREEN} /></View>
          <TextInput
            style={[styles.inputPremium, focusedField === 'phone' && styles.inputFocused]}
            value={formData.phone}
            onChangeText={(value) => updateFormData('phone', value)}
            placeholder="+33 6 12 34 56 78"
            placeholderTextColor="#bbb"
            keyboardType="phone-pad"
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
          />
        </BlurView>
        {/* Pays */}
        <BlurView intensity={30} tint="light" style={styles.inputContainerGlass}>
          <View style={styles.iconCircle}><Ionicons name="flag" size={22} color={GREEN} /></View>
          <TextInput
            style={[styles.inputPremium, focusedField === 'country' && styles.inputFocused]}
            value={formData.country}
            onChangeText={(value) => updateFormData('country', value)}
            placeholder="France"
            placeholderTextColor="#bbb"
            onFocus={() => setFocusedField('country')}
            onBlur={() => setFocusedField(null)}
          />
        </BlurView>
        {/* Ville */}
        <BlurView intensity={30} tint="light" style={styles.inputContainerGlass}>
          <View style={styles.iconCircle}><Ionicons name="location" size={22} color={GREEN} /></View>
          <TextInput
            style={[styles.inputPremium, focusedField === 'city' && styles.inputFocused]}
            value={formData.city}
            onChangeText={(value) => updateFormData('city', value)}
            placeholder="Paris"
            placeholderTextColor="#bbb"
            onFocus={() => setFocusedField('city')}
            onBlur={() => setFocusedField(null)}
          />
        </BlurView>
        {/* Site web */}
        <BlurView intensity={30} tint="light" style={styles.inputContainerGlass}>
          <View style={styles.iconCircle}><Ionicons name="globe" size={22} color={GREEN} /></View>
          <TextInput
            style={[styles.inputPremium, focusedField === 'website' && styles.inputFocused]}
            value={formData.website}
            onChangeText={(value) => updateFormData('website', value)}
            placeholder="https://votre-site.com"
            placeholderTextColor="#bbb"
            autoCapitalize="none"
            keyboardType="url"
            onFocus={() => setFocusedField('website')}
            onBlur={() => setFocusedField(null)}
          />
        </BlurView>
        {/* Date de naissance */}
        <BlurView intensity={30} tint="light" style={styles.inputContainerGlass}>
          <View style={styles.iconCircle}><Ionicons name="calendar" size={22} color={GREEN} /></View>
          <TextInput
            style={[styles.inputPremium, focusedField === 'date_of_birth' && styles.inputFocused]}
            value={formData.date_of_birth}
            onChangeText={(value) => updateFormData('date_of_birth', value)}
            placeholder="JJ/MM/AAAA"
            placeholderTextColor="#bbb"
            keyboardType="numeric"
            onFocus={() => setFocusedField('date_of_birth')}
            onBlur={() => setFocusedField(null)}
          />
        </BlurView>
        {/* Bouton de sauvegarde premium */}
        <TouchableOpacity 
          style={[styles.saveButtonPremium, (saving || loading) && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving || loading}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonTextPremium}>
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
  inputGroupPremium: {
    marginBottom: 22,
  },
  labelPremium: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 7,
    marginLeft: 2,
  },
  inputContainerPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 2,
  },
  inputIconPremium: {
    marginRight: 12,
    opacity: 0.85,
  },
  inputPremium: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 2,
  },
  inputContainerGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#E8F5E8',
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  inputFocused: {
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  saveButtonPremium: {
    backgroundColor: GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 18,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 6,
  },
  saveButtonTextPremium: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
}); 
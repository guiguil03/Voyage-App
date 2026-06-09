import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Profile } from '@/features/profile/services/profiles';

interface SettingsFormProps {
  profile: Profile | null;
  onSaveNotifications: (settings: Profile['notification_settings']) => Promise<void>;
  onSavePrivacy: (level: Profile['privacy_level']) => Promise<void>;
  loading?: boolean;
}

export default function SettingsForm({ 
  profile, 
  onSaveNotifications, 
  onSavePrivacy, 
  loading = false 
}: SettingsFormProps) {
  const [notificationSettings, setNotificationSettings] = useState({
    email: profile?.notification_settings?.email ?? true,
    push: profile?.notification_settings?.push ?? true,
    sms: profile?.notification_settings?.sms ?? false,
  });

  const [privacyLevel, setPrivacyLevel] = useState<Profile['privacy_level']>(
    profile?.privacy_level || 'public'
  );

  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const handleSaveNotifications = async () => {
    if (savingNotifications || loading) return;

    setSavingNotifications(true);
    try {
      await onSaveNotifications(notificationSettings);
      Alert.alert('Succès', 'Paramètres de notification mis à jour !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSavePrivacy = async (newLevel: Profile['privacy_level']) => {
    if (savingPrivacy || loading) return;

    setSavingPrivacy(true);
    try {
      setPrivacyLevel(newLevel);
      await onSavePrivacy(newLevel);
      Alert.alert('Succès', 'Paramètres de confidentialité mis à jour !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
      setPrivacyLevel(profile?.privacy_level || 'public'); // Revert on error
    } finally {
      setSavingPrivacy(false);
    }
  };

  const privacyOptions = [
    {
      id: 'public' as const,
      title: 'Public',
      description: 'Tout le monde peut voir votre profil et vos voyages',
      icon: 'globe',
    },
    {
      id: 'friends' as const,
      title: 'Amis uniquement',
      description: 'Seuls vos amis peuvent voir vos informations',
      icon: 'people',
    },
    {
      id: 'private' as const,
      title: 'Privé',
      description: 'Vos informations sont privées',
      icon: 'lock-closed',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
        <Text style={styles.subtitle}>Gérez vos notifications et votre confidentialité</Text>
      </View>

      <View style={styles.form}>
        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="mail" size={20} color="#2F7417" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Notifications email</Text>
                  <Text style={styles.settingDescription}>
                    Recevez des emails pour les nouvelles activités
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.email}
                onValueChange={(value) =>
                  setNotificationSettings(prev => ({ ...prev, email: value }))
                }
                trackColor={{ false: '#767577', true: '#2F7417' }}
                thumbColor={notificationSettings.email ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={20} color="#2F7417" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Notifications push</Text>
                  <Text style={styles.settingDescription}>
                    Recevez des notifications sur votre appareil
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.push}
                onValueChange={(value) =>
                  setNotificationSettings(prev => ({ ...prev, push: value }))
                }
                trackColor={{ false: '#767577', true: '#2F7417' }}
                thumbColor={notificationSettings.push ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="chatbubble" size={20} color="#2F7417" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Notifications SMS</Text>
                  <Text style={styles.settingDescription}>
                    Recevez des SMS pour les informations importantes
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.sms}
                onValueChange={(value) =>
                  setNotificationSettings(prev => ({ ...prev, sms: value }))
                }
                trackColor={{ false: '#767577', true: '#2F7417' }}
                thumbColor={notificationSettings.sms ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, savingNotifications && styles.saveButtonDisabled]}
              onPress={handleSaveNotifications}
              disabled={savingNotifications || loading}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {savingNotifications ? 'Sauvegarde...' : 'Sauvegarder'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Confidentialité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidentialité</Text>
          <Text style={styles.sectionSubtitle}>
            Choisissez qui peut voir vos informations
          </Text>
          
          {privacyOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.privacyOption,
                privacyLevel === option.id && styles.privacyOptionSelected
              ]}
              onPress={() => handleSavePrivacy(option.id)}
              disabled={savingPrivacy || loading}
            >
              <View style={styles.privacyOptionContent}>
                <View style={styles.privacyOptionLeft}>
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={privacyLevel === option.id ? '#2F7417' : '#666'}
                  />
                  <View style={styles.privacyOptionText}>
                    <Text style={[
                      styles.privacyOptionTitle,
                      privacyLevel === option.id && styles.privacyOptionTitleSelected
                    ]}>
                      {option.title}
                    </Text>
                    <Text style={styles.privacyOptionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                {privacyLevel === option.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#2F7417" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Informations supplémentaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={20} color="#2F7417" />
              <Text style={styles.infoText}>
                Vos données sont sécurisées et chiffrées
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#2F7417" />
              <Text style={styles.infoText}>
                Vous pouvez modifier ces paramètres à tout moment
              </Text>
            </View>
          </View>
        </View>
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
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 12,
  },
  saveButton: {
    backgroundColor: '#2F7417',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  privacyOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    padding: 16,
    marginBottom: 12,
  },
  privacyOptionSelected: {
    borderColor: '#2F7417',
    backgroundColor: '#F0F9F0',
  },
  privacyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  privacyOptionTitleSelected: {
    color: '#2F7417',
  },
  privacyOptionDescription: {
    fontSize: 12,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
}); 
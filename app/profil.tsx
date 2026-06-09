import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PersonalInfoForm from '@/features/profile/components/PersonalInfoForm';
import SettingsForm from '@/features/profile/components/SettingsForm';
import TravelPreferencesForm from '@/features/profile/components/TravelPreferencesForm';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    getCurrentUserProfile,
    getProfileById,
    Profile,
    ProfileUpdate,
    updateNotificationSettings,
    updateTravelPreferences,
    upsertProfile,
} from '@/features/profile/services/profiles';

type TabType = 'info' | 'preferences' | 'settings';

export default function ProfilScreen() {
  const { user, loading: authLoading } = useAuth();
  const params = useLocalSearchParams();
  const userIdParam = params.userId as string | undefined;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');

  // Charger le profil au montage
  useEffect(() => {
    loadProfile();
  }, [user, userIdParam]);

  const loadProfile = async () => {
    if (userIdParam) {
      // Afficher le profil d'un autre utilisateur
      try {
        const { data, error } = await getProfileById(userIdParam);
        if (error) {
          console.error('Erreur lors du chargement du profil:', error);
          Alert.alert('Erreur', 'Impossible de charger le profil');
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Erreur inattendue:', error);
        Alert.alert('Erreur', 'Une erreur inattendue est survenue');
      } finally {
        setLoading(false);
      }
    } else if (user) {
      // Afficher le profil connecté
      try {
        const { data, error } = await getCurrentUserProfile();
        if (error) {
          console.error('Erreur lors du chargement du profil:', error);
          Alert.alert('Erreur', 'Impossible de charger le profil');
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Erreur inattendue:', error);
        Alert.alert('Erreur', 'Une erreur inattendue est survenue');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (data: ProfileUpdate) => {
    try {
      const { data: updatedProfile, error } = await upsertProfile(data);
      if (error) {
        throw new Error(error);
      }
      setProfile(updatedProfile);
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleSaveTravelPreferences = async (preferences: Profile['travel_preferences']) => {
    try {
      const { error } = await updateTravelPreferences(preferences);
      if (error) {
        throw new Error(error);
      }
      // Recharger le profil pour avoir les données à jour
      await loadProfile();
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleSaveNotificationSettings = async (settings: Profile['notification_settings']) => {
    try {
      const { error } = await updateNotificationSettings(settings);
      if (error) {
        throw new Error(error);
      }
      // Recharger le profil pour avoir les données à jour
      await loadProfile();
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleSavePrivacySettings = async (level: Profile['privacy_level']) => {
    try {
      const { error } = await upsertProfile({ privacy_level: level });
      if (error) {
        throw new Error(error);
      }
      // Recharger le profil pour avoir les données à jour
      await loadProfile();
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const tabs = [
    {
      id: 'info' as TabType,
      title: 'Informations',
      icon: 'person',
    },
    {
      id: 'preferences' as TabType,
      title: 'Préférences',
      icon: 'heart',
    },
    {
      id: 'settings' as TabType,
      title: 'Paramètres',
      icon: 'settings',
    },
  ];

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Vous devez être connecté pour accéder au profil</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Désactive la modification si ce n'est pas le profil connecté
  const isOwnProfile = !userIdParam || (user && userIdParam === user.id);
  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <PersonalInfoForm
            profile={profile}
            onSave={handleSaveProfile}
            loading={loading}
          />
        );
      case 'preferences':
        return (
          <TravelPreferencesForm
            profile={profile}
            onSave={handleSaveTravelPreferences}
            loading={loading}
          />
        );
      case 'settings':
        return isOwnProfile ? (
          <SettingsForm
            profile={profile}
            onSaveNotifications={handleSaveNotificationSettings}
            onSavePrivacy={handleSavePrivacySettings}
            loading={loading}
          />
        ) : (
          <Text style={{ textAlign: 'center', color: '#888', marginTop: 30 }}>Paramètres non accessibles pour ce profil.</Text>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec profil */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#2F7417" />
              </View>
            )}
          </View>
          <Text style={styles.profileName}>
            {profile?.full_name || user.email?.split('@')[0] || 'Voyageur'}
          </Text>
          <Text style={styles.profileEmail}>{profile?.email || user.email}</Text>
        </View>
      </View>

      {/* Navigation par onglets */}
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? '#2F7417' : '#666'}
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenu de l'onglet actif */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#2F7417',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  tabTextActive: {
    color: '#2F7417',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
}); 
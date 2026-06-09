const C = {
  bg:         '#0D0D0D',
  card:       'rgba(13,13,13,0.82)',
  border:     'rgba(245,237,214,0.14)',
  cream:      '#F5EDD6',
  creamDim:   'rgba(245,237,214,0.50)',
  creamFaint: 'rgba(245,237,214,0.18)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.40)',
};

import { useAuth } from '@/features/auth/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  getCurrentUserProfile,
  Profile,
  ProfileUpdate,
  updateNotificationSettings,
  updateTravelPreferences,
  upsertProfile,
} from '@/features/profile/services/profiles';

type TabType = 'info' | 'preferences' | 'settings';

export default function Account() {
  const { user, loading: authLoading, signOut, isConnected } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');

  // Charger le profil au montage
  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await getCurrentUserProfile();
      if (error) {
        console.error('Erreur lors du chargement du profil:', error);

        // Gestion d'erreur plus spécifique
        if (error.includes('relation "public.profiles" does not exist')) {
          Alert.alert(
            'Configuration requise',
            'La table des profils n\'existe pas. Veuillez exécuter le script de création de la base de données.',
            [
              { text: 'OK', style: 'default' }
            ]
          );
        } else {
          Alert.alert(
            'Erreur de chargement',
            'Impossible de charger le profil. L\'application créera un profil automatiquement lors de la prochaine connexion.',
            [
              { text: 'Réessayer', onPress: loadProfile },
              { text: 'Continuer', style: 'cancel' }
            ]
          );
        }
      } else {
        setProfile(data);
        console.log('✅ Profil chargé avec succès:', data?.full_name || data?.email);
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      Alert.alert(
        'Erreur système',
        'Une erreur technique est survenue. Veuillez réessayer.',
        [
          { text: 'Réessayer', onPress: loadProfile },
          { text: 'Continuer', style: 'cancel' }
        ]
      );
    } finally {
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

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('❌ Erreur UI de déconnexion:', error);
      await signOut();
    }
  };

  const tabs = [
    {
      id: 'info' as TabType,
      title: 'Profil',
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
        <ActivityIndicator size="large" color={C.cream} />
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
        return (
          <SettingsForm
            profile={profile}
            onSaveNotifications={handleSaveNotificationSettings}
            onSavePrivacy={handleSavePrivacySettings}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header profil */}
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={44} color={C.creamDim} />
            )}
          </View>
          <Text style={styles.profileName}>
            {profile?.full_name || user.email?.split('@')[0] || 'Voyageur'}
          </Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </Text>
          </View>
        </View>
      </View>

      {/* Bouton de déconnexion */}
      <View style={styles.logoutWrapper}>
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.75} onPress={handleLogout}>
          <Ionicons name="log-out" size={18} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation par onglets */}
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? C.cream : C.creamDim}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
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
    backgroundColor: C.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
    gap: 14,
  },
  loadingText: {
    fontSize: 15,
    color: C.creamDim,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 15,
    color: C.creamDim,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loginButton: {
    borderWidth: 1,
    borderColor: C.creamFaint,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 13,
    backgroundColor: 'rgba(245,237,214,0.06)',
  },
  loginButtonText: {
    color: C.cream,
    fontSize: 15,
    fontWeight: '300',
    letterSpacing: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: C.creamFaint,
    backgroundColor: 'rgba(245,237,214,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '200',
    letterSpacing: 2,
    color: C.cream,
    marginTop: 14,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: C.creamDim,
    marginBottom: 12,
  },
  statusBadge: {
    borderWidth: 1,
    borderColor: C.creamFaint,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(245,237,214,0.04)',
  },
  statusText: {
    fontSize: 12,
    color: C.cream,
    letterSpacing: 1,
  },
  logoutWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.40)',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(239,68,68,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(245,237,214,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginHorizontal: 1,
  },
  tabActive: {
    backgroundColor: 'rgba(245,237,214,0.10)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.creamFaint,
  },
  tabText: {
    fontSize: 13,
    color: C.creamDim,
    fontWeight: '400',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: C.cream,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: C.bg,
  },
});

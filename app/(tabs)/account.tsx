import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import PersonalInfoForm from '../../components/profile/PersonalInfoForm';
import SettingsForm from '../../components/profile/SettingsForm';
import TravelPreferencesForm from '../../components/profile/TravelPreferencesForm';
import { BG, BORDER, DARK, GREEN, GREEN_LIGHT } from '../../constants/Colors';
import {
    getCurrentUserProfile,
    Profile,
    ProfileUpdate,
    updateNotificationSettings,
    updateTravelPreferences,
    upsertProfile,
} from '../../lib/profiles';

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
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}> 
      {/* Dégradé premium en haut - réduit */}
      <LinearGradient
        colors={[GREEN_LIGHT, BG]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140, zIndex: 0 }}
      />
      {/* Header avec profil - compact */}
      <View style={[styles.header, { backgroundColor: 'transparent', borderBottomWidth: 0, marginTop: 5, marginBottom: 10, zIndex: 1, paddingTop: 40, paddingBottom: 10 }]}> 
        <View style={styles.profileHeader}>
          {/* Avatar plus petit */}
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, borderWidth: 2, borderColor: GREEN_LIGHT }}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: 64, height: 64, borderRadius: 32 }} />
              ) : (
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0F9F0', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={32} color="#2F7417" />
                </View>
              )}
            </View>
          </View>
          {/* Informations compactes */}
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: DARK, marginBottom: 1 }}>{profile?.full_name || user.email?.split('@')[0] || 'Voyageur'}</Text>
          <Text style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{user.email}</Text>
          {/* Statut de connexion plus petit */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: GREEN_LIGHT, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginBottom: 4 }}>
            <Ionicons name="ellipse" size={10} color={GREEN} style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 12, color: GREEN, fontWeight: '600' }}>{isConnected ? 'Connecté' : 'Déconnecté'}</Text>
          </View>
        </View>
        {/* Bouton de déconnexion compact dans le header */}
        <TouchableOpacity style={{ backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 }} activeOpacity={0.85} onPress={handleLogout}>
          <Ionicons name="log-out" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
      {/* Navigation par onglets modernisée */}
      <View style={[styles.tabContainer, { marginBottom: 10, borderRadius: 16, overflow: 'hidden', backgroundColor: GREEN_LIGHT, padding: 6 }]}> 
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && { backgroundColor: '#fff', shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4, borderRadius: 12 }]} 
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={activeTab === tab.id ? GREEN : '#bbb'}
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive,
              { fontSize: 15 }
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Contenu de l'onglet actif - plus d'espace */}
      <View style={[styles.content, { padding: 20, marginTop: 5, flex: 1 }]}> 
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
    backgroundColor: GREEN,
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
    paddingBottom: 10, // Réduit de 20 à 10
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Alignement en haut
  },
  profileHeader: {
    alignItems: 'center',
    flex: 1,
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
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectedDot: {
    backgroundColor: '#2F7417',
  },
  disconnectedDot: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: 200,
    marginBottom: 10,

    borderRadius: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
    minHeight: 400, // Plus d'espace pour le contenu
  },
}); 
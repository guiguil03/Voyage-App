import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
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

const C = {
  bg:         '#0D0D0D',
  card:       'rgba(13,13,13,0.92)',
  border:     'rgba(122,184,245,0.14)',
  cream:      '#7AB8F5',
  creamDim:   'rgba(122,184,245,0.50)',
  creamFaint: 'rgba(122,184,245,0.18)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.40)',
};

type TabType = 'info' | 'preferences' | 'settings';

export default function ProfilScreen() {
  const { user, loading: authLoading } = useAuth();
  const params = useLocalSearchParams();
  const userIdParam = params.userId as string | undefined;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');

  useEffect(() => { loadProfile(); }, [user, userIdParam]);

  const loadProfile = async () => {
    if (userIdParam) {
      try {
        const { data, error } = await getProfileById(userIdParam);
        if (error) {
          Alert.alert('Erreur', 'Impossible de charger le profil');
        } else {
          setProfile(data);
        }
      } catch {
        Alert.alert('Erreur', 'Une erreur inattendue est survenue');
      } finally {
        setLoading(false);
      }
    } else if (user) {
      try {
        const { data, error } = await getCurrentUserProfile();
        if (error) {
          Alert.alert('Erreur', 'Impossible de charger le profil');
        } else {
          setProfile(data);
        }
      } catch {
        Alert.alert('Erreur', 'Une erreur inattendue est survenue');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (data: ProfileUpdate) => {
    const { data: updated, error } = await upsertProfile(data);
    if (error) throw new Error(error);
    setProfile(updated);
  };

  const handleSaveTravelPreferences = async (prefs: Profile['travel_preferences']) => {
    const { error } = await updateTravelPreferences(prefs);
    if (error) throw new Error(error);
    await loadProfile();
  };

  const handleSaveNotificationSettings = async (settings: Profile['notification_settings']) => {
    const { error } = await updateNotificationSettings(settings);
    if (error) throw new Error(error);
    await loadProfile();
  };

  const handleSavePrivacySettings = async (level: Profile['privacy_level']) => {
    const { error } = await upsertProfile({ privacy_level: level });
    if (error) throw new Error(error);
    await loadProfile();
  };

  const isOwnProfile = !userIdParam || (user && userIdParam === user.id);

  const tabs: { id: TabType; title: string; icon: string }[] = [
    { id: 'info',        title: 'Profil',      icon: 'person-outline' },
    { id: 'preferences', title: 'Préférences', icon: 'heart-outline' },
    { id: 'settings',    title: 'Paramètres',  icon: 'settings-outline' },
  ];

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.cream} />
          <Text style={styles.loadingText}>Chargement du profil…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="person-outline" size={48} color={C.creamFaint} />
          <Text style={styles.loadingText}>Vous devez être connecté</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Voyageur';

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return <PersonalInfoForm profile={profile} onSave={handleSaveProfile} loading={loading} />;
      case 'preferences':
        return <TravelPreferencesForm profile={profile} onSave={handleSaveTravelPreferences} loading={loading} />;
      case 'settings':
        return isOwnProfile ? (
          <SettingsForm
            profile={profile}
            onSaveNotifications={handleSaveNotificationSettings}
            onSavePrivacy={handleSavePrivacySettings}
            loading={loading}
          />
        ) : (
          <View style={styles.centered}>
            <Ionicons name="lock-closed-outline" size={36} color={C.creamFaint} />
            <Text style={styles.loadingText}>Paramètres non accessibles</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* BACK + PROFILE HEADER */}
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.cream} />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatarRing}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={C.cream} />
            </View>
          )}
        </View>

        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileEmail}>{profile?.email || user.email}</Text>

        {!isOwnProfile && (
          <View style={styles.viewingBadge}>
            <Ionicons name="eye-outline" size={13} color={C.creamDim} />
            <Text style={styles.viewingText}>Profil public</Text>
          </View>
        )}
      </View>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons name={tab.icon as any} size={17} color={active ? C.cream : C.creamDim} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CONTENT */}
      <View style={styles.content}>{renderContent()}</View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: 16, paddingHorizontal: 40,
  },
  loadingText: { fontSize: 15, color: C.creamDim, fontWeight: '300', textAlign: 'center' },
  loginBtn:     { backgroundColor: C.cream, borderRadius: 20, paddingHorizontal: 28, paddingVertical: 13 },
  loginBtnText: { color: C.bg, fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },

  /* HEADER */
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 16, paddingBottom: 24,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2, borderColor: C.cream,
    padding: 3, marginBottom: 14,
  },
  avatarImg:         { width: '100%', height: '100%', borderRadius: 44 },
  avatarPlaceholder: {
    width: '100%', height: '100%', borderRadius: 44,
    backgroundColor: 'rgba(122,184,245,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  profileName:  { fontSize: 24, fontWeight: '200', letterSpacing: 1.5, color: C.white, marginBottom: 4 },
  profileEmail: { fontSize: 13, color: C.creamDim, fontWeight: '300' },
  viewingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(122,184,245,0.20)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  viewingText: { fontSize: 12, color: C.creamDim, fontWeight: '300' },

  /* TAB BAR */
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 22, marginTop: 16, marginBottom: 4,
    backgroundColor: 'rgba(122,184,245,0.04)',
    borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10, borderRadius: 10,
  },
  tabActive: {
    backgroundColor: 'rgba(122,184,245,0.10)',
    borderWidth: 1, borderColor: C.creamFaint,
  },
  tabText:       { fontSize: 12, color: C.creamDim, fontWeight: '400' },
  tabTextActive: { color: C.cream, fontWeight: '500' },

  content: { flex: 1 },
});

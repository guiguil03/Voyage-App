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

import { useAuth } from '@/features/auth/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');

  useEffect(() => { loadProfile(); }, [user]);

  const loadProfile = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await getCurrentUserProfile();
      if (error) {
        Alert.alert('Erreur', 'Impossible de charger le profil.', [
          { text: 'Réessayer', onPress: loadProfile },
          { text: 'Continuer', style: 'cancel' },
        ]);
      } else {
        setProfile(data);
      }
    } catch {
      Alert.alert('Erreur système', 'Une erreur technique est survenue.', [
        { text: 'Réessayer', onPress: loadProfile },
        { text: 'Continuer', style: 'cancel' },
      ]);
    } finally {
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

  const handleLogout = async () => {
    try { await signOut(); } catch { await signOut(); }
  };

  const tabs: { id: TabType; title: string; icon: string }[] = [
    { id: 'info',        title: 'Profil',       icon: 'person-outline' },
    { id: 'preferences', title: 'Préférences',  icon: 'heart-outline' },
    { id: 'settings',    title: 'Paramètres',   icon: 'settings-outline' },
  ];

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.cream} />
          <Text style={styles.loadingText}>Chargement du profil…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
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
      case 'info':        return <PersonalInfoForm profile={profile} onSave={handleSaveProfile} loading={loading} />;
      case 'preferences': return <TravelPreferencesForm profile={profile} onSave={handleSaveTravelPreferences} loading={loading} />;
      case 'settings':    return <SettingsForm profile={profile} onSaveNotifications={handleSaveNotificationSettings} onSavePrivacy={handleSavePrivacySettings} loading={loading} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* PROFILE HEADER */}
      <View style={styles.profileHeader}>
        {/* Avatar */}
        <View style={styles.avatarRing}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={42} color={C.cream} />
            </View>
          )}
        </View>

        {/* Name + email */}
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>

        {/* Status + logout */}
        <View style={styles.profileMeta}>
          <View style={[styles.statusBadge, { borderColor: isConnected ? 'rgba(78,205,196,0.4)' : C.creamFaint }]}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4ECDC4' : C.creamDim }]} />
            <Text style={[styles.statusText, { color: isConnected ? '#4ECDC4' : C.creamDim }]}>
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
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
              <Ionicons name={tab.icon as any} size={18} color={active ? C.cream : C.creamDim} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {renderContent()}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  loadingWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: 16, paddingHorizontal: 40,
  },
  loadingText: { fontSize: 15, color: C.creamDim, fontWeight: '300', textAlign: 'center' },
  loginBtn:    { backgroundColor: C.cream, borderRadius: 20, paddingHorizontal: 28, paddingVertical: 13, marginTop: 8 },
  loginBtnText:{ color: C.bg, fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },

  /* PROFILE HEADER */
  profileHeader: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: C.cream,
    padding: 3,
    marginBottom: 16,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 44 },
  avatarPlaceholder: {
    width: '100%', height: '100%', borderRadius: 44,
    backgroundColor: 'rgba(122,184,245,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  profileName:  { fontSize: 24, fontWeight: '200', letterSpacing: 1.5, color: C.white, marginBottom: 4 },
  profileEmail: { fontSize: 13, color: C.creamDim, fontWeight: '300', marginBottom: 16 },
  profileMeta:  { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 13, fontWeight: '300' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  logoutText: { color: '#EF4444', fontSize: 13, fontWeight: '400' },

  /* TAB BAR */
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: 'rgba(122,184,245,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 4,
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

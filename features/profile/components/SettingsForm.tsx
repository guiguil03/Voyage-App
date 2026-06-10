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

const C = {
  bg:         '#0D0D0D',
  card:       'rgba(18,18,18,0.95)',
  border:     'rgba(122,184,245,0.12)',
  borderMid:  'rgba(122,184,245,0.22)',
  cream:      '#7AB8F5',
  creamDim:   'rgba(122,184,245,0.50)',
  creamFaint: 'rgba(122,184,245,0.10)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.45)',
};

interface SettingsFormProps {
  profile: Profile | null;
  onSaveNotifications: (settings: Profile['notification_settings']) => Promise<void>;
  onSavePrivacy: (level: Profile['privacy_level']) => Promise<void>;
  loading?: boolean;
}

export default function SettingsForm({ profile, onSaveNotifications, onSavePrivacy, loading = false }: SettingsFormProps) {
  const [notifications, setNotifications] = useState({
    email: profile?.notification_settings?.email ?? true,
    push:  profile?.notification_settings?.push  ?? true,
    sms:   profile?.notification_settings?.sms   ?? false,
  });

  const [privacyLevel, setPrivacyLevel] = useState<Profile['privacy_level']>(
    profile?.privacy_level || 'public'
  );

  const [savingNotif, setSavingNotif] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const handleSaveNotifications = async () => {
    if (savingNotif || loading) return;
    setSavingNotif(true);
    try {
      await onSaveNotifications(notifications);
      Alert.alert('Succès', 'Paramètres de notification mis à jour !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingNotif(false);
    }
  };

  const handleSavePrivacy = async (level: Profile['privacy_level']) => {
    if (savingPrivacy || loading) return;
    setSavingPrivacy(true);
    try {
      setPrivacyLevel(level);
      await onSavePrivacy(level);
      Alert.alert('Succès', 'Confidentialité mise à jour !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
      setPrivacyLevel(profile?.privacy_level || 'public');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const notifRows: { key: keyof typeof notifications; icon: string; label: string; desc: string }[] = [
    { key: 'email', icon: 'mail-outline',          label: 'Notifications email', desc: 'Recevez des emails pour les nouvelles activités' },
    { key: 'push',  icon: 'notifications-outline', label: 'Notifications push',  desc: 'Recevez des notifications sur votre appareil' },
    { key: 'sms',   icon: 'chatbubble-outline',    label: 'Notifications SMS',   desc: 'Recevez des SMS pour les informations importantes' },
  ];

  const privacyOptions: { id: Profile['privacy_level']; title: string; desc: string; icon: string }[] = [
    { id: 'public',  title: 'Public',          desc: 'Tout le monde peut voir votre profil et vos voyages', icon: 'globe-outline' },
    { id: 'friends', title: 'Amis uniquement', desc: 'Seuls vos amis peuvent voir vos informations',        icon: 'people-outline' },
    { id: 'private', title: 'Privé',           desc: 'Vos informations sont privées',                      icon: 'lock-closed-outline' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

      {/* NOTIFICATIONS */}
      <View style={styles.sectionHead}>
        <View style={styles.accent} />
        <Text style={styles.sectionTitle}>Notifications</Text>
      </View>

      <View style={styles.card}>
        {notifRows.map((row, i) => (
          <View key={row.key}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons name={row.icon as any} size={18} color={C.cream} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{row.label}</Text>
                <Text style={styles.settingDesc}>{row.desc}</Text>
              </View>
              <Switch
                value={notifications[row.key]}
                onValueChange={v => setNotifications(p => ({ ...p, [row.key]: v }))}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: 'rgba(122,184,245,0.55)' }}
                thumbColor={notifications[row.key] ? C.cream : 'rgba(255,255,255,0.40)'}
              />
            </View>
            {i < notifRows.length - 1 && <View style={styles.divider} />}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveBtn, savingNotif && styles.saveBtnDisabled]}
          onPress={handleSaveNotifications}
          disabled={savingNotif || loading}
        >
          <Ionicons name="checkmark" size={18} color={C.bg} style={{ marginRight: 6 }} />
          <Text style={styles.saveBtnText}>{savingNotif ? 'Sauvegarde…' : 'Sauvegarder'}</Text>
        </TouchableOpacity>
      </View>

      {/* CONFIDENTIALITÉ */}
      <View style={[styles.sectionHead, { marginTop: 28 }]}>
        <View style={styles.accent} />
        <Text style={styles.sectionTitle}>Confidentialité</Text>
      </View>
      <Text style={styles.sectionSub}>Choisissez qui peut voir vos informations</Text>

      {privacyOptions.map(opt => {
        const sel = privacyLevel === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[styles.privacyOpt, sel && styles.privacyOptSelected]}
            onPress={() => handleSavePrivacy(opt.id)}
            disabled={savingPrivacy || loading}
          >
            <View style={[styles.privacyIcon, sel && styles.privacyIconSelected]}>
              <Ionicons name={opt.icon as any} size={20} color={sel ? C.bg : C.cream} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.privacyTitle, sel && styles.privacyTitleSelected]}>{opt.title}</Text>
              <Text style={styles.privacyDesc}>{opt.desc}</Text>
            </View>
            {sel && <Ionicons name="checkmark-circle" size={22} color={C.cream} />}
          </TouchableOpacity>
        );
      })}

      {/* INFOS */}
      <View style={[styles.sectionHead, { marginTop: 28 }]}>
        <View style={styles.accent} />
        <Text style={styles.sectionTitle}>Informations</Text>
      </View>

      <View style={styles.infoCard}>
        {[
          { icon: 'shield-checkmark-outline', text: 'Vos données sont sécurisées et chiffrées' },
          { icon: 'time-outline',             text: 'Vous pouvez modifier ces paramètres à tout moment' },
        ].map((row, i) => (
          <View key={i} style={[styles.infoRow, i > 0 && { marginTop: 12 }]}>
            <Ionicons name={row.icon as any} size={18} color={C.creamDim} />
            <Text style={styles.infoText}>{row.text}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content:   { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 60 },

  sectionHead:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  accent:       { width: 3, height: 16, backgroundColor: '#7AB8F5', borderRadius: 2, marginRight: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '400', color: C.white, letterSpacing: 0.4 },
  sectionSub:   { fontSize: 12, color: C.creamDim, marginBottom: 14, fontWeight: '300', marginTop: -8 },

  /* NOTIFICATION CARD */
  card: {
    backgroundColor: 'rgba(18,18,18,0.95)',
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
    padding: 16,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  settingIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  settingInfo:  { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: C.white, marginBottom: 2 },
  settingDesc:  { fontSize: 12, color: C.creamDim, fontWeight: '300' },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 10 },

  saveBtn: {
    backgroundColor: C.cream, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, marginTop: 14,
    shadowColor: C.cream, shadowOpacity: 0.22, shadowRadius: 8, elevation: 4,
  },
  saveBtnDisabled: { backgroundColor: 'rgba(122,184,245,0.20)', shadowOpacity: 0, elevation: 0 },
  saveBtnText: { color: C.bg, fontSize: 14, fontWeight: '600' },

  /* PRIVACY OPTIONS */
  privacyOpt: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(18,18,18,0.95)',
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 10,
  },
  privacyOptSelected: { borderColor: C.borderMid, backgroundColor: 'rgba(122,184,245,0.06)' },
  privacyIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.creamFaint, justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  privacyIconSelected: { backgroundColor: C.cream },
  privacyTitle:         { fontSize: 14, fontWeight: '500', color: C.white, marginBottom: 2 },
  privacyTitleSelected: { color: C.cream },
  privacyDesc: { fontSize: 12, color: C.creamDim, fontWeight: '300' },

  /* INFO CARD */
  infoCard: {
    backgroundColor: 'rgba(18,18,18,0.95)',
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    padding: 16,
  },
  infoRow:  { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 13, color: C.whiteDim, marginLeft: 12, flex: 1, fontWeight: '300' },
});

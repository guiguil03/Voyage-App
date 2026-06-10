import { signUp } from '@/features/auth/services/auth-client';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const ROWS = [
  { text: 'Paris  ·  Tokyo  ·  New York  ·  Bali  ·  Rome  ·  Marrakech  ·  Sydney  ·  Dubaï  ·  ', dur: 30000, y: H * 0.06, rev: false, op: 0.06 },
  { text: 'Barcelone  ·  Kyoto  ·  Lisbonne  ·  Istanbul  ·  Santorini  ·  Prague  ·  Maldives  ·  ', dur: 46000, y: H * 0.22, rev: true, op: 0.04 },
  { text: 'Amsterdam  ·  Seoul  ·  Rio  ·  Nairobi  ·  Reykjavik  ·  Montréal  ·  Athènes  ·  ', dur: 38000, y: H * 0.60, rev: false, op: 0.04 },
  { text: 'Venise  ·  Singapour  ·  Le Cap  ·  Buenos Aires  ·  Moscou  ·  Séville  ·  Lisbonne  ·  ', dur: 54000, y: H * 0.82, rev: true, op: 0.05 },
];

const COPY_W = 920;

function DestRow({ text, dur, y, rev, op }: { text: string; dur: number; y: number; rev: boolean; op: number }) {
  const x = useRef(new Animated.Value(rev ? -COPY_W : 0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(x, {
        toValue: rev ? 0 : -COPY_W,
        duration: dur,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);
  return (
    <Animated.View style={{ position: 'absolute', top: y, width: W * 12, transform: [{ translateX: x }] }}>
      <Text style={{ fontSize: 12, fontWeight: '200', letterSpacing: 4, color: `rgba(122,184,245,${op})` }} numberOfLines={1}>
        {text.repeat(4)}
      </Text>
    </Animated.View>
  );
}

const C = {
  bg:         '#0D0D0D',
  cardBg:     'rgba(13,13,13,0.72)',
  cardBorder: 'rgba(122,184,245,0.18)',
  cream:      '#7AB8F5',
  creamDim:   'rgba(122,184,245,0.55)',
  creamFocus: 'rgba(122,184,245,0.60)',
  inputBg:    'rgba(255,255,255,0.06)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.35)',
};

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (cooldown > 0) {
      interval = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [cooldown]);

  const handleRegister = async () => {
    if (cooldown > 0) {
      Alert.alert('Patientez', `Encore ${cooldown} secondes.`);
      return;
    }
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      const result = await signUp.email({ email, password });
      if (result.data?.user) {
        const confirmed = result.data.user.email_confirmed_at !== null;
        Alert.alert(
          'Succès',
          confirmed
            ? 'Inscription réussie ! Vous pouvez vous connecter.'
            : 'Inscription réussie ! Vérifiez votre email.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      const msg = error.message || "Erreur lors de l'inscription";
      if (msg.includes('patienter')) setCooldown(40);
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View style={styles.background}>
        {/* Couche décorative fond */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {ROWS.map((row, i) => <DestRow key={i} {...row} />)}
          <LinearGradient
            colors={['rgba(122,184,245,0.06)', 'rgba(122,184,245,0.02)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.45 }}
          />
          <View style={styles.glowCircle} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
              <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                  <AntDesign name="arrow-left" size={22} color={C.cream} />
                </TouchableOpacity>
                <Text style={styles.appTitle}>CityTrip</Text>
                <Text style={styles.appSubtitle}>CRÉER UN COMPTE</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.formTitle}>Inscription</Text>

                <Text style={styles.label}>EMAIL</Text>
                <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused]}>
                  <Ionicons name="mail-outline" size={18} color={C.creamDim} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="email@gmail.com"
                    placeholderTextColor={C.whiteDim}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                <Text style={styles.label}>MOT DE PASSE</Text>
                <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused]}>
                  <Ionicons name="lock-closed-outline" size={18} color={C.creamDim} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="••••••••"
                    placeholderTextColor={C.whiteDim}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={18}
                      color={C.creamDim}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>CONFIRMER</Text>
                <View style={[styles.inputWrapper, focusedField === 'confirm' && styles.inputFocused]}>
                  <Ionicons name="lock-closed-outline" size={18} color={C.creamDim} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={C.whiteDim}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={true}
                    autoCapitalize="none"
                    editable={!loading}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, (loading || cooldown > 0) && styles.primaryBtnDisabled]}
                  onPress={handleRegister}
                  disabled={loading || cooldown > 0}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={C.bg} />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {cooldown > 0 ? `Attendre ${cooldown}s` : "S'inscrire"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => router.back()}
                  disabled={loading}
                >
                  <Text style={styles.secondaryBtnText}>Déjà un compte ? Se connecter</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
    </>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#0D0D0D' },
  glowCircle: {
    position: 'absolute',
    top: H * 0.02,
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(122,184,245,0.025)',
    shadowColor: '#7AB8F5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 80,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  backBtn: { position: 'absolute', left: 0, top: 0, padding: 8 },
  appTitle: {
    fontSize: 42,
    fontWeight: '200',
    letterSpacing: 10,
    color: '#7AB8F5',
    marginBottom: 10,
  },
  appSubtitle: {
    fontSize: 12,
    letterSpacing: 5,
    color: 'rgba(122,184,245,0.55)',
    fontWeight: '300',
  },
  card: {
    backgroundColor: 'rgba(13,13,13,0.72)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(122,184,245,0.18)',
    padding: 28,
    shadowColor: '#7AB8F5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 10,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(122,184,245,0.60)',
    fontWeight: '400',
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(122,184,245,0.20)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputFocused: { borderColor: 'rgba(122,184,245,0.60)' },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#FFFFFF', fontWeight: '300' },
  primaryBtn: {
    backgroundColor: '#7AB8F5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 14,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    color: '#0D0D0D',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(122,184,245,0.40)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#7AB8F5',
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
});

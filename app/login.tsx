import { useAuth } from '@/features/auth/hooks/useAuth';
import { signIn, signUp } from '@/features/auth/services/auth-client';
import { Ionicons } from '@expo/vector-icons';
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
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const C = {
  bg:         '#0D0D0D',
  cardBg:     'rgba(13,13,13,0.82)',
  cardBorder: 'rgba(245,237,214,0.18)',
  cream:      '#F5EDD6',
  creamDim:   'rgba(245,237,214,0.55)',
  creamFocus: 'rgba(245,237,214,0.60)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.35)',
};

const ROWS = [
  { text: 'Paris  ·  Tokyo  ·  New York  ·  Bali  ·  Rome  ·  Marrakech  ·  Sydney  ·  Dubaï  ·  ', dur: 28000, y: H * 0.08, rev: false, op: 0.07 },
  { text: 'Barcelone  ·  Kyoto  ·  Lisbonne  ·  Istanbul  ·  Santorini  ·  Prague  ·  Maldives  ·  ', dur: 44000, y: H * 0.26, rev: true, op: 0.04 },
  { text: 'Amsterdam  ·  Seoul  ·  Rio  ·  Nairobi  ·  Reykjavik  ·  Montréal  ·  Athènes  ·  ', dur: 36000, y: H * 0.55, rev: false, op: 0.04 },
  { text: 'Venise  ·  Singapour  ·  Le Cap  ·  Buenos Aires  ·  Moscou  ·  Séville  ·  Lisbonne  ·  ', dur: 52000, y: H * 0.78, rev: true, op: 0.05 },
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
      <Text
        style={{ fontSize: 12, fontWeight: '200', letterSpacing: 4, color: `rgba(245,237,214,${op})` }}
        numberOfLines={1}
      >
        {text.repeat(4)}
      </Text>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const { isConnected, loading: authLoading } = useAuth();

  useEffect(() => {
    if (isConnected && !authLoading && !redirecting) {
      setRedirecting(true);
      setTimeout(() => { try { router.replace('/(tabs)/home'); } catch { /* ignore */ } }, 100);
    }
  }, [isConnected, authLoading, redirecting]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn.email({ email: email.trim(), password });
        setTimeout(() => { try { router.replace('/(tabs)/home'); } catch { /* ignore */ } }, 100);
      } else {
        await signUp.email({ email: email.trim(), password });
        Alert.alert('Succès', 'Compte créé !', [{
          text: 'OK',
          onPress: () => setTimeout(() => { try { router.replace('/(tabs)/home'); } catch { /* ignore */ } }, 100),
        }]);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setEmail('');
    setPassword('');
  };

  if (authLoading || redirecting || isConnected) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.cream} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View style={styles.bg}>

        {/* Couche décorative fond */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {ROWS.map((row, i) => <DestRow key={i} {...row} />)}
          <LinearGradient
            colors={['rgba(245,237,214,0.06)', 'rgba(245,237,214,0.02)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.50 }}
          />
          <View style={styles.glowCircle} />
        </View>

        {/* Contenu */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.inner}>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Ionicons name="compass-outline" size={26} color="rgba(245,237,214,0.65)" />
              </View>
              <Text style={styles.title}>CityTrip</Text>
              <Text style={styles.subtitle}>
                {mode === 'signin' ? 'BON RETOUR' : 'BIENVENUE'}
              </Text>
              <Text style={styles.tagline}>Discover the world</Text>
            </View>

            {/* Carte glass */}
            <View style={styles.card}>
              <Text style={styles.formTitle}>
                {mode === 'signin' ? 'Connexion' : 'Inscription'}
              </Text>

              <Text style={styles.label}>EMAIL</Text>
              <View style={[styles.inputWrap, focusedField === 'email' && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={18} color={C.creamDim} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="email@gmail.com"
                  placeholderTextColor={C.whiteDim}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <Text style={styles.label}>MOT DE PASSE</Text>
              <View style={[styles.inputWrap, focusedField === 'password' && styles.inputFocused]}>
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

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleAuth}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator size="small" color={C.bg} />
                  : <Text style={styles.primaryBtnText}>{mode === 'signin' ? 'Se connecter' : "S'inscrire"}</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={toggleMode} disabled={loading}>
                <Text style={styles.secondaryBtnText}>
                  {mode === 'signin' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: C.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  glowCircle: {
    position: 'absolute',
    top: H * 0.02,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(245,237,214,0.025)',
    shadowColor: C.cream,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 80,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 50,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(245,237,214,0.22)',
    backgroundColor: 'rgba(245,237,214,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 42,
    fontWeight: '200',
    letterSpacing: 10,
    color: C.cream,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 6,
    color: C.creamDim,
    fontWeight: '300',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(245,237,214,0.28)',
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 28,
    shadowColor: C.cream,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 10,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: C.white,
    letterSpacing: 1,
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.creamFocus,
    fontWeight: '400',
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,237,214,0.20)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputFocused: { borderColor: C.creamFocus },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: C.white, fontWeight: '300' },
  primaryBtn: {
    backgroundColor: C.cream,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 14,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: C.bg, fontSize: 15, fontWeight: '500', letterSpacing: 1 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245,237,214,0.40)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: C.cream, fontSize: 14, fontWeight: '300', letterSpacing: 0.5 },
});

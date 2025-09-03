import AuthCard from '@/components/auth/AuthCard';
import EnhancedAuthHeader from '@/components/auth/EnhancedAuthHeader';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import GradientButton from '@/components/auth/GradientButton';
import ModeToggle from '@/components/auth/ModeToggle';
import Separator from '@/components/auth/Separator';
import { useAuth } from '@/hooks/useAuth';
import { signIn, signUp } from '@/lib/auth-client';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { isConnected, loading: authLoading } = useAuth();

  // Redirection si déjà connecté avec protection contre les erreurs
  useEffect(() => {
    const handleRedirection = async () => {
      if (isConnected && !authLoading && !redirecting) {
        console.log('✅ Utilisateur déjà connecté, préparation redirection...');
        setRedirecting(true);
        
        try {
          // Attendre un petit délai pour éviter les conflits de navigation
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Vérifier si on peut faire la redirection
          if (typeof window !== 'undefined') {
            // Sur web, utiliser replace natif
            window.location.replace('/(tabs)/home');
          } else {
            // Sur mobile, utiliser expo-router
            router.replace('/(tabs)/home');
          }
        } catch (error) {
          console.warn('⚠️ Erreur de redirection:', error);
          // En cas d'erreur, essayer une méthode alternative
          setTimeout(() => {
            try {
              router.push('/(tabs)/home');
            } catch (secondError) {
              console.error('❌ Impossible de rediriger:', secondError);
              setRedirecting(false);
            }
          }, 500);
        }
      }
    };

    handleRedirection();
  }, [isConnected, authLoading, redirecting]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        console.log('🔐 Tentative de connexion...');
        await signIn.email({ email: email.trim(), password });
        console.log('✅ Connexion réussie');
        
        // Redirection plus sûre après connexion
        setTimeout(() => {
          try {
            router.replace('/(tabs)/home');
          } catch (navError) {
            console.warn('⚠️ Erreur navigation après connexion:', navError);
            if (typeof window !== 'undefined') {
              window.location.href = '/(tabs)/home';
            }
          }
        }, 100);
        
      } else {
        console.log('📝 Tentative d\'inscription...');
        await signUp.email({ email: email.trim(), password });
        console.log('✅ Inscription réussie');
        Alert.alert(
          'Succès',
          'Compte créé avec succès !',
          [{ 
            text: 'OK', 
            onPress: () => {
              setTimeout(() => {
                try {
                  router.replace('/(tabs)/home');
                } catch (navError) {
                  console.warn('⚠️ Erreur navigation après inscription:', navError);
                  if (typeof window !== 'undefined') {
                    window.location.href = '/(tabs)/home';
                  }
                }
              }, 100);
            }
          }]
        );
      }
    } catch (error: any) {
      console.error('❌ Erreur d\'authentification:', error.message);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setEmail('');
    setPassword('');
  };

  // Loader pendant la vérification ou redirection
  if (authLoading || redirecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {redirecting ? 'Redirection...' : 'Vérification...'}
        </Text>
      </View>
    );
  }

  // Ne rien afficher si connecté (évite le flash)
  if (isConnected) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F7417" />
        <Text style={styles.loadingText}>Redirection...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header enrichi avec votre charte graphique */}
        <EnhancedAuthHeader
          title="CityTrip"
          subtitle={mode === 'signin' ? 'Bon retour !' : 'Bienvenue dans l\'aventure !'}
          icon="airplane"
          showFeatures={true}
        />

        {/* Formulaire avec design moderne */}
        <ScrollView 
          style={styles.formScrollView}
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthCard>
            {/* Indicateur de mode */}
            <ModeToggle
              mode={mode}
              onModeChange={handleModeChange}
              disabled={loading}
            />

            {/* Champs de saisie modernes */}
            <View style={styles.inputsContainer}>
              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[styles.inputWrapper, email && styles.inputWrapperFocused]}>
                  <Ionicons name="mail-outline" size={20} color={email ? "#2F7417" : "#9CA3AF"} />
                  <TextInput
                    style={styles.input}
                    placeholder="votre@email.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Mot de passe */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
                <View style={[styles.inputWrapper, password && styles.inputWrapperFocused]}>
                  <Ionicons name="lock-closed-outline" size={20} color={password ? "#2F7417" : "#9CA3AF"} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    disabled={loading}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Bouton principal avec gradient */}
            <GradientButton
              title={mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
              onPress={handleAuth}
              loading={loading}
              icon={mode === 'signin' ? "log-in-outline" : "person-add-outline"}
            />

            {/* Séparateur */}
            <Separator text="ou" />

            {/* Boutons sociaux */}
            <View style={styles.socialContainer}>
              <GoogleSignInButton 
                onSuccess={() => {
                  console.log('✅ Connexion Google réussie');
                  setRedirecting(true);
                }}
                onError={(error) => {
                  console.error('❌ Erreur connexion Google:', error);
                  Alert.alert('Erreur', error);
                }}
              />

              <TouchableOpacity 
                style={styles.socialButton} 
                disabled={loading}
                onPress={() => Alert.alert('Info', 'Connexion Facebook bientôt disponible')}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Lien de basculement */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => handleModeChange(mode === 'signin' ? 'signup' : 'signin')}
              disabled={loading}
            >
              <Text style={styles.toggleButtonText}>
                {mode === 'signin' 
                  ? 'Pas encore de compte ? Créer un compte' 
                  : 'Déjà un compte ? Se connecter'
                }
              </Text>
            </TouchableOpacity>
          </AuthCard>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Container principal
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // ScrollView du formulaire
  formScrollView: {
    flex: 1,
  },
  
  formScrollContent: {
    padding: 24,
    paddingTop: 25,
    marginTop: 0,
  },
  
  // Container des inputs
  inputsContainer: {
    marginBottom: 32,
  },
  
  inputGroup: {
    marginBottom: 20,
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  
  inputWrapperFocused: {
    borderColor: '#2F7417',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  
  // Boutons sociaux
  socialContainer: {
    gap: 12,
    marginBottom: 24,
  },
  
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  
  socialButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  
  // Bouton de basculement
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  
  toggleButtonText: {
    fontSize: 16,
    color: '#2F7417',
    fontWeight: '600',
  },
  
  // Styles pour les loaders
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
}); 
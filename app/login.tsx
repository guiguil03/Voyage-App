import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/hooks/useAuth';
import { signIn, signUp } from '@/lib/auth-client';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
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

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
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
      <ImageBackground
        source={require('@/assets/images/temple-bali-sunset.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.appTitle}>CityTrip</Text>
              <Text style={styles.appSubtitle}>
                {mode === 'signin' ? 'Bon retour !' : 'Bienvenue !'}
              </Text>
            </View>

            {/* Formulaire */}
            <View style={styles.formContainer}>
              <View style={styles.card}>
                <Text style={styles.formTitle}>
                  {mode === 'signin' ? 'Connexion' : 'Inscription'}
                </Text>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail" size={20} color="#2F7417" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#999"
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
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed" size={20} color="#2F7417" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Mot de passe"
                      placeholderTextColor="#999"
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
                        name={showPassword ? "eye" : "eye-off"} 
                        size={20} 
                        color="#999" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bouton principal */}
                <TouchableOpacity
                  style={[styles.authButton, loading && styles.authButtonDisabled]}
                  onPress={handleAuth}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.authButtonText}>
                      {mode === 'signin' ? 'Se connecter' : 'S inscrire'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Bouton changement de mode */}
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={toggleMode}
                  disabled={loading}
                >
                  <Text style={styles.toggleButtonText}>
                    {mode === 'signin' 
                      ? 'Pas de compte ? S inscrire' 
                      : 'Déjà un compte ? Se connecter'
                    }
                  </Text>
                </TouchableOpacity>

               

                {/* Boutons sociaux simplifiés */}
                <View style={styles.socialContainer}>
                  <Text style={styles.socialText}>Ou continuer avec</Text>
                  
                  <View style={styles.socialButtons}>
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
                      style={[styles.socialButton, styles.facebookButton]} 
                      disabled={loading}
                      onPress={() => Alert.alert('Info', 'Connexion Facebook non configurée')}
                    >
                      <Ionicons name="logo-facebook" size={20} color="#2F7417" />
                      <Text style={[styles.socialButtonText, { color: '#0000000' }]}>Facebook</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  eyeButton: {
    padding: 5,
  },
  authButton: {
    backgroundColor: '#2F7417',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '##2F7417',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  authButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleButtonText: {
    color: '#2F7417',
    fontSize: 16,
    fontWeight: '500',
  },
  debugContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  debugText: {
    fontSize: 12,
    color: '#8A6D3B',
    textAlign: 'center',
  },
  socialContainer: {
    alignItems: 'center',
  },
  socialText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderColor: '##2F7417',
  },
  facebookButton: {
    backgroundColor: '#ffffff',
    borderColor: '#2F7417',
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
}); 
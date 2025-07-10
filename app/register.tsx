import { signUp } from '@/lib/auth-client';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Effect pour le countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  const handleRegister = async () => {
    if (cooldown > 0) {
      Alert.alert('Patientez', `Veuillez patienter encore ${cooldown} secondes avant de réessayer.`);
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
      if (result.data.user) {
        // Vérifier si l'utilisateur est déjà confirmé (confirmation désactivée)
        const isEmailConfirmed = result.data.user.email_confirmed_at !== null;
        
        if (isEmailConfirmed) {
          // Email confirmation désactivée - connexion directe possible
          Alert.alert(
            'Succès', 
            'Inscription réussie ! Vous pouvez maintenant vous connecter.',
            [
              {
                text: 'OK',
                onPress: () => router.back()
              }
            ]
          );
        } else {
          // Email confirmation activée - besoin de vérifier l'email
          Alert.alert(
            'Succès', 
            'Inscription réussie ! Vérifiez votre email pour confirmer votre compte.',
            [
              {
                text: 'OK',
                onPress: () => router.back()
              }
            ]
          );
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de l\'inscription';
      
      // Si c'est une erreur de rate limiting, activer le cooldown
      if (errorMessage.includes('patienter')) {
        setCooldown(40); // 40 secondes de cooldown
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/temple-water-sunset.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.contentContainer}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBackToLogin}
              >
                <AntDesign name="arrowleft" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.title}>CityTrip</Text>
              <Text style={styles.subtitle}>Create your account</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>email</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="email@gmail.com"
                  placeholderTextColor="#999999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Mot de passe</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#999999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Confirmer le mot de passe</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#999999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  (loading || cooldown > 0) && styles.registerButtonDisabled
                ]}
                onPress={handleRegister}
                disabled={loading || cooldown > 0}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.registerButtonText}>
                    {cooldown > 0 ? `Attendre ${cooldown}s` : 'Register'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Already have an account?{' '}
                  <Text 
                    style={styles.loginLink}
                    onPress={handleBackToLogin}
                  >
                    Login
                  </Text>
                </Text>
              </View>

            </View>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 40,
  },
  headerSection: {
    alignItems: 'flex-start',
    marginTop: 30,
    paddingHorizontal: 30,
  },
  backButton: {
    marginBottom: 20,
    padding: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 30,
    height: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 15,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000000',
    fontWeight: '400',
    borderWidth: 0,
  },
  registerButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  registerButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 18,
  },
  loginText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '400',
  },
  loginLink: {
    color: '#000000',
    fontWeight: '600',
  },
}); 
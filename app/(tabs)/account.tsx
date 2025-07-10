import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Account() {
  const { user, session, loading, signOut, getAuthStatus, isConnected } = useAuth();

  // Fonction de déconnexion simple
  const handleLogout = async () => {
    try {
      Alert.alert(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Déconnecter',
            style: 'destructive',
            onPress: async () => {
              console.log('🚪 Déconnexion initiée depuis account.tsx');
              await signOut();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Erreur UI de déconnexion:', error);
      await signOut();
    }
  };

  // Fonction de diagnostic (debug)
  const handleDebug = async () => {
    const status = await getAuthStatus();
    Alert.alert('Diagnostic', `État: ${status}\nConnecté: ${isConnected ? 'Oui' : 'Non'}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header avec gradient */}
      <LinearGradient
        colors={['#2F7417', '#5F934E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <IconSymbol 
              name="person.crop.circle.fill" 
              size={80} 
              color="#FFFFFF" 
            />
          </View>
          <Text style={styles.userName}>
            {user?.email?.split('@')[0] || 'Utilisateur'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || 'Email non disponible'}
          </Text>
          
          {/* Badge de statut */}
          <View style={[styles.statusBadge, isConnected ? styles.connectedBadge : styles.disconnectedBadge]}>
            <IconSymbol 
              name={isConnected ? "checkmark.circle.fill" : "xmark.circle.fill"} 
              size={16} 
              color={isConnected ? "#FFFFFF" : "#FFFFFF"} 
            />
            <Text style={styles.statusText}>
              {isConnected ? "Connecté" : "Déconnecté"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Contenu principal */}
      <View style={styles.content}>
        
        {/* Section Informations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du compte</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <IconSymbol name="envelope.fill" size={20} color="#667eea" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || 'Non disponible'}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <IconSymbol name="calendar.badge.clock" size={20} color="#667eea" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Membre depuis</Text>
                <Text style={styles.infoValue}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <IconSymbol name="key.fill" size={20} color="#667eea" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>ID Utilisateur</Text>
                <Text style={styles.infoValue}>
                  {user?.id?.substring(0, 8) || 'N/A'}...
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section Paramètres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <IconSymbol name="bell.fill" size={22} color="#667eea" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Notifications</Text>
                <Text style={styles.menuSubtitle}>Gérer vos notifications</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#C1C1C1" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <IconSymbol name="lock.fill" size={22} color="#667eea" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Confidentialité</Text>
                <Text style={styles.menuSubtitle}>Paramètres de confidentialité</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#C1C1C1" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <IconSymbol name="questionmark.circle.fill" size={22} color="#667eea" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Aide & Support</Text>
                <Text style={styles.menuSubtitle}>Obtenez de l&apos;aide</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#C1C1C1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
        

          {/* Bouton Déconnexion */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]} 
            onPress={handleLogout}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right.fill" size={20} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
              Se déconnecter
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  connectedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
  },
  disconnectedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  menuContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  menuTitle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  debugButton: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
}); 
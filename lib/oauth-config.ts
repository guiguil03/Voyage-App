import { Platform } from 'react-native';

// Configuration des URLs OAuth selon la plateforme
export const getOAuthRedirectUrl = (): string => {
  if (Platform.OS === 'web') {
    // Pour le web, utiliser l'URL de votre domaine
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    // Fallback pour le développement
    return 'http://localhost:8081/auth/callback';
  } else {
    // Pour mobile, ne pas spécifier d'URL de redirection
    // Supabase gérera automatiquement le retour vers l'app
    return '';
  }
};

// URLs de redirection autorisées dans Supabase
export const ALLOWED_REDIRECT_URLS = [
  'voyageapp://auth/callback',
  'http://localhost:8081/auth/callback',
  'https://votre-domaine.com/auth/callback', // Remplacez par votre vrai domaine
  'https://eqxgqenvaqexcasjkuaz.supabase.co/auth/v1/callback', // Fallback Supabase pour mobile
];

// URL de callback spécifique pour mobile
export const MOBILE_CALLBACK_URL = 'https://eqxgqenvaqexcasjkuaz.supabase.co/auth/v1/callback';

// Configuration Google OAuth
export const GOOGLE_OAUTH_CONFIG = {
  // Remplacez par vos vrais credentials Google
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '',
  
  // URLs de redirection
  redirectUrls: ALLOWED_REDIRECT_URLS,
  
  // Scopes demandés
  scopes: [
    'openid',
    'profile',
    'email',
  ],
};

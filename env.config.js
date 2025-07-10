// Configuration d'environnement pour Better Auth et Supabase
export const ENV_CONFIG = {
  // Better Auth Configuration
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'your-secret-key-here',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3000/api/auth',

  // Supabase Configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project-ref.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',

  // OAuth Providers
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID || '',
  APPLE_CLIENT_SECRET: process.env.APPLE_CLIENT_SECRET || '',
  
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID || '',
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET || '',
  
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'sqlite:./auth.db'
}; 
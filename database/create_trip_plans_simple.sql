-- Script pour créer la table trip_plans avec gestion des dépendances
-- Vérifie d'abord si la table profiles existe, sinon la crée

-- Créer la table profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supprimer la table trip_plans si elle existe déjà
DROP TABLE IF EXISTS trip_plans CASCADE;

-- Créer la table trip_plans
CREATE TABLE trip_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Informations de base
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  
  -- Préférences de voyage
  travel_type TEXT NOT NULL CHECK (travel_type IN ('Solo', 'Couple', 'Family', 'Group')),
  interests JSONB DEFAULT '[]'::jsonb,
  activity_level TEXT NOT NULL CHECK (activity_level IN ('Relax', 'Balanced', 'Intense')),
  
  -- Statut et résultat
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  generated_itinerary JSONB,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_trip_plans_user_id ON trip_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_plans_status ON trip_plans(status);
CREATE INDEX IF NOT EXISTS idx_trip_plans_created_at ON trip_plans(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE trip_plans ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own trip plans" ON trip_plans;
DROP POLICY IF EXISTS "Users can insert their own trip plans" ON trip_plans;
DROP POLICY IF EXISTS "Users can update their own trip plans" ON trip_plans;
DROP POLICY IF EXISTS "Users can delete their own trip plans" ON trip_plans;

-- Créer les nouvelles politiques de sécurité
CREATE POLICY "Users can view their own trip plans" ON trip_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trip plans" ON trip_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip plans" ON trip_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip plans" ON trip_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Créer ou remplacer la fonction de trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer l'ancien trigger s'il existe et créer le nouveau
DROP TRIGGER IF EXISTS update_trip_plans_updated_at ON trip_plans;
CREATE TRIGGER update_trip_plans_updated_at 
  BEFORE UPDATE ON trip_plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Vérifier que la table a été créée correctement
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trip_plans') THEN
    RAISE NOTICE 'Table trip_plans créée avec succès !';
  ELSE
    RAISE EXCEPTION 'Échec de la création de la table trip_plans';
  END IF;
END $$; 
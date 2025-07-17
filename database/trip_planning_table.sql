-- Table pour les demandes de planification de voyage
CREATE TABLE IF NOT EXISTS trip_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Destination et dates
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  
  -- Type de voyage
  travel_type TEXT NOT NULL CHECK (travel_type IN ('Solo', 'Couple', 'Family', 'Group')),
  
  -- Centres d'intérêt (JSON array)
  interests JSONB DEFAULT '[]'::jsonb,
  
  -- Niveau d'activité
  activity_level TEXT NOT NULL CHECK (activity_level IN ('Relax', 'Balanced', 'Intense')),
  
  -- Statut de la planification
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Itinéraire généré (JSON)
  generated_itinerary JSONB,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Configuration supplémentaire
  budget_range TEXT,
  accommodation_type TEXT,
  notes TEXT
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_trip_plans_user_id ON trip_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_plans_status ON trip_plans(status);
CREATE INDEX IF NOT EXISTS idx_trip_plans_created_at ON trip_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_plans_destination ON trip_plans(destination);
CREATE INDEX IF NOT EXISTS idx_trip_plans_dates ON trip_plans(start_date, end_date);

-- RLS (Row Level Security)
ALTER TABLE trip_plans ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs propres planifications
CREATE POLICY "Users can view their own trip plans" ON trip_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trip plans" ON trip_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip plans" ON trip_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip plans" ON trip_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trip_plans_updated_at 
  BEFORE UPDATE ON trip_plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Ajouter des commentaires pour la documentation
COMMENT ON TABLE trip_plans IS 'Table pour stocker les demandes de planification de voyage des utilisateurs';
COMMENT ON COLUMN trip_plans.destination IS 'Destination du voyage (ville ou pays)';
COMMENT ON COLUMN trip_plans.travel_type IS 'Type de voyage: Solo, Couple, Family, Group';
COMMENT ON COLUMN trip_plans.interests IS 'Array JSON des centres d''intérêt sélectionnés';
COMMENT ON COLUMN trip_plans.activity_level IS 'Niveau d''activité souhaité: Relax, Balanced, Intense';
COMMENT ON COLUMN trip_plans.status IS 'Statut de la planification: pending, processing, completed, failed';
COMMENT ON COLUMN trip_plans.generated_itinerary IS 'Itinéraire généré par l''IA (JSON)';
COMMENT ON COLUMN trip_plans.budget_range IS 'Gamme de budget pour le voyage';
COMMENT ON COLUMN trip_plans.accommodation_type IS 'Type d''hébergement préféré';
COMMENT ON COLUMN trip_plans.notes IS 'Notes supplémentaires de l''utilisateur'; 
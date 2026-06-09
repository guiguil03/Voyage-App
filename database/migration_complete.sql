-- ============================================================
-- MIGRATION COMPLETE - Voyage App
-- Copier-coller en entier dans Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. TABLE PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    phone TEXT,
    country TEXT,
    city TEXT,
    website TEXT,
    privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private')),
    travel_preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- ============================================================
-- 2. TABLE VOYAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.voyages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    trip_name TEXT NOT NULL,
    destination TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    trip_type TEXT NOT NULL DEFAULT 'Aventure',
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    duration TEXT,
    memory_text TEXT,
    flag_emoji TEXT DEFAULT '🌍',
    status TEXT DEFAULT 'Terminé',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.voyages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "voyages_select_policy" ON public.voyages;
DROP POLICY IF EXISTS "voyages_insert_policy" ON public.voyages;
DROP POLICY IF EXISTS "voyages_update_policy" ON public.voyages;
DROP POLICY IF EXISTS "voyages_delete_policy" ON public.voyages;

CREATE POLICY "voyages_select_policy" ON public.voyages FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "voyages_insert_policy" ON public.voyages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "voyages_update_policy" ON public.voyages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "voyages_delete_policy" ON public.voyages FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_voyages_user_id ON public.voyages(user_id);
CREATE INDEX IF NOT EXISTS idx_voyages_is_public ON public.voyages(is_public);
CREATE INDEX IF NOT EXISTS idx_voyages_created_at ON public.voyages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voyages_images ON public.voyages USING GIN (images);

-- ============================================================
-- 3. TABLE TRIP_PLANS
-- ============================================================
DROP TABLE IF EXISTS public.trip_plans CASCADE;

CREATE TABLE public.trip_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    travel_type TEXT NOT NULL CHECK (travel_type IN ('Solo', 'Couple', 'Family', 'Group')),
    interests JSONB DEFAULT '[]'::jsonb,
    activity_level TEXT NOT NULL CHECK (activity_level IN ('Relax', 'Balanced', 'Intense')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    generated_itinerary JSONB,
    budget_range TEXT,
    accommodation_type TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.trip_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_plans_select_policy" ON public.trip_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trip_plans_insert_policy" ON public.trip_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trip_plans_update_policy" ON public.trip_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "trip_plans_delete_policy" ON public.trip_plans FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trip_plans_user_id ON public.trip_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_plans_status ON public.trip_plans(status);
CREATE INDEX IF NOT EXISTS idx_trip_plans_created_at ON public.trip_plans(created_at DESC);

-- ============================================================
-- 4. TABLE FRIENDSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friendships_select_policy" ON public.friendships;
DROP POLICY IF EXISTS "friendships_insert_policy" ON public.friendships;
DROP POLICY IF EXISTS "friendships_update_policy" ON public.friendships;
DROP POLICY IF EXISTS "friendships_delete_policy" ON public.friendships;

CREATE POLICY "friendships_select_policy" ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "friendships_insert_policy" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "friendships_update_policy" ON public.friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "friendships_delete_policy" ON public.friendships FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- ============================================================
-- 5. FONCTION updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voyages_updated_at ON public.voyages;
CREATE TRIGGER update_voyages_updated_at
    BEFORE UPDATE ON public.voyages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_plans_updated_at ON public.trip_plans;
CREATE TRIGGER update_trip_plans_updated_at
    BEFORE UPDATE ON public.trip_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_friendships_updated_at ON public.friendships;
CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. TRIGGER AUTO-CREATION PROFIL A L'INSCRIPTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, privacy_level, travel_preferences, notification_settings, is_verified, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'public',
        '{}',
        '{"email": true, "push": true, "sms": false}',
        false,
        true
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. STORAGE BUCKET POUR LES IMAGES
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('voyages', 'voyages', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "voyages_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "voyages_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "voyages_storage_delete" ON storage.objects;

CREATE POLICY "voyages_storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'voyages');
CREATE POLICY "voyages_storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'voyages' AND auth.uid() IS NOT NULL);
CREATE POLICY "voyages_storage_delete" ON storage.objects FOR DELETE USING (bucket_id = 'voyages' AND auth.uid() IS NOT NULL);

-- ============================================================
-- 8. DONNÉES DE DÉMO (optionnel - commentez si non voulu)
-- ============================================================

-- Insérer des profils de démo (sans lien avec auth.users - juste pour affichage)
-- Ces données apparaîtront dans la section "Explorer" de l'app

-- Vérification finale
DO $$
BEGIN
    RAISE NOTICE '✅ Migration terminée avec succès !';
    RAISE NOTICE '📋 Tables créées : profiles, voyages, trip_plans, friendships';
    RAISE NOTICE '🔐 RLS activé sur toutes les tables';
    RAISE NOTICE '🪣 Storage bucket "voyages" créé';
    RAISE NOTICE '🤖 Trigger auto-création profil activé';
END $$;

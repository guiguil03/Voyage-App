# 📊 Guide du Schéma de Base de Données - Voyage App

## 🎯 Vue d'Ensemble

Ce schéma complet couvre **toutes les fonctionnalités** d'une application de voyage moderne avec 17 tables principales, sécurité RLS, et optimisations de performance.

## 📋 Tables Créées

### 🔐 **1. Authentification et Profils**
- `profiles` - Profils utilisateurs étendus (bio, préférences, paramètres)
- `follows` - Système de suiveurs/amis
- `notifications` - Notifications en temps réel

### 🌍 **2. Géographie et Destinations**
- `countries` - Pays avec codes ISO, devises, drapeaux
- `destinations` - Villes et lieux avec coordonnées GPS
- `activities` - Points d'intérêt et activités touristiques

### ✈️ **3. Gestion des Voyages**
- `voyages` - Souvenirs de voyages (existant, étendu)
- `trip_plans` - Planification de futurs voyages
- `itineraries` - Itinéraires détaillés jour par jour
- `itinerary_activities` - Activités planifiées dans les itinéraires

### 💰 **4. Budget et Dépenses**
- `expenses` - Suivi détaillé des dépenses par voyage
- Support multi-devises avec conversion automatique

### 📸 **5. Médias et Contenu**
- `media` - Photos et vidéos géolocalisées
- `activity_reviews` - Avis et notes sur les activités

### 💝 **6. Fonctionnalités Sociales**
- `voyage_likes` - Likes sur les voyages
- `media_likes` - Likes sur les photos
- `comments` - Commentaires avec réponses
- `comment_likes` - Likes sur les commentaires

### 📝 **7. Listes et Favoris**
- `wishlists` - Listes de souhaits personnalisées
- `wishlist_items` - Destinations et activités favorites

### 🤝 **8. Collaboration**
- `trip_collaborators` - Voyages partagés avec permissions

## 🚀 **Installation et Configuration**

### 1. **Exécution du Script**
```sql
-- Connectez-vous à votre projet Supabase
-- SQL Editor > Nouveau script
-- Copiez le contenu de complete_database_schema.sql
-- Exécutez le script
```

### 2. **Vérification**
```sql
-- Vérifier que toutes les tables sont créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 3. **Variables d'Environnement**
```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-publique
```

## 🔐 **Sécurité Row Level Security (RLS)**

### **Politiques Implémentées**

| Table | Lecture | Écriture | Restriction |
|-------|---------|----------|-------------|
| `profiles` | Publique | Propriétaire uniquement | - |
| `voyages` | Publique si `is_public=true` | Propriétaire uniquement | Respect de la vie privée |
| `trip_plans` | Propriétaire + collaborateurs | Propriétaire uniquement | Plans privés par défaut |
| `expenses` | Propriétaire uniquement | Propriétaire uniquement | Données financières privées |
| `notifications` | Propriétaire uniquement | Système uniquement | Notifications personnelles |

### **Exemples de Requêtes Sécurisées**

```sql
-- ✅ Voyages publics visibles par tous
SELECT * FROM voyages WHERE is_public = true;

-- ✅ Mes voyages privés (RLS automatique)
SELECT * FROM voyages WHERE user_id = auth.uid();

-- ✅ Mes dépenses uniquement
SELECT * FROM expenses; -- RLS filtre automatiquement
```

## 📊 **Fonctionnalités Avancées**

### **1. Géolocalisation (PostGIS)**
```sql
-- Activités proches (rayon 5km)
SELECT name, ST_Distance(coordinates, ST_Point(2.3522, 48.8566)) as distance
FROM activities 
WHERE ST_DWithin(coordinates, ST_Point(2.3522, 48.8566), 5000)
ORDER BY distance;
```

### **2. Recherche Full-Text**
```sql
-- Recherche dans les voyages
SELECT * FROM voyages 
WHERE to_tsvector('french', trip_name || ' ' || description) 
@@ to_tsquery('french', 'paris | france');
```

### **3. Agrégations et Statistiques**
```sql
-- Statistiques utilisateur
SELECT 
    COUNT(*) as total_voyages,
    AVG(rating) as moyenne_notes,
    SUM(budget_actual) as budget_total
FROM voyages 
WHERE user_id = auth.uid();
```

### **4. Calculs de Budget**
```sql
-- Budget par voyage avec conversion EUR
SELECT 
    voyage_id,
    SUM(amount_eur) as total_eur,
    COUNT(*) as nb_depenses
FROM expenses 
GROUP BY voyage_id;
```

## 🎯 **Utilisation dans l'Application**

### **Fichiers à Mettre à Jour**

#### **1. Types TypeScript (`lib/types.ts`)**
```typescript
export interface TripPlan {
  id: string;
  user_id: string;
  destination: string;
  travel_type: 'Solo' | 'Couple' | 'Family' | 'Group';
  interest_themes: string[];
  activity_level: 'Relax' | 'Balanced' | 'Intense';
  start_date: string;
  end_date: string;
  budget: number;
  status: 'draft' | 'planned' | 'booked' | 'completed';
}

export interface Expense {
  id: string;
  voyage_id: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
}
```

#### **2. Fonctions Supabase (`lib/database.ts`)**
```typescript
// Créer un plan de voyage
export async function createTripPlan(plan: TripPlanInsert) {
  const { data, error } = await supabase
    .from('trip_plans')
    .insert(plan)
    .select()
    .single();
  return { data, error };
}

// Ajouter une dépense
export async function addExpense(expense: ExpenseInsert) {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single();
  return { data, error };
}
```

#### **3. Composants React Native**
```typescript
// Planning de voyage
const TripPlanningScreen = () => {
  const [plans, setPlans] = useState<TripPlan[]>([]);
  
  useEffect(() => {
    loadUserTripPlans().then(setPlans);
  }, []);
  
  // ...
};

// Suivi des dépenses
const ExpenseTracker = ({ voyageId }: { voyageId: string }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // ...
};
```

## 📈 **Optimisations de Performance**

### **Index Créés**
- **Géolocalisation** : Index GIST sur les coordonnées
- **Recherche** : Index sur les colonnes fréquemment filtrées
- **Tri** : Index sur `created_at`, `rating`, `popularity_score`
- **Relations** : Index sur toutes les clés étrangères

### **Requêtes Optimisées**
```sql
-- ✅ RAPIDE : Utilise l'index sur user_id
SELECT * FROM voyages WHERE user_id = 'uuid';

-- ✅ RAPIDE : Utilise l'index géospatial
SELECT * FROM activities 
WHERE ST_DWithin(coordinates, ST_Point(lng, lat), 1000);

-- ✅ RAPIDE : Utilise l'index sur is_public
SELECT * FROM voyages WHERE is_public = true ORDER BY created_at DESC;
```

## 🔄 **Migration Depuis l'Ancienne Structure**

Si vous avez déjà des données dans la table `voyages` existante :

```sql
-- Migration automatique (les colonnes existantes sont préservées)
-- Les nouvelles colonnes auront des valeurs par défaut

-- Optionnel : Mettre à jour les voyages existants
UPDATE voyages SET 
  status = 'completed',
  is_public = true
WHERE status IS NULL;
```

## 🚀 **Nouvelles Fonctionnalités Activées**

### ✅ **Implémentées**
- [x] Souvenirs de voyage (existant)
- [x] Sécurité RLS complète
- [x] Structure complète des données

### 🔄 **Prochaines Étapes Suggérées**
- [ ] Interface de planification de voyage
- [ ] Suivi des dépenses en temps réel
- [ ] Système de commentaires et likes
- [ ] Upload et gestion des photos
- [ ] Recherche avancée d'activités
- [ ] Notifications push
- [ ] Partage de voyages avec amis
- [ ] Statistiques et analyses

## 🐛 **Dépannage**

### **Erreurs Communes**

1. **Permission denied**
   ```
   Solution : Vérifier que l'utilisateur est connecté (auth.uid())
   ```

2. **Table doesn't exist**
   ```
   Solution : Exécuter le script complet dans SQL Editor
   ```

3. **RLS policy violation**
   ```
   Solution : Vérifier les politiques RLS pour la table concernée
   ```

### **Tests de Validation**

```sql
-- Test 1 : Vérification des tables
SELECT COUNT(*) as nb_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Résultat attendu : 17+ tables

-- Test 2 : Vérification RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
-- Toutes les tables doivent avoir rowsecurity = true

-- Test 3 : Test d'insertion
INSERT INTO trip_plans (destination, travel_type) 
VALUES ('Test', 'Solo');
-- Doit réussir si connecté
```

## 📞 **Support**

- **Documentation Supabase** : [supabase.com/docs](https://supabase.com/docs)
- **PostGIS** : [postgis.net/docs](https://postgis.net/docs)
- **Row Level Security** : [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

🎉 **Votre application de voyage est maintenant prête pour toutes les fonctionnalités avancées !** 
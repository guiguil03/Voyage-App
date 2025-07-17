# Configuration de la Planification de Voyage

## 🚨 RÉSOLUTION DU PROBLÈME ACTUEL

Si vous obtenez l'erreur "Could not find the 'interests' column", suivez ces étapes :

### Étape 1 : Vérifier la base de données

1. Connectez-vous à votre dashboard Supabase
2. Allez dans l'onglet "SQL Editor"
3. Exécutez cette requête pour vérifier si la table existe :

```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trip_plans';
```

### Étape 2 : Créer/Recréer la table

Si la table n'existe pas ou a une mauvaise structure :

1. **Copiez le contenu du fichier `database/create_trip_plans_simple.sql`**
2. **Collez-le dans l'éditeur SQL de Supabase**
3. **Cliquez sur "Run" pour exécuter le script**

Le script va :
- ✅ Créer la table `profiles` si elle n'existe pas
- ✅ Supprimer l'ancienne table `trip_plans` si elle existe
- ✅ Créer la nouvelle table avec la bonne structure
- ✅ Configurer les index et la sécurité RLS
- ✅ Afficher un message de confirmation

### Étape 3 : Vérifier la création

Après l'exécution, vous devriez voir :
```
NOTICE: Table trip_plans créée avec succès !
```

## Configuration Initiale

### 1. Base de données

**IMPORTANT** : Exécutez le script SQL complet avant de tester l'application !

### 2. Types TypeScript

Les types sont déjà configurés dans `lib/supabase.ts` :

```typescript
export interface TripPlan {
  id: string;
  user_id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  travel_type: 'Solo' | 'Couple' | 'Family' | 'Group';
  interests: string[];
  activity_level: 'Relax' | 'Balanced' | 'Intense';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_itinerary: any | null;
  created_at: string;
  updated_at: string;
}
```

### 3. Services

Les services suivants sont disponibles dans `lib/trip-planning.ts` :

- ✅ `createTripPlan()` - Créer une nouvelle planification
- ✅ `getUserTripPlans()` - Récupérer les voyages de l'utilisateur
- ✅ `getTripPlanById()` - Récupérer un voyage spécifique
- ✅ `updateTripPlan()` - Mettre à jour une planification
- ✅ `deleteTripPlan()` - Supprimer une planification

## Test

### 1. Interface utilisateur

L'interface de planification est accessible via :
- Page "Créer" → "Planifier un Voyage"
- Route : `/plan-trip`

### 2. Fonctionnalités

- ✅ Sélection de destination
- ✅ Calendrier natif avec dates valides
- ✅ Types de voyage (Solo, Couple, Family, Group)
- ✅ Centres d'intérêt multiples
- ✅ Niveaux d'activité avec icônes
- ✅ Sauvegarde en base de données
- ✅ Gestion des erreurs et états de chargement

### 3. Vérification

Après avoir créé un voyage, vérifiez dans Supabase :

1. Allez dans "Table Editor"
2. Sélectionnez la table `trip_plans`
3. Vous devriez voir votre nouveau voyage avec le statut `pending`

## Dépannage

### Problème : "Supabase client non initialisé"

Vérifiez votre fichier `.env` :
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Problème : "User not authenticated"

L'utilisateur doit être connecté pour créer un voyage. Vérifiez le hook `useAuth()`.

### Problème : Erreurs RLS

Si les politiques de sécurité posent problème, vous pouvez temporairement les désactiver pour tester :

```sql
ALTER TABLE trip_plans DISABLE ROW LEVEL SECURITY;
```

⚠️ **Attention** : Réactivez la RLS en production !

## Prêt pour l'IA

Le système est maintenant prêt pour l'intégration de l'IA :

1. **Tous les voyages sont créés avec le statut `pending`**
2. **Structure flexible pour stocker les itinéraires générés**
3. **API complète pour la gestion des statuts**
4. **Types TypeScript pour l'itinéraire généré**

### Prochaines étapes

1. ✅ Backend fonctionnel ← **VOUS ÊTES ICI**
2. 🔄 Intégration service IA (OpenAI/Claude)
3. 🔄 Génération d'itinéraires automatique
4. 🔄 Interface d'affichage des résultats 
# Configuration OpenTripMap API

Ce guide vous explique comment configurer l'API OpenTripMap pour la recherche d'activités touristiques dans votre application.

## 📋 Prérequis

1. **Compte OpenTripMap** : Créez un compte sur https://opentripmap.io/
2. **Clé API** : Obtenez votre clé API gratuite dans votre profil

## 🔧 Configuration

### 1. Variables d'environnement

Ajoutez ces variables à votre fichier `.env.local` :

```bash
# OpenTripMap API Configuration
EXPO_PUBLIC_OPENTRIPMAP_API_KEY=your_opentripmap_api_key_here

# Optionnel: Langue (fr, en, es, etc.)
EXPO_PUBLIC_OPENTRIPMAP_LANGUAGE=fr
```

### 2. Obtention de la clé API

1. **Inscription** : Allez sur https://opentripmap.io/
2. **Créez un compte** gratuit
3. **Obtenez la clé** dans votre profil utilisateur
4. **Aucune limite** de requêtes pour l'usage gratuit

### 3. Avantages d'OpenTripMap

| Caractéristique | OpenTripMap |
|------------------|-------------|
| **Prix** | Gratuit |
| **Limites** | Aucune limite de requêtes |
| **Données** | Base collaborative mondiale |
| **Couverture** | Monde entier |
| **Types de POI** | Très variés (musées, monuments, parcs, etc.) |
| **Métadonnées** | Wikipedia, photos, descriptions |

## 🚀 Utilisation

### Configuration initiale

```typescript
import { setupOpenTripMapService } from '@/lib/recherche';

// À appeler au démarrage de l'application
setupOpenTripMapService();
```

### Recherche de POI

```typescript
import { getOpenTripMapService, CATEGORIES, createCoordinates } from '@/lib/recherche';

const service = getOpenTripMapService();

// Recherche de musées près du Louvre
const louvre = createCoordinates(48.8606, 2.3376);
const musees = await service.searchPOI({
  coordinates: louvre,
  kinds: [CATEGORIES.MUSEUMS],
  radius: 2000,
  limit: 10,
  minRate: 3 // Note minimum 3/7
});
```

### Découverte automatique

```typescript
// Découverte de lieux intéressants
const decouvertes = await service.discoverNearby(
  createCoordinates(48.8584, 2.2945), // Tour Eiffel
  {
    radius: 3000,
    limit: 15,
    excludeKinds: ['transport', 'accommodations']
  }
);
```

### Recherche dans une zone

```typescript
// Recherche dans une zone géographique
const bbox = {
  lon_min: 2.325,
  lat_min: 48.880,
  lon_max: 2.355,
  lat_max: 48.895
};

const pois = await service.searchInBbox(bbox, {
  kinds: [CATEGORIES.CHURCHES, CATEGORIES.MUSEUMS],
  limit: 20,
  minRate: 4
});
```

## 📱 Composant React

Utilisez le composant `RechercheActivites` dans vos pages :

```typescript
import RechercheActivites from '@/components/search/RechercheActivites';

export default function ExplorePage() {
  const handleSelectPOI = (poi) => {
    console.log('POI sélectionné:', poi);
    // Afficher les détails ou naviguer
  };

  return (
    <RechercheActivites
      coordinates={createCoordinates(48.8566, 2.3522)} // Paris
      onSelectPOI={handleSelectPOI}
    />
  );
}
```

## 🗺️ Fonctionnalités Disponibles

### Recherche de POI
- ✅ **Recherche par catégorie** (musées, monuments, parcs, etc.)
- ✅ **Filtrage par distance** (rayon jusqu'à 50km)
- ✅ **Filtrage par note** (1-7)
- ✅ **Limite configurable** (jusqu'à 500 résultats)
- ✅ **Format JSON/GeoJSON**

### Types de données
- ✅ **Informations détaillées** (nom, description, coordonnées)
- ✅ **Métadonnées riches** (Wikipedia, photos, adresses)
- ✅ **Système de notation** (1-7)
- ✅ **Catégories multiples** par POI
- ✅ **Liens externes** (OSM, Wikidata)

### Fonctions avancées
- ✅ **Découverte automatique** de lieux intéressants
- ✅ **Recherche dans une zone** (bounding box)
- ✅ **Détails complets** d'un POI
- ✅ **Support multilingue**

## 📊 Types de Données

### POI (Point d'Intérêt)
```typescript
interface POI {
  xid: string;              // ID unique OpenTripMap
  name: string;             // Nom du lieu
  description?: string;     // Description (souvent depuis Wikipedia)
  kinds: string;            // Catégories (séparées par virgules)
  coordinates: {            // Coordonnées GPS
    lat: number;
    lng: number;
  };
  address?: {               // Adresse détaillée
    city?: string;
    road?: string;
    house_number?: string;
    postcode?: string;
    country?: string;
  };
  image?: string;           // URL de l'image
  wikipedia?: string;       // Lien Wikipedia
  rate?: number;           // Note 1-7
  distance?: number;       // Distance en mètres
}
```

### Réponse API
```typescript
interface OpenTripMapResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## 🎯 Catégories Disponibles

### Architecture et monuments
```typescript
CATEGORIES.ARCHITECTURE         // Architecture générale
CATEGORIES.HISTORIC_ARCHITECTURE // Architecture historique
CATEGORIES.MONUMENTS           // Monuments et mémoriaux
CATEGORIES.CASTLES             // Châteaux
CATEGORIES.PALACES             // Palais
CATEGORIES.TOWERS              // Tours
CATEGORIES.BRIDGES             // Ponts
```

### Culture
```typescript
CATEGORIES.MUSEUMS             // Musées
CATEGORIES.GALLERIES           // Galeries d'art
CATEGORIES.THEATRES            // Théâtres
CATEGORIES.CULTURAL            // Sites culturels
```

### Religion
```typescript
CATEGORIES.CHURCHES            // Églises
CATEGORIES.RELIGION            // Sites religieux
```

### Nature
```typescript
CATEGORIES.PARKS               // Parcs
CATEGORIES.GARDENS             // Jardins
CATEGORIES.NATURAL             // Sites naturels
CATEGORIES.BEACHES             // Plages
```

### Divertissement
```typescript
CATEGORIES.ENTERTAINMENT       // Divertissement
CATEGORIES.ZOOS               // Zoos
CATEGORIES.AMUSEMENT_PARKS    // Parcs d'attractions
```

### Sport
```typescript
CATEGORIES.SPORT              // Sport général
CATEGORIES.CLIMBING           // Escalade
CATEGORIES.DIVING             // Plongée
CATEGORIES.SKIING             // Ski
```

## 🔍 Exemples Pratiques

### Recherche par géolocalisation
```typescript
// Obtenir la position de l'utilisateur
navigator.geolocation.getCurrentPosition(async (position) => {
  const userCoords = createCoordinates(
    position.coords.latitude,
    position.coords.longitude
  );
  
  const nearbyPOIs = await service.searchPOI({
    coordinates: userCoords,
    radius: 2000,
    limit: 10,
    minRate: 4
  });
});
```

### Recherche combinée
```typescript
// Recherche parallèle de différents types
const [monuments, musees, parcs] = await Promise.all([
  service.searchByCategory(coords, CATEGORIES.MONUMENTS),
  service.searchByCategory(coords, CATEGORIES.MUSEUMS),
  service.searchByCategory(coords, CATEGORIES.PARKS)
]);
```

### Détails d'un POI
```typescript
// Obtenir tous les détails d'un point d'intérêt
const details = await service.getPOIDetails('xid_du_poi');

if (details.success && details.data) {
  console.log('Nom:', details.data.name);
  console.log('Description:', details.data.description);
  console.log('Wikipedia:', details.data.wikipedia);
  console.log('Photo:', details.data.image);
}
```

## 🛠️ Fonctions Utilitaires

### Traduction des catégories
```typescript
import { translateKinds } from '@/lib/recherche';

// Convertit les "kinds" en français
const categories = translateKinds('museums,historic_architecture');
// Résultat: ['Musée', 'Architecture historique']
```

### Icônes appropriées
```typescript
import { getIconForCategory } from '@/lib/recherche';

// Obtient une icône Ionicons appropriée
const icon = getIconForCategory('museums,cultural');
// Résultat: 'library'
```

### Calcul de distance
```typescript
import { calculateDistance } from '@/lib/recherche';

const distance = calculateDistance(
  createCoordinates(48.8566, 2.3522), // Paris
  createCoordinates(48.8584, 2.2945)  // Tour Eiffel
);
// Résultat: distance en mètres
```

## 🛠️ Dépannage

### Erreurs courantes

1. **"Service OpenTripMap non initialisé"**
   - Vérifiez que `setupOpenTripMapService()` est appelé avant utilisation
   - Contrôlez la variable `EXPO_PUBLIC_OPENTRIPMAP_API_KEY`

2. **"API Error: 401"**
   - Clé API invalide
   - Vérifiez votre clé sur https://opentripmap.io/

3. **Aucun résultat**
   - Élargissez le rayon de recherche
   - Diminuez la note minimum (`minRate`)
   - Vérifiez les coordonnées

4. **Données manquantes**
   - Certains POI peuvent avoir des informations incomplètes
   - C'est normal, OpenTripMap est collaboratif

### Logs et debugging

```typescript
// Activez les logs détaillés
const result = await service.searchPOI(params);
console.log('Résultat OpenTripMap:', result);

if (!result.success) {
  console.error('Erreur API:', result.error);
}

// Examiner un POI spécifique
console.log('POI kinds:', poi.kinds);
console.log('Catégories traduites:', translateKinds(poi.kinds));
```

## 🌍 Couverture Géographique

OpenTripMap couvre le monde entier avec une densité variable :

- **Europe** : Excellente couverture
- **Amérique du Nord** : Très bonne couverture
- **Asie** : Bonne couverture dans les grandes villes
- **Autres continents** : Couverture en développement

## 📞 Support et Ressources

- **Documentation officielle** : https://opentripmap.io/docs
- **API Endpoint** : https://api.opentripmap.com/
- **GitHub** : https://github.com/opentripmap
- **Données OSM** : Basé sur OpenStreetMap
- **Communauté** : Contributing via OSM

## 🔄 Bonnes Pratiques

### Performance
1. **Cache les résultats** fréquemment utilisés
2. **Limite les requêtes** simultanées
3. **Utilise des rayons raisonnables** (< 10km)
4. **Optimise les limites** selon vos besoins

### UX
1. **Affiche un loading** pendant les requêtes
2. **Gère les états vides** gracieusement
3. **Propose des filtres** par catégorie
4. **Montre la distance** aux utilisateurs

### Données
1. **Valide les coordonnées** avant les requêtes
2. **Gère les POI sans image** ou description
3. **Utilise les notes** pour filtrer la qualité
4. **Respecte les liens externes** (Wikipedia, OSM)

---

**Note** : OpenTripMap est un service gratuit basé sur OpenStreetMap, offrant une excellente alternative aux APIs commerciales pour la découverte de lieux touristiques. 
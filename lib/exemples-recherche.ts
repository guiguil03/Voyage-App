/**
 * Exemples d'utilisation du service OpenTripMap
 */

import {
    CATEGORIES,
    createCoordinates,
    getIconForCategory,
    getOpenTripMapService,
    initializeOpenTripMap,
    translateKinds,
    type Coordinates,
    type POI,
    type POISearchParams
} from './recherche';

// Configuration initiale (à faire une seule fois dans votre app)
export function setupOpenTripMapService() {
  const apiKey = process.env.EXPO_PUBLIC_OPENTRIPMAP_API_KEY;
  
  if (!apiKey) {
    throw new Error('Clé API OpenTripMap manquante');
  }

  return initializeOpenTripMap({
    apiKey: apiKey,
    language: 'fr'
  });
}

// Exemple 1: Recherche de musées près du Louvre
export async function exempleRechercheMusees() {
  try {
    const service = getOpenTripMapService();
    
    // Coordonnées du Louvre
    const louvre = createCoordinates(48.8606, 2.3376);
    
    const params: POISearchParams = {
      coordinates: louvre,
      kinds: [CATEGORIES.MUSEUMS],
      radius: 2000, // 2km autour
      limit: 10,
      minRate: 3 // Seulement les musées bien notés
    };

    const result = await service.searchPOI(params);
    
    if (result.success && result.data) {
      console.log(`${result.data.length} musées trouvés:`);
      result.data.forEach(poi => {
        const categories = translateKinds(poi.kinds);
        console.log(`- ${poi.name} (${categories.join(', ')})`);
        if (poi.rate) console.log(`  Note: ${poi.rate}/7`);
        if (poi.distance) console.log(`  Distance: ${Math.round(poi.distance)}m`);
      });
      return result.data;
    } else {
      console.error('Erreur:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    return [];
  }
}

// Exemple 2: Recherche d'architecture historique à Paris
export async function exempleArchitectureHistorique() {
  try {
    const service = getOpenTripMapService();
    
    // Centre de Paris (Notre-Dame)
    const centreParis = createCoordinates(48.8566, 2.3522);
    
    const result = await service.searchByCategory(
      centreParis,
      CATEGORIES.HISTORIC_ARCHITECTURE,
      {
        radius: 5000, // 5km
        limit: 15,
        minRate: 4 // Seulement les lieux très bien notés
      }
    );

    if (result.success && result.data) {
      console.log('Architecture historique à Paris:');
      result.data.forEach(poi => {
        const categories = translateKinds(poi.kinds);
        console.log(`🏛️ ${poi.name}`);
        console.log(`   Catégories: ${categories.join(', ')}`);
        if (poi.rate) console.log(`   Note: ${poi.rate}/7`);
        if (poi.distance) console.log(`   🚶 ${Math.round(poi.distance)}m du centre`);
      });
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
}

// Exemple 3: Découverte automatique autour d'un lieu
export async function exempleDecouverteAutomatique() {
  try {
    const service = getOpenTripMapService();
    
    // Tour Eiffel
    const tourEiffel = createCoordinates(48.8584, 2.2945);
    
    const result = await service.discoverNearby(tourEiffel, {
      radius: 3000, // 3km autour
      limit: 20,
      excludeKinds: ['transport', 'accommodations'] // Exclure transport et hébergements
    });

    if (result.success && result.data) {
      console.log('🗼 Découvertes près de la Tour Eiffel:');
      
      // Grouper par catégorie
      const grouped = result.data.reduce((acc, poi) => {
        const categories = translateKinds(poi.kinds);
        const mainCategory = categories[0] || 'Autre';
        if (!acc[mainCategory]) acc[mainCategory] = [];
        acc[mainCategory].push(poi);
        return acc;
      }, {} as Record<string, POI[]>);

      Object.entries(grouped).forEach(([category, pois]) => {
        console.log(`\n📂 ${category} (${pois.length}):`);
        pois.slice(0, 3).forEach(poi => {
          console.log(`  • ${poi.name} - ${Math.round(poi.distance || 0)}m`);
        });
      });
      
      return result.data;
    } else {
      console.error('Erreur découverte:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
}

// Exemple 4: Recherche dans une zone géographique
export async function exempleRechercheZone() {
  try {
    const service = getOpenTripMapService();
    
    // Zone autour de Montmartre
    const bbox = {
      lon_min: 2.325,
      lat_min: 48.880,
      lon_max: 2.355,
      lat_max: 48.895
    };
    
    const result = await service.searchInBbox(bbox, {
      kinds: [CATEGORIES.CHURCHES, CATEGORIES.MUSEUMS, CATEGORIES.GALLERIES],
      limit: 15,
      minRate: 3
    });

    if (result.success && result.data) {
      console.log('🎨 Lieux culturels à Montmartre:');
      result.data.forEach(poi => {
        const categories = translateKinds(poi.kinds);
        const icon = getIconForCategory(poi.kinds);
        console.log(`${icon === 'library' ? '📚' : icon === 'home' ? '⛪' : '🎨'} ${poi.name}`);
        console.log(`   ${categories.join(', ')}`);
      });
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Erreur recherche zone:', error);
    return [];
  }
}

// Exemple 5: Obtenir les détails complets d'un POI
export async function exempleDetailsPOI(xid: string) {
  try {
    const service = getOpenTripMapService();
    
    const result = await service.getPOIDetails(xid);
    
    if (result.success && result.data) {
      const poi = result.data;
      console.log(`🏛️ Détails de ${poi.name}:`);
      
      if (poi.description) {
        console.log(`📝 Description: ${poi.description.substring(0, 200)}...`);
      }
      
      if (poi.address) {
        console.log(`📍 Adresse: ${poi.address.road || ''} ${poi.address.city || ''}`);
      }
      
      if (poi.wikipedia) {
        console.log(`📖 Wikipedia: ${poi.wikipedia}`);
      }
      
      if (poi.image) {
        console.log(`📷 Image: ${poi.image}`);
      }
      
      if (poi.rate) {
        console.log(`⭐ Note: ${poi.rate}/7`);
      }
      
      const categories = translateKinds(poi.kinds);
      console.log(`🏷️ Catégories: ${categories.join(', ')}`);
      
      return poi;
    } else {
      console.error('Erreur détails POI:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Erreur:', error);
    return null;
  }
}

// Exemple 6: Recherche combinée avec différentes catégories
export async function exempleRechercheCombinee() {
  try {
    const service = getOpenTripMapService();
    
    const montmartre = createCoordinates(48.8867, 2.3431);
    
    // Recherche parallèle de différents types de lieux
    const [monuments, musees, parcs] = await Promise.all([
      service.searchByCategory(montmartre, CATEGORIES.MONUMENTS, { radius: 1000, limit: 5 }),
      service.searchByCategory(montmartre, CATEGORIES.MUSEUMS, { radius: 1000, limit: 5 }),
      service.searchByCategory(montmartre, CATEGORIES.PARKS, { radius: 1500, limit: 5 })
    ]);

    const resultats = {
      monuments: monuments.success ? monuments.data || [] : [],
      musees: musees.success ? musees.data || [] : [],
      parcs: parcs.success ? parcs.data || [] : []
    };

    console.log('🏛️ Monuments à Montmartre:', resultats.monuments.length);
    console.log('🎨 Musées:', resultats.musees.length);
    console.log('🌳 Parcs:', resultats.parcs.length);

    // Afficher le top 3 de chaque catégorie
    Object.entries(resultats).forEach(([category, pois]) => {
      if (pois.length > 0) {
        console.log(`\n${category.toUpperCase()}:`);
        pois.slice(0, 3).forEach((poi, index) => {
          console.log(`${index + 1}. ${poi.name} (${poi.rate || 'N/A'}/7)`);
        });
      }
    });

    return resultats;
  } catch (error) {
    console.error('Erreur recherche combinée:', error);
    return null;
  }
}

// Exemple 7: Recherche avec géolocalisation utilisateur
export async function exempleRechercheProche(userLat: number, userLng: number) {
  try {
    const service = getOpenTripMapService();
    const userPosition = createCoordinates(userLat, userLng);
    
    // Recherche des attractions proches bien notées
    const result = await service.searchPOI({
      coordinates: userPosition,
      kinds: [
        CATEGORIES.MUSEUMS,
        CATEGORIES.MONUMENTS,
        CATEGORIES.PARKS,
        CATEGORIES.CHURCHES,
        CATEGORIES.GALLERIES
      ],
      radius: 2000, // 2km autour
      limit: 10,
      minRate: 4 // Seulement les lieux excellents
    });

    if (result.success && result.data) {
      console.log('🎯 Attractions près de vous:');
      result.data
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .forEach(poi => {
          const distance = Math.round((poi.distance || 0) / 100) * 100; // Arrondi à 100m
          const categories = translateKinds(poi.kinds);
          const icon = getIconForCategory(poi.kinds);
          console.log(`${getEmojiForIcon(icon)} ${poi.name} - ${distance}m`);
          console.log(`   ${categories[0]} • Note: ${poi.rate || 'N/A'}/7`);
        });
      
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
}

// Exemple 8: Recherche spécialisée par type d'activité
export async function exempleRechercheActivite(
  coordinates: Coordinates,
  typeActivite: 'culture' | 'nature' | 'histoire' | 'divertissement'
) {
  try {
    const service = getOpenTripMapService();
    
    const categoriesParType = {
      culture: [CATEGORIES.MUSEUMS, CATEGORIES.GALLERIES, CATEGORIES.THEATRES, CATEGORIES.CULTURAL],
      nature: [CATEGORIES.PARKS, CATEGORIES.GARDENS, CATEGORIES.NATURAL, CATEGORIES.BEACHES],
      histoire: [CATEGORIES.HISTORIC, CATEGORIES.MONUMENTS, CATEGORIES.CASTLES, CATEGORIES.ARCHAEOLOGICAL],
      divertissement: [CATEGORIES.ENTERTAINMENT, CATEGORIES.ZOOS, CATEGORIES.AMUSEMENT_PARKS]
    };
    
    const kinds = categoriesParType[typeActivite];
    
    const result = await service.searchPOI({
      coordinates,
      kinds,
      radius: 5000,
      limit: 15,
      minRate: 3
    });

    if (result.success && result.data) {
      console.log(`🎪 Activités ${typeActivite} trouvées:`);
      result.data.forEach(poi => {
        const categories = translateKinds(poi.kinds);
        console.log(`• ${poi.name}`);
        console.log(`  ${categories.join(', ')} • ${poi.rate || 'N/A'}/7`);
      });
      return result.data;
    }
    return [];
  } catch (error) {
    console.error(`Erreur recherche ${typeActivite}:`, error);
    return [];
  }
}

// Fonction utilitaire pour les emojis
function getEmojiForIcon(icon: string): string {
  const emojiMap: { [key: string]: string } = {
    'library': '📚',
    'home': '⛪',
    'business': '🏛️',
    'leaf': '🌳',
    'play': '🎭',
    'restaurant': '🍽️',
    'storefront': '🛍️',
    'fitness': '🏃',
    'time': '⏰',
    'location': '📍'
  };
  return emojiMap[icon] || '📍';
}

// Fonction utilitaire pour tester tous les exemples
export async function testerTousLesExemples() {
  console.log('🚀 Test du service OpenTripMap...\n');
  
  try {
    // Initialisation
    setupOpenTripMapService();
    
    // Tests
    console.log('1️⃣ Recherche musées près du Louvre...');
    await exempleRechercheMusees();
    
    console.log('\n2️⃣ Architecture historique Paris...');
    await exempleArchitectureHistorique();
    
    console.log('\n3️⃣ Découverte Tour Eiffel...');
    await exempleDecouverteAutomatique();
    
    console.log('\n4️⃣ Recherche zone Montmartre...');
    await exempleRechercheZone();
    
    console.log('\n5️⃣ Recherche combinée...');
    await exempleRechercheCombinee();
    
    console.log('\n6️⃣ Recherche culturelle...');
    const paris = createCoordinates(48.8566, 2.3522);
    await exempleRechercheActivite(paris, 'culture');
    
    console.log('\n✅ Tests terminés!');
  } catch (error) {
    console.error('❌ Erreur durant les tests:', error);
  }
}

export default {
  setupOpenTripMapService,
  exempleRechercheMusees,
  exempleArchitectureHistorique,
  exempleDecouverteAutomatique,
  exempleRechercheZone,
  exempleDetailsPOI,
  exempleRechercheCombinee,
  exempleRechercheProche,
  exempleRechercheActivite,
  testerTousLesExemples
}; 
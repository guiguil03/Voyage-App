import type { PlaceDetailsResult } from '@/features/explore/services/search';
import { getSearchService } from '@/features/explore/services/search';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ActivityDetailsScreen() {
  const params = useLocalSearchParams();
  const [details, setDetails] = useState<PlaceDetailsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const searchService = getSearchService();

  // Récupérer les données de base depuis les paramètres
  const basicData = {
    id: params.id as string,
    name: params.name as string,
    description: params.description as string,
    type: params.type as string,
    rating: params.rating ? parseFloat(params.rating as string) : undefined,
    distance: params.distance ? parseFloat(params.distance as string) : undefined,
    address: params.address as string,
    photos: params.photos ? JSON.parse(params.photos as string) : [],
    coordinates: params.coordinates ? JSON.parse(params.coordinates as string) : { lat: 0, lng: 0 },
    icon: params.icon as string || '📍',
    isPopular: params.isPopular === 'true'
  };

  useEffect(() => {
    loadDetailedInformation();
  }, []);

  const loadDetailedInformation = async () => {
    try {
      console.log('📋 Chargement détails pour:', basicData.id);
      
      const result = await searchService.getPlaceDetails(basicData.id);
      
      if (result.success && result.place) {
        setDetails(result.place);
      } else {
        console.log('ℹ️ Détails API non disponibles, utilisation données de base');
        // Utiliser les données de base si l'API ne retourne pas de détails
        setDetails({
          ...basicData,
          source: 'opentripmap',
          categories: [basicData.type]
        } as PlaceDetailsResult);
      }
    } catch (error) {
      console.error('❌ Erreur chargement détails:', error);
      // En cas d'erreur, utiliser les données de base
      setDetails({
        ...basicData,
        source: 'opentripmap',
        categories: [basicData.type]
      } as PlaceDetailsResult);
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = async () => {
    const coords = details?.coordinates || basicData.coordinates;
    const name = details?.name || basicData.name;
    const label = encodeURIComponent(name);
    const url = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}(${label})`;
    
    await WebBrowser.openBrowserAsync(url);
  };

  const shareActivity = async () => {
    try {
      const name = details?.name || basicData.name;
      const description = details?.description || basicData.description;
      const coords = details?.coordinates || basicData.coordinates;
      
      await Share.share({
        message: `🌍 ${name}\n\n${description}\n\nVoir sur Google Maps: https://maps.google.com/maps?q=${coords.lat},${coords.lng}`,
        title: `Découvrez ${name}`,
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const openWebsite = async () => {
    if (details?.website) {
      await WebBrowser.openBrowserAsync(details.website);
    }
  };

  const callPhone = () => {
    if (details?.phone) {
      Linking.openURL(`tel:${details.phone}`);
    }
  };

  const renderHeader = () => {
    const mainImage = details?.photos?.[0] || basicData.photos?.[0];
    
    return (
      <View style={styles.header}>
        {mainImage && !imageError ? (
          <Image
            source={{ uri: mainImage }}
            style={styles.headerImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderIcon}>{details?.icon || basicData.icon}</Text>
            <Text style={styles.placeholderText}>Image non disponible</Text>
          </View>
        )}
        
        <View style={styles.headerOverlay}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={shareActivity}>
              <Ionicons name="share-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {(details?.isPopular || basicData.isPopular) && (
          <View style={styles.popularBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.popularText}>Lieu populaire</Text>
          </View>
        )}
      </View>
    );
  };

  const renderInfo = () => {
    const name = details?.name || basicData.name;
    const description = details?.fullDescription || details?.description || basicData.description;
    let rating = details?.rating ?? basicData.rating;
    const address = details?.address || basicData.address;
    const distance = details?.distance || basicData.distance;

    // S'assurer que rating est bien un nombre
    if (typeof rating === 'string') {
      const parsed = parseFloat(rating);
      rating = isNaN(parsed) ? undefined : parsed;
    }

    return (
      <View style={styles.infoSection}>
        <Text style={styles.title}>{name}</Text>
        
        <View style={styles.metaInfo}>
          {typeof rating === 'number' && !isNaN(rating) && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={styles.metaText}>{rating.toFixed(1)}/7</Text>
            </View>
          )}
          
          {distance && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text style={styles.metaText}>
                {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`}
              </Text>
            </View>
          )}
          
          <View style={styles.metaItem}>
            <Ionicons name="pricetag-outline" size={18} color="#666" />
            <Text style={styles.metaText}>{details?.categories?.[0] || basicData.type}</Text>
          </View>
        </View>

        {description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        )}

        {address && (
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Adresse</Text>
            <TouchableOpacity style={styles.addressRow} onPress={openInMaps}>
              <Ionicons name="location" size={20} color="#007AFF" />
              <Text style={styles.addressText}>{address}</Text>
              <Ionicons name="chevron-forward" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderWikipedia = () => {
    if (!details?.wikipediaExtract) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <Text style={styles.wikipediaText}>{details.wikipediaExtract}</Text>
      </View>
    );
  };

  const renderPhotos = () => {
    const photos = details?.photos || basicData.photos || [];
    if (photos.length <= 1) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
        >
          {photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={styles.photoThumbnail}
              onError={() => console.log('Erreur chargement photo:', photo)}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderContact = () => {
    const hasWebsite = details?.website;
    const hasPhone = details?.phone;
    
    if (!hasWebsite && !hasPhone) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact & Informations</Text>
        
        {hasWebsite && (
          <TouchableOpacity style={styles.contactRow} onPress={openWebsite}>
            <Ionicons name="globe-outline" size={20} color="#007AFF" />
            <Text style={styles.contactText}>Site web</Text>
            <Ionicons name="open-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
        
        {hasPhone && (
          <TouchableOpacity style={styles.contactRow} onPress={callPhone}>
            <Ionicons name="call-outline" size={20} color="#007AFF" />
            <Text style={styles.contactText}>{details.phone}</Text>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderActions = () => (
    <View style={styles.actionsSection}>
      <TouchableOpacity style={styles.primaryAction} onPress={openInMaps}>
        <Ionicons name="map" size={24} color="#FFF" />
        <Text style={styles.actionText}>Voir sur la carte</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryAction} onPress={shareActivity}>
        <Ionicons name="share-outline" size={24} color="#007AFF" />
        <Text style={styles.secondaryActionText}>Partager</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {renderInfo()}
        {renderWikipedia()}
        {renderPhotos()}
        {renderContact()}
        
        <View style={styles.spacer} />
      </ScrollView>
      
      {renderActions()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
  },
  popularBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  descriptionSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  addressSection: {
    marginTop: 20,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  wikipediaText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
  },
  photosScroll: {
    marginTop: 8,
  },
  photoThumbnail: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  actionsSection: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  actionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryActionText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  spacer: {
    height: 20,
  },
}); 
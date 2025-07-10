import React from 'react';
import {
    Image,
    ImageSourcePropType,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TripCardProps {
  title?: string;
  date: string;
  country: string;
  flagEmoji: string;
  image: ImageSourcePropType;
  onPress: () => void;
  buttonText?: string;
}

export default function TripCard({
  title,
  date,
  country,
  flagEmoji,
  image,
  onPress,
  buttonText = 'Plus de Détail'
}: TripCardProps) {
  return (
    <View style={styles.tripCard}>
      <Image
        source={image}
        style={styles.tripImage}
        resizeMode="cover"
      />
      
      <View style={styles.tripOverlay}>
        <View style={styles.tripInfo}>
          {title && (
            <Text style={styles.tripTitle}>{title}</Text>
          )}
          <Text style={styles.tripDate}>{date}</Text>
          <View style={styles.tripDestination}>
            <Text style={styles.tripCountry}>{country}</Text>
            <Text style={styles.flagEmoji}>{flagEmoji}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={onPress}
        >
          <Text style={styles.detailButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tripCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  tripImage: {
    width: '100%',
    height: 280,
  },
  tripOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripInfo: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  tripDestination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripCountry: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  flagEmoji: {
    fontSize: 18,
  },
  detailButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
}); 
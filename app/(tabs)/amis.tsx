import { acceptFriendRequest, declineFriendRequest, getAddableUsers, getMyFriends, getReceivedFriendRequests, sendFriendRequest } from '@/lib/friends';
import { Profile } from '@/lib/profiles';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function AmisScreen() {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [addableUsers, setAddableUsers] = useState<Profile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<{ friendshipId: string, profile: Profile }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      const [friendsRes, addableRes, receivedRes] = await Promise.all([
        getMyFriends(),
        getAddableUsers(),
        getReceivedFriendRequests()
      ]);
      if (friendsRes.error) setError(friendsRes.error);
      if (addableRes.error) setError(addableRes.error);
      if (receivedRes.error) setError(receivedRes.error);
      setFriends(friendsRes.data || []);
      setAddableUsers(addableRes.data || []);
      setReceivedRequests(receivedRes.data || []);
      setLoading(false);
    }
    fetchAll();
  }, [sending, processingRequest]);

  const handleAddFriend = async (userId: string) => {
    setSending(userId);
    const { error } = await sendFriendRequest(userId);
    if (error) alert('Erreur: ' + error);
    else alert('Demande envoyée !');
    setSending(null);
  };

  const handleAccept = async (friendshipId: string) => {
    setProcessingRequest(friendshipId);
    const { error } = await acceptFriendRequest(friendshipId);
    if (error) alert('Erreur: ' + error);
    setProcessingRequest(null);
  };

  const handleDecline = async (friendshipId: string) => {
    setProcessingRequest(friendshipId);
    const { error } = await declineFriendRequest(friendshipId);
    if (error) alert('Erreur: ' + error);
    setProcessingRequest(null);
  };

  const handleFriendPress = (friend: Profile) => {
    router.push({ pathname: '/friend-profile', params: { userId: friend.id } });
  };

  const renderUser = (item: Profile, isFriend: boolean = false) => (
    <View style={styles.userRow}>
      <TouchableOpacity onPress={() => isFriend && handleFriendPress(item)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Image source={item.avatar_url ? { uri: item.avatar_url } : require('@/assets/images/icon.png')} style={styles.avatar} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.userName}>{item.full_name || item.username || item.email || item.id}</Text>
          <Text style={styles.userEmail}>{item.city} {item.city && item.country ? '·' : ''} {item.country}</Text>
          {item.bio ? <Text style={styles.userBio}>{item.bio}</Text> : null}
        </View>
      </TouchableOpacity>
      {isFriend ? (
        <View style={styles.friendBadge}><Text style={styles.friendBadgeText}>Ami</Text></View>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddFriend(item.id)} disabled={sending === item.id}>
          <Text style={styles.addButtonText}>{sending === item.id ? '...' : 'Ajouter'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRequest = ({ friendshipId, profile }: { friendshipId: string, profile: Profile }) => (
    <View style={styles.userRow}>
      <Image source={profile.avatar_url ? { uri: profile.avatar_url } : require('@/assets/images/icon.png')} style={styles.avatar} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.userName}>{profile.full_name || profile.username || profile.email || profile.id}</Text>
        <Text style={styles.userEmail}>{profile.city} {profile.city && profile.country ? '·' : ''} {profile.country}</Text>
        {profile.bio ? <Text style={styles.userBio}>{profile.bio}</Text> : null}
      </View>
      <View style={styles.requestButtons}>
        <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(friendshipId)} disabled={processingRequest === friendshipId}>
          <Text style={styles.acceptButtonText}>{processingRequest === friendshipId ? '...' : 'Accepter'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineButton} onPress={() => handleDecline(friendshipId)} disabled={processingRequest === friendshipId}>
          <Text style={styles.declineButtonText}>{processingRequest === friendshipId ? '...' : 'Refuser'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSection = (
    title: string,
    data: any[],
    renderItem: (item: any) => React.ReactElement,
    emptyText: string,
    icon?: string
  ): React.ReactElement => (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length === 0 ? (
        <View style={styles.emptyBox}>
          {icon && <Text style={styles.emptyIcon}>{icon}</Text>}
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id || item.friendshipId}
          renderItem={({ item }) => renderItem(item)}
          contentContainerStyle={{ paddingBottom: 8 }}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Dégradé premium en haut */}
      <LinearGradient
        colors={["#E8F5E8", "#F8F9FA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220, zIndex: 0 }}
      />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: 'transparent', borderBottomWidth: 0, marginTop: 10, marginBottom: 18, zIndex: 1 }]}>
        <Text style={[styles.title, { fontSize: 30 }]}>Mes Amis</Text>
        <Text style={styles.subtitle}>Connectez-vous avec la communauté</Text>
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2F7417" style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</Text>
        ) : (
          <>
            {renderSection('Demandes reçues', receivedRequests, renderRequest, 'Aucune demande en attente.', '👋')}
            {renderSection('Mes amis', friends, (item) => renderUser(item, true), 'Aucun ami pour l&apos;instant.', '🤝')}
            {renderSection('Ajouter des amis', addableUsers, (item) => renderUser(item, false), 'Aucun utilisateur à ajouter.', '🔍')}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2F7417',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  sectionBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2F7417',
    letterSpacing: 0.2,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    fontSize: 15,
    textAlign: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#eee',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#888',
    marginBottom: 1,
  },
  userBio: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#2F7417',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  friendBadge: {
    backgroundColor: '#e0ffe0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  friendBadgeText: {
    color: '#2F7417',
    fontWeight: 'bold',
    fontSize: 15,
  },
  requestButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#2F7417',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  declineButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
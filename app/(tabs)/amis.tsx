import { acceptFriendRequest, declineFriendRequest, getAddableUsers, getMyFriends, getReceivedFriendRequests, sendFriendRequest } from '@/features/social/services/friends';
import { Profile } from '@/features/profile/services/profiles';
import { router } from 'expo-router';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const C = {
  bg:         '#0D0D0D',
  card:       'rgba(13,13,13,0.82)',
  border:     'rgba(245,237,214,0.14)',
  cream:      '#F5EDD6',
  creamDim:   'rgba(245,237,214,0.50)',
  creamFaint: 'rgba(245,237,214,0.18)',
  white:      '#FFFFFF',
  whiteDim:   'rgba(255,255,255,0.40)',
};

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
    router.push({ pathname: '/profil', params: { userId: friend.id } });
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
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.pageTitle}>AMIS</Text>
        {loading ? (
          <ActivityIndicator size="large" color={C.cream} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            {renderSection('Demandes reçues', receivedRequests, renderRequest, 'Aucune demande en attente.', '👋')}
            {renderSection('Mes amis', friends, (item) => renderUser(item, true), 'Aucun ami pour l\'instant.', '🤝')}
            {renderSection('Ajouter des amis', addableUsers, (item) => renderUser(item, false), 'Aucun utilisateur à ajouter.', '🔍')}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '200',
    letterSpacing: 6,
    color: C.cream,
    paddingTop: 55,
    paddingHorizontal: 22,
    marginBottom: 28,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 22,
  },
  sectionBox: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 3,
    color: C.creamDim,
    fontWeight: '300',
    marginBottom: 14,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyText: {
    color: C.creamDim,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.creamFaint,
  },
  userName: {
    fontSize: 15,
    fontWeight: '400',
    color: C.white,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: C.creamDim,
    marginBottom: 1,
  },
  userBio: {
    fontSize: 12,
    color: C.creamDim,
    fontStyle: 'italic',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: C.cream,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: C.bg,
    fontSize: 13,
    fontWeight: '500',
  },
  friendBadge: {
    borderWidth: 1,
    borderColor: C.creamFaint,
    backgroundColor: 'rgba(245,237,214,0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  friendBadgeText: {
    color: C.cream,
    fontSize: 13,
    fontWeight: '400',
  },
  requestButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: C.cream,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: C.bg,
    fontWeight: '500',
    fontSize: 13,
  },
  declineButton: {
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#EF4444',
    fontWeight: '500',
    fontSize: 13,
  },
});

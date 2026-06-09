import { Profile } from '@/features/profile/services/profiles';
import { supabase, Voyage } from '@/lib/supabase';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  updated_at: string;
  friend_profile?: Profile;
}

// Récupérer la liste de mes amis (status = accepted)
export async function getMyFriends(): Promise<{ data: Profile[]; error: string | null }> {
  if (!supabase) return { data: [], error: 'Supabase non configuré' };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { data: [], error: 'Utilisateur non connecté' };
  const myId = userData.user.id;
  // On récupère les amis où je suis user_id OU friend_id
  const { data, error } = await supabase
    .from('friendships')
    .select('*, friend:friend_id(*), user:user_id(*)')
    .or(`user_id.eq.${myId},friend_id.eq.${myId}`)
    .eq('status', 'accepted');
  if (error) return { data: [], error: error.message };
  // On extrait le profil de l'ami (l'autre personne)
  const friends = (data || []).map((f: any) => {
    if (f.user_id === myId) return f.friend;
    else return f.user;
  }).filter(Boolean);
  return { data: friends, error: null };
}

// Récupérer les utilisateurs que je peux ajouter (pas déjà amis ni moi-même)
export async function getAddableUsers(): Promise<{ data: Profile[]; error: string | null }> {
  if (!supabase) return { data: [], error: 'Supabase non configuré' };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { data: [], error: 'Utilisateur non connecté' };
  const myId = userData.user.id;
  // Récupérer tous les profils publics actifs
  const { data: allUsers, error: usersError } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .eq('privacy_level', 'public');
  if (usersError) return { data: [], error: usersError.message };
  // Récupérer mes relations d'amitié
  const { data: myFriendships, error: friendsError } = await supabase
    .from('friendships')
    .select('*')
    .or(`user_id.eq.${myId},friend_id.eq.${myId}`);
  if (friendsError) return { data: [], error: friendsError.message };
  // Exclure moi-même et ceux déjà amis ou en attente
  const excludedIds = new Set([
    myId,
    ...(myFriendships || []).map((f: any) => f.user_id === myId ? f.friend_id : f.user_id)
  ]);
  const addable = (allUsers || []).filter((u: Profile) => !excludedIds.has(u.id));
  return { data: addable, error: null };
}

// Envoyer une demande d'ami
export async function sendFriendRequest(friendId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase non configuré' };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { error: 'Utilisateur non connecté' };
  const myId = userData.user.id;
  if (myId === friendId) return { error: 'Impossible de s’ajouter soi-même' };
  const { error } = await supabase
    .from('friendships')
    .insert({ user_id: myId, friend_id: friendId, status: 'pending' });
  return { error: error ? error.message : null };
}

// Accepter une demande d'ami
export async function acceptFriendRequest(friendshipId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase non configuré' };
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId);
  return { error: error ? error.message : null };
}

// Refuser une demande d'ami
export async function declineFriendRequest(friendshipId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase non configuré' };
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'declined' })
    .eq('id', friendshipId);
  return { error: error ? error.message : null };
}

// Récupérer les demandes d'amis reçues (status = pending, friend_id = moi)
export async function getReceivedFriendRequests(): Promise<{ data: { friendshipId: string, profile: Profile }[]; error: string | null }> {
  if (!supabase) return { data: [], error: 'Supabase non configuré' };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { data: [], error: 'Utilisateur non connecté' };
  const myId = userData.user.id;
  const { data, error } = await supabase
    .from('friendships')
    .select('id, user_id, user:user_id(*)')
    .eq('friend_id', myId)
    .eq('status', 'pending');
  if (error) return { data: [], error: error.message };
  // On retourne l'id de la demande et le profil de l'expéditeur
  const requests = (data || []).map((f: any) => ({ friendshipId: f.id, profile: f.user }));
  return { data: requests, error: null };
} 

//Retourner les voyages de ses amis
export async function getFriendsVoyages(friends: Profile[]): Promise<{ data: Voyage[]; error: string | null }> {
  if (!supabase) return { data: [], error: 'Supabase non configuré' };
  const { data, error } = await supabase
    .from('voyages')
    .select('*')
    .in('user_id', friends.map((f) => f.id));
  return { data: data || [], error: error ? error.message : null };
}
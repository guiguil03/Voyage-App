# 🔧 Résolution : Erreur de Profil

## Problème
```
Erreur lors du chargement du profil: JSON object requested, multiple (or no) rows returned
PGRST116: The result contains 0 rows
```

## Cause
L'utilisateur n'a pas encore de profil dans la table `profiles`, ou la table n'existe pas.

## ✅ Solution Automatique
Le code a été mis à jour pour **créer automatiquement** un profil basique lors de la première connexion.

### Ce qui se passe maintenant :
1. ✅ L'app vérifie si un profil existe
2. ✅ Si aucun profil → création automatique avec :
   - Email de l'utilisateur
   - Nom basé sur l'email
   - Paramètres par défaut
   - Confidentialité publique

## 🗄️ Si la table n'existe pas

### Exécuter le script SQL
Dans votre dashboard Supabase :
1. Allez dans **SQL Editor**
2. Créez un nouveau script
3. Copiez le contenu de `database/create_profiles_table.sql`
4. Exécutez le script

### Le script crée :
- ✅ Table `profiles` avec tous les champs
- ✅ Politiques RLS (sécurité)
- ✅ Index pour les performances
- ✅ Triggers pour `updated_at`

## 🧪 Test
1. Déconnectez-vous de l'app
2. Reconnectez-vous
3. Allez sur l'onglet **Account**
4. Le profil devrait se charger automatiquement

## 📋 Vérification
Si tout fonctionne, vous devriez voir dans les logs :
```
🆕 Création d'un nouveau profil pour l'utilisateur: user@email.com
✅ Profil chargé avec succès: user
```

## 🚨 En cas de problème persistant
1. Vérifiez que Supabase est bien configuré
2. Vérifiez les variables d'environnement
3. Assurez-vous que la table `profiles` existe
4. Vérifiez les politiques RLS dans Supabase

La nouvelle version est **robuste** et gère automatiquement la création des profils ! 🎯 
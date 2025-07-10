# 🚀 Configuration Supabase - Guide Express

## Problème actuel
Le bouton de déconnexion ne fonctionne pas car Supabase n'est pas configuré.

## Solution Rapide (5 minutes)

### 1. Créer un compte Supabase
- Aller sur https://supabase.com
- Créer un compte gratuit
- Créer un nouveau projet

### 2. Récupérer les clés
- Dans votre projet Supabase : **Settings** > **API**
- Copier :
  - **Project URL** (commence par `https://xxx.supabase.co`)
  - **anon public** key (longue clé qui commence par `eyJ...`)

### 3. Créer le fichier .env
Créer un fichier `.env` à la racine du projet avec :
```
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...votre-clé-anon
```

### 4. Redémarrer l'app
```bash
npm start
```

## Test Rapide
1. Aller sur la page Account
2. Cliquer sur "Diagnostic Connexion"
3. Vous devriez voir "SUPABASE_NOT_CONFIGURED" → "CONNECTED" après config

## Alternative : Mode Dégradé
Si vous ne voulez pas configurer Supabase maintenant, la déconnexion fonctionne quand même en mode local (nettoie le cache).

## ✅ Une fois configuré
- ✅ Connexion/Inscription fonctionnelle
- ✅ Déconnexion robuste
- ✅ Sessions sécurisées
- ✅ Persistance des données

---
🔧 **Besoin d'aide ?** Vérifiez la console pour voir les logs de diagnostic. 
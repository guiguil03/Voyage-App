# Guide d'Utilisation - Voyage App

## 🏗️ Architecture du Code

L'application a été complètement restructurée pour avoir un code plus propre et modulaire.

### 📁 Structure des Dossiers

```
Voyage-App/
├── app/                    # Pages de l'application
│   ├── (tabs)/            # Navigation par onglets (après connexion)
│   │   ├── home.tsx       # Page d'accueil principale
│   │   ├── create.tsx     # Page de création de voyages
│   │   ├── account.tsx    # Page de gestion du compte
│   │   └── index.tsx      # Page de connexion/inscription
│   └── register.tsx       # Page d'inscription (legacy)
├── components/            # Composants réutilisables
│   ├── auth/             # Composants d'authentification
│   │   ├── AuthForm.tsx  # Formulaire de connexion/inscription
│   │   └── SocialButtons.tsx # Boutons de connexion sociale
│   └── travel/           # Composants liés aux voyages
│       └── TripCard.tsx  # Carte de voyage réutilisable
├── hooks/                # Hooks personnalisés
│   └── useAuth.ts        # Hook pour la gestion d'authentification
└── lib/                  # Utilitaires et configurations
    ├── auth-client.ts    # Client d'authentification avec sécurité JWT
    └── supabase.ts       # Configuration Supabase
```

## 🔐 Sécurité JWT

### Fonctionnalités Implémentées

- **Validation automatique des tokens JWT** : Vérification de l'expiration et de l'issuer
- **Refresh automatique** : Les tokens sont automatiquement rafraîchis
- **Déconnexion automatique** : En cas de token invalide ou expiré
- **Validation côté client** : Email et mot de passe validés avant envoi

### Validation des Tokens

```typescript
// Le token JWT est automatiquement validé à chaque requête
const validateJWTToken = (session) => {
  // Vérification de l'expiration
  // Vérification de l'issuer
  // Décodage sécurisé du payload
}
```

## 🎯 Navigation Simplifiée

### Flux d'Authentification

1. **Page de connexion** (`index.tsx`) - Écran d'accueil avec formulaire
2. **Après connexion** → Redirection automatique vers `home.tsx`
3. **Navigation par onglets** :
   - **Home** : Accueil avec les derniers voyages
   - **Créer** : Création de nouveaux voyages/souvenirs
   - **Compte** : Gestion du profil utilisateur

### Protection des Routes

```typescript
// Hook useAuth pour protéger les pages
const { isAuthenticated, loading } = useAuth();

if (!isAuthenticated && !loading) {
  router.replace('/'); // Redirection vers connexion
}
```

## 🧩 Composants Réutilisables

### AuthForm

Composant unifié pour connexion et inscription :

```typescript
<AuthForm 
  mode="signin" // ou "signup"
  onModeChange={() => setMode(...)}
/>
```

### TripCard

Carte de voyage réutilisable :

```typescript
<TripCard
  date="21 Juillet 2024 - 1 Août 2024"
  country="Canada"
  flagEmoji="🇨🇦"
  image={require('@/assets/images/mountain-background.jpg')}
  onPress={() => handleTripDetail()}
/>
```

### SocialButtons

Boutons de connexion sociale (Facebook, Google, Apple) :

```typescript
<SocialButtons />
```

## 🔄 Hook useAuth

Hook centralisé pour la gestion de l'authentification :

```typescript
const { user, isAuthenticated, loading, refreshAuth } = useAuth();

// user: Informations utilisateur (id, email, name)
// isAuthenticated: État de connexion
// loading: Chargement en cours
// refreshAuth: Actualiser la session
```

## 🚀 Fonctionnalités

### Authentification

- ✅ Connexion par email/mot de passe
- ✅ Inscription avec validation
- ✅ Connexion sociale (Facebook, Google, Apple)
- ✅ Déconnexion sécurisée
- ✅ Validation JWT automatique
- ✅ Gestion des erreurs utilisateur-friendly

### Navigation

- ✅ Onglets cachés sur la page de connexion
- ✅ Navigation fluide entre les pages
- ✅ Protection des routes authentifiées
- ✅ Redirection automatique après connexion

### Interface

- ✅ Design moderne et responsive
- ✅ Animations fluides
- ✅ Feedback utilisateur (loading, erreurs)
- ✅ Mode sombre compatible

## 🛠️ Développement

### Ajouter une Nouvelle Page

1. Créer le fichier dans `app/(tabs)/`
2. Ajouter l'onglet dans `_layout.tsx`
3. Utiliser le hook `useAuth` pour la protection

### Créer un Nouveau Composant

1. Créer dans `components/[category]/`
2. Exporter par défaut
3. Ajouter les types TypeScript
4. Documenter les props

### Hooks Personnalisés

1. Créer dans `hooks/`
2. Préfixer par `use`
3. Gérer les états et effets
4. Retourner un objet avec les données nécessaires

## 🔧 Configuration

### Variables d'Environnement

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Créer un projet Supabase
2. Configurer l'authentification
3. Ajouter les variables d'environnement
4. Activer les providers sociaux si nécessaire

## 🎨 Personnalisation

### Thèmes

Les couleurs sont centralisées dans `constants/Colors.ts`

### Images

Les assets sont dans `assets/images/` et peuvent être facilement remplacés

### Styles

Chaque composant a ses styles encapsulés pour éviter les conflits

## 📝 Bonnes Pratiques

### Code

- Utiliser TypeScript pour le typage
- Composants fonctionnels avec hooks
- Gestion d'état locale quand possible
- Validation côté client ET serveur

### Sécurité

- Jamais stocker de tokens en plain text
- Validation des entrées utilisateur
- Gestion des erreurs appropriée
- Logs de sécurité pour le debugging

### Performance

- Composants mémorisés si nécessaire
- Images optimisées
- Lazy loading des pages
- Cache intelligent des données

## 🚧 Prochaines Étapes

- [ ] Base de données pour les voyages
- [ ] Upload d'images
- [ ] Géolocalisation
- [ ] Notifications push
- [ ] Mode hors ligne
- [ ] Partage social

---

*Cette architecture garantit un code maintenable, sécurisé et évolutif pour votre application de voyage.* 🌟 
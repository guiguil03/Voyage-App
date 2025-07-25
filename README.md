# CityTrip - Application de Voyage

Une magnifique application de voyage avec authentification sociale et par email construite avec React Native, Expo et Better Auth.

## Fonctionnalités

- 🔐 Authentification par email et mot de passe
- 🍎 Connexion avec Apple
- 📘 Connexion avec Facebook
- 🌐 Connexion avec Google
- 📱 Interface utilisateur moderne et responsive
- 🎨 Design élégant avec image de fond de temple

## Installation

1. Clonez le repository :
```bash
git clone <votre-repo>
cd Voyage-App
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez les variables d'environnement :
   - Ouvrez le fichier `env.config.js`
   - Remplacez les valeurs par vos vraies clés API OAuth

4. Lancez l'application :
```bash
npm start
```

## Configuration OAuth

Pour activer l'authentification sociale, vous devez configurer les providers OAuth :

### Apple Sign In
1. Créez un App ID dans Apple Developer Portal
2. Activez Sign In with Apple
3. Ajoutez votre `APPLE_CLIENT_ID` et `APPLE_CLIENT_SECRET`

### Facebook Login
1. Créez une application Facebook
2. Configurez Facebook Login
3. Ajoutez votre `FACEBOOK_CLIENT_ID` et `FACEBOOK_CLIENT_SECRET`

### Google Sign In
1. Créez un projet Google Cloud
2. Activez Google Sign-In API
3. Ajoutez votre `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`

## Structure du Projet

```
Voyage-App/
├── app/
│   ├── (tabs)/
│   │   └── index.tsx        # Page de connexion
│   └── register.tsx         # Page d'inscription
├── lib/
│   ├── auth.ts             # Configuration Better Auth
│   └── auth-client.ts      # Client d'authentification
├── assets/
│   └── images/
│       └── temple-background.jpg  # Image de fond
├── api/
│   └── auth/
│       └── [...all].ts     # Point d'entrée API
└── env.config.js           # Configuration d'environnement
```

## Utilisation

1. **Connexion** : Utilisez votre email et mot de passe ou l'un des providers sociaux
2. **Inscription** : Créez un nouveau compte avec email et mot de passe
3. **Navigation** : Basculez entre les pages de connexion et d'inscription

## Technologies Utilisées

- React Native
- Expo
- Better Auth
- TypeScript
- React Navigation

## Développement

Pour développer cette application :

1. Assurez-vous d'avoir Expo CLI installé
2. Utilisez `npm start` pour lancer le serveur de développement
3. Utilisez l'application Expo Go sur votre téléphone pour tester

## Déploiement

Pour déployer l'application :

1. Configurez vos variables d'environnement de production
2. Construisez l'application avec `expo build`
3. Déployez sur les stores d'applications

---

Créé avec ❤️ pour les amoureux de voyage

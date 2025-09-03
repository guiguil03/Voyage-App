const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour éviter les erreurs de fichiers 'unknown'
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Améliorer la gestion des source maps
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Configuration pour éviter les erreurs de symbolication
config.symbolicator = {
  customizeFrame: (frame) => {
    // Éviter les erreurs sur les fichiers 'unknown'
    if (frame.file === 'unknown' || !frame.file) {
      return null;
    }
    return frame;
  }
};

// Désactiver la symbolication qui cause des problèmes
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Ignorer les requêtes de symbolication problématiques
      if (req.url && req.url.includes('symbolicate')) {
        // Utiliser la méthode correcte pour définir le status et envoyer la réponse
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ stack: [] }));
        return;
      }
      return middleware(req, res, next);
    };
  }
};

module.exports = config;

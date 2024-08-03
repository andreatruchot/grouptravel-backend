module.exports = {
    testEnvironment: 'node', // Spécifie l'environnement de test pour les tests backend
    testPathIgnorePatterns: ['/node_modules/', '/public/'], // Dossiers à ignorer
    setupFilesAfterEnv: ['./jest.setup.js'] // Script de configuration après l'env
  };
  
// Importation du modèle User depuis le fichier ../models/users
const User = require('../models/users'); 
// Déclaration de la fonction middleware d'authentification
const authenticate = async (req, res, next) => {

    // Extrait le token d'authentification de l'en-tête 'Authorization' de la requête
// L'en-tête 'Authorization' est normalement formaté comme 'Bearer <token>',
// donc on divise la chaîne sur l'espace (' ') et on prend le deuxième élément ([1]),
  const token = req.headers.authorization?.split(' ')[1];

  // Vérifie si le token est absent
  if (!token) {

    // Retourne une réponse 401 (Unauthorized) avec un message d'erreur
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  try {
    // Cherche un utilisateur dans la base de données avec le token fourni
    const user = await User.findOne({ token: token });

    if (!user) {
      // Si aucun utilisateur n'est trouvé, retourne une réponse 404 (Not Found) avec un message d'erreur
      return res.status(404).json({ message: 'User not found with provided token' });
    }
    // Ajoute l'ID de l'utilisateur à l'objet de requête pour une utilisation ultérieure
    req.userId = user._id.toString(); 
    next();
  } catch (error) {
     // En cas d'erreur (comme un token invalide), retourne une réponse 401 (Unauthorized) avec un message d'erreur
    res.status(401).json({ message: 'Invalid token' });
  }
}
// Exporte la fonction middleware authenticate pour une utilisation dans d'autres parties de l'application
module.exports = authenticate;

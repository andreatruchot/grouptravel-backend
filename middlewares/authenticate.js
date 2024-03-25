const User = require('../models/users'); 

const authenticate = async (req, res, next) => {

    // Extrait le token d'authentification de l'en-tête 'Authorization' de la requête
// L'en-tête 'Authorization' est normalement formaté comme 'Bearer <token>',
// donc on divise la chaîne sur l'espace (' ') et on prend le deuxième élément ([1]),
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  try {
    const user = await User.findOne({ token: token });

    if (!user) {
      return res.status(404).json({ message: 'User not found with provided token' });
    }

    req.userId = user._id.toString(); ; // Attacher l'ID de l'utilisateur à l'objet req
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = authenticate;

var express = require('express');
const User = require('../models/users');
var router = express.Router();
require('../models/connexion');
const { checkBody } = require('../modules/checkBody');
const authenticate = require('../middlewares/authenticate');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const { validateEmailFormat, checkDomain } = require('../services/validateEmailService');



const bcrypt = require('bcrypt');
const uid2 = require('uid2');
const token = uid2(32);

/* GET users listing. */
router.get('/', (req, res) => {
  User.find().then(data => {
   res.json({result: true, data: data});
 });
});

router.post('/signup', async (req, res) => {

  // Extrait l'adresse email de la requête
  const { email } = req.body;

  // Valide le format de l'adresse email
  if (!validateEmailFormat(email)) {
    return res.status(400).json({ result: false, error: "L'adresse email n'est pas valide." });
  }
  if (!checkBody(req.body, ['username', 'password', 'email'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
   // Expression régulière pour valider la force du mot de passe
   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;

   // Vérifie si le mot de passe respecte les critères de sécurité
   if (!passwordRegex.test(req.body.password)) {
     res.json({ result: false, error: 'Le mot de passe doit contenir 10 caracteres, une majuscule,un chiffre et un caractere spéciale.' });
     return;
   }
   // Vérification supplémentaire pour s'assurer que les mots de passe correspondent
  if (req.body.password !== req.body.confirmPassword) {
    res.json({ result: false, error: 'les mots de passe ne sont pas identiques' });
    return;
  }
  // Vérifie l'existence du domaine (asynchrone)
  try {
    const domainIsValid = await checkDomain(email);
    if (!domainIsValid) {
      return res.status(400).json({ result: false, error: 'Le domaine de l\'adresse email n\'est pas valide.' });
    }
  } catch (error) {
    return res.status(500).json({ result: false, error: 'Erreur lors de la vérification du domaine.' });
  }


  User.findOne({ username: req.body.username, email: req.body.email }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);
      const uniqueToken = uid2(32); // Génére un token unique pour ce nouvel utilisateur

      const newUser = new User({
        username: req.body.username,
        password: hash,
        token: uniqueToken, 
        email: req.body.email,
        userPicture: '',
        myTrips: []
      });

      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      res.json({ result: false, error: 'User already exists' });
    }
  });
});

router.post('/signin', (req, res) => {
  console.log('body: ');
  if (!checkBody(req.body, ['email', 'password'])) {

    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ email: req.body.email }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, username: data.username });
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});

// Route POST pour télécharger la photo de profil de l'utilisateur avec Cloudinary
router.post('/profilePicture', authenticate, async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send({ message: "No file uploaded" });
  }

  const userPicture = req.files.userPicture;
  const userId = req.userId; // Récupéré par le middleware 'authenticate'

  // Validation de la taille du fichier (par exemple, 5MB max)
  const maxFileSize = 5 * 1024 * 1024; // 5MB en octets
  if (userPicture.size > maxFileSize) {
    return res.status(400).send({ message: "File is too large. Max size is 5MB." });
  }
  
  // Validation du type de fichier
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedMimeTypes.includes(userPicture.mimetype)) {
    return res.status(400).send({ message: "Invalid file type. Only JPG, PNG, and GIF files are allowed." });
  }

  try {
    const user = await User.findById(userId);

    if (user && user.cloudinaryPublicId) {
      // Supprimer l'ancienne image sur Cloudinary
      await cloudinary.uploader.destroy(user.cloudinaryPublicId);
    }

    // Télécharger la nouvelle image sur Cloudinary
    cloudinary.uploader.upload(userPicture.tempFilePath, { folder: "user_pictures" }, async (error, result) => {
      if (error) {
        return res.status(500).send({ message: "An error occurred while uploading to Cloudinary", error: error.message });
      }

      // Mettre à jour l'utilisateur avec le nouvel URL de l'image et l'ID public Cloudinary
      const updatedUser = await User.findByIdAndUpdate(userId, { userPicture: result.secure_url, cloudinaryPublicId: result.public_id }, { new: true });

      if (!updatedUser) {
        return res.status(404).send({ message: "User not found" });
      }

      res.send({ message: "Profile picture updated successfully", userPicture: result.secure_url });
    });

  } catch (dbError) {
    res.status(500).send({ message: "An error occurred while updating user info", error: dbError.message });
  }
});

module.exports = router;

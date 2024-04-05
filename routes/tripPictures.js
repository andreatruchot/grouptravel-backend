const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const TripPicture = require('../models/tripPictures');
const authenticate = require('../middlewares/authenticate'); 

// Route POST pour télécharger une image de voyage avec Cloudinary
 router.post('/addPicture', authenticate, async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send({ message: "No file uploaded" });
    }
  
    const { tripId, description } = req.body; // `userId` est récupéré par le middleware 'authenticate'
    const file = req.files.photo; // Utilise 'photo' comme nom dans le formulaire d'upload
    const userId = req.userId; // Récupére par le middleware 'authenticate'
  
    // Validation de la taille et du type du fichier
    const maxFileSize = 5 * 1024 * 1024; // 5MB en octets
    if (file.size > maxFileSize) {
      return res.status(400).send({ message: "File is too large. Max size is 5MB." });
    }
    
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).send({ message: "Invalid file type. Only JPG, PNG, and GIF files are allowed." });
    }
  
    try {
      // Télécharge la nouvelle image sur Cloudinary
      const result = await cloudinary.uploader.upload(file.tempFilePath, { folder: "trip_pictures" });
  
      // Sauvegarde dans la base de données
      const newPicture = new TripPicture({
        tripId,
        userId,
        photo: result.secure_url,
        description,
        uploadDate: new Date(),
      });
  
      await newPicture.save();
      res.status(201).json({ message: "Image added successfully", photo: result.secure_url });
    } catch (error) {
      res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
  });
  

  router.get('/:tripId', authenticate, async (req, res) => {
    try {
      const { tripId } = req.params;

      const pictures = await TripPicture.find({ tripId });
      res.status(200).json(pictures);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des images' });
    }
});

    
  router.delete('/:id', authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const picture = await TripPicture.findById(id);
  
      if (!picture) {
        return res.status(404).send({ message: "Picture not found" });
      }
  
      if (picture.userId.toString() !== req.userId) {
        return res.status(403).send({ message: "User not authorized to delete this picture" });
      }
  
      // Supprime l'entrée de la base de données
      await TripPicture.findByIdAndDelete(id);
  
      res.send({ message: "Picture deleted successfully" });
    } catch (error) {
      res.status(500).send({ message: "Error deleting picture", error: error.message });
    }
  });
  

  module.exports = router;
  
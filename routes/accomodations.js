var express = require('express');
var router = express.Router();
require('../models/connexion'); 
const Trip = require('../models/trips');
const { checkBody } = require('../modules/checkBody');
const authenticate = require('../middlewares/authenticate'); 
const User = require('../models/users');
const cloudinary = require('cloudinary').v2;

// Ajoute un logement à un voyage existant
router.post('/addAccomodation/:tripId', authenticate, async (req, res) => {
    if (!checkBody(req.body, ['location', 'arrivalDate', 'returnDate', 'budget', 'description'])) {
        return res.json({ result: false, error: 'Missing or empty fields' });
    }
    if (!req.files || !req.files.photo) {
        return res.status(400).json({ message: "No photo uploaded" });
      }
    const accomodationPhoto = req.files.photo; 
    const maxFileSize = 5 * 1024 * 1024; // 5MB en octets
    if (accomodationPhoto.size > maxFileSize) {
        return res.status(400).json({ message: "File is too large. Max size is 5MB." });
    }
  
    // Validation du type de fichier
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(accomodationPhoto.mimetype)) {
        return res.status(400).json({ message: "Invalid file type. Only JPG, PNG, and GIF files are allowed." });
    }

    try {
        // Récupère l'ID du voyage depuis l'URL
        const { tripId } = req.params;
        // Vérifie si le voyage existe et si l'utilisateur en est un membre
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.json({ result: false, error: 'Trip not found' });
        }

        const user = await User.findById(req.userId);
        const isMember = trip.members.includes(req.userId) || user.myTrips.map(trip => trip.toString()).includes(tripId);

        if (!isMember) {
            return res.json({ result: false, error: "User is not a member of this trip" });
        }
        // Téléchargement de l'image sur Cloudinary
       const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(accomodationPhoto.tempFilePath, { folder: "accomodation_pictures" }, (error, result) => {
         if (error) {
             reject(error);
         } else {
             resolve(result);
         }
     });
     }).catch(error => {
     // Gére l'erreur de Cloudinary ici
     console.error("Cloudinary error:", error);
     return res.status(500).json({ result: false, message: "An error occurred while uploading to Cloudinary", error: error.message });
     });

        // Crée le nouvel hébergement avec les informations fournies
        const newAccomodation = {
            location: req.body.location,
            arrivalDate: req.body.arrivalDate,
            returnDate: req.body.returnDate,
            photo: result.secure_url,
            url: req.body.url || '',
            description: req.body.description,
            budget: req.body.budget,
            vote: [],
            isFixed: false,
            userId: req.userId // L'ID de l'utilisateur proposant le logement
        };

        // Ajoute le nouvel hébergement au voyage
        trip.accomodations.push(newAccomodation);
        await trip.save();

        res.json({ result: true, message: 'Accommodation added successfully to the trip' });
    } catch (error) {
        res.json({ result: false, error: error.toString() });
    }
});

router.get('/:tripId', authenticate, async (req, res) => {
    try {
        
        const { tripId } = req.params;
       // console.log(`Fetching activities for tripId: ${tripId}`); 

        const trip = await Trip.findById(tripId);
        if (!trip) {
            //console.log('Trip not found');
            return res.status(404).json({ result: false, message: 'Trip not found' });
        }
  
        // Vérification si l'utilisateur est membre du voyage ou l'admin
        const isMember = trip.members.includes(req.userId) || trip.admin.toString() === req.userId;
        if (!isMember) {
            //console.log('User is not a member of this trip');
            return res.status(403).json({ result: false, message: "User is not a member of this trip" });
        }
  
        //console.log('Sending accomodations:', trip.accomodations);
        res.json({ result: true, accomodations: trip.accomodations });
    } catch (error) {
        console.error('Error fetching accomodations:', error);
        res.status(500).json({ result: false, message: 'Error fetching accomodations', error: error.toString() });
    }
});
// route pour voter sur un hébergement
router.post('/vote/:accomodationId', authenticate, async (req, res) => {
    const { accomodationId } = req.params;
    const userId = req.userId;
    // Convertit la valeur de status en booléen
    const status = req.body.status === 'true';
  
    try {
      // Trouver le voyage qui contient l'hébergement
      const trip = await Trip.findOne({ "accomodations._id": accomodationId });
      if (!trip) {
        return res.status(404).send({ message: "Hébergement non trouvé dans aucun voyage." });
      }
      
      // Trouver l'accomodation spécifique dans le tableau `accomodations`
      const accomodation = trip.accomodations.id(accomodationId);
      if (!accomodation) {
        return res.status(404).send({ message: "Hébergement non trouvé." });
      }
      // Rechercher un vote existant pour cet utilisateur
      let existingVote = accomodation.vote.find(p => p.userId.toString() === userId);
      
      if (existingVote) {
        existingVote.status = status;

      } else if (status === true) {
        // Ajoute une nouvelle participation si l'utilisateur vote "oui" et n'a pas déjà voté
        accomodation.vote.push({ userId: req.userId, status });
  
      } else {
        // Si l'utilisateur vote "non" et n'a pas déjà voté, rien ne change
      }
  
  
      await trip.save(); // Sauvegarder le voyage, pas l'activité
      res.status(200).send({ message: "Votre vote a été enregistré." });
    } catch (error) {
      res.status(500).send({ message: "Erreur lors de l'enregistrement du vote.", error: error.message });
    }
  });
  router.post('/select/:tripId/:accomodationId', authenticate, async (req, res) => {
    const { tripId, accomodationId } = req.params;
    const userId = req.userId;
  
    try {
      const trip = await Trip.findById(tripId);
      if (!trip) return res.status(404).send({ message: "Voyage non trouvé." });
      if (!trip.admin.equals(userId)) return res.status(403).send({ message: "Action non autorisé." });
  
      let selectedAccomodation;
      for (let accomodation of trip.accomodations) {
        if (accomodation._id.toString() === accomodationId) {
          selectedAccomodation = accomodation;
          break;
        }
      }

      if (!selectedAccomodation) {
        return res.status(404).send({ message: "Hébergement non trouvé." });
      }

      trip.accomodations.forEach(accomodation => { 
       
        accomodation.isFixed = accomodation._id.toString() === accomodationId;
       
      });
  
      await trip.save();
      res.status(200).send({ message: "Hébergement sélectionné avec succès." });
    } catch (error) {
      res.status(500).send({ message: "Erreur du serveur.", error: error.message });
    }
     });

     router.delete('/:accomodationId', authenticate, async (req, res) => {
      const { accomodationId } = req.params;
      try {
        // Trouver le voyage qui contient l'hébergement
        const trip = await Trip.findOne({ 'accomodations._id': accomodationId });
    
        if (!trip) {
          return res.status(404).send({ message: "Hébergement non trouvé." });
        }
    
        // Vérifier si l'utilisateur est l'admin du voyage
        if (!trip.admin.equals(req.userId)) {
          return res.status(403).send({ message: "Seul l'administrateur du voyage peut supprimer les hébergements." });
        }
    
        // Supprimer l'activité du tableau activities
        trip.accomodations.pull({ _id: accomodationId });
        await trip.save();
    
        res.send({ message: "Hébergement supprimé avec succès." });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Erreur du serveur.", error: error.toString() });
      }
    });
module.exports = router;

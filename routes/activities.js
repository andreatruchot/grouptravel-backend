var express = require('express');
var router = express.Router();
require('../models/connexion'); 
const Trip = require('../models/trips');
const { checkBody } = require('../modules/checkBody');
const authenticate = require('../middlewares/authenticate'); 
const User = require('../models/users');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');


// Ajoute une activité à un voyage existant
router.post('/addActivity/:tripId', authenticate, async (req, res) => {
    if (!checkBody(req.body, ['name', 'date', 'description', 'budget', 'place'])) {
        return res.json({ result: false, error: 'Missing or empty fields' });
    }
    if (!req.files || !req.files.photo) {
        return res.status(400).json({ message: "No photo uploaded" });
      }
    const activityPhoto = req.files.photo; 
    const maxFileSize = 5 * 1024 * 1024; // 5MB en octets
    if (activityPhoto.size > maxFileSize) {
        return res.status(400).json({ message: "File is too large. Max size is 5MB." });
    }
  
    // Validation du type de fichier
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(activityPhoto.mimetype)) {
        return res.status(400).json({ message: "Invalid file type. Only JPG, PNG, and GIF files are allowed." });
    }

    try {
        // Récupère l'ID du voyage depuis l'URL
        const { tripId } = req.params;
        // Vérifie si l'activité existe et si l'utilisateur en est un membre
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.json({ result: false, error: 'Activity not found' });
        }

        const user = await User.findById(req.userId);
        const isMember = trip.members.includes(req.userId) || user.myTrips.map(trip => trip.toString()).includes(tripId);

        if (!isMember) {
            return res.json({ result: false, error: "User is not a member of this trip" });
        }
       
        // Téléchargement de l'image sur Cloudinary
       const result = await new Promise((resolve, reject) => {
       cloudinary.uploader.upload(activityPhoto.tempFilePath, { folder: "activity_pictures" }, (error, result) => {
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

// contrôle que la promesse est résolue avant de continuer
if (!result) {
    // Si aucun résultat, il y a eu une erreur
    return;
}
        // Crée la nouvelle activité avec les informations fournies
        const newActivity = {
            name: req.body.name,
            date: req.body.date,
            place: req.body.place,
            photo: result.secure_url,
            url: req.body.url || '',
            description: req.body.description,
            budget: req.body.budget,
            participation: [],
            isFixed: false,
            userId: req.userId // L'ID de l'utilisateur proposant l'activité
        };

        // Ajoute la nouvelle activité au voyage
        trip.activities.push(newActivity);
        await trip.save();

        res.json({ result: true, message: 'Activity added successfully to the trip' });
    } catch (error) {
        res.json({ result: false, error: error.toString() });
    }
});
  
//route pour récuperer les données de activités
  router.get('/:tripId', authenticate, async (req, res) => {
    try {
        
        const { tripId } = req.params;
        console.log(`Fetching activities for tripId: ${tripId}`); 

        const trip = await Trip.findById(tripId);
        if (!trip) {
            console.log('Trip not found');
            return res.status(404).json({ result: false, message: 'Trip not found' });
        }
  
        // Vérification si l'utilisateur est membre du voyage ou l'admin
        const isMember = trip.members.includes(req.userId) || trip.admin.toString() === req.userId;
        if (!isMember) {
            console.log('User is not a member of this trip');
            return res.status(403).json({ result: false, message: "User is not a member of this trip" });
        }
       
       // Calcule le nombre de votes pour chaque activité
        const activitiesWithVoteCount = trip.activities.map(activity => {
        const voteCount = activity.participation.filter(participant => participant.status).length;
        return { ...activity.toObject(), voteCount }; // Convertit le document Mongoose en objet JS et ajoute le voteCount
      });

         console.log('Sending activities with vote counts:', activitiesWithVoteCount);
         res.json({ result: true, activities: activitiesWithVoteCount });
         } catch (error) {
         console.error('Error fetching activities:', error);
         res.status(500).json({ result: false, message: 'Error fetching activities', error: error.toString() });
       }
       });
       // Route pour voter sur une activité
router.post('/vote/:activityId', authenticate, async (req, res) => {
  const { activityId } = req.params;
  const userId = req.userId; // Assuré par le middleware 'authenticate'
  const status = req.body.status === 'true'; // Conversion du statut en booléen

  try {
    // Trouver le voyage contenant l'activité spécifiée par ID
    const trip = await Trip.findOne({ "activities._id": activityId });
    if (!trip) {
      return res.status(404).send({ message: "Activité non trouvée dans aucun voyage." });
    }
    
    // Trouver l'activité spécifique dans le voyage
    const activity = trip.activities.id(activityId);
    if (!activity) {
      return res.status(404).send({ message: "Activité non trouvée." });
    }

    // Rechercher une participation existante pour cet utilisateur
    let existingParticipation = activity.participation.find(p => p.userId.toString() === userId);

    if (existingParticipation) {
      // Si l'utilisateur a déjà voté, mettre à jour son vote
      existingParticipation.status = status;
    } else if (status === true) {
      // Ajouter une nouvelle participation si l'utilisateur vote "oui" et n'a pas déjà voté
      activity.participation.push({ userId: req.userId, status });

    } else {
      // Si l'utilisateur vote "non" et n'a pas déjà voté, rien ne change
    }

    await trip.save(); // Sauvegarder les modifications apportées au voyage
    res.status(200).send({ message: "Votre vote a été enregistré." });
  } catch (error) {
    res.status(500).send({ message: "Erreur lors de l'enregistrement du vote.", error: error.message });
  }
});
router.post('/select/:tripId/:activityId', authenticate, async (req, res) => {
  const { tripId, activityId } = req.params;
  const userId = req.userId;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).send({ message: "Voyage non trouvé." });
    if (!trip.admin.equals(userId)) return res.status(403).send({ message: "Action non autorisée." });

    // Trouve l'activité sélectionnée
    const selectedActivity = trip.activities.find(activity => activity._id.equals(activityId));
    if (!selectedActivity) {
      return res.status(404).send({ message: "Activité non trouvée." });
    }

    // Convertis la date de l'activité sélectionnée en format YYYY-MM-DD pour la comparaison
    const selectedDate = selectedActivity.date.toISOString().split('T')[0];

    // Désélectionne les autres activités pour ce jour
    trip.activities.forEach(activity => {
      if (activity.date.toISOString().split('T')[0] === selectedDate) {
        activity.isFixed = activity._id.equals(activityId);
      }
    });

    await trip.save();
    res.status(200).send({ message: "Activité sélectionnée avec succès." });
  } catch (error) {
    res.status(500).send({ message: "Erreur du serveur.", error: error.message });
  }
});


module.exports = router;

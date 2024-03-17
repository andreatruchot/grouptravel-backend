var express = require('express');
var router = express.Router();
require('../models/connexion');
const Trip = require('../models/trips');
const { checkBody } = require('../modules/checkBody');
const authenticate = require('../middlewares/authenticate'); 
const User = require('../models/users');

router.post('/addTrip', authenticate, async (req, res) => {
    // Pas besoin de vérifier 'admin' dans le corps de la requête, on utilise 'req.userId' à la place
    if (!checkBody(req.body, ['name', 'location', 'departureDate','returnDate'])) {
      return res.json({ result: false, error: 'Missing or empty fields' });
    }
  
    try {

      // Recherche si un voyage avec le même nom et les mêmes dates existe déjà
      const existingTrip = await Trip.findOne({
        name: req.body.name,
        departureDate: req.body.departureDate,
        returnDate: req.body.returnDate
      });
      
      if (existingTrip) {
        return res.json({ result: false, error: 'A trip with the same name and dates already exists' });
      }
      // Utilise 'req.userId' pour l'ID de l'admin extrait par le middleware 'authenticate'
      const newTrip = new Trip({
        name: req.body.name,
        location: req.body.location,
        departureDate: req.body.departureDate,
        returnDate: req.body.returnDate,
        budget: req.body.budget,
        admin: req.userId, //'req.userId' fourni par le middleware 'authenticate'
        members: [req.userId], // L'admin est automatiquement inclus comme membre
        activities: [],
        accomodations: [],
        chat: []
      });
      
      const savedTrip = await newTrip.save();
      console.log('Updating user with ID:', req.userId);
      console.log('Adding trip with ID to myTrips:', savedTrip._id);
      
      // Mise à jour de l'utilisateur avec le nouveau voyage, en utilisant 'req.userId'
      const updatedUser = await User.findByIdAndUpdate(
        req.userId, // Utilisez 'req.userId' ici aussi
        { $push: { myTrips: savedTrip._id } },
        { new: true, useFindAndModify: false }
      );
  
      if (!updatedUser) {
        return res.json({ result: false, error: "Failed to update the user's myTrips" });
      }
  
      res.json({ result: true, trip: savedTrip, tripId: savedTrip._id});
    } catch (error) {
        
      res.json({ result: false, error: error });
    }
});
// Route GET pour récupérer les détails d'un voyage par son nom
router.get('/trip/:name', (req, res) => {
  Trip.findOne({ name: req.params.name }).then(trip => {
    if (trip) {
      res.json({ result: true, trip: trip });
    } else {
      res.json({ result: false, error: 'Trip not found' });
    }
  }).catch(error => {
    res.json({ result: false, error: error.message });
  });
});


router.get('/myTrips', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .populate({
        path: 'myTrips',
        // Sélection des champs spécifiques à renvoyer pour chaque voyage
        select: 'name location departureDate returnDate budget admin members activities accomodations chat',
       
        populate: [
          { path: 'activities', select: 'name place date' },
          { path: 'accomodations', select: 'location arrivalDate returnDate' },
          // ...plus de peuplements si vous avez d'autres sous-documents
        ]
      })
      .exec();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Construit la liste des voyages avec les détails et le statut admin de l'utilisateur pour chaque voyage
    const tripsWithDetails = user.myTrips.map(trip => {
      return {
        id: trip.id,
        name: trip.name,
        location: trip.location,
        departureDate: trip.departureDate,
        returnDate: trip.returnDate,
        budget: trip.budget,
        isAdmin: trip.admin.equals(userId),
        members: trip.members, // Assurez-vous d'avoir les autorisations pour afficher cette information
        activities: trip.activities,
        accomodations: trip.accomodations,
        chat: trip.chat,
        // ...incluez d'autres champs si nécessaire
      };
    });

    // Envoye la liste des voyages avec le statut admin et la photo de l'utilisateur
    res.json({
      userPicture: user.userPicture,
      trips: tripsWithDetails
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching user trips', error: error });
  }
});
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = req.params.id;

    const trip = await Trip.findOne({ _id: tripId, admin: userId })
      .populate({
        path: 'activities',
        select: 'name place date'
      })
      .populate({
        path: 'accomodations',
        select: 'name location arrivalDate returnDate'
      })
      .populate('chat.author', 'username') // Peuple l'auteur des messages dans le chat avec le nom d'utilisateur seulement
      .exec();

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Envoyer les détails du voyage trouvé
    res.json(trip);
  } catch (error) {
    console.error('Error fetching trip details:', error);
    res.status(500).json({ message: 'Error fetching trip details', error });
  }
});


module.exports = router;

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
  
      res.json({ result: true, trip: savedTrip });
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

module.exports = router;

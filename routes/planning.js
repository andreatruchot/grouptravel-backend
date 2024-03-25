const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Trip = require('../models/trips');
const uid2 = require('uid2');
const token = uid2(32);
const authenticate = require('../middlewares/authenticate'); 


//Renvoie l'itinéraire d'un voyage spécifié par tripId
router.get('/itinerary/:tripId', authenticate, async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    // Construit une réponse avec les activités et les hébergements directement

    const itinerary = {
      activities: trip.activities,
      accommodations: trip.accomodations 
    };
    res.json(itinerary);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

  
module.exports = router;
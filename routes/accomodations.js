var express = require('express');
var router = express.Router();
require('../models/connexion'); 
const Trip = require('../models/trips');
const { checkBody } = require('../modules/checkBody');
const authenticate = require('../middlewares/authenticate'); 
const User = require('../models/users');

// Ajoute un logement à un voyage existant
router.post('/addAccomodation/:tripId', authenticate, async (req, res) => {
    if (!checkBody(req.body, ['location', 'arrivalDate', 'departureDate', 'budget', 'description'])) {
        return res.json({ result: false, error: 'Missing or empty fields' });
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

        // Crée le nouvel hébergement avec les informations fournies
        const newAccommodation = {
            location: req.body.location,
            arrivalDate: req.body.arrivalDate,
            departureDate: req.body.returnDate,
            photos: req.body.photos || [],
            url: req.body.url || '',
            description: req.body.description,
            budget: req.body.budget,
            vote: [],
            isFixed: false,
            userId: req.userId // L'ID de l'utilisateur proposant le logement
        };

        // Ajoute le nouvel hébergement au voyage
        trip.accomodations.push(newAccommodation);
        await trip.save();

        res.json({ result: true, message: 'Accommodation added successfully to the trip' });
    } catch (error) {
        res.json({ result: false, error: error.toString() });
    }
});

module.exports = router;

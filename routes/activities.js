var express = require('express');
var router = express.Router();
require('../models/connexion'); 
const Trip = require('../models/trips');
const { checkBody } = require('../modules/checkBody');
const authenticate = require('../middlewares/authenticate'); 
const User = require('../models/users');

// Ajoute une activité à un voyage existant
router.post('/addActivity/:tripId', authenticate, async (req, res) => {
    if (!checkBody(req.body, ['name', 'date', 'description', 'budget'])) {
        return res.json({ result: false, error: 'Missing or empty fields' });
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

        // Crée la nouvelle activité avec les informations fournies
        const newActivity = {
            name: req.body.name,
            date: req.body.date,
            photo: req.body.photo|| '' ,
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

module.exports = router;

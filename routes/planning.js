const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Trip = require('../models/trips');
const uid2 = require('uid2');
const token = uid2(32);
const authenticate = require('../middlewares/authenticate'); 


// Route pour récupérer le planning journalier des activités et hébergements fixés pour un voyage donné
router.get('/planning/:tripId', authenticate, async (req, res) => {
    const { tripId } = req.params;

    try {
        const trip = await Trip.findById(tripId)
                               .populate('activities')
                               .populate('accomodations');
        if (!trip) {
            return res.status(404).json({ message: "Voyage non trouvé." });
        }

        // Filtre pour récupérer uniquement les activités et hébergements fixés
        const fixedActivities = trip.activities.filter(activity => activity.isFixed && activity.date);
        const fixedAccomodations = trip.accomodations.filter(accomodation => accomodation.isFixed && accomodation.arrivalDate);

        // Organiser les activités et hébergements par date
        let planning = {};
        fixedActivities.forEach(activity => {
            const key = activity.date.toISOString().split('T')[0]; // Utilise la date pour les activités

            if (!planning[key]) {
                planning[key] = {
                    activities: [],
                    accomodations: []
                };
            }
            planning[key].activities.push(activity);
        });

        fixedAccomodations.forEach(accomodation => {
            const key = accomodation.arrivalDate.toISOString().split('T')[0]; // Utilise arrivalDate pour les hébergements

            if (!planning[key]) {
                planning[key] = {
                    activities: [],
                    accomodations: []
                };
            }
            planning[key].accomodations.push(accomodation);
        });

        res.json({ result: true, planning });
    } catch (error) {
        console.error("Erreur lors de la récupération du planning :", error);
        res.status(500).json({ message: "Erreur du serveur", error: error.toString() });
    }
});

  
module.exports = router;
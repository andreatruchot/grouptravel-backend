const express = require('express');
const router = express.Router();
const { sendInvitationEmail } = require('../services/emailService '); 
const User = require('../models/users');
const Trip = require('../models/trips');
const Invitation = require('../models/invitations'); 



// Route pour envoyer une invitation
router.post('/send-invitation', async (req, res) => {
  const { email, tripId } = req.body;
  try {
    // Générer un nouveau token et enregistrer l'invitation
    const invitation = new Invitation({
      email,
      tripId,
      // Le token est généré automatiquement selon votre schéma
    });
    await invitation.save();

    // Envoyer l'email d'invitation
    const invitationLink = `http://localhost:3001/accept-invitation?token=${invitation.token}&tripId=${tripId}`;

    sendInvitationEmail(email, invitationLink);



    res.status(200).json({ message: "Invitation envoyée avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'invitation : ", error);
    res.status(500).json({ message: "Erreur lors de l'envoi de l'invitation." });
  }
});


// Route pour accepter une invitation
router.post('/accept-invitation', async (req, res) => {
    const { email, token, tripId } = req.body; // Assumant que l'email de l'utilisateur est envoyé avec la requête
    
    try {
        const invitation = await Invitation.findOne({ token, tripId });
        if (!invitation) {
            return res.status(404).json({ message: "Invitation non trouvée." });
        }

        // Crée un nouvel utilisateur si nécessaire
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ email, /* autres propriétés */ });
            await user.save();
        }

        // Ajouter l'utilisateur au voyage
        const trip = await Trip.findById(tripId);
        if (!trip.members.includes(user._id)) {
            trip.members.push(user._id);
            await trip.save();
        }

        // Mettre à jour l'invitation comme acceptée
        invitation.status = 'accepted';
        await invitation.save();

        res.json({ message: "Invitation acceptée avec succès." });
    } catch (error) {
        console.error('Erreur lors de l\'acceptation de l\'invitation:', error);
        res.status(500).json({ message: "Erreur lors de l\'acceptation de l\'invitation." });
    }
});


module.exports = router;

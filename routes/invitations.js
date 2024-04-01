const express = require('express');
const router = express.Router();
const { sendInvitationEmail } = require('../services/emailService '); 
const User = require('../models/users');
const Trip = require('../models/trips');
const Invitation = require('../models/invitations'); 
const bcrypt = require('bcrypt');
const uid2 = require('uid2');
const token = uid2(32);



// Route pour envoyer une invitation
router.post('/send-invitation', async (req, res) => {
  const { email, tripId } = req.body;
  try {
    // Générer un nouveau token et enregistrer l'invitation
    const invitation = new Invitation({
      email,
      tripId,
      // Le token est généré automatiquement selon le schéma
    });
    await invitation.save();

    // Envoyer l'email d'invitation
    const invitationLink = `http://localhost:3001/Accept-invitation?token=${invitation.token}&tripId=${tripId}`;

    sendInvitationEmail(email, invitationLink);


    res.status(200).json({ message: "Invitation envoyée avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'invitation : ", error);
    res.status(500).json({ message: "Erreur lors de l'envoi de l'invitation." });
  }
});


//route pour s'inscrire et accepter l'invitation
router.post('/signup', async (req, res) => {
  const { email, password, username, token: token} = req.body;
  
  try {
    const invitation = await Invitation.findOne({ token, status: 'pending' });
    if (!invitation || invitation.email !== email) {
      return res.status(400).json({ message: 'Invitation invalide ou déjà acceptée.' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    // Création d'un token unique pour l'utilisateur avec uid2
    const userToken = uid2(16);
    const newUser = new User({ email, password: hashedPassword, username, token: userToken });
    await newUser.save();

    // Ajoute l'utilisateur au voyage
    const trip = await Trip.findById(invitation.tripId);
    trip.members.push(newUser._id);
    await trip.save();

    // Ajoute le voyage aux voyages de l'utilisateur
    newUser.myTrips.push(trip._id);
    await newUser.save();

     // Met à jour le statut de l'invitation
    invitation.status = 'accepted';
    await invitation.save();
    
   // C'est ici que vous mettez la réponse avec l'indicateur de succès
   res.status(201).json({
    success: true, // Indicateur de succès
    message: 'Inscription réussie et invitation acceptée.',
    token: userToken // Retourner le token de l'utilisateur dans la réponse
  });
  } catch (error) {
   console.error('Erreur lors de l\'inscription:', error);
   res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
   }
   });

   router.post('/login', async (req, res) => {
    const { email, password, token: invitationToken} = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
      }
  
      if (invitationToken) {
        const invitation = await Invitation.findOne({ token: invitationToken, status: 'pending', email });
        if (!invitation) {
          return res.status(400).json({ message: 'Invitation invalide ou déjà acceptée.' });
        }
          // Ajoute l'utilisateur au voyage
        const trip = await Trip.findById(invitation.tripId);
          trip.members.push(user._id);
          await trip.save();

           // Ajoute le voyage aux voyages de l'utilisateur
          user.myTrips.push(trip._id);
          await user.save();

          // Met à jour le statut de l'invitation
          invitation.status = 'accepted';
          await invitation.save();
        
      }
  
      // Alignement sur la structure de réponse de /signup
      res.status(201).json({
        success: true,
        message: 'Connexion réussie et invitation acceptée.',
        token: user.token,
        username: user.username
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({ message: 'Erreur lors de la connexion.' });
    }
  });
  

module.exports = router;

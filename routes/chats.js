const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Trip = require('../models/trips');
const bcrypt = require('bcrypt');
const uid2 = require('uid2');
const token = uid2(32);
const authenticate = require('../middlewares/authenticate'); 

// Route pour ecrire des messages

router.post('/chat/:tripId', authenticate, async (req, res) => {
    const { tripId } = req.params;
    const { message } = req.body;

    console.log(`tripId: ${tripId}, userId: ${req.userId}, message: ${message}`); // Pour débogage

    try {
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: "Voyage non trouvé." });
        }

        const newChat = {
            author: req.userId,
            message,
            date: new Date()
        };

        trip.chat.push(newChat);
        await trip.save();

        const author = await User.findById(req.userId).select('username');
        const responseMessage = {
            ...newChat,
            author: { _id: req.userId, username: author.username }
        };

        res.status(201).json(responseMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur du serveur", error: error.toString() });
    }
});



//Route pour recevoir les messages

router.get('/chat/:tripId', authenticate, async (req, res) => {
    const { tripId } = req.params;

    try {
        const trip = await Trip.findById(tripId).populate('chat.author', 'username message');


        if (!trip) {
            return res.status(404).json({ message: "Voyage non trouvé." });
        }

        res.json(trip.chat);
    } catch (error) {
        res.status(500).json({ message: "Erreur du serveur", error: error.toString() });
    }
});
// Route pour supprimer un message spécifique dans le chat d'un voyage
router.delete('/chat/:tripId/:chatId', authenticate, async (req, res) => {
    const { tripId, chatId } = req.params;
  
    try {
      // Trouver le voyage et retirer le message spécifié par chatId
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).send({ message: "Voyage non trouvé." });
      }
  
      // Trouver le message spécifique dans le chat
      const chatIndex = trip.chat.findIndex(chat => chat._id.toString() === chatId);
      if (chatIndex === -1) {
        return res.status(404).send({ message: "Message non trouvé." });
      }
  
      const chat = trip.chat[chatIndex];
  
      // Vérifie si l'utilisateur est l'auteur du message
      if (chat.author.toString() !== req.userId) {
        return res.status(403).send({ message: "Non autorisé. Seul l'auteur peut supprimer ce message." });
      }
  
      // Suppression du message
      trip.chat.splice(chatIndex, 1);
  
      await trip.save(); // Sauvegarde des modifications dans le document Trip
  
      res.send({ message: "Message supprimé avec succès." });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Erreur du serveur." });
    }
  });
  



module.exports = router;

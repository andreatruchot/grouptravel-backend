require('dotenv').config(); 
const nodemailer = require('nodemailer');

// Crée un transporteur Nodemailer avec la configuration SMTP de Yahoo
const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525, // Port utilisé par Mailtrap
    auth: {
        user: process.env.MAILTRAP_USER, // Utilisateur de Mailtrap
        pass: process.env.MAILTRAP_PASS, // Mot de passe de Mailtrap
    },
});

/**
 * Envoie une invitation par e-mail en utilisant un lien d'invitation.
 * @param {string} recipientEmail - L'adresse e-mail du destinataire de l'invitation.
 * @param {string} invitationLink - Le lien complet d'invitation que l'utilisateur peut cliquer pour accepter l'invitation.
 */
function sendInvitationEmail(recipientEmail, invitationLink) {
    const mailOptions = {
        from: process.env.YAHOO_EMAIL_USER, // Utilise l'adresse e-mail configurée dans transporter
        to: recipientEmail,
        subject: 'Invitation à rejoindre notre voyage',
        html: `Bonjour,<br><br>Vous avez été invité à rejoindre notre voyage. Veuillez cliquer sur le lien suivant pour accepter l'invitation :<br><a href="${invitationLink}">Accepter l'invitation</a><br><br>Merci,`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Erreur lors de l\'envoi de l\'e-mail :', error);
        } else {
            console.log('E-mail envoyé : ' + info.response);
        }
    });
}

module.exports = { sendInvitationEmail };

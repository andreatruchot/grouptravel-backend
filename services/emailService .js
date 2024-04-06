require('dotenv').config(); 
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com', // Remplacez par le serveur SMTP de Brevo
    port: 587, // Port standard pour la connexion chiffrée
    secure: false, // False pour le port 587, true pour le port 465
    auth: {
        user: process.env.BEVO_SMTP_USER, 
        pass: process.env.BEVO_SMTP_PASS, 
    },
});

function sendInvitationEmail(senderEmail, recipientEmail, invitationLink) {
    const mailOptions = {
        from: senderEmail, 
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

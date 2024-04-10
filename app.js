require('dotenv').config();

const cors = require('cors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload');


// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(cors()); 
// Configuration pour la sécurité et la performance


// Configuration de l'upload de fichiers avec limites de taille
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }, // Limite à 50MB
}));

// Routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const tripsRouter = require('./routes/trips');
const accomodationsRouter = require('./routes/accomodations');
const activitiesRouter = require('./routes/activities');
const invitationsRouter = require('./routes/invitations');
const planningRouter = require('./routes/planning');
const chatsRouter = require('./routes/chats');
const tripPictureRouter = require('./routes/tripPictures');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/trips', tripsRouter);
app.use('/accomodations', accomodationsRouter);
app.use('/activities', activitiesRouter);
app.use('/invitations', invitationsRouter);
app.use('/planning', planningRouter);
app.use('/chats', chatsRouter);
app.use('/tripPictures', tripPictureRouter);

module.exports = app;

require('dotenv').config();
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const compression = require('compression');

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

// Configuration de morgan pour écrire dans un fichier en mode 'combined'
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuration de CORS
const corsOptions = {
  origin: ['https://your-frontend-domain.com'], // Remplacez par votre domaine réel
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Configuration pour la sécurité et la performance
app.use(helmet());
app.use(compression());

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

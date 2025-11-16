require('dotenv').config();

const cors = require('cors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload');

const app = express();

// 🌟 IMPORTANT : Middleware CORS GLOBAL — AVANT TOUT
// Ce middleware répond à TOUTES les requêtes OPTIONS
// pour empêcher Vercel de renvoyer 404 (cause du blocage CORS)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://www.fellowvoyagers.fr");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware Express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload fichiers
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 },
}));

// 🔥 CORS Express (second niveau, OK à garder)
const allowedOrigins = [
  "https://www.fellowvoyagers.fr",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// IMPORTANT aussi (mais moins qu'avant le middleware global)
app.options('*', cors());

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

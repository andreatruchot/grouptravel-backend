require('dotenv').config();

const cors = require('cors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const tripsRouter = require('./routes/trips');
const accomodationsRouter = require('./routes/accomodations.js');
const activitiesRouter = require('./routes/activities.js');
const invitationsRouter = require('./routes/invitations.js');
const planningRouter = require('./routes/planning.js');
const chatsRouter = require('./routes/chats.js');
const tripPictureRouter = require('./routes/tripPictures');

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
}));


app.use(cors());

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

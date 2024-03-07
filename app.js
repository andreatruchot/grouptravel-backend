require('dotenv').config();

const cors = require('cors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const tripsRouter = require('./routes/trips');
const accommodationsRouter = require('./routes/accommodations.js');
const activitiesRouter = require('./routes/activities.js');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/trips', tripsRouter);
app.use('/accommodations', accommodationsRouter);
app.use('/activities', activitiesRouter)


module.exports = app;

const mongoose = require('mongoose');


const tripPictureSchema = mongoose.Schema({

    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'trips' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    photo: String,
    description: String,
    uploadDate: Date,
   
  });
  
  const TripPicture = mongoose.model('tripPictures', tripPictureSchema);

  module.exports = TripPicture
  
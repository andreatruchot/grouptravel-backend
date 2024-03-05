const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  username: String,
  password: String,
  token: String,
  email: String,
  userPicture: String,
  myTrips: [{ type: mongoose.Schema.Types.ObjectId, ref: 'trips' }]
});

const User = mongoose.model('users', userSchema);

module.exports = User;
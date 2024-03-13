const mongoose = require('mongoose');
const { Schema } = mongoose;
const uid2 = require('uid2');

const invitationSchema = new Schema({
  email: { type: String, required: true },
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  token: { type: String, required: true, default: () => uid2(16) },
  status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'declined'] },
  createdAt: { type: Date, default: Date.now },
});
const Invitation = mongoose.model('invitations', invitationSchema);
module.exports = Invitation;

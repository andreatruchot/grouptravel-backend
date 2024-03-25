const mongoose = require('mongoose');
const activitiesSchema = mongoose.Schema({ 
                                           name: String, 
                                           place : String, 
                                           date : Date, 
                                           photo : String, 
                                           url: String, 
                                           description : String,
                                           budget: Number,
                                           participation: [{ userId: { type: mongoose.Schema.Types.ObjectId, 
                                                ref: 'users' }, 
                                                 status: Boolean }], 
                                            isFixed: Boolean, });

const accomodationsSchema = mongoose.Schema({ location: String, 
                                              arrivalDate : Date, 
                                              returnDate : Date, 
                                              photo : String, 
                                              url: String, 
                                              description : String, 
                                              budget: Number, 
                                              vote: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }, status: Boolean }], isFixed: Boolean, });
const chatSchema = mongoose.Schema({ author: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }, date: Date, message: String })

const tripSchema = mongoose.Schema({ name : String, 
                                     location : String, 
                                     departureDate : Date, 
                                     returnDate : Date, 
                                     budget : Number, admin : { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
                                     members : [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
                                     activities : [activitiesSchema],
                                     accomodations :[accomodationsSchema], 
                                     chat : [chatSchema] });
const Trip = mongoose.model('trips', tripSchema);

module.exports = Trip;

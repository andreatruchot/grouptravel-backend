var express = require('express');
var router = express.Router();
require('../models/connexion');
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');

const bcrypt = require('bcrypt');
const uid2 = require('uid2');
const token = uid2(32);

/* GET users listing. */
router.get('/', (req, res) => {
  User.find().then(data => {
   res.json({result: true, data: data});
 });
});

router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['username', 'password', 'email'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ username: req.body.username, email: req.body.email }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);
      const uniqueToken = uid2(32); // Génére un token unique pour ce nouvel utilisateur

      const newUser = new User({
        username: req.body.username,
        password: hash,
        token: uniqueToken, 
        email: req.body.email,
        userPicture: '',
        myTrips: []
      });

      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      res.json({ result: false, error: 'User already exists' });
    }
  });
});

router.post('/signin', (req, res) => {
  console.log('body: ');
  if (!checkBody(req.body, ['email', 'password'])) {

    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ email: req.body.email }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, userName: data.userName });
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});



module.exports = router;

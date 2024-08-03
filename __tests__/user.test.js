const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/users');
const userRoutes = require('../routes/users');
require('dotenv').config({ path: './.env' });

const app = express();
app.use(express.json());
app.use('/users', userRoutes);

const request = require('supertest');

describe('Routes Utilisateurs', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Hacher le mot de passe pour l'utilisateur de test
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    // Créer un utilisateur pour le test de connexion
    await User.create({
      username: 'signinuser',
      email: 'signinuser@example.com',
      password: hashedPassword,
      token: 'someuniquetoken',
      myTrips: [],
    });
  });

  afterAll(async () => {
    // Nettoyer les utilisateurs de test créés par les tests
    await User.deleteOne({ email: 'testuser@example.com' });
    await User.deleteOne({ email: 'signinuser@example.com' });
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Nettoyer uniquement l'utilisateur de test créé par le test d'inscription
    await User.deleteOne({ email: 'testuser@example.com' });
  });

  it('devrait inscrire un nouvel utilisateur', async () => {
    const response = await request(app)
      .post('/users/signup')
      .send({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'TestPassword123!', // Mot de passe respectant les règles
        confirmPassword: 'TestPassword123!', // Correspondance du mot de passe
      });

    console.log('Signup Response:', response.body); // Log pour voir la réponse exacte
    expect(response.status).toBe(200); // vérifie le statut est 200
    expect(response.body.result).toBe(true); //vérifie resultat  est true
    expect(response.body).toHaveProperty('token'); //vérifie le token est présent
  });

  it('devrait se connecter avec un utilisateur existant', async () => {
    const response = await request(app)
      .post('/users/signin')
      .send({
        email: 'signinuser@example.com',
        password: 'Password123!', // Mot de passe respectant les règles
      });

    console.log('Signin Response:', response.body); // Log pour voir la réponse exacte
    expect(response.status).toBe(200); // le statut est 200
    expect(response.body.result).toBe(true); //vérifie result est true
    expect(response.body).toHaveProperty('token', 'someuniquetoken'); //vérifie que le token est présent et correct
  });
});

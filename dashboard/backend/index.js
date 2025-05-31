const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

const { connectToMongoose } = require('./mongoose');
const UserWarn = require('../../models/UserWarn');
require('./auth'); // Load passport strategy

const app = express();
const PORT = 3001;

// === Middleware ===
app.use(cors({
  origin: 'http://localhost:5173', // your frontend origin
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// === Auth Routes ===
app.get('/auth/discord', passport.authenticate('discord'));

app.get(
  '/auth/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: '/'
  }),
  (req, res) => {
    res.redirect('http://localhost:5173'); // Redirect to frontend
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout(err => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

app.get('/auth/user', (req, res) => {
  if (!req.user) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true, user: req.user });
});

// === App Routes ===
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Pandoryx backend!' });
});

app.get('/api/warnings', async (req, res) => {
  console.log('GET /api/warnings hit!');
  try {
    console.log('Querying collection:', UserWarn.collection.name);
    const warns = await UserWarn.find();
    console.log('Returned documents:', warns);
    res.json({ success: true, data: warns });
  } catch (err) {
    console.error('Error fetching warnings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// === Start Server ===
app.listen(PORT, async () => {
  await connectToMongoose();
  console.log(`✅ Mongoose connected`);
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
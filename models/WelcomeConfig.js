// models/WelcomeConfig.js
const mongoose = require('mongoose');

const WelcomeConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  welcomeType: { type: String, enum: ['embed', 'text'], default: 'text' },
  welcomeEmbedId: { type: String }, // Mongo ID of the embed to use
  welcomeText: { type: String },    // If text mode
  welcomeChannel: { type: String }, // Channel ID

  leaveType: { type: String, enum: ['embed', 'text'], default: 'text' },
  leaveEmbedId: { type: String },
  leaveText: { type: String },
  leaveChannel: { type: String }, // Channel ID
});

module.exports = mongoose.model('WelcomeConfig', WelcomeConfigSchema);
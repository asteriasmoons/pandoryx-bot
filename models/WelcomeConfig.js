// models/WelcomeConfig.js
const mongoose = require('mongoose');

const WelcomeConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },

  welcomeType: { type: String, enum: ['embed', 'text'], default: 'text' },
  welcomeEmbedName: { type: String }, // Name of the embed to use (not ID!)
  welcomeText: { type: String },
  welcomeChannel: { type: String },

  leaveType: { type: String, enum: ['embed', 'text'], default: 'text' },
  leaveEmbedName: { type: String }, // Name of the embed to use (not ID!)
  leaveText: { type: String },
  leaveChannel: { type: String },
});

module.exports = mongoose.model('WelcomeConfig', WelcomeConfigSchema);
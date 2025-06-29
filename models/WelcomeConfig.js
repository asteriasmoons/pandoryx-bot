// models/WelcomeConfig.js
const mongoose = require("mongoose");

const WelcomeConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },

  // Welcome
  welcomeType: { type: String, enum: ["embed", "text"], default: "text" },
  welcomeEmbedName: { type: String }, // Name of the embed to use if type=embed
  welcomeText: { type: String }, // Optional, even with embed
  welcomeChannel: { type: String }, // Channel ID

  // Leave
  leaveType: { type: String, enum: ["embed", "text"], default: "text" },
  leaveEmbedName: { type: String },
  leaveText: { type: String },
  leaveChannel: { type: String },
});

module.exports = mongoose.model("WelcomeConfig", WelcomeConfigSchema);

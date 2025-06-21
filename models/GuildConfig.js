// models/GuildConfig.js
const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  levelThresholds: {
    type: [Number],
    default: [0, 5, 10, 25, 50, 100, 200]
  },
  levelRoles: {
    type: [
      {
        level: { type: Number, required: true },
        roleId: { type: String, required: true }
      }
    ],
    default: []
  },
  // Add to your GuildConfigSchema:
levelUpMessage: {
  type: String,
  default: '<@{userId}> leveled up to **Level {level}**! 🎉'
}
});

module.exports = mongoose.model('GuildConfig', GuildConfigSchema);
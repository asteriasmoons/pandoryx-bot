// models/CommandPermissions.js
const mongoose = require("mongoose");

const CommandPermissionsSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  command: { type: String, required: true }, // e.g. 'ticketpanel.create'
  allowedRoles: { type: [String], default: [] }, // array of role IDs
});

// Compound index to ensure uniqueness per command per guild
CommandPermissionsSchema.index({ guildId: 1, command: 1 }, { unique: true });

module.exports = mongoose.model("CommandPermissions", CommandPermissionsSchema);

const mongoose = require('mongoose');

const ReactionRoleMessageSchema = new mongoose.Schema({
  panelName: { type: String, required: true },
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
  emojiRoleMap: { type: Map, of: String, required: true }, // emoji as key, role ID as value
});

// Ensure panelName is unique per guild
ReactionRoleMessageSchema.index({ guildId: 1, panelName: 1 }, { unique: true });

module.exports = mongoose.model('ReactionRoleMessage', ReactionRoleMessageSchema);
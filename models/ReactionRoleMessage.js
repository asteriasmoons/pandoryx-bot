const mongoose = require('mongoose');

const ReactionRoleMessageSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true, unique: true },
  emojiRoleMap: { type: Map, of: String, required: true }, // emoji as key, role ID as value
});

module.exports = mongoose.model('ReactionRoleMessage', ReactionRoleMessageSchema);
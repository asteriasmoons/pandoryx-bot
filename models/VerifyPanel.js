const mongoose = require('mongoose');

const VerifyPanelSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
  roleId: { type: String, required: true }, // <-- ADD THIS LINE
  title: { type: String, default: 'Verification Required' },
  description: { type: String, default: 'Click the button below to verify yourself!' },
  color: { type: String, default: '#5865F2' },
  emoji: { type: String, default: null }
});

module.exports = mongoose.model('VerifyPanel', VerifyPanelSchema);
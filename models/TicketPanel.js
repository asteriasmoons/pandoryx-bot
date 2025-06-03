// models/TicketPanel.js
const mongoose = require('mongoose');

const TicketPanelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  embed: {
    title: String,
    description: String,
    color: String
  },
  emoji: { type: String }, // ✅ emoji support
  categoryId: { type: String }, // ✅ where tickets open
  message: { type: String }, // ✅ optional extra message
  transcript: { type: Boolean, default: false }, // ✅ toggle
  guildId: { type: String, required: true } // ✅ new: ties the panel to the server
});

module.exports = mongoose.model('TicketPanel', TicketPanelSchema);
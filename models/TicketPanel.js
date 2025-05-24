const mongoose = require('mongoose');

const TicketPanelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  channelId: { type: String, required: false },
  messageId: { type: String, required: false },
  embed: {
    title: String,
    description: String,
    color: String,
	emoji: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('TicketPanel', TicketPanelSchema);
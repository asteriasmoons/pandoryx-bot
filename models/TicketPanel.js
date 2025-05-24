const mongoose = require('mongoose');

const TicketPanelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  embed: {
    title: String,
    description: String,
    color: String
  },
  emoji: { type: String }, // <-- make sure this is here!
});

module.exports = mongoose.model('TicketPanel', TicketPanelSchema);
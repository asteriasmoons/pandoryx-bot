const mongoose = require('mongoose');

const TicketPanelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  embed: {
    title: String,
    description: String,
    color: String
  },
  emoji: { type: String }, // <-- make sure this is here!
  // Add these to TicketPanelSchema
categoryId: { type: String }, // where tickets open
message: { type: String }, // additional message
transcript: { type: Boolean, default: false },
});

module.exports = mongoose.model('TicketPanel', TicketPanelSchema);
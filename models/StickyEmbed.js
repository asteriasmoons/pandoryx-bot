const mongoose = require('mongoose');

const StickyEmbedSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  name: { type: String, required: true },
  embed: { type: Object, required: true },
  channelId: { type: String },
  messageId: { type: String },
});

StickyEmbedSchema.index({ guildId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('StickyEmbed', StickyEmbedSchema);
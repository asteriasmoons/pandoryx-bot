const mongoose = require('mongoose');

const autoForumConfigSchema = new mongoose.Schema({
  forumId: { type: String, required: true, unique: true },
  title: { type: String, default: null },
  description: { type: String, default: null },
  color: { type: String, default: null },
  buttonLabel: { type: String, default: null },
  buttonEmoji: { type: String, default: null },
});

module.exports = mongoose.model('AutoForumConfig', autoForumConfigSchema);
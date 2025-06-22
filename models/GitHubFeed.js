const mongoose = require('mongoose');

const GitHubFeedSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  repoUrl: { type: String, required: true },
  branch: { type: String, default: 'main' },
  channelId: { type: String, required: true },
  lastCommitSha: { type: String },
});

module.exports = mongoose.model('GitHubFeed', GitHubFeedSchema);
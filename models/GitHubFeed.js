// models/GitHubFeed.js
const mongoose = require('mongoose');

const GitHubFeedSchema = new mongoose.Schema({
  guildId: String,
  repoUrl: String,
  branch: { type: String, default: 'main' },
  channelId: String,
  lastCommitSha: String,
});

module.exports = mongoose.model('GitHubFeed', GitHubFeedSchema);
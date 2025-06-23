const mongoose = require('mongoose');

const TwitterFeedSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  twitterUserId: { type: String, required: true },
  username: { type: String, required: true },
  channelId: { type: String, required: true },
  lastTweetId: { type: String }, // for deduping
});

module.exports = mongoose.model('TwitterFeed', TwitterFeedSchema);
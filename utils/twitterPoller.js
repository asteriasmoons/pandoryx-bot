const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const TwitterFeed = require('../models/TwitterFeed');

async function checkTwitterFeeds(client) {
  const feeds = await TwitterFeed.find();

  for (const feed of feeds) {
    try {
      const apiUrl = `https://api.twitter.com/2/users/${feed.twitterUserId}/tweets?max_results=5&tweet.fields=created_at,author_id&exclude=replies,retweets`;
      const res = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER}` }
      });

      const tweets = res.data.data;
      if (!Array.isArray(tweets) || !tweets.length) continue;

      let newTweets = [];
      for (const tweet of tweets) {
        if (tweet.id === feed.lastTweetId) break;
        newTweets.push(tweet);
      }
      if (newTweets.length === 0) continue;

      newTweets.reverse();

      const channel = await client.channels.fetch(feed.channelId);
      if (!channel) continue;

      for (const tweet of newTweets) {
        const url = `https://twitter.com/${feed.username}/status/${tweet.id}`;
        const embed = new EmbedBuilder()
          .setColor(0x1da1f2)
          .setAuthor({ name: `@${feed.username} on Twitter`, url: url })
          .setDescription(tweet.text)
          .setURL(url)
          .setTimestamp(new Date(tweet.created_at))
          .setFooter({ text: 'Twitter Feed' });

        await channel.send({ embeds: [embed] });
        await channel.send(url); // to trigger Discord's rich preview
      }

      feed.lastTweetId = tweets[0].id;
      await feed.save();
    } catch (err) {
      console.error(`❌ Error checking @${feed.username}:`, err.response?.data?.title || err.message);
    }
  }
}

module.exports = { checkTwitterFeeds };
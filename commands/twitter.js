const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const TwitterFeed = require('../models/TwitterFeed');
const axios = require('axios');

function getUsernameFromUrl(url) {
  // Supports x.com and twitter.com, any protocol, with or without trailing slash
  url = url.replace(/^https?:\/\//, '');
  const match = url.match(/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})(?:[/?].*)?$/i);
  return match ? match[1] : null;
}

async function getUserIdFromUsername(username) {
  const res = await axios.get(
    `https://api.twitter.com/2/users/by/username/${username}`,
    { headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER}` } }
  );
  return res.data.data?.id;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('twitter')
    .setDescription('Track Twitter accounts in a channel')
    .addSubcommand(sub =>
      sub.setName('follow')
        .setDescription('Track tweets from a Twitter account')
        .addStringOption(opt =>
          opt.setName('url').setDescription('Twitter profile URL (e.g., https://twitter.com/nyxiridessa)').setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Channel to post tweets in').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('unfollow')
        .setDescription('Stop tracking tweets from an account')
        .addStringOption(opt =>
          opt.setName('url').setDescription('Twitter profile URL').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all Twitter feeds tracked in this server')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'follow') {
      const url = interaction.options.getString('url');
      const channel = interaction.options.getChannel('channel');
      const username = getUsernameFromUrl(url);
      if (!username) {
        const embed = new EmbedBuilder()
          .setColor(0xff5c5c)
          .setTitle('Invalid Twitter URL')
          .setDescription('Please provide a valid Twitter profile URL.');
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      try {
        const twitterUserId = await getUserIdFromUsername(username);
        if (!twitterUserId) throw new Error('User not found on Twitter.');

        await TwitterFeed.findOneAndUpdate(
          { guildId, twitterUserId },
          { channelId: channel.id, username },
          { upsert: true }
        );

        const embed = new EmbedBuilder()
          .setColor(0x1da1f2)
          .setTitle('Now Tracking Twitter User')
          .setDescription(`Now tracking [@${username}](https://twitter.com/${username}) in <#${channel.id}>.`);
        await interaction.reply({ embeds: [embed] });
      } catch (err) {
        const embed = new EmbedBuilder()
          .setColor(0xff5c5c)
          .setTitle('Error')
          .setDescription('Could not find or access this Twitter user. Please check the URL and try again.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    if (sub === 'unfollow') {
      const url = interaction.options.getString('url');
      const username = getUsernameFromUrl(url);
      if (!username) {
        const embed = new EmbedBuilder()
          .setColor(0xff5c5c)
          .setTitle('Invalid Twitter URL')
          .setDescription('Please provide a valid Twitter profile URL.');
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      try {
        const twitterUserId = await getUserIdFromUsername(username);
        await TwitterFeed.deleteOne({ guildId, twitterUserId });
        const embed = new EmbedBuilder()
          .setColor(0x1da1f2)
          .setTitle('Stopped Tracking')
          .setDescription(`No longer tracking [@${username}](https://twitter.com/${username}).`);
        await interaction.reply({ embeds: [embed] });
      } catch {
        const embed = new EmbedBuilder()
          .setColor(0xff5c5c)
          .setTitle('Error')
          .setDescription('Could not remove tracking for that user.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    if (sub === 'list') {
      const feeds = await TwitterFeed.find({ guildId });
      if (!feeds.length) {
        const embed = new EmbedBuilder()
          .setColor(0x999999)
          .setTitle('No Twitter Feeds Tracked')
          .setDescription('This server is not tracking any Twitter accounts.');
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x1da1f2)
        .setTitle('Tracked Twitter Accounts')
        .setDescription(feeds.map(f =>
          `• [@${f.username}](https://twitter.com/${f.username}) → <#${f.channelId}>`
        ).join('\n'));

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
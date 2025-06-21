// events/messageCreate.js
const StickyEmbed = require('../models/StickyEmbed');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Find all stickies in this channel for this guild
    const stickies = await StickyEmbed.find({ guildId: message.guildId, 'stickies.channelId': message.channel.id });
    if (!stickies.length) return;

    for (const sticky of stickies) {
      // Find the sticky record for this channel
      const stickyInfo = sticky.stickies.find(s => s.channelId === message.channel.id);
      if (stickyInfo && stickyInfo.messageId) {
        try {
          const oldMsg = await message.channel.messages.fetch(stickyInfo.messageId);
          if (oldMsg) await oldMsg.delete();
        } catch (e) {
          // Ignore if already deleted
        }
      }

      // Re-send the sticky embed
      const embed = new EmbedBuilder()
        .setTitle(sticky.embed.title)
        .setDescription(sticky.embed.description)
        .setColor(sticky.embed.color || '#5865F2');
      const sentMsg = await message.channel.send({ embeds: [embed] });

      // Update sticky messageId in DB for this channel
      sticky.stickies = sticky.stickies.map(s =>
        s.channelId === message.channel.id ? { channelId: s.channelId, messageId: sentMsg.id } : s
      );
      await sticky.save();
    }
  });
};
const { EmbedBuilder, ChannelType, Events, PermissionsBitField } = require('discord.js');
const LogConfig = require('../models/LogConfig'); // Adjust path if needed

console.log('[DEBUG] channelEvents.js loaded!');

function getChannelTypeName(type) {
  switch (type) {
    case ChannelType.GuildText: return 'Text';
    case ChannelType.GuildVoice: return 'Voice';
    case ChannelType.GuildCategory: return 'Category';
    case ChannelType.GuildAnnouncement: return 'Announcement';
    case ChannelType.AnnouncementThread: return 'Announcement Thread';
    case ChannelType.PublicThread: return 'Public Thread';
    case ChannelType.PrivateThread: return 'Private Thread';
    case ChannelType.GuildForum: return 'Forum';
    default: return `Unknown (${type})`;
  }
}

module.exports = (client) => {
  // Channel Created (includes threads)
  client.on(Events.ChannelCreate, async (channel) => {
    if (!channel.guild) return;

    const config = await LogConfig.findOne({ guildId: channel.guild.id });
    if (!config?.logs?.channelCreate) return;

    const logChannel = channel.guild.channels.cache.get(config.logs.channelCreate);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    // Thread details
    let embed = new EmbedBuilder()
      .setColor(0x5d47a0)
      .setTimestamp();

    if (channel.isThread && channel.isThread()) {
      embed
        .setTitle('Thread Created')
        .addFields(
          { name: 'Name', value: channel.name, inline: true },
          { name: 'ID', value: channel.id, inline: true },
          { name: 'Type', value: getChannelTypeName(channel.type), inline: true },
          { name: 'Parent Channel', value: channel.parent ? `<#${channel.parentId}> (${channel.parentId})` : 'None', inline: false },
          { name: 'Archived?', value: channel.archived ? 'Yes' : 'No', inline: true },
          { name: 'Locked?', value: channel.locked ? 'Yes' : 'No', inline: true },
          { name: 'Invitable?', value: channel.invitable ? 'Yes' : 'No', inline: true },
          { name: 'Owner', value: channel.ownerId ? `<@${channel.ownerId}>` : 'Unknown', inline: true }
        );
    } else {
      embed
        .setTitle('Channel Created')
        .addFields(
          { name: 'Name', value: channel.name, inline: true },
          { name: 'ID', value: channel.id, inline: true },
          { name: 'Type', value: getChannelTypeName(channel.type), inline: true }
        );
    }

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Channel Deleted (includes threads)
  client.on(Events.ChannelDelete, async (channel) => {
    if (!channel.guild) return;

    const config = await LogConfig.findOne({ guildId: channel.guild.id });
    if (!config?.logs?.channelDelete) return;

    const logChannel = channel.guild.channels.cache.get(config.logs.channelDelete);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    let embed = new EmbedBuilder()
      .setColor(0x5d47a0)
      .setTimestamp();

    if (channel.isThread && channel.isThread()) {
      embed
        .setTitle('Thread Deleted')
        .addFields(
          { name: 'Name', value: channel.name, inline: true },
          { name: 'ID', value: channel.id, inline: true },
          { name: 'Type', value: getChannelTypeName(channel.type), inline: true },
          { name: 'Parent Channel', value: channel.parentId ? `<#${channel.parentId}> (${channel.parentId})` : 'None', inline: false }
        );
    } else {
      embed
        .setTitle('Channel Deleted')
        .addFields(
          { name: 'Name', value: channel.name, inline: true },
          { name: 'ID', value: channel.id, inline: true },
          { name: 'Type', value: getChannelTypeName(channel.type), inline: true }
        );
    }

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Channel Updated (supports permission changes & name/topic/etc)
  client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    if (!newChannel.guild) return;

    const config = await LogConfig.findOne({ guildId: newChannel.guild.id });
    if (!config?.logs?.channelUpdate) return;

    const logChannel = newChannel.guild.channels.cache.get(config.logs.channelUpdate);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    const changes = [];

    if (oldChannel.name !== newChannel.name) {
      changes.push({
        name: 'Name Changed',
        value: `**Before:** ${oldChannel.name}\n**After:** ${newChannel.name}`,
      });
    }

    if ('topic' in oldChannel && oldChannel.topic !== newChannel.topic) {
      changes.push({
        name: 'Topic Changed',
        value: `**Before:** ${oldChannel.topic || 'None'}\n**After:** ${newChannel.topic || 'None'}`,
      });
    }

    // Permissions Changed
    if (oldChannel.permissionOverwrites && newChannel.permissionOverwrites) {
      // This can be expensive! We'll just show "permissions changed" if bitfields differ
      if (JSON.stringify(oldChannel.permissionOverwrites.cache.map(po => [po.id, po.allow.bitfield, po.deny.bitfield]))
        !== JSON.stringify(newChannel.permissionOverwrites.cache.map(po => [po.id, po.allow.bitfield, po.deny.bitfield]))) {
        changes.push({
          name: 'Permissions Changed',
          value: `Channel permissions were updated.`,
        });
      }
    }

    if (changes.length === 0) return;

    const embed = new EmbedBuilder()
      .setColor(0x5d47a0)
      .setTitle(newChannel.isThread && newChannel.isThread() ? 'Thread Updated' : 'Channel Updated')
      .addFields(...changes)
      .addFields({ name: 'Channel', value: `<#${newChannel.id}>`, inline: false })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });
};
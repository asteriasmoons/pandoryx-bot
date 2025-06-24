const { EmbedBuilder, ChannelType, Events, PermissionsBitField } = require('discord.js');
const LogConfig = require('../models/LogConfig');

console.log('[DEBUG] channelEvents.js loaded!');

const THREAD_TYPES = [
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.AnnouncementThread
];

module.exports = (client) => {
  // Channel Created
  client.on(Events.ChannelCreate, async (channel) => {
    console.log('[DEBUG] ChannelCreate event fired!', channel.name, channel.id, 'Type:', channel.type);
    if (!channel.guild) return;
    const config = await LogConfig.findOne({ guildId: channel.guild.id });
    if (!config?.logs?.channelCreate) return;
    const logChannel = channel.guild.channels.cache.get(config.logs.channelCreate);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    if (THREAD_TYPES.includes(channel.type)) {
      // Thread Created
      const embed = new EmbedBuilder()
        .setColor(0x12cdea)
        .setTitle('Thread Created')
        .addFields(
          { name: 'Thread Name', value: channel.name, inline: true },
          { name: 'Thread ID', value: channel.id, inline: true },
          { name: 'Parent Channel', value: channel.parentId ? `<#${channel.parentId}>` : 'Unknown', inline: true }
        )
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
      console.log('[DEBUG] Thread creation log sent!');
    } else if (channel.type === ChannelType.GuildForum) {
      // Forum Channel Created
      const embed = new EmbedBuilder()
        .setColor(0x12cdea)
        .setTitle('Forum Channel Created')
        .addFields(
          { name: 'Name', value: channel.name, inline: true },
          { name: 'ID', value: channel.id, inline: true },
          { name: 'Type', value: 'Forum', inline: true }
        )
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
      console.log('[DEBUG] Forum channel creation log sent!');
    } else {
      // Standard Channel Created
      const embed = new EmbedBuilder()
        .setColor(0x12cdea)
        .setTitle('Channel Created')
        .addFields(
          { name: 'Name', value: channel.name, inline: true },
          { name: 'ID', value: channel.id, inline: true },
          { name: 'Type', value: `${channel.type}`, inline: true }
        )
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
      console.log('[DEBUG] Channel creation log sent!');
    }
  });

  // Channel Deleted
  client.on(Events.ChannelDelete, async (channel) => {
    console.log('[DEBUG] ChannelDelete event fired!', channel.name, channel.id, 'Type:', channel.type);
    if (!channel.guild) return;
    const config = await LogConfig.findOne({ guildId: channel.guild.id });
    if (!config?.logs?.channelDelete) return;
    const logChannel = channel.guild.channels.cache.get(config.logs.channelDelete);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    if (THREAD_TYPES.includes(channel.type)) {
      // Thread Deleted
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('Thread Deleted')
        .addFields(
          { name: 'Thread Name', value: channel.name, inline: true },
          { name: 'Thread ID', value: channel.id, inline: true },
          { name: 'Parent Channel', value: channel.parentId ? `<#${channel.parentId}>` : 'Unknown', inline: true }
        )
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
      console.log('[DEBUG] Thread deletion log sent!');
    } else if (channel.type === ChannelType.GuildForum) {
      // Forum Channel Deleted
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('Forum Channel Deleted')
        .addFields(
          { name: 'Name', value: channel.name, inline: true },
          { name: 'ID', value: channel.id, inline: true },
          { name: 'Type', value: 'Forum', inline: true }
        )
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
      console.log('[DEBUG] Forum channel deletion log sent!');
    } else {
      // Standard Channel Deleted
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('Channel Deleted')
        .addFields(
          { name: 'Name', value: channel.name, inline: true },
          { name: 'ID', value: channel.id, inline: true },
          { name: 'Type', value: `${channel.type}`, inline: true }
        )
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
      console.log('[DEBUG] Channel deletion log sent!');
    }
  });

  // Channel Updated (including threads, forums, etc.)
  client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    console.log('[DEBUG] ChannelUpdate event fired!', oldChannel.name, '->', newChannel.name, newChannel.id);
    if (!newChannel.guild) return;

    const config = await LogConfig.findOne({ guildId: newChannel.guild.id });
    if (!config) {
      console.log('[DEBUG] No LogConfig for guild:', newChannel.guild.id);
      return;
    }
    if (!config.logs?.channelUpdate) {
      console.log('[DEBUG] No channelUpdate log config for guild:', newChannel.guild.id);
      return;
    }

    const logChannel = newChannel.guild.channels.cache.get(config.logs.channelUpdate);
    if (!logChannel) {
      console.log('[DEBUG] Log channel not found or not cached:', config.logs.channelUpdate);
      return;
    }
    if (!logChannel.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) {
      console.log('[DEBUG] No send permissions for log channel');
      return;
    }

    // Track changes
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

    // Forum-specific
    if (oldChannel.type === ChannelType.GuildForum && newChannel.type === ChannelType.GuildForum) {
      if ('rateLimitPerUser' in oldChannel && oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
        changes.push({
          name: 'Forum Slowmode Changed',
          value: `**Before:** ${oldChannel.rateLimitPerUser || 'None'}\n**After:** ${newChannel.rateLimitPerUser || 'None'}`
        });
      }
      // Add more forum-specific checks as needed
    }

    // Thread-specific
    if (THREAD_TYPES.includes(oldChannel.type) && THREAD_TYPES.includes(newChannel.type)) {
      if (oldChannel.archived !== newChannel.archived) {
        changes.push({
          name: 'Thread Archived',
          value: newChannel.archived ? 'Thread was archived.' : 'Thread was unarchived.'
        });
      }
      // Add more thread-specific checks if needed
    }

    // Permission overwrites
    if (JSON.stringify(oldChannel.permissionOverwrites.cache.map(po => po.id + ':' + po.deny.bitfield + ':' + po.allow.bitfield).sort())
        !== JSON.stringify(newChannel.permissionOverwrites.cache.map(po => po.id + ':' + po.deny.bitfield + ':' + po.allow.bitfield).sort())) {
      changes.push({
        name: 'Permission Overwrites Changed',
        value: 'Channel permissions were changed.'
      });
    }

    if (changes.length === 0) {
      console.log('[DEBUG] No relevant changes to log.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xf0ad4e)
      .setTitle('Channel Updated')
      .addFields(...changes)
      .addFields({ name: 'Channel', value: `<#${newChannel.id}>`, inline: false })
      .setTimestamp();

    logChannel.send({ embeds: [embed] })
      .then(() => console.log('[DEBUG] Sent channel update log!'))
      .catch(err => console.error('[ERROR] Failed to send log:', err));
  });
};
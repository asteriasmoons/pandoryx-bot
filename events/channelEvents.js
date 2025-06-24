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
    console.log(`[DEBUG] ChannelCreate event fired! Name: ${channel.name}, ID: ${channel.id}, Type: ${getChannelTypeName(channel.type)}`);

    if (!channel.guild) {
      console.log('[DEBUG] ChannelCreate: No guild found, skipping.');
      return;
    }

    const config = await LogConfig.findOne({ guildId: channel.guild.id });
    if (!config) {
      console.log(`[DEBUG] ChannelCreate: No LogConfig for guild ${channel.guild.id}`);
      return;
    }
    if (!config.logs?.channelCreate) {
      console.log(`[DEBUG] ChannelCreate: Logging not enabled for channelCreate in guild ${channel.guild.id}`);
      return;
    }

    const logChannel = channel.guild.channels.cache.get(config.logs.channelCreate);
    if (!logChannel) {
      console.log(`[DEBUG] ChannelCreate: Log channel not found or not cached (${config.logs.channelCreate})`);
      return;
    }
    if (!logChannel.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) {
      console.log('[DEBUG] ChannelCreate: Bot cannot send messages in log channel.');
      return;
    }

    // Thread details
    let embed = new EmbedBuilder()
      .setColor(0x5d47a0)
      .setTimestamp();

    if (channel.isThread && channel.isThread()) {
      console.log('[DEBUG] ChannelCreate: This is a thread!');
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

    logChannel.send({ embeds: [embed] })
      .then(() => console.log('[DEBUG] ChannelCreate: Log sent successfully!'))
      .catch(err => console.error('[ERROR] ChannelCreate: Failed to send log:', err));
  });

  // Channel Deleted (includes threads)
  client.on(Events.ChannelDelete, async (channel) => {
    console.log(`[DEBUG] ChannelDelete event fired! Name: ${channel.name}, ID: ${channel.id}, Type: ${getChannelTypeName(channel.type)}`);

    if (!channel.guild) {
      console.log('[DEBUG] ChannelDelete: No guild found, skipping.');
      return;
    }

    const config = await LogConfig.findOne({ guildId: channel.guild.id });
    if (!config) {
      console.log(`[DEBUG] ChannelDelete: No LogConfig for guild ${channel.guild.id}`);
      return;
    }
    if (!config.logs?.channelDelete) {
      console.log(`[DEBUG] ChannelDelete: Logging not enabled for channelDelete in guild ${channel.guild.id}`);
      return;
    }

    const logChannel = channel.guild.channels.cache.get(config.logs.channelDelete);
    if (!logChannel) {
      console.log(`[DEBUG] ChannelDelete: Log channel not found or not cached (${config.logs.channelDelete})`);
      return;
    }
    if (!logChannel.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) {
      console.log('[DEBUG] ChannelDelete: Bot cannot send messages in log channel.');
      return;
    }

    let embed = new EmbedBuilder()
      .setColor(0x5d47a0)
      .setTimestamp();

    if (channel.isThread && channel.isThread()) {
      console.log('[DEBUG] ChannelDelete: This is a thread!');
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

    logChannel.send({ embeds: [embed] })
      .then(() => console.log('[DEBUG] ChannelDelete: Log sent successfully!'))
      .catch(err => console.error('[ERROR] ChannelDelete: Failed to send log:', err));
  });

  // Channel Updated (supports permission changes & name/topic/etc)
  client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    console.log(`[DEBUG] ChannelUpdate event fired! Old Name: ${oldChannel.name}, New Name: ${newChannel.name}, ID: ${newChannel.id}, Type: ${getChannelTypeName(newChannel.type)}`);

    if (!newChannel.guild) {
      console.log('[DEBUG] ChannelUpdate: No guild on newChannel');
      return;
    }

    const config = await LogConfig.findOne({ guildId: newChannel.guild.id });
    if (!config) {
      console.log('[DEBUG] ChannelUpdate: No LogConfig for guild:', newChannel.guild.id);
      return;
    }
    if (!config.logs?.channelUpdate) {
      console.log('[DEBUG] ChannelUpdate: No channelUpdate log config for guild:', newChannel.guild.id);
      return;
    }

    const logChannel = newChannel.guild.channels.cache.get(config.logs.channelUpdate);
    if (!logChannel) {
      console.log('[DEBUG] ChannelUpdate: Log channel not found or not cached:', config.logs.channelUpdate);
      return;
    }
    if (!logChannel.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) {
      console.log('[DEBUG] ChannelUpdate: No send permissions for log channel');
      return;
    }

    // Only log if relevant changes
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
      if (JSON.stringify(oldChannel.permissionOverwrites.cache.map(po => [po.id, po.allow.bitfield, po.deny.bitfield]))
        !== JSON.stringify(newChannel.permissionOverwrites.cache.map(po => [po.id, po.allow.bitfield, po.deny.bitfield]))) {
        changes.push({
          name: 'Permissions Changed',
          value: `Channel permissions were updated.`,
        });
      }
    }

    if (changes.length === 0) {
      console.log('[DEBUG] ChannelUpdate: No relevant changes to log.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5d47a0)
      .setTitle(newChannel.isThread && newChannel.isThread() ? 'Thread Updated' : 'Channel Updated')
      .addFields(...changes)
      .addFields({ name: 'Channel', value: `<#${newChannel.id}>`, inline: false })
      .setTimestamp();

    logChannel.send({ embeds: [embed] })
      .then(() => console.log('[DEBUG] ChannelUpdate: Log sent successfully!'))
      .catch(err => console.error('[ERROR] ChannelUpdate: Failed to send log:', err));
  });
};
const { EmbedBuilder, ChannelType, Events, PermissionsBitField } = require('discord.js');
const LogConfig = require('../models/LogConfig');

console.log('[DEBUG] channelEvents.js loaded!');

const THREAD_TYPES = [
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.AnnouncementThread
];

// Helper: Friendly names for each channel type
function channelTypeToString(type) {
  switch (type) {
    case ChannelType.GuildText: return 'Text';
    case ChannelType.GuildVoice: return 'Voice';
    case ChannelType.GuildCategory: return 'Category';
    case ChannelType.GuildAnnouncement: return 'Announcement/News';
    case ChannelType.AnnouncementThread: return 'Announcement Thread';
    case ChannelType.PublicThread: return 'Public Thread';
    case ChannelType.PrivateThread: return 'Private Thread';
    case ChannelType.GuildStageVoice: return 'Stage';
    case ChannelType.GuildDirectory: return 'Directory';
    case ChannelType.GuildForum: return 'Forum';
    default: return 'Unknown';
  }
}

module.exports = (client) => {
  // Channel Created
  client.on(Events.ChannelCreate, async (channel) => {
    console.log('[DEBUG] ChannelCreate event fired!', channel.name, channel.id, 'Type:', channel.type);

    if (!channel.guild) return;
    const config = await LogConfig.findOne({ guildId: channel.guild.id });
    if (!config?.logs?.channelCreate) return;
    const logChannel = channel.guild.channels.cache.get(config.logs.channelCreate);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    const typeLabel = channelTypeToString(channel.type);
    const baseFields = [
      { name: 'Name', value: `${channel.name ?? '(no name)'}`, inline: true },
      { name: 'ID', value: `${channel.id}`, inline: true },
      { name: 'Type', value: typeLabel, inline: true }
    ];

    // Thread
    if (THREAD_TYPES.includes(channel.type)) {
      baseFields.push({ name: 'Parent Channel', value: channel.parentId ? `<#${channel.parentId}>` : 'Unknown', inline: false });
      if (channel.ownerId) baseFields.push({ name: 'Owner', value: `<@${channel.ownerId}>`, inline: true });
    }

    // Forum
    if (channel.type === ChannelType.GuildForum) {
      baseFields.push({ name: 'Forum Guidelines', value: channel.topic || 'None', inline: false });
    }

    // Voice/Stage
    if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
      baseFields.push({ name: 'Bitrate', value: String(channel.bitrate), inline: true });
      baseFields.push({ name: 'User Limit', value: String(channel.userLimit || 'None'), inline: true });
    }

    // Category
    if (channel.type === ChannelType.GuildCategory) {
      baseFields.push({ name: 'Children', value: `${channel.children?.cache.size ?? 0}`, inline: true });
    }

    // Directory (rare)
    if (channel.type === ChannelType.GuildDirectory) {
      baseFields.push({ name: 'Directory', value: 'Yes', inline: true });
    }

    // News/Announcement
    if (channel.type === ChannelType.GuildAnnouncement) {
      baseFields.push({ name: 'Announcement Channel', value: 'Yes', inline: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x12cdea)
      .setTitle(`${typeLabel} Channel Created`)
      .addFields(baseFields)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
    console.log('[DEBUG] Channel creation log sent for type:', typeLabel);
  });

  // Channel Deleted
  client.on(Events.ChannelDelete, async (channel) => {
    console.log('[DEBUG] ChannelDelete event fired!', channel.name, channel.id, 'Type:', channel.type);

    if (!channel.guild) return;
    const config = await LogConfig.findOne({ guildId: channel.guild.id });
    if (!config?.logs?.channelDelete) return;
    const logChannel = channel.guild.channels.cache.get(config.logs.channelDelete);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    const typeLabel = channelTypeToString(channel.type);
    const baseFields = [
      { name: 'Name', value: `${channel.name ?? '(no name)'}`, inline: true },
      { name: 'ID', value: `${channel.id}`, inline: true },
      { name: 'Type', value: typeLabel, inline: true }
    ];

    if (THREAD_TYPES.includes(channel.type)) {
      baseFields.push({ name: 'Parent Channel', value: channel.parentId ? `<#${channel.parentId}>` : 'Unknown', inline: false });
      if (channel.ownerId) baseFields.push({ name: 'Owner', value: `<@${channel.ownerId}>`, inline: true });
    }
    if (channel.type === ChannelType.GuildForum) {
      baseFields.push({ name: 'Forum Guidelines', value: channel.topic || 'None', inline: false });
    }
    if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
      baseFields.push({ name: 'Bitrate', value: String(channel.bitrate), inline: true });
      baseFields.push({ name: 'User Limit', value: String(channel.userLimit || 'None'), inline: true });
    }
    if (channel.type === ChannelType.GuildCategory) {
      baseFields.push({ name: 'Children', value: `${channel.children?.cache.size ?? 0}`, inline: true });
    }
    if (channel.type === ChannelType.GuildDirectory) {
      baseFields.push({ name: 'Directory', value: 'Yes', inline: true });
    }
    if (channel.type === ChannelType.GuildAnnouncement) {
      baseFields.push({ name: 'Announcement Channel', value: 'Yes', inline: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle(`${typeLabel} Channel Deleted`)
      .addFields(baseFields)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
    console.log('[DEBUG] Channel deletion log sent for type:', typeLabel);
  });

  // Channel Updated (supports all types, including threads & permission changes)
  client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    console.log('[DEBUG] ChannelUpdate event fired!', oldChannel.name, '->', newChannel.name, newChannel.id, 'Type:', newChannel.type);

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

    const typeLabel = channelTypeToString(newChannel.type);
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
    if ('nsfw' in oldChannel && oldChannel.nsfw !== newChannel.nsfw) {
      changes.push({
        name: 'NSFW Changed',
        value: `**Before:** ${oldChannel.nsfw ? 'Yes' : 'No'}\n**After:** ${newChannel.nsfw ? 'Yes' : 'No'}`
      });
    }
    if ('rateLimitPerUser' in oldChannel && oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
      changes.push({
        name: 'Slowmode Changed',
        value: `**Before:** ${oldChannel.rateLimitPerUser || 'None'}\n**After:** ${newChannel.rateLimitPerUser || 'None'}`
      });
    }
    // Thread specific
    if (THREAD_TYPES.includes(oldChannel.type) && THREAD_TYPES.includes(newChannel.type)) {
      if (oldChannel.archived !== newChannel.archived) {
        changes.push({
          name: 'Thread Archived',
          value: newChannel.archived ? 'Thread was archived.' : 'Thread was unarchived.'
        });
      }
      if (oldChannel.locked !== newChannel.locked) {
        changes.push({
          name: 'Thread Locked',
          value: newChannel.locked ? 'Thread was locked.' : 'Thread was unlocked.'
        });
      }
    }
    // Permission Overwrites
    if (JSON.stringify(oldChannel.permissionOverwrites.cache.map(po => po.id + ':' + po.deny.bitfield + ':' + po.allow.bitfield).sort())
      !== JSON.stringify(newChannel.permissionOverwrites.cache.map(po => po.id + ':' + po.deny.bitfield + ':' + po.allow.bitfield).sort())) {
      changes.push({
        name: 'Permission Overwrites Changed',
        value: 'Channel permissions were changed.'
      });
    }

    // Voice/Stage property changes
    if (oldChannel.type === ChannelType.GuildVoice && newChannel.type === ChannelType.GuildVoice) {
      if (oldChannel.bitrate !== newChannel.bitrate) {
        changes.push({
          name: 'Bitrate Changed',
          value: `**Before:** ${oldChannel.bitrate}\n**After:** ${newChannel.bitrate}`
        });
      }
      if (oldChannel.userLimit !== newChannel.userLimit) {
        changes.push({
          name: 'User Limit Changed',
          value: `**Before:** ${oldChannel.userLimit}\n**After:** ${newChannel.userLimit}`
        });
      }
    }

    if (changes.length === 0) {
      console.log('[DEBUG] No relevant changes to log.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xf0ad4e)
      .setTitle(`${typeLabel} Channel Updated`)
      .addFields(...changes)
      .addFields({ name: 'Channel', value: `<#${newChannel.id}>`, inline: false })
      .setTimestamp();

    logChannel.send({ embeds: [embed] })
      .then(() => console.log('[DEBUG] Sent channel update log for type:', typeLabel))
      .catch(err => console.error('[ERROR] Failed to send log:', err));
  });
};
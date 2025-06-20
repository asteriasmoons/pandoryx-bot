const { EmbedBuilder, ChannelType, Events, PermissionsBitField } = require('discord.js');
const LogConfig = require('../models/LogConfig'); // Adjust path if needed

console.log('[DEBUG] channelEvents.js loaded!');

module.exports = (client) => {
  // Channel Created
  client.on(Events.ChannelCreate, async (channel) => {
   console.log('[DEBUG] ChannelCreate event fired!', channel.name, channel.id);
    if (!channel.guild) return;

    const config = await LogConfig.findOne({ guildId: channel.guild.id });
    if (!config?.logs?.channelCreate) return;

    const logChannel = channel.guild.channels.cache.get(config.logs.channelCreate);
    if (!logChannel || !logChannel.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('📁 Channel Created')
      .addFields(
        { name: 'Name', value: `${channel.name}`, inline: true },
        { name: 'ID', value: `${channel.id}`, inline: true },
        { name: 'Type', value: `${channel.type}`, inline: true }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Channel Deleted
  client.on(Events.ChannelDelete, async (channel) => {
    if (!channel.guild) return;

    const config = await LogConfig.findOne({ guildId: channel.guild.id });
    if (!config?.logs?.channelDelete) return;

    const logChannel = channel.guild.channels.cache.get(config.logs.channelDelete);
    if (!logChannel || !logChannel.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('🗑️ Channel Deleted')
      .addFields(
        { name: 'Name', value: `${channel.name}`, inline: true },
        { name: 'ID', value: `${channel.id}`, inline: true },
        { name: 'Type', value: `${channel.type}`, inline: true }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Channel Updated
  client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
  console.log('[DEBUG] ChannelUpdate event fired!', oldChannel.name, '->', newChannel.name, newChannel.id);

  if (!newChannel.guild) {
    console.log('[DEBUG] No guild on newChannel');
    return;
  }

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

  if (changes.length === 0) {
    console.log('[DEBUG] No relevant changes to log.');
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle('✏️ Channel Updated')
    .addFields(...changes)
    .addFields({ name: 'Channel', value: `<#${newChannel.id}>`, inline: false })
    .setTimestamp();

  logChannel.send({ embeds: [embed] })
    .then(() => console.log('[DEBUG] Sent channel update log!'))
    .catch(err => console.error('[ERROR] Failed to send log:', err));
});
};
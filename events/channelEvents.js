const { EmbedBuilder, ChannelType, Events, PermissionsBitField } = require('discord.js');
const LogConfig = require('../models/LogConfig'); // Adjust path if needed

console.log('[DEBUG] channelEvents.js loaded!');

module.exports = (client) => {
  // Channel (or thread) Created
  client.on(Events.ChannelCreate, async (channel) => {
    console.log('[DEBUG] ChannelCreate event fired!', channel.name, channel.id);
    if (!channel.guild) return;

    const config = await LogConfig.findOne({ guildId: channel.guild.id });
    if (!config?.logs?.channelCreate) return;

    const logChannel = channel.guild.channels.cache.get(config.logs.channelCreate);
    if (!logChannel || !logChannel.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    const isThread = [
      ChannelType.PublicThread,
      ChannelType.PrivateThread,
      ChannelType.AnnouncementThread
    ].includes(channel.type);

    const parent = isThread && channel.parent ? `<#${channel.parent.id}>` : null;

    const embed = new EmbedBuilder()
      .setColor(0x12cdea)
      .setTitle(isThread ? 'Thread Created' : 'Channel Created')
      .addFields(
        { name: 'Name', value: `${channel.name}`, inline: true },
        { name: 'ID', value: `${channel.id}`, inline: true },
        { name: 'Type', value: `${ChannelType[channel.type] || channel.type}`, inline: true },
        ...(isThread ? [{ name: 'Parent Channel', value: parent || 'Unknown', inline: true }] : [])
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Channel (or thread) Deleted
  client.on(Events.ChannelDelete, async (channel) => {
    if (!channel.guild) return;

    const config = await LogConfig.findOne({ guildId: channel.guild.id });
    if (!config?.logs?.channelDelete) return;

    const logChannel = channel.guild.channels.cache.get(config.logs.channelDelete);
    if (!logChannel || !logChannel.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    const isThread = [
      ChannelType.PublicThread,
      ChannelType.PrivateThread,
      ChannelType.AnnouncementThread
    ].includes(channel.type);

    const parent = isThread && channel.parent ? `<#${channel.parent.id}>` : null;

    const embed = new EmbedBuilder()
      .setColor(0x12cdea)
      .setTitle(isThread ? 'Thread Deleted' : 'Channel Deleted')
      .addFields(
        { name: 'Name', value: `${channel.name}`, inline: true },
        { name: 'ID', value: `${channel.id}`, inline: true },
        { name: 'Type', value: `${ChannelType[channel.type] || channel.type}`, inline: true },
        ...(isThread ? [{ name: 'Parent Channel', value: parent || 'Unknown', inline: true }] : [])
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Channel Updated (name, topic, permissions, etc)
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

    // Name change
    if (oldChannel.name !== newChannel.name) {
      changes.push({
        name: 'Name Changed',
        value: `**Before:** ${oldChannel.name}\n**After:** ${newChannel.name}`,
      });
    }

    // Topic change (for text channels)
    if ('topic' in oldChannel && oldChannel.topic !== newChannel.topic) {
      changes.push({
        name: 'Topic Changed',
        value: `**Before:** ${oldChannel.topic || 'None'}\n**After:** ${newChannel.topic || 'None'}`,
      });
    }

    // Permission changes (compare overwrites)
    const oldPerms = oldChannel.permissionOverwrites.cache;
    const newPerms = newChannel.permissionOverwrites.cache;

    // Check for added/removed overwrites
    const allIds = new Set([
      ...oldPerms.map(po => po.id),
      ...newPerms.map(po => po.id)
    ]);
    for (const id of allIds) {
      const oldOvr = oldPerms.get(id);
      const newOvr = newPerms.get(id);

      if (!oldOvr && newOvr) {
        // New overwrite added
        changes.push({
          name: 'Permission Overwrite Added',
          value: `<@&${id}> (Role/User) - ${JSON.stringify(newOvr.allow.toArray())} allowed, ${JSON.stringify(newOvr.deny.toArray())} denied`
        });
      } else if (oldOvr && !newOvr) {
        // Overwrite removed
        changes.push({
          name: 'Permission Overwrite Removed',
          value: `<@&${id}> (Role/User)`
        });
      } else if (oldOvr && newOvr && (
        oldOvr.allow.bitfield !== newOvr.allow.bitfield ||
        oldOvr.deny.bitfield !== newOvr.deny.bitfield
      )) {
        // Overwrite changed
        const beforeAllowed = oldOvr.allow.toArray().join(', ') || 'None';
        const afterAllowed = newOvr.allow.toArray().join(', ') || 'None';
        const beforeDenied = oldOvr.deny.toArray().join(', ') || 'None';
        const afterDenied = newOvr.deny.toArray().join(', ') || 'None';
        changes.push({
          name: 'Permission Overwrite Changed',
          value:
            `<@&${id}> (Role/User)\n` +
            `Allowed: **Before:** ${beforeAllowed} | **After:** ${afterAllowed}\n` +
            `Denied: **Before:** ${beforeDenied} | **After:** ${afterDenied}`
        });
      }
    }

    if (changes.length === 0) {
      console.log('[DEBUG] No relevant changes to log.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x12cdea)
      .setTitle('Channel Updated')
      .addFields(...changes)
      .addFields({ name: 'Channel', value: `<#${newChannel.id}>`, inline: false })
      .setTimestamp();

    logChannel.send({ embeds: [embed] })
      .then(() => console.log('[DEBUG] Sent channel update log!'))
      .catch(err => console.error('[ERROR] Failed to send log:', err));
  });
};
const { EmbedBuilder, Events, PermissionsBitField, ChannelType } = require('discord.js');
const LogConfig = require('../models/LogConfig');

console.log('[DEBUG] messageEvent.js loaded!');

// Utility to add thread info if message is in a thread
function formatThreadInfo(message) {
  // Discord.js v14: .isThread() is a function, but ChannelType can be used directly
  if (message.channel && [
    ChannelType.PublicThread,
    ChannelType.PrivateThread,
    ChannelType.AnnouncementThread
  ].includes(message.channel.type)) {
    const thread = message.channel;
    return `\n**Thread:** ${thread.name} (<#${thread.id}>)\n**Parent Channel:** <#${thread.parentId}>`;
  }
  return '';
}

// Utility to preview up to 3 attachments
function previewAttachments(message) {
  if (!message.attachments || !message.attachments.size) return '';
  return (
    '\n**Attachments:**\n' +
    [...message.attachments.values()].slice(0, 3).map(a => a.url).join('\n')
  );
}

module.exports = (client) => {
  // Message Deleted
  client.on(Events.MessageDelete, async (message) => {
    console.log('[DEBUG] MessageDelete event fired!', message.id, message.channel?.id);

    if (!message.guild || (!message.content && !message.attachments?.size)) {
      console.log('[DEBUG] MessageDelete: Skipping (no guild/content/attachment)');
      return;
    }

    const config = await LogConfig.findOne({ guildId: message.guild.id });
    if (!config?.logs?.messageDelete) {
      console.log('[DEBUG] MessageDelete: No log channel configured.');
      return;
    }

    const logChannel = message.guild.channels.cache.get(config.logs.messageDelete);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) {
      console.log('[DEBUG] MessageDelete: Cannot send to log channel.');
      return;
    }

    let description = `**Author:** ${message.author?.tag || 'Unknown'} (${message.author?.id || 'N/A'})\n` +
                      `**Channel:** <#${message.channel.id}>` +
                      formatThreadInfo(message);

    if (message.content) description += `\n**Content:**\n${message.content}`;
    description += previewAttachments(message);

    const embed = new EmbedBuilder()
      .setTitle('Message Deleted')
      .setColor(0xff34cd)
      .setDescription(description)
      .setTimestamp();

    logChannel.send({ embeds: [embed] })
      .then(() => console.log('[DEBUG] MessageDelete: Log sent.'))
      .catch(err => console.error('[ERROR] MessageDelete: Failed to send log.', err));
  });

  // Message Edited
  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    console.log('[DEBUG] MessageUpdate event fired!', oldMessage.id, oldMessage.channel?.id);

    // If uncached: oldMessage.content may be null. Still try to log if possible!
    if (!oldMessage.guild || !newMessage.content) {
      console.log('[DEBUG] MessageUpdate: Skipping (no guild or new content)');
      return;
    }
    if (oldMessage.content === newMessage.content) {
      console.log('[DEBUG] MessageUpdate: No content changed');
      return;
    }

    const config = await LogConfig.findOne({ guildId: oldMessage.guild.id });
    if (!config?.logs?.messageEdit) {
      console.log('[DEBUG] MessageUpdate: No log channel configured.');
      return;
    }

    const logChannel = newMessage.guild.channels.cache.get(config.logs.messageEdit);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) {
      console.log('[DEBUG] MessageUpdate: Cannot send to log channel.');
      return;
    }

    let description = `**Author:** ${newMessage.author?.tag || 'Unknown'} (${newMessage.author?.id || 'N/A'})\n` +
                      `**Channel:** <#${newMessage.channel.id}>` +
                      formatThreadInfo(newMessage);

    const embed = new EmbedBuilder()
      .setTitle('Message Edited')
      .setColor(0xff34cd)
      .setDescription(description)
      .addFields(
        { name: 'Before', value: oldMessage.content?.slice(0, 1024) || '*No content*' },
        { name: 'After', value: newMessage.content?.slice(0, 1024) || '*No content*' }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] })
      .then(() => console.log('[DEBUG] MessageUpdate: Log sent.'))
      .catch(err => console.error('[ERROR] MessageUpdate: Failed to send log.', err));
  });

  // Bulk Delete
  client.on(Events.MessageBulkDelete, async (messages) => {
    console.log('[DEBUG] MessageBulkDelete event fired!');
    const first = messages.first();
    if (!first?.guild) {
      console.log('[DEBUG] MessageBulkDelete: No guild in first message.');
      return;
    }

    const config = await LogConfig.findOne({ guildId: first.guild.id });
    if (!config?.logs?.bulkDelete) {
      console.log('[DEBUG] MessageBulkDelete: No log channel configured.');
      return;
    }

    const logChannel = first.guild.channels.cache.get(config.logs.bulkDelete);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) {
      console.log('[DEBUG] MessageBulkDelete: Cannot send to log channel.');
      return;
    }

    const threadInfo = formatThreadInfo(first);
    const contentPreview = [...messages.values()].slice(0, 10).map(m =>
      `${m.author?.tag ?? 'Unknown'}: ${m.content ?? '[No content]'}`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('Bulk Message Delete')
      .setColor(0xff34cd)
      .setDescription(`**Messages Deleted:** ${messages.size}\n` +
                      `**Channel:** <#${first.channel.id}>${threadInfo}\n\n` +
                      `**Sample:**\n\`\`\`\n${contentPreview}\n\`\`\``)
      .setTimestamp();

    logChannel.send({ embeds: [embed] })
      .then(() => console.log('[DEBUG] MessageBulkDelete: Log sent.'))
      .catch(err => console.error('[ERROR] MessageBulkDelete: Failed to send log.', err));
  });
};
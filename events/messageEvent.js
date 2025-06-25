const { EmbedBuilder, Events, PermissionsBitField } = require('discord.js');
const LogConfig = require('../models/LogConfig');

console.log('[DEBUG] messageEvent.js loaded!');

module.exports = (client) => {
  // Message Deleted
  client.on(Events.MessageDelete, async (message) => {
  console.log('[DEBUG] MessageDelete event fired!');
  if (!message.guild) return;

  const config = await LogConfig.findOne({ guildId: message.guild.id });
  if (!config?.logs?.messageDelete) return;

  const logChannel = message.guild.channels.cache.get(config.logs.messageDelete);
  if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

  let description = '';

  if (message.content) {
    description += `**Content:**\n${message.content}\n`;
  }

  // Check for embeds
  if (message.embeds.length > 0) {
    description += `**Embeds:**\n${message.embeds.map((embed, i) => `\`[Embed ${i + 1}] ${embed.title || 'No Title'} - ${embed.description || 'No Description'}\``).join('\n')}\n`;
  }

  // Check for attachments
  if (message.attachments.size > 0) {
    description += `**Attachments:**\n${message.attachments.map(att => att.url).join('\n')}\n`;
  }

  if (!description) description = '*No Content, Embeds, or Attachments.*';

  const embed = new EmbedBuilder()
    .setTitle('Message Deleted')
    .setColor(0xff34cd)
    .setDescription(
      `**Author:** ${message.author?.tag} (${message.author?.id})\n` +
      `**Channel:** <#${message.channel.id}>\n` +
      description
    )
    .setTimestamp();

  logChannel.send({ embeds: [embed] }).catch(() => {});
});

  // Message Edited
  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    console.log('[DEBUG] MessageUpdate event fired!');

    if (!oldMessage.guild || !oldMessage.content || !newMessage.content) return;
    if (oldMessage.content === newMessage.content) return;

    const config = await LogConfig.findOne({ guildId: oldMessage.guild.id });
    if (!config?.logs?.messageEdit) return;

    const logChannel = oldMessage.guild.channels.cache.get(config.logs.messageEdit);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    const embed = new EmbedBuilder()
      .setTitle('Message Edited')
      .setColor(0xff34cd)
      .setDescription(`**Author:** ${newMessage.author?.tag} (${newMessage.author?.id})\n**Channel:** <#${newMessage.channel.id}>`)
      .addFields(
        { name: 'Before', value: oldMessage.content.slice(0, 1024) || '*No content*' },
        { name: 'After', value: newMessage.content.slice(0, 1024) || '*No content*' }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // Bulk Delete
  client.on(Events.MessageBulkDelete, async (messages) => {
    console.log('[DEBUG] MessageBulkDelete event fired!');

    const first = messages.first();
    if (!first?.guild) return;

    const config = await LogConfig.findOne({ guildId: first.guild.id });
    if (!config?.logs?.bulkDelete) return;

    const logChannel = first.guild.channels.cache.get(config.logs.bulkDelete);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    const contentPreview = [...messages.values()].slice(0, 10).map(m =>
      `${m.author?.tag ?? 'Unknown'}: ${m.content ?? '[No content]'}`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('Bulk Message Delete')
      .setColor(0xff34cd)
      .setDescription(`**Messages Deleted:** ${messages.size}\n**Channel:** <#${first.channel.id}>\n\n**Sample:**\n\`\`\`\n${contentPreview}\n\`\`\``)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(console.error);
  });
};
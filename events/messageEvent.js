const { EmbedBuilder } = require('discord.js');
const { getLogChannel } = require('../utils/logging');

module.exports = (client) => {

  // Message Deleted
  client.on('messageDelete', async (message) => {
    if (!message.guild || !message.content) return;

    const logChannelId = await getLogChannel(message.guild.id, 'messageDelete');
    if (!logChannelId) return;

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Message Deleted')
      .setColor(0xFF5555)
      .setDescription(`**Author:** ${message.author.tag} (${message.author.id})\n` +
                      `**Channel:** <#${message.channel.id}>\n` +
                      `**Content:**\n${message.content}`)
      .setTimestamp();

    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (logChannel) logChannel.send({ embeds: [embed] });
  });

  // Message Edited
  client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || !oldMessage.content || !newMessage.content) return;
    if (oldMessage.content === newMessage.content) return;

    const logChannelId = await getLogChannel(oldMessage.guild.id, 'messageEdit');
    if (!logChannelId) return;

    const embed = new EmbedBuilder()
      .setTitle('✏️ Message Edited')
      .setColor(0x00B0F4)
      .setDescription(`**Author:** ${newMessage.author.tag} (${newMessage.author.id})\n` +
                      `**Channel:** <#${newMessage.channel.id}>`)
      .addFields(
        { name: 'Before', value: oldMessage.content.slice(0, 1024) || '*No content*' },
        { name: 'After', value: newMessage.content.slice(0, 1024) || '*No content*' }
      )
      .setTimestamp();

    const logChannel = newMessage.guild.channels.cache.get(logChannelId);
    if (logChannel) logChannel.send({ embeds: [embed] });
  });

  // Bulk Delete
  client.on('messageDeleteBulk', async (messages) => {
    const first = messages.first();
    if (!first?.guild) return;

    const logChannelId = await getLogChannel(first.guild.id, 'bulkDelete');
    if (!logChannelId) return;

    const contentPreview = [...messages.values()].slice(0, 10).map(m =>
      `${m.author?.tag ?? 'Unknown'}: ${m.content ?? '[No content]'}`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🧹 Bulk Message Delete')
      .setColor(0xFF9900)
      .setDescription(`**Messages Deleted:** ${messages.size}\n` +
                      `**Channel:** <#${first.channel.id}>\n\n` +
                      `**Sample:**\n\`\`\`\n${contentPreview}\n\`\`\``)
      .setTimestamp();

    const logChannel = first.guild.channels.cache.get(logChannelId);
    if (logChannel) logChannel.send({ embeds: [embed] });
  });
};
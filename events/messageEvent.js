const { EmbedBuilder, Events, PermissionsBitField, ChannelType } = require('discord.js');
const LogConfig = require('../models/LogConfig');

console.log('[DEBUG] messageEvent.js loaded!');

module.exports = (client) => {
  // Helper to get type name
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

  // Thread Created (via Message)
  client.on(Events.MessageCreate, async (message) => {
    // Check for new thread (forum posts use MessageCreate!)
    if (message.channel && message.channel.isThread() && message.type === 21) {
      // 21 = THREAD_CREATED (new post in forum)
      console.log('[DEBUG] Thread created via message:', message.channel.name, message.channel.id);

      const config = await LogConfig.findOne({ guildId: message.guild.id });
      if (!config?.logs?.channelCreate) return;

      const logChannel = message.guild.channels.cache.get(config.logs.channelCreate);
      if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

      const parent = message.channel.parent ? `<#${message.channel.parentId}>` : 'Unknown';
      const typeLabel = channelTypeToString(message.channel.type);

      const embed = new EmbedBuilder()
        .setColor(0x12cdea)
        .setTitle(`${typeLabel} Created`)
        .addFields(
          { name: 'Name', value: message.channel.name, inline: true },
          { name: 'ID', value: message.channel.id, inline: true },
          { name: 'Parent Channel', value: parent, inline: false },
          { name: 'Type', value: typeLabel, inline: true },
          { name: 'Owner', value: message.author ? `<@${message.author.id}>` : 'Unknown', inline: true }
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  });

  // Message Deleted (includes threads deleted with first message deletion)
  client.on(Events.MessageDelete, async (message) => {
    console.log('[DEBUG] MessageDelete event fired!');
    if (!message.guild) return;

    const config = await LogConfig.findOne({ guildId: message.guild.id });
    if (!config?.logs?.messageDelete) return;

    const logChannel = message.guild.channels.cache.get(config.logs.messageDelete);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    // Detect if this is a thread that was deleted (happens when the starter message is deleted)
    if (message.channel && message.channel.isThread() && message.type === 21) {
      // 21 = THREAD_CREATED
      const parent = message.channel.parent ? `<#${message.channel.parentId}>` : 'Unknown';
      const typeLabel = channelTypeToString(message.channel.type);

      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle(`${typeLabel} Deleted`)
        .addFields(
          { name: 'Name', value: message.channel.name, inline: true },
          { name: 'ID', value: message.channel.id, inline: true },
          { name: 'Parent Channel', value: parent, inline: false },
          { name: 'Type', value: typeLabel, inline: true }
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(() => {});
      return;
    }

    // Standard message delete
    if (!message.content) return;
    const embed = new EmbedBuilder()
      .setTitle('Message Deleted')
      .setColor(0xff34cd)
      .setDescription(`**Author:** ${message.author?.tag} (${message.author?.id})\n` +
                      `**Channel:** <#${message.channel.id}>\n` +
                      `**Content:**\n${message.content}`)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // Message Edited (also can be used for forum/thread posts!)
  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    console.log('[DEBUG] MessageUpdate event fired!');
    if (!oldMessage.guild) return;

    const config = await LogConfig.findOne({ guildId: oldMessage.guild.id });
    if (!config?.logs?.messageEdit) return;

    const logChannel = newMessage.guild.channels.cache.get(config.logs.messageEdit);
    if (!logChannel?.permissionsFor(client.user)?.has(PermissionsBitField.Flags.SendMessages)) return;

    // Detect if a thread starter message was updated (e.g., forum thread renamed)
    if (newMessage.channel && newMessage.channel.isThread() && newMessage.type === 21) {
      const parent = newMessage.channel.parent ? `<#${newMessage.channel.parentId}>` : 'Unknown';
      const typeLabel = channelTypeToString(newMessage.channel.type);

      const embed = new EmbedBuilder()
        .setColor(0xf0ad4e)
        .setTitle(`${typeLabel} Edited`)
        .addFields(
          { name: 'Name', value: newMessage.channel.name, inline: true },
          { name: 'ID', value: newMessage.channel.id, inline: true },
          { name: 'Parent Channel', value: parent, inline: false },
          { name: 'Type', value: typeLabel, inline: true }
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(() => {});
      return;
    }

    // Standard message edit
    if (!oldMessage.content && !newMessage.content) return;
    if (oldMessage.content === newMessage.content) return;

    const embed = new EmbedBuilder()
      .setTitle('Message Edited')
      .setColor(0xff34cd)
      .setDescription(`**Author:** ${newMessage.author?.tag} (${newMessage.author?.id})\n` +
                      `**Channel:** <#${newMessage.channel.id}>`)
      .addFields(
        { name: 'Before', value: oldMessage.content?.slice(0, 1024) || '*No content*' },
        { name: 'After', value: newMessage.content?.slice(0, 1024) || '*No content*' }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
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
      .setDescription(`**Messages Deleted:** ${messages.size}\n` +
                      `**Channel:** <#${first.channel.id}>\n\n` +
                      `**Sample:**\n\`\`\`\n${contentPreview}\n\`\`\``)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });
};
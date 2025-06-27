// events/autoThread.js
const AutoThreadConfig = require('../models/AutoThreadConfig');
const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'messageCreate', // Your loader should listen for this!
  /**
   * This function will run on EVERY message.
   * It's modular and won't interfere with other messageCreate handlers.
   */
  async execute(message) {
    // ==== Guard clauses ====
    if (!message.guild) return; // Ignore DMs
    if (message.author.bot) return; // Ignore bots
    if (message.system) return; // Ignore system messages
    if (message.channel.type !== ChannelType.GuildText) return; // Only text channels

    // ==== Fetch config ====
    const config = await AutoThreadConfig.findOne({ guildId: message.guild.id });
    if (!config) return;

    const chanConfig = config.channels.find(c => c.channelId === message.channel.id);
    if (!chanConfig) return;

    // ==== Prepare thread name ====
    const snippet = message.content ? message.content.slice(0, 60) : '';
    let threadName = chanConfig.threadNameTemplate || 'Thread for {user}';
    threadName = threadName
      .replace('{user}', message.member?.displayName || message.author.username)
      .replace('{message}', snippet);

    // ==== Permissions check ====
    if (!message.channel.permissionsFor(message.guild.members.me)?.has(PermissionsBitField.Flags.CreatePublicThreads)) {
      // Optionally log this, or ignore
      return;
    }

    // ==== Create public thread ====
    let thread;
    try {
      thread = await message.startThread({
        name: threadName,
        autoArchiveDuration: 1440, // 24 hours
        type: ChannelType.PublicThread,
      });
    } catch (err) {
      console.error('Failed to create thread:', err);
      return;
    }

    // ==== Prepare the embed ====
    const embedData = chanConfig.embed || {};
    const embed = new EmbedBuilder()
      .setTitle(embedData.title || 'No Embed Configured')
      .setDescription(embedData.description || "This embed hasn't been configured yet.")
      .setColor(embedData.color || '#5865F2');

    try {
      await thread.send({ embeds: [embed] });
    } catch (err) {
      console.error('Failed to send embed in thread:', err);
    }
  }
};
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } = require('discord.js');
const AutoForumConfig = require('../models/AutoForumConfig');

module.exports = (client) => {
  client.on('threadCreate', async (thread, newlyCreated) => {
    if (!newlyCreated) return;
    if (thread.parent?.type !== ChannelType.GuildForum) return;

    const config = await AutoForumConfig.findOne({ forumId: thread.parentId });
    if (!config) return;

    // Thread owner (forum post author)
    const opId = thread.ownerId;

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(config.title || "Welcome!")
      .setDescription(config.description || "Start your discussion here.")
      .setColor(config.color || 0x5865F2);

    // Build button, put OP's ID in customId for permissions
    const button = new ButtonBuilder()
      .setCustomId(`autoforum-close-${opId}`)
      .setLabel(config.buttonLabel || "Mark as Resolved")
      .setStyle(ButtonStyle.Secondary);

    if (config.buttonEmoji) button.setEmoji(config.buttonEmoji);

    const row = new ActionRowBuilder().addComponents(button);

    await thread.send({ embeds: [embed], components: [row] });
  });
};
const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const TicketPanel = require('../models/TicketPanel');
const { sendTicketPanelEditor } = require('../utils/ticketPanelUi.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Create, edit, list, post, or delete ticket panels')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a new ticket panel')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Name to identify this panel')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete an existing panel')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Name of the panel to delete')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all existing ticket panels')
    )
    .addSubcommand(sub =>
      sub.setName('post')
        .setDescription('Post a configured ticket panel to its assigned channel')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Name of the panel to post')
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const name = interaction.options.getString('name')?.toLowerCase();

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: '🚫 You need **Manage Server** permission to use this command.',
        ephemeral: false
      });
    }

    if (sub === 'create') {
      const existing = await TicketPanel.findOne({ guildId, panelName: name });
      if (existing) {
        return interaction.reply({
          content: `🚫 A panel named \`${name}\` already exists.`,
          ephemeral: false
        });
      }

      const panel = await TicketPanel.create({
        guildId,
        creatorId: userId,
        panelName: name,
        transcriptsEnabled: true,
        emoji: '',
        greeting: 'Thank you for opening a ticket! A moderator will be with you shortly.',
        embed: {
          title: '',
          description: '',
          color: '#5865F2'
        }
      });

      return sendTicketPanelEditor(interaction, panel);
    }

    if (sub === 'delete') {
      const deleted = await TicketPanel.findOneAndDelete({ guildId, panelName: name });
      if (!deleted) {
        return interaction.reply({
          content: `🚫 No panel named \`${name}\` was found.`,
          ephemeral: false
        });
      }

      return interaction.reply({
        content: `✅ Panel \`${name}\` deleted.`,
        ephemeral: false
      });
    }

    if (sub === 'list') {
      const panels = await TicketPanel.find({ guildId });
      if (!panels.length) {
        return interaction.reply({
          content: '📭 No ticket panels found for this server.',
          ephemeral: false
        });
      }

      const panelList = panels.map(p => `• \`${p.panelName}\``).join('\n');

      return interaction.reply({
        content: `🎟️ **Ticket Panels:**\n${panelList}`,
        ephemeral: false
      });
    }

    if (sub === 'post') {
      const panel = await TicketPanel.findOne({ guildId, panelName: name });
      if (!panel) {
        return interaction.reply({
          content: `❌ No panel named \`${name}\` was found.`,
          ephemeral: false
        });
      }

      const channel = interaction.guild.channels.cache.get(panel.postChannelId);
      if (!channel || !channel.isTextBased()) {
        return interaction.reply({
          content: '❌ This panel has no valid post channel set. Use the select menu to assign one.',
          ephemeral: false
        });
      }

      const button = new ButtonBuilder()
        .setCustomId(`open_ticket_modal:${panel.panelName}`)
        .setLabel(panel.buttonLabel || 'Open Ticket')
        .setStyle(ButtonStyle.Primary);

      if (panel.emoji) button.setEmoji(panel.emoji);

      const row = new ActionRowBuilder().addComponents(button);

      const embed = new EmbedBuilder()
        .setTitle(panel.embed?.title || 'Need Help?')
        .setDescription(panel.embed?.description || 'Click the button below to open a ticket.')
        .setColor(panel.embed?.color || 0x5865F2);

      await channel.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        content: `✅ Ticket panel \`${name}\` has been posted to <#${channel.id}>.`,
        ephemeral: false
      });
    }
  }
};
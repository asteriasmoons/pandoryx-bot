const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');
const ConfessionConfig = require('../models/ConfessionConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('confessions')
    .setDescription('Manage the anonymous confession system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub
        .setName('setup')
        .setDescription('Configure the confession system')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel to send confession messages')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('title')
            .setDescription('Embed title (use {id} to include the confession number)')
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('send')
        .setDescription('Send the confession panel (embed and button)')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel to send the panel into')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // /confessions setup
    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');
      const rawTitle = interaction.options.getString('title');
      const title = rawTitle || '📢 Confession #{id}';

      if (!title.includes('{id}')) {
        return interaction.reply({
          content: '⚠️ Your title must include `{id}` so the confession number can be inserted.',
          ephemeral: true
        });
      }

      await ConfessionConfig.findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
          guildId: interaction.guild.id,
          confessionChannelId: channel.id,
          embedTitle: title
        },
        { upsert: true, new: true }
      );

      return interaction.reply({
        content: `✅ Confession system configured!\nChannel: <#${channel.id}>\nTitle: **${title}**`,
        ephemeral: true
      });
    }

    // /confessions send
    if (sub === 'send') {
      const panelChannel = interaction.options.getChannel('channel');

      const embed = new EmbedBuilder()
        .setTitle('📝 Anonymous Confessions')
        .setDescription('Click the button below to send a completely anonymous confession.\nYour identity will **not** be saved or shown.')
        .setColor(0x5865f2);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('confession_open_modal')
          .setLabel('Submit Confession')
          .setStyle(ButtonStyle.Secondary)
      );

      await panelChannel.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        content: `✅ Confession panel sent to <#${panelChannel.id}>.`,
        ephemeral: true
      });
    }
  }
};
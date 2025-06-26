const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const LogConfig = require('../models/LogConfig'); // adjust path if needed

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log')
    .setDescription('Configure or view logging')
    .addSubcommand(sub =>
      sub.setName('config')
        .setDescription('Configure event log destinations.')
    )
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View current logging channel settings.')
    )
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Disable ALL logging (removes all log channels).')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // === /log config ===
    if (sub === 'config') {
      const eventSelect = new StringSelectMenuBuilder()
        .setCustomId('selectLogEvent')
        .setPlaceholder('Select an event to configure')
        .addOptions([
          { label: 'Member Join', value: 'memberJoin' },
          { label: 'Member Leave', value: 'memberLeave' },
          { label: 'Message Deleted', value: 'messageDelete' },
          { label: 'Message Edited', value: 'messageEdit' },
          { label: 'Bulk Delete', value: 'bulkDelete' },
          { label: 'Nickname Changed', value: 'nicknameChange' },
          { label: 'Avatar Changed', value: 'avatarChange' },
          { label: 'Channel Created', value: 'channelCreate' },
          { label: 'Channel Updated', value: 'channelUpdate' },
          { label: 'Channel Deleted', value: 'channelDelete' },
          { label: 'Role Create', value: 'roleCreate' },
          { label: 'Role Updated', value: 'roleUpdate' },
          { label: 'Role Delete', value: 'roleDelete' },
          { label: 'Warn', value: 'warn' },
          { label: 'Timeout', value: 'timeout' },
          { label: 'Ban', value: 'ban' },
          { label: 'Kick', value: 'kick' }
        ]);
      const row = new ActionRowBuilder().addComponents(eventSelect);

      const selectEmbed = new EmbedBuilder()
      .setTitle('Logging Configuration')
      .setDescription('Select an event you want to assign a log channel for below.')
      .setColor(0x5865F2)
      .setFooter({ text: interaction.guild.name })
      .setTimestamp();

          await interaction.reply({
          embeds: [selectEmbed],
          components: [row],
          ephemeral: true
        });
    }

    // === /log view ===
    if (sub === 'view') {
      const config = await LogConfig.findOne({ guildId: interaction.guild.id });
      const embed = new EmbedBuilder()
        .setTitle('Logging Configuration')
        .setColor(0x5865F2)
        .setFooter({ text: interaction.guild.name })
        .setTimestamp();

      if (!config || !config.logs || Object.keys(config.logs).length === 0) {
        embed.setDescription('No logging channels have been configured yet. Use `/log config` to get started.');
      } else {
        const formatted = Object.entries(config.logs).map(([key, channelId]) => {
          const label = key
            .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → spaced
            .replace(/\b\w/g, l => l.toUpperCase()); // capitalize words
          return `• **${label}** → <#${channelId}>`;
        });
        embed.setDescription(formatted.join('\n'));
      }

      await interaction.reply({ embeds: [embed], ephemeral: false });
    }

    // === /log disable ===
    if (sub === 'disable') {
      const config = await LogConfig.findOne({ guildId: interaction.guild.id });

      if (!config || !config.logs || Object.keys(config.logs).length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Nothing to Disable')
              .setDescription('No logging channels are currently set up.')
              .setColor(0xed4245)
              .setFooter({ text: interaction.guild.name })
              .setTimestamp()
          ],
          ephemeral: true
        });
      }

      config.logs = {}; // Remove all log assignments
      await config.save();

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Logging Disabled')
            .setDescription('All logging channels have been cleared for this server.')
            .setColor(0xed4245)
            .setFooter({ text: interaction.guild.name })
            .setTimestamp()
        ],
        ephemeral: false
      });
    }
  }
};
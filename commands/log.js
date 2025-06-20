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
          { label: 'Channel Deleted', value: 'channelDelete' },
          { label: 'Role Updated', value: 'roleUpdate' },
          { label: 'Warn', value: 'warn' },
          { label: 'Timeout', value: 'timeout' },
          { label: 'Ban', value: 'ban' },
          { label: 'Kick', value: 'kick' }
        ]);

      const row = new ActionRowBuilder().addComponents(eventSelect);

      await interaction.reply({
        content: '🛠️ Select an event you want to assign a log channel for:',
        components: [row],
        ephemeral: true
      });
    }

    // === /log view ===
    if (sub === 'view') {
      const config = await LogConfig.findOne({ guildId: interaction.guild.id });

      const embed = new EmbedBuilder()
        .setTitle('📋 Logging Configuration')
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
  }
};
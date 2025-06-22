// commands/levelconfig.js

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');

const DEFAULT_THRESHOLDS = [0, 5, 10, 20, 40, 60, 80, 120, 180, 220];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelconfig')
    .setDescription('Configure leveling system for this server')
    .addSubcommand(sub =>
      sub.setName('set-thresholds')
        .setDescription('Set messages required per level')
        .addStringOption(opt =>
          opt.setName('thresholds')
            .setDescription('Space-separated message counts, e.g. 5 10 25 50')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('view-thresholds')
        .setDescription('View the current level thresholds')
    )
    .addSubcommand(sub =>
      sub.setName('reset-thresholds')
        .setDescription('Reset level thresholds to default')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'set-thresholds') {
      const input = interaction.options.getString('thresholds');
      const thresholds = input.split(/\s+/).map(Number).filter(x => !isNaN(x));
      if (thresholds.length === 0) {
        return interaction.reply({ content: 'Please provide valid numbers.', ephemeral: true });
      }
      await GuildConfig.findOneAndUpdate(
        { guildId },
        { $set: { levelThresholds: thresholds } },
        { upsert: true }
      );
      return interaction.reply({
        embeds: [{
          title: 'Level Thresholds Updated!',
          description: thresholds.map((v, i) => `Level ${i+1}: ${v} messages`).join('\n')
        }]
      });
    }

    if (sub === 'view-thresholds') {
      const config = await GuildConfig.findOne({ guildId });
      const thresholds = config?.levelThresholds || DEFAULT_THRESHOLDS;
      return interaction.reply({
        embeds: [{
          title: 'Current Level Thresholds',
          description: thresholds.map((v, i) => `Level ${i+1}: ${v} messages`).join('\n')
        }]
      });
    }

    if (sub === 'reset-thresholds') {
      await GuildConfig.findOneAndUpdate(
        { guildId },
        { $set: { levelThresholds: DEFAULT_THRESHOLDS } },
        { upsert: true }
      );
      return interaction.reply({
        embeds: [{
          title: 'Level Thresholds Reset!',
          description: DEFAULT_THRESHOLDS.map((v, i) => `Level ${i+1}: ${v} messages`).join('\n')
        }]
      });
    }
  }
};
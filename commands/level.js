// commands/level.js

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const UserLevel = require('../models/UserLevel');

const DEFAULT_THRESHOLDS = [0, 5, 10, 25, 50, 100, 200];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Leveling system commands')
    // PROFILE
    .addSubcommand(sub =>
      sub.setName('profile')
        .setDescription('Show a user\'s leveling profile')
        .addUserOption(opt =>
          opt.setName('user').setDescription('User to view').setRequired(false)
        )
    )
    // ROLE ADD
    .addSubcommand(sub =>
      sub.setName('role-add')
        .setDescription('Add or update a reward role for a level')
        .addIntegerOption(opt =>
          opt.setName('level').setDescription('Level to reward').setRequired(true)
        )
        .addRoleOption(opt =>
          opt.setName('role').setDescription('Role to give').setRequired(true)
        )
    )
    // ROLE REMOVE
    .addSubcommand(sub =>
      sub.setName('role-remove')
        .setDescription('Remove a reward role for a level')
        .addIntegerOption(opt =>
          opt.setName('level').setDescription('Level to remove').setRequired(true)
        )
    )
    // ROLE LIST
    .addSubcommand(sub =>
      sub.setName('role-list')
        .setDescription('List all configured reward roles')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // ---- PROFILE ----
    if (sub === 'profile') {
      // Get target user or default to command user
      const user = interaction.options.getUser('user') || interaction.user;

      // Fetch user level data
      let userData = await UserLevel.findOne({ guildId, userId: user.id });
      if (!userData) {
        userData = await UserLevel.create({ guildId, userId: user.id });
      }

      // Fetch thresholds
      const config = await GuildConfig.findOne({ guildId });
      const thresholds = config?.levelThresholds || DEFAULT_THRESHOLDS;

      // Find user's current and next level
      let currentLevel = 0;
      let nextLevelAt = thresholds[1] || null;
      for (let i = 0; i < thresholds.length; i++) {
        if (userData.messages >= thresholds[i]) {
          currentLevel = i;
          nextLevelAt = thresholds[i + 1] || null;
        }
      }
      const messagesToNext = nextLevelAt ? nextLevelAt - userData.messages : 0;

      // Get role for this level, if exists
      const rewardRole = config?.levelRoles?.find(r => r.level === currentLevel);

      // Build embed
      const embed = {
        title: `${user.username}'s Level Profile`,
        description: [
          `**Level:** ${currentLevel}`,
          `**Total Messages:** ${userData.messages}`,
          nextLevelAt
            ? `**Messages to next level (${currentLevel + 1}):** ${messagesToNext}`
            : `🎉 **Max level reached!**`,
          rewardRole ? `**Reward Role:** <@&${rewardRole.roleId}>` : null
        ].filter(Boolean).join('\n'),
        color: 0x7289da,
        thumbnail: { url: user.displayAvatarURL?.() }
      };

      return interaction.reply({ embeds: [embed] });
    }

    // ---- ROLE ADD ----
    if (sub === 'role-add') {
      const level = interaction.options.getInteger('level');
      const role = interaction.options.getRole('role');
      if (level < 1) {
        return interaction.reply({ content: 'Level must be at least 1.', ephemeral: true });
      }

      // Remove existing for that level, then add new one
      const config = await GuildConfig.findOneAndUpdate(
        { guildId },
        { $pull: { levelRoles: { level } } },
        { upsert: true, new: true }
      );
      config.levelRoles.push({ level, roleId: role.id });
      await config.save();

      return interaction.reply({
        content: `Role <@&${role.id}> will now be awarded at level ${level}.`
      });
    }

    // ---- ROLE REMOVE ----
    if (sub === 'role-remove') {
      const level = interaction.options.getInteger('level');
      const config = await GuildConfig.findOneAndUpdate(
        { guildId },
        { $pull: { levelRoles: { level } } },
        { upsert: true, new: true }
      );
      return interaction.reply({
        content: `Role reward for level ${level} has been removed.`
      });
    }

    // ---- ROLE LIST ----
    if (sub === 'role-list') {
      const config = await GuildConfig.findOne({ guildId });
      if (!config || !config.levelRoles.length) {
        return interaction.reply({ content: 'No level roles are configured yet.', ephemeral: true });
      }
      const lines = config.levelRoles
        .sort((a, b) => a.level - b.level)
        .map(lr => `Level ${lr.level}: <@&${lr.roleId}>`);

      return interaction.reply({
        embeds: [{
          title: 'Configured Level Roles',
          description: lines.join('\n'),
          color: 0x7289da
        }]
      });
    }
  }
};
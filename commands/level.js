// commands/level.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const UserLevel = require('../models/UserLevel');

const DEFAULT_THRESHOLDS = [0, 5, 10, 20, 40, 60, 80, 120, 180, 220];
const DEFAULT_LVLUP = '<@{userId}> leveled up to **Level {level}**! 🎉';

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
    // RESET
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('Reset a user\'s level and message count')
        .addUserOption(opt =>
          opt.setName('user').setDescription('User to reset').setRequired(true)
        )
    )
    // SET ANNOUNCEMENT
    .addSubcommand(sub =>
      sub.setName('set-announcement')
        .setDescription('Set the level-up announcement description')
        .addStringOption(opt =>
          opt.setName('description')
            .setDescription('Message (use {userId}, {level}, {username}, {mention})')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // ---- PROFILE ----
    if (sub === 'profile') {
      const user = interaction.options.getUser('user') || interaction.user;

      let userData = await UserLevel.findOne({ guildId, userId: user.id });
      if (!userData) {
        userData = await UserLevel.create({ guildId, userId: user.id });
      }

      const config = await GuildConfig.findOne({ guildId });
      const thresholds = config?.levelThresholds || DEFAULT_THRESHOLDS;

      let currentLevel = 0;
      let nextLevelAt = thresholds[1] || null;
      for (let i = 0; i < thresholds.length; i++) {
        if (userData.messages >= thresholds[i]) {
          currentLevel = i;
          nextLevelAt = thresholds[i + 1] || null;
        }
      }
      const messagesToNext = nextLevelAt ? nextLevelAt - userData.messages : 0;

      const rewardRole = config?.levelRoles?.find(r => r.level === currentLevel);

      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Level Profile`)
        .setColor(0x7289da)
        .setThumbnail(user.displayAvatarURL?.())
        .setDescription([
          `**Level:** ${currentLevel}`,
          `**Total Messages:** ${userData.messages}`,
          nextLevelAt
            ? `**Messages to next level (${currentLevel + 1}):** ${messagesToNext}`
            : `🎉 **Max level reached!**`,
          rewardRole ? `**Reward Role:** <@&${rewardRole.roleId}>` : null
        ].filter(Boolean).join('\n'));

      return interaction.reply({ embeds: [embed] });
    }

    // ---- ROLE ADD ----
    if (sub === 'role-add') {
      const level = interaction.options.getInteger('level');
      const role = interaction.options.getRole('role');
      if (level < 1) {
        return interaction.reply({ content: 'Level must be at least 1.', ephemeral: true });
      }

      const config = await GuildConfig.findOneAndUpdate(
        { guildId },
        { $pull: { levelRoles: { level } } },
        { upsert: true, new: true }
      );
      config.levelRoles.push({ level, roleId: role.id });
      await config.save();

      const embed = new EmbedBuilder()
        .setColor(0x43b581)
        .setTitle('Level Role Added')
        .setDescription(`Role <@&${role.id}> will now be awarded at level ${level}.`);

      return interaction.reply({ embeds: [embed] });
    }

    // ---- ROLE REMOVE ----
    if (sub === 'role-remove') {
      const level = interaction.options.getInteger('level');
      await GuildConfig.findOneAndUpdate(
        { guildId },
        { $pull: { levelRoles: { level } } },
        { upsert: true, new: true }
      );

      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('Level Role Removed')
        .setDescription(`Role reward for level ${level} has been removed.`);

      return interaction.reply({ embeds: [embed] });
    }

    // ---- ROLE LIST ----
    if (sub === 'role-list') {
      const config = await GuildConfig.findOne({ guildId });
      if (!config || !config.levelRoles.length) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(0x7289da)
            .setTitle('Configured Level Roles')
            .setDescription('No level roles are configured yet.')
          ],
          ephemeral: true
        });
      }
      const lines = config.levelRoles
        .sort((a, b) => a.level - b.level)
        .map(lr => `Level ${lr.level}: <@&${lr.roleId}>`);

      const embed = new EmbedBuilder()
        .setColor(0x7289da)
        .setTitle('Configured Level Roles')
        .setDescription(lines.join('\n'));

      return interaction.reply({ embeds: [embed] });
    }

    // ---- RESET ----
    if (sub === 'reset') {
      const targetUser = interaction.options.getUser('user');
      const userData = await UserLevel.findOne({ guildId, userId: targetUser.id });

      if (!userData) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('Level Reset')
            .setDescription(`${targetUser.username} has no leveling data to reset.`)
          ],
          ephemeral: true
        });
      }

      userData.level = 0;
      userData.messages = 0;
      await userData.save();

      const embed = new EmbedBuilder()
        .setColor(0xfaa61a)
        .setTitle('Level Reset')
        .setDescription(`${targetUser.username}'s level and message count have been reset.`);

      return interaction.reply({ embeds: [embed] });
    }

    // ---- SET ANNOUNCEMENT ----
    if (sub === 'set-announcement') {
      const desc = interaction.options.getString('description').slice(0, 500);
      await GuildConfig.findOneAndUpdate(
        { guildId },
        { $set: { levelUpMessage: desc } },
        { upsert: true }
      );

      // Preview for admin (using command user's info)
      const preview = desc
        .replaceAll('{userId}', interaction.user.id)
        .replaceAll('{level}', '7')
        .replaceAll('{username}', interaction.user.username)
        .replaceAll('{mention}', `<@${interaction.user.id}>`);

      const embed = new EmbedBuilder()
        .setColor(0x43b581)
        .setTitle('Level Up Announcement Updated')
        .setDescription([
          'New announcement template saved!',
          'You can use `{userId}`, `{level}`, `{username}`, `{mention}` as placeholders.',
          '',
          `**Preview:**`,
          preview
        ].join('\n'));

      return interaction.reply({ embeds: [embed] });
    }
  }
};
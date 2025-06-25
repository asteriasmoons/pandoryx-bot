// commands/permissions.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('permissions')
    .setDescription('Manage role permissions for bot commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set which roles can use a command')
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const { sendCommandGroupSelect } = require('../events/permissionMenus');
      await sendCommandGroupSelect(interaction);
    }
  }
};
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder
} = require('discord.js');
const CommandPermissions = require('../models/CommandPermissions');
const { sendCommandGroupSelect } = require('../events/permissionMenus');

// ⬇️ Your full commandGroups list (copied from permissionMenus.js)
const commandGroups = {
  single: ['help', 'clear', 'report', 'messagetags'],
  embeds: ['embed.create', 'embed.edit', 'embed.delete', 'embed.send', 'embed.view', 'embed.list'],
  notes: ['note.add', 'note.view', 'note.remove'],
  warns: ['warn.add', 'warn.view', 'warn.remove'],
  bans: ['ban.add', 'ban.remove', 'ban.list', 'ban.view'],
  kicks: ['kick.add', 'kick.list', 'kick.view', 'kick.remove'],
  autorole: ['autorole.add', 'autorole.view', 'autorole.remove'],
  timeouts: ['timeout.add', 'timeout.remove', 'timeout.list', 'timeout.view'],
  reactionrole: ['reactionrole.create', 'reactionrole.add', 'reactionrole.remove', 'reactionrole.delete', 'reactionrole.list'],
  tickets: ['ticketpanel.create', 'ticketpanel.edit', 'ticketpanel.delete', 'ticketpanel.list', 'ticketpanel.post', 'ticketpanel.setrole', 'ticketpanel.settranscriptchannel'],
  logs: ['log.config', 'log.view'],
  roles: ['rolepanel.create', 'rolepanel.addrole', 'rolepanel.publish', 'rolepanel.editembed', 'rolepanel.list', 'rolepanel.delete'],
  stickymessages: ['sticky.embed.create', 'sticky.embed.edit', 'sticky.embed.send', 'sticky.embed.delete', 'sticky.embed.remove'],
  levels: ['level.profile', 'level.role-add', 'level.role-remove', 'level.role-list', 'level.reset', 'level.set-announcement'],
  levelconfigs: ['levelconfig.set-thresholds', 'levelconfig.view-thresholds', 'levelconfig.reset-thresholds'],
  reminders: ['reminder.create', 'reminder.list', 'reminder.edit', 'reminder.delete', 'reminder.timezone'],
  github: ['github.watch', 'github.unwatch', 'github.list'],
  leavemessages: ['setleave.set', 'setleave.test'],
  welcomemessages: ['setwelcome.set', 'setwelcome.test'],
  confessions: ['confessions.setup', 'confessions.send'],
  verification: ['verify.panel', 'verify.panel_edit'],
};

function formatCommandLabel(cmd) {
  return cmd
    .split('.')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('  ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('permissions')
    .setDescription('Manage role permissions for bot commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('set').setDescription('Set which roles can use a command')
    )
    .addSubcommand(sub =>
      sub.setName('view').setDescription('View allowed roles for a command')
    )
    .addSubcommand(sub =>
      sub.setName('reset').setDescription('Reset all permissions (make all commands public)')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      return sendCommandGroupSelect(interaction);
    }

    if (sub === 'view') {
      const flatCommands = Object.values(commandGroups).flat();
      const select = new StringSelectMenuBuilder()
        .setCustomId('perm_view_select')
        .setPlaceholder('Select a command to view permissions')
        .addOptions(
          flatCommands.map(cmd => ({
            label: formatCommandLabel(cmd),
            value: cmd
          }))
        );

      const row = new ActionRowBuilder().addComponents(select);
      const embed = new EmbedBuilder()
        .setTitle('View Command Permissions')
        .setDescription('Select a command below to see who can use it.')
        .setColor(0x2f3136);

      return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
    }

    if (sub === 'reset') {
      const result = await CommandPermissions.deleteMany({
        guildId: interaction.guildId
      });

      const embed = new EmbedBuilder()
        .setTitle('🔄 Permissions Reset')
        .setDescription(`All command-specific permission overrides have been removed.\nCommands are now **public** unless otherwise restricted.`)
        .setColor(0x57F287)
        .addFields({ name: 'Entries Deleted', value: `${result.deletedCount}` });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
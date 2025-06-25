// commands/permissions.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ComponentType
} = require('discord.js');
const CommandPermissions = require('../models/CommandPermissions');

// 🧠 Shared helper for formatting display labels
function formatCommandLabel(cmd) {
  return cmd
    .split('.')
    .map(str => str.charAt(0).toUpperCase() + str.slice(1))
    .join(' › ');
}

// 👇 Same structure you used in permissionMenus.js
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
      sub.setName('reset').setDescription('Reset a command\'s permissions to public')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const { sendCommandGroupSelect } = require('../events/permissionMenus');
      return await sendCommandGroupSelect(interaction);
    }

    // Shared logic for view/reset
    const flatCommands = Object.values(commandGroups).flat();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`perm_${sub}_select`)
      .setPlaceholder('Select a command')
      .addOptions(
        flatCommands.map(cmd => ({
          label: formatCommandLabel(cmd),
          value: cmd
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const prompt = new EmbedBuilder()
      .setTitle(`${sub === 'view' ? '🔍 View' : '♻️ Reset'} Command Permissions`)
      .setDescription('Pick a command to continue.')
      .setColor(0x2f3136);

    await interaction.reply({
      embeds: [prompt],
      components: [row],
      ephemeral: true
    });

    // Wait for menu selection
    const response = await interaction.channel.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      time: 30_000,
      filter: i => i.user.id === interaction.user.id && i.customId === `perm_${sub}_select`
    });

    const commandName = response.values[0];

    if (sub === 'view') {
      const record = await CommandPermissions.findOne({
        guildId: interaction.guildId,
        command: commandName
      });

      const embed = new EmbedBuilder()
        .setTitle(`🔍 Permissions: \`${formatCommandLabel(commandName)}\``)
        .setColor(0x5865F2);

      if (!record || record.allowedRoles.length === 0) {
        embed.setDescription('No override set — this command is currently **public**.');
      } else {
        embed.setDescription('This command is restricted to the following role(s):');
        embed.addFields({
          name: 'Allowed Roles',
          value: record.allowedRoles.map(r => `<@&${r}>`).join(', ')
        });
      }

      await response.update({ embeds: [embed], components: [] });
    }

    if (sub === 'reset') {
      const result = await CommandPermissions.findOneAndDelete({
        guildId: interaction.guildId,
        command: commandName
      });

      const embed = new EmbedBuilder()
        .setTitle(`♻️ Permissions Reset: \`${formatCommandLabel(commandName)}\``)
        .setDescription(
          result
            ? '✅ The command is now **public**.'
            : 'ℹ️ No override was set — this command was already public.'
        )
        .setColor(0x57F287);

      await response.update({ embeds: [embed], components: [] });
    }
  }
};
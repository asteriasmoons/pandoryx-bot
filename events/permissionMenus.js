// events/permissionMenus.js
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  RoleSelectMenuBuilder,
  EmbedBuilder,
} = require("discord.js");
const CommandPermissions = require("../models/CommandPermissions");

// 👇 Customize these groups and commands based on your bot
const commandGroups = {
  single: ["help", "clear", "report", "messagetags"],
  embeds: [
    "embed.create",
    "embed.edit",
    "embed.delete",
    "embed.send",
    "embed.view",
    "embed.list",
  ],
  notes: ["note.add", "note.view", "note.remove"],
  warns: ["warn.add", "warn.view", "warn.remove"],
  bans: ["ban.add", "ban.remove", "ban.list", "ban.view"],
  kicks: ["kick.add", "kick.list", "kick.view", "kick.remove"],
  autorole: ["autorole.add", "autorole.view", "autorole.remove"],
  timeouts: ["timeout.add", "timeout.remove", "timeout.list", "timeout.view"],
  reactionrole: [
    "reactionrole.create",
    "reactionrole.add",
    "reactionrole.remove",
    "reactionrole.delete",
    "reactionrole.list",
  ],
  tickets: [
    "ticketpanel.create",
    "ticketpanel.edit",
    "ticketpanel.delete",
    "ticketpanel.list",
    "ticketpanel.post",
    "ticketpanel.setrole",
    "ticketpanel.settranscriptchannel",
  ],
  logs: ["log.config", "log.view"],
  roles: [
    "rolepanel.create",
    "rolepanel.addrole",
    "rolepanel.publish",
    "rolepanel.editembed",
    "rolepanel.list",
    "rolepanel.delete",
  ],
  stickymessages: [
    "sticky.embed.create",
    "sticky.embed.edit",
    "sticky.embed.send",
    "sticky.embed.delete",
    "sticky.embed.remove",
  ],
  levels: [
    "level.profile",
    "level.role-add",
    "level.role-remove",
    "level.role-list",
    "level.reset",
    "level.set-announcement",
  ],
  levelconfigs: [
    "levelconfig.set-thresholds",
    "levelconfig.view-thresholds",
    "levelconfig.reset-thresholds",
  ],
  reminders: [
    "reminder.create",
    "reminder.list",
    "reminder.edit",
    "reminder.delete",
    "reminder.timezone",
  ],
  github: ["github.watch", "github.unwatch", "github.list"],
  leavemessages: ["setleave.set", "setleave.test"],
  welcomemessages: ["setwelcome.set", "setwelcome.test"],
  confessions: ["confessions.setup", "confessions.send"],
  verification: ["verify.panel", "verify.panel_edit"],
  afk: ["afk.enable", "afk.disable", "afk.nomessage"],
  autodelete: ["autodelete.set", "autodelete.list", "autodelete.remove"],
};

const groupLabels = {
  single: "Singles",
  embeds: "Embeds",
  notes: "User Notes",
  warns: "Warnings",
  bans: "Banning",
  kicks: "Kicking",
  autorole: "Autoroles",
  timeouts: "Timeouts",
  reactionrole: "Reaction Roles",
  tickets: "Ticket System",
  logs: "Mod Logs",
  roles: "Role Panels",
  stickymessages: "Sticky Messaging",
  levels: "Leveling",
  levelconfigs: "Level Configuration",
  reminders: "Reminders System",
  github: "Github Feeds",
  leavemessages: "Leave Messages",
  welcomemessages: "Welcome Messages",
  confessions: "Confessions",
  verification: "Verification",
  afk: "Afk System",
  autodelete: "Auto Delete System",
};

function formatCommandLabel(cmd) {
  return cmd
    .split(".")
    .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
    .join(" ");
}

// [Set flow] Show group select
async function sendCommandGroupSelect(interaction) {
  const select = new StringSelectMenuBuilder()
    .setCustomId("perm_group_select")
    .setPlaceholder("Select a command group")
    .addOptions(
      Object.keys(commandGroups).map((group) => ({
        label: groupLabels[group] || group,
        value: group,
      }))
    );
  const row = new ActionRowBuilder().addComponents(select);
  const embed = new EmbedBuilder()
    .setTitle("Set Permissions")
    .setDescription("Select a command group to begin")
    .setColor(0x2f3136);
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

// [Set flow] Handle group select
async function handleGroupSelect(interaction) {
  const group = interaction.values[0];
  const commands = commandGroups[group];
  const select = new StringSelectMenuBuilder()
    .setCustomId(`perm_command_select:${group}`)
    .setPlaceholder("Select a command")
    .addOptions(
      commands.map((cmd) => ({
        label: formatCommandLabel(cmd),
        value: cmd,
      }))
    );
  const row = new ActionRowBuilder().addComponents(select);
  const embed = new EmbedBuilder()
    .setTitle(`Group: ${groupLabels[group] || group}`)
    .setDescription("Now select the specific command you want to set permissions for.")
    .setColor(0x2f3136);
  await interaction.update({ embeds: [embed], components: [row] });
}

// [Set flow] Handle command select
async function handleCommandSelect(interaction) {
  const command = interaction.values[0];
  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId(`perm_role_select:${command}`)
    .setPlaceholder("Select role(s) allowed to use this command")
    .setMinValues(1)
    .setMaxValues(5);
  const row = new ActionRowBuilder().addComponents(roleSelect);
  const embed = new EmbedBuilder()
    .setTitle(`Command: \`${formatCommandLabel(command)}\``)
    .setDescription("Select one or more roles that should be allowed to use this command.")
    .setColor(0x2f3136);
  await interaction.update({ embeds: [embed], components: [row] });
}

// [Set flow] Handle role select and save to DB
async function handleRoleSelect(interaction) {
  const [_, command] = interaction.customId.split(":");
  const roleIds = interaction.values;
  await CommandPermissions.findOneAndUpdate(
    { guildId: interaction.guildId, command },
    { $set: { allowedRoles: roleIds } },
    { upsert: true }
  );
  const embed = new EmbedBuilder()
    .setTitle("✅ Permissions Updated")
    .setDescription(`Only the selected roles can now use \`${formatCommandLabel(command)}\`.`)
    .addFields({
      name: "Allowed Roles",
      value: roleIds.map((r) => `<@&${r}>`).join(", "),
    })
    .setColor(0x2ecc71);
  await interaction.update({ embeds: [embed], components: [] });
}

// [Reset flow] Show group select
async function sendResetGroupSelect(interaction) {
  const select = new StringSelectMenuBuilder()
    .setCustomId("perm_reset_group_select")
    .setPlaceholder("Select a command group to reset from")
    .addOptions(
      Object.keys(commandGroups).map((group) => ({
        label: groupLabels[group] || group,
        value: group,
      }))
    );
  const row = new ActionRowBuilder().addComponents(select);
  const embed = new EmbedBuilder()
    .setTitle("Reset Permissions")
    .setDescription("Select a group to begin resetting permissions.")
    .setColor(0x2f3136);
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

// [Reset flow] Handle group select
async function handleResetGroupSelect(interaction) {
  const group = interaction.values[0];
  const commands = commandGroups[group];
  const select = new StringSelectMenuBuilder()
    .setCustomId(`perm_reset_command_select:${group}`)
    .setPlaceholder("Select a command to reset")
    .addOptions(
      commands.map((cmd) => ({
        label: formatCommandLabel(cmd),
        value: cmd,
      }))
    );
  const row = new ActionRowBuilder().addComponents(select);
  const embed = new EmbedBuilder()
    .setTitle(`Reset › ${groupLabels[group] || group}`)
    .setDescription("Now select the command to remove all permission roles from.")
    .setColor(0x2f3136);
  await interaction.update({ embeds: [embed], components: [row] });
}

// [Reset flow] Handle reset command select
async function handleResetCommandSelect(interaction) {
  const [_, command] = interaction.customId.split(":");
  await CommandPermissions.findOneAndDelete({ guildId: interaction.guildId, command });
  const embed = new EmbedBuilder()
    .setTitle("✅ Permissions Reset")
    .setDescription(`\`${formatCommandLabel(command)}\` is now public. All restrictions have been cleared.`)
    .setColor(0x2ecc71);
  await interaction.update({ embeds: [embed], components: [] });
}

module.exports = {
  sendCommandGroupSelect,
  handleGroupSelect,
  handleCommandSelect,
  handleRoleSelect,
  sendResetGroupSelect,
  handleResetGroupSelect,
  handleResetCommandSelect,
  commandGroups,
  groupLabels,
};
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");
const {
  commandGroups,
  groupLabels,
  sendCommandGroupSelect,
  sendResetGroupSelect,
} = require("../events/permissionMenus");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("permissions")
    .setDescription("Manage role permissions for bot commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("set").setDescription("Set which roles can use a command")
    )
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("View allowed roles for a command")
    )
    .addSubcommand((sub) =>
      sub
        .setName("reset")
        .setDescription("Reset permissions for a specific command (make it public)")
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "set") {
      return sendCommandGroupSelect(interaction);
    }

    if (sub === "view") {
      // Show the group select for viewing
      const select = new StringSelectMenuBuilder()
        .setCustomId("perm_view_group_select")
        .setPlaceholder("Select a command group")
        .addOptions(
          Object.keys(commandGroups).map((group) => ({
            label: groupLabels[group] || (group.charAt(0).toUpperCase() + group.slice(1)),
            value: group,
          }))
        );

      const row = new ActionRowBuilder().addComponents(select);
      const embed = new EmbedBuilder()
        .setTitle("View Command Permissions")
        .setDescription("Select a command group to begin.")
        .setColor(0x2f3136);

      return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      });
    }

    if (sub === "reset") {
      // Launch interactive reset flow (group ➜ command ➜ reset)
      return sendResetGroupSelect(interaction);
    }
  },
};
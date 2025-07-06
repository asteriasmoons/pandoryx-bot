const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

const AfkStatus = require("../models/AfkStatus");
const AfkConfig = require("../models/AfkConfig");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Manage AFK status")
    .addSubcommand((sub) =>
      sub
        .setName("enable")
        .setDescription("Set your AFK message")
        .addStringOption((opt) =>
          opt
            .setName("message")
            .setDescription("Your AFK message (emojis supported!)")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable your AFK status")
    )
    .addSubcommand((sub) =>
      sub
        .setName("nomessage")
        .setDescription(
          "Toggle whether AFK clears on user messages (server-wide)"
        )
    ),

  async execute(interaction) {
    const Premium = require("../models/Premium");

    const premiumUser = await Premium.findOne({
      discordId: interaction.user.id,
    });

    if (!premiumUser) {
      const embed = new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle("🔒 Premium Only")
        .setDescription(
          "This command is for premium users only.\nUse `/claimpremium` to link your Patreon and unlock access!"
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    // === /afk enable ===
    if (sub === "enable") {
      const message = interaction.options.getString("message");

      await AfkStatus.findOneAndUpdate(
        { userId, guildId },
        { message, since: new Date() },
        { upsert: true }
      );

      const embed = new EmbedBuilder()
        .setTitle("AFK Enabled")
        .setDescription(`You're now AFK:\n> ${message}`)
        .setColor("#5865F2")
        .setFooter({
          text: "AFK will clear when you send a message (unless disabled server-wide).",
        });

      return interaction.reply({ embeds: [embed] });
    }

    // === /afk disable ===
    if (sub === "disable") {
      const removed = await AfkStatus.findOneAndDelete({ userId, guildId });

      if (!removed) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription("You werent marked as AFK.")
              .setColor("#5865F2"),
          ],
        });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("AFK Disabled")
            .setDescription("You're no longer marked as AFK.")
            .setColor("#5865F2"),
        ],
      });
    }

    // === /afk nomessage ===
    if (sub === "nomessage") {
      // Require Manage Guild or use your permission system
      if (
        !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)
      ) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription("You dont have permission to toggle this.")
              .setColor("#5865F2"),
          ],
          ephemeral: true,
        });
      }

      let config = await AfkConfig.findOne({ guildId });

      if (!config) {
        config = new AfkConfig({ guildId, noMessageReset: true });
      } else {
        config.noMessageReset = !config.noMessageReset;
      }

      await config.save();

      const state = config.noMessageReset
        ? "AFK will **NOT** be cleared when users send messages."
        : "AFK **will** be cleared automatically when users send messages.";

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("AFK Auto-Clear Setting Updated")
            .setDescription(state)
            .setColor("#5865F2"),
        ],
      });
    }
  },
};

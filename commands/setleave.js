const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const WelcomeConfig = require("../models/WelcomeConfig");
const Embed = require("../models/Embed");
const buildEmbedFromDoc = require("../utils/buildEmbedFromDoc"); // Adjust path if needed

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setleave")
    .setDescription("Set or test the leave message for this server")
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Set up or change the leave message")
        // Required first!
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription(
              'Choose "embed" (with optional text), or "text" only'
            )
            .setRequired(true)
            .addChoices(
              { name: "Embed", value: "embed" },
              { name: "Text", value: "text" }
            )
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel to send leave messages in")
            .setRequired(true)
        )
        // Optional: embed name if type=embed
        .addStringOption((opt) =>
          opt
            .setName("embedname")
            .setDescription(
              "Name of the saved embed (required if type is embed)"
            )
        )
        // Optional: text for ping/instructions (optional with embed, required if type=text)
        .addStringOption((opt) =>
          opt
            .setName("text")
            .setDescription(
              "Text to send with the embed (optional) or alone if type=text"
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("test")
        .setDescription(
          "Test what the leave message will look like (sends here)"
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // --- SET SUBCOMMAND ---
    if (sub === "set") {
      const type = interaction.options.getString("type");
      const embedName = interaction.options.getString("embedname");
      const text = interaction.options.getString("text");
      const channel = interaction.options.getChannel("channel");

      // Validation
      if (type === "embed" && !embedName) {
        return interaction.reply({
          content: 'You must provide an embed name for type "embed".',
          ephemeral: true,
        });
      }
      if (type === "text" && !text) {
        return interaction.reply({
          content: 'You must provide a text message for type "text".',
          ephemeral: true,
        });
      }

      await WelcomeConfig.findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
          leaveType: type,
          leaveEmbedName: type === "embed" ? embedName : undefined,
          leaveText: text || undefined, // Allow text for both types!
          leaveChannel: channel.id,
        },
        { upsert: true }
      );

      return interaction.reply({
        content: "✅ Leave message updated!",
        ephemeral: true,
      });
    }

    // --- TEST SUBCOMMAND ---
    if (sub === "test") {
      const config = await WelcomeConfig.findOne({
        guildId: interaction.guild.id,
      });
      if (!config || (!config.leaveEmbedName && !config.leaveText)) {
        return interaction.reply({
          content: "No leave message is set yet!",
          ephemeral: true,
        });
      }

      if (config.leaveType === "embed" && config.leaveEmbedName) {
        const embedDoc = await Embed.findOne({
          guildId: interaction.guild.id,
          name: config.leaveEmbedName,
        });
        if (!embedDoc) {
          return interaction.reply({
            content: "Configured embed not found in database.",
            ephemeral: true,
          });
        }
        const embed = buildEmbedFromDoc(
          embedDoc,
          interaction.member,
          interaction.guild
        );

        if (config.leaveText) {
          let message = config.leaveText
            .replaceAll("{user}", `<@${interaction.user.id}>`)
            .replaceAll("{username}", interaction.user.username)
            .replaceAll("{server}", interaction.guild.name);
          return interaction.reply({
            content: message,
            embeds: [embed],
            ephemeral: true,
          });
          // Or, as separate messages:
          // await interaction.reply({ content: message, ephemeral: true });
          // await interaction.followUp({ embeds: [embed], ephemeral: true });
        } else {
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
      } else if (config.leaveType === "text" && config.leaveText) {
        let message = config.leaveText
          .replaceAll("{user}", `<@${interaction.user.id}>`)
          .replaceAll("{username}", interaction.user.username)
          .replaceAll("{server}", interaction.guild.name);
        return interaction.reply({ content: message, ephemeral: true });
      } else {
        return interaction.reply({
          content: "No valid leave message is set.",
          ephemeral: true,
        });
      }
    }
  },
};

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Bulk delete messages in this channel")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (max 100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addStringOption((option) =>
      option
        .setName("bots")
        .setDescription("Include bot messages?")
        .addChoices({ name: "Yes", value: "yes" }, { name: "No", value: "no" })
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");
    const botsIncluded = interaction.options.getString("bots") === "yes";

    // Fetch a few extra to account for filtered-out messages
    const fetched = await interaction.channel.messages.fetch({
      limit: amount + 10,
    });
    let messagesToDelete;

    if (botsIncluded) {
      messagesToDelete = fetched.first(amount);
    } else {
      // Only non-bot messages
      messagesToDelete = fetched.filter((msg) => !msg.author.bot).first(amount);
    }

    // Handle case where there’s nothing to delete
    if (!messagesToDelete || messagesToDelete.length === 0) {
      return interaction.reply({
        content:
          "No messages found to delete (maybe not enough recent messages, or wrong filter).",
        ephemeral: true,
      });
    }

    // Bulk delete (can only delete messages <14 days old)
    await interaction.channel
      .bulkDelete(messagesToDelete, true)
      .then((deleted) =>
        interaction.reply({
          content: `🧹 Deleted ${deleted.size} message${
            deleted.size !== 1 ? "s" : ""
          }${botsIncluded ? "" : " (bots excluded)"}.`,
          ephemeral: true,
        })
      )
      .catch((err) =>
        interaction.reply({
          content:
            "Failed to delete messages. Make sure I have the right permissions and that messages are not too old.",
          ephemeral: true,
        })
      );
  },
};

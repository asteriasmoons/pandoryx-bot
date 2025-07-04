const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");
const BumpReminder = require("../models/BumpReminder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bumpreminder")
    .setDescription("Customize the bump reminder embed")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("set-title")
        .setDescription("Set the reminder embed title")
        .addStringOption((opt) =>
          opt.setName("title").setDescription("Embed title").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("set-description")
        .setDescription("Set the reminder embed description")
        .addStringOption((opt) =>
          opt
            .setName("description")
            .setDescription("Embed description")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("preview")
        .setDescription("Preview the current reminder embed")
    )
    .addSubcommand((sub) =>
      sub
        .setName("set-channel")
        .setDescription("Set the bump reminder channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel to listen for bumps and send reminders")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("set-role")
        .setDescription("Set a role to ping when sending a bump reminder")
        .addRoleOption((opt) =>
          opt
            .setName("role")
            .setDescription("Role to ping (or choose 'none' to remove ping)")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    let reminder = await BumpReminder.findOne({ guildId });

    if (!reminder) {
      reminder = await BumpReminder.create({ guildId });
    }

    if (sub === "set-title") {
      const title = interaction.options.getString("title");
      reminder.reminderTitle = title;
      await reminder.save();
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Title Updated")
            .setDescription(`Reminder embed title set to:\n\n**${title}**`)
            .setColor(0x72bdda),
        ],
        ephemeral: true,
      });
    }

    if (sub === "set-description") {
      const description = interaction.options.getString("description");
      reminder.reminderDesc = description;
      await reminder.save();
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Description Updated")
            .setDescription(
              `Reminder embed description set to:\n\n${description}`
            )
            .setColor(0x72bdda),
        ],
        ephemeral: true,
      });
    }

    if (sub === "preview") {
      let content = "";
      if (reminder.pingRoleId) content = `<@&${reminder.pingRoleId}>`;

      return interaction.reply({
        content: content || undefined,
        embeds: [
          new EmbedBuilder()
            .setTitle(reminder.reminderTitle)
            .setDescription(reminder.reminderDesc)
            .setColor(0x72bdda)
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    }

    if (sub === "set-channel") {
      const channel = interaction.options.getChannel("channel");
      reminder.channelId = channel.id;
      await reminder.save();
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Bump Channel Set")
            .setDescription(
              `I'll only listen for Disboard bumps and send reminders in ${channel}.`
            )
            .setColor(0x72bdda),
        ],
        ephemeral: true,
      });
    }

    if (sub === "set-role") {
      const role = interaction.options.getRole("role");
      reminder.pingRoleId = role.id;
      await reminder.save();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Ping Role Set")
            .setDescription(
              `I'll ping <@&${role.id}> when sending bump reminders in this server.`
            )
            .setColor(0x72bdda),
        ],
        ephemeral: true,
      });
    }
  },
};

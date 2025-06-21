const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const StickyEmbed = require('../models/StickyEmbed'); // Your Mongo model

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sticky')
    .setDescription('Sticky embed system')
    .addSubcommandGroup(group =>
      group.setName('embed')
        .setDescription('Sticky embed management')
        .addSubcommand(sub =>
          sub.setName('create')
            .setDescription('Create a sticky embed')
            .addStringOption(opt => opt.setName('name').setDescription('Unique name').setRequired(true))
            .addStringOption(opt => opt.setName('title').setDescription('Embed title').setRequired(true))
            .addStringOption(opt => opt.setName('description').setDescription('Embed description').setRequired(true))
            .addStringOption(opt => opt.setName('color').setDescription('Hex color (#ABCDEF)').setRequired(false))
        )
        .addSubcommand(sub =>
          sub.setName('edit')
            .setDescription('Edit a sticky embed')
            .addStringOption(opt => opt.setName('name').setDescription('Name of the sticky embed').setRequired(true))
            .addStringOption(opt => opt.setName('title').setDescription('New title').setRequired(false))
            .addStringOption(opt => opt.setName('description').setDescription('New description').setRequired(false))
            .addStringOption(opt => opt.setName('color').setDescription('New color (#ABCDEF)').setRequired(false))
        )
        .addSubcommand(sub =>
          sub.setName('send')
            .setDescription('Send a sticky embed to a channel')
            .addStringOption(opt => opt.setName('name').setDescription('Name of the sticky embed').setRequired(true))
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel to send to').setRequired(true).addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(sub =>
          sub.setName('delete')
            .setDescription('Delete a sticky embed')
            .addStringOption(opt => opt.setName('name').setDescription('Name of the sticky embed').setRequired(true))
        )
    ),
  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup();
    const sub = interaction.options.getSubcommand();

    if (group !== 'embed') return;

    // CREATE
    if (sub === 'create') {
      const name = interaction.options.getString('name');
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const color = interaction.options.getString('color') || '#5865F2';

      // Ensure unique name per guild
      const existing = await StickyEmbed.findOne({ guildId: interaction.guildId, name });
      if (existing) return interaction.reply({ content: 'A sticky embed with that name already exists.', ephemeral: true });

      await StickyEmbed.create({
        guildId: interaction.guildId,
        name,
        embed: { title, description, color },
      });

      return interaction.reply({ content: `Sticky embed \`${name}\` created.`, ephemeral: true });
    }

    // EDIT
    if (sub === 'edit') {
      const name = interaction.options.getString('name');
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const color = interaction.options.getString('color');

      const sticky = await StickyEmbed.findOne({ guildId: interaction.guildId, name });
      if (!sticky) return interaction.reply({ content: 'Sticky embed not found.', ephemeral: true });

      // Only update if a value is provided
      if (title) sticky.embed.title = title;
      if (description) sticky.embed.description = description;
      if (color) sticky.embed.color = color;

      await sticky.save();
      return interaction.reply({ content: `Sticky embed \`${name}\` updated.`, ephemeral: true });
    }

    // SEND
    if (sub === 'send') {
      const name = interaction.options.getString('name');
      const channel = interaction.options.getChannel('channel');
      const sticky = await StickyEmbed.findOne({ guildId: interaction.guildId, name });
      if (!sticky) return interaction.reply({ content: 'Sticky embed not found.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle(sticky.embed.title)
        .setDescription(sticky.embed.description)
        .setColor(sticky.embed.color || '#5865F2');

      const msg = await channel.send({ embeds: [embed] });

      // Save messageId/channelId for future sticky logic if needed
      sticky.channelId = channel.id;
      sticky.messageId = msg.id;
      await sticky.save();

      return interaction.reply({ content: `Sticky embed \`${name}\` sent to ${channel}.`, ephemeral: true });
    }

    // DELETE
    if (sub === 'delete') {
      const name = interaction.options.getString('name');
      const deleted = await StickyEmbed.findOneAndDelete({ guildId: interaction.guildId, name });
      if (!deleted) return interaction.reply({ content: 'Sticky embed not found.', ephemeral: true });
      return interaction.reply({ content: `Sticky embed \`${name}\` deleted.`, ephemeral: true });
    }
  }
};
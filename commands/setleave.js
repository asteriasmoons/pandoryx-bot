const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const WelcomeConfig = require('../models/WelcomeConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setleave')
    .setDescription('Set up or change the leave message for this server')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Choose "embed" to use a saved embed, or "text" for a text message')
        .setRequired(true)
        .addChoices(
          { name: 'Embed', value: 'embed' },
          { name: 'Text', value: 'text' }
        )
    )
    .addStringOption(opt =>
      opt.setName('embedid')
        .setDescription('MongoDB Embed ID to use (if type is embed)')
    )
    .addStringOption(opt =>
      opt.setName('text')
        .setDescription('Text message (if type is text). Use {user}, {username}, {server}')
    )
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to send leave messages in')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const embedId = interaction.options.getString('embedid');
    const text = interaction.options.getString('text');
    const channel = interaction.options.getChannel('channel');

    // Input checks
    if (type === 'embed' && !embedId) {
      return interaction.reply({ content: 'You must provide an Embed ID for type "embed".', ephemeral: true });
    }
    if (type === 'text' && !text) {
      return interaction.reply({ content: 'You must provide a text message for type "text".', ephemeral: true });
    }

    await WelcomeConfig.findOneAndUpdate(
      { guildId: interaction.guild.id },
      {
        leaveType: type,
        leaveEmbedId: type === 'embed' ? embedId : undefined,
        leaveText: type === 'text' ? text : undefined,
        leaveChannel: channel.id,
      },
      { upsert: true }
    );

    await interaction.reply({ content: '✅ Leave message updated!', ephemeral: true });
  }
};
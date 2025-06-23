const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const WelcomeConfig = require('../models/WelcomeConfig');
const Embed = require('../models/Embed');
const { EmbedBuilder } = require('discord.js');

// Helper: same as before
function buildEmbedFromDoc(embedDoc, member, guild) {
  const replacements = {
    '{user}': `<@${member.id}>`,
    '{username}': member.user.username,
    '{userTag}': member.user.tag,
    '{userId}': member.id,
    '{userAvatar}': member.user.displayAvatarURL({ dynamic: true }),
    '{server}': guild.name,
  };
  const replace = (text) => {
    if (!text) return undefined;
    return Object.entries(replacements).reduce(
      (acc, [key, value]) => acc.replaceAll(key, value), text
    );
  };

  const embed = new EmbedBuilder();
  if (embedDoc.title) embed.setTitle(replace(embedDoc.title));
  if (embedDoc.description) embed.setDescription(replace(embedDoc.description));
  if (embedDoc.color) embed.setColor(embedDoc.color);
  if (embedDoc.author && (embedDoc.author.name || embedDoc.author.icon_url)) {
    embed.setAuthor({
      name: replace(embedDoc.author.name),
      iconURL: replace(embedDoc.author.icon_url),
    });
  }
  if (embedDoc.footer && (embedDoc.footer.text || embedDoc.footer.icon_url)) {
    embed.setFooter({
      text: replace(embedDoc.footer.text),
      iconURL: replace(embedDoc.footer.icon_url),
    });
  }
  if (embedDoc.footer && embedDoc.footer.timestamp) embed.setTimestamp();
  if (embedDoc.thumbnail) embed.setThumbnail(replace(embedDoc.thumbnail));
  if (embedDoc.image) embed.setImage(replace(embedDoc.image));
  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('Set or test the welcome message for this server')
    .addSubcommand(sub =>
      sub
        .setName('set')
        .setDescription('Set up or change the welcome message')
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
            .setDescription('Channel to send welcome messages in')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('test')
        .setDescription('Test what the welcome message will look like (sends here)')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const type = interaction.options.getString('type');
      const embedId = interaction.options.getString('embedid');
      const text = interaction.options.getString('text');
      const channel = interaction.options.getChannel('channel');

      if (type === 'embed' && !embedId) {
        return interaction.reply({ content: 'You must provide an Embed ID for type "embed".', ephemeral: true });
      }
      if (type === 'text' && !text) {
        return interaction.reply({ content: 'You must provide a text message for type "text".', ephemeral: true });
      }

      await WelcomeConfig.findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
          welcomeType: type,
          welcomeEmbedId: type === 'embed' ? embedId : undefined,
          welcomeText: type === 'text' ? text : undefined,
          welcomeChannel: channel.id,
        },
        { upsert: true }
      );

      return interaction.reply({ content: '✅ Welcome message updated!', ephemeral: true });
    }

    if (sub === 'test') {
      const config = await WelcomeConfig.findOne({ guildId: interaction.guild.id });
      if (!config || (!config.welcomeEmbedId && !config.welcomeText)) {
        return interaction.reply({ content: 'No welcome message is set yet!', ephemeral: true });
      }

      // Fake "member" = interaction.member, "guild" = interaction.guild
      if (config.welcomeType === 'embed' && config.welcomeEmbedId) {
        const embedDoc = await Embed.findById(config.welcomeEmbedId);
        if (!embedDoc) {
          return interaction.reply({ content: 'Configured embed not found in database.', ephemeral: true });
        }
        const embed = buildEmbedFromDoc(embedDoc, interaction.member, interaction.guild);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      } else if (config.welcomeType === 'text' && config.welcomeText) {
        let message = config.welcomeText
          .replaceAll('{user}', `<@${interaction.user.id}>`)
          .replaceAll('{username}', interaction.user.username)
          .replaceAll('{server}', interaction.guild.name);
        return interaction.reply({ content: message, ephemeral: true });
      } else {
        return interaction.reply({ content: 'No valid welcome message is set.', ephemeral: true });
      }
    }
  }
};
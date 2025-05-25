const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ReactionRoleMessage = require('../models/ReactionRoleMessage');

// Helper: Get emoji key
function parseEmojiInput(emojiInput) {
  // Custom emoji: <a:name:id> or <:name:id>
  const custom = emojiInput.match(/^<a?:\w+:(\d+)>$/);
  if (custom) return custom[1];
  return emojiInput;
}

module.exports = {
	data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Create and manage reaction role messages')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a new reaction role message')
        .addStringOption(opt => opt.setName('text').setDescription('Message content (if not using embed)').setRequired(false))
        .addStringOption(opt => opt.setName('embed_title').setDescription('Embed title').setRequired(false))
        .addStringOption(opt => opt.setName('embed_description').setDescription('Embed description').setRequired(false))
        .addStringOption(opt => opt.setName('embed_color').setDescription('Embed color (hex, e.g. #00bfff)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a reaction/role pair to an existing reaction role message')
        .addStringOption(opt => opt.setName('messageid').setDescription('Reaction role message ID').setRequired(true))
        .addStringOption(opt => opt.setName('emoji').setDescription('Emoji').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a reaction/role pair from a reaction role message')
        .addStringOption(opt => opt.setName('messageid').setDescription('Reaction role message ID').setRequired(true))
        .addStringOption(opt => opt.setName('emoji').setDescription('Emoji').setRequired(true))
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: 'You need the Manage Roles permission.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    // CREATE
    if (sub === 'create') {
      const text = interaction.options.getString('text');
      const channel = interaction.channel;

      // Send the message
      const msg = await channel.send({ content: text });

      // Create DB entry
      await ReactionRoleMessage.create({
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId: msg.id,
        emojiRoleMap: {},
      });

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Reaction Role Message Created')
            .setDescription(`Message ID: \`${msg.id}\`\nNow use \`/reactionrole add\` to assign emojis and roles!`)
            .setColor(0x00bfff)
        ],
        ephemeral: true
      });
    }

    // ADD
    if (sub === 'add') {
      const messageId = interaction.options.getString('messageid');
      const emojiInput = interaction.options.getString('emoji');
      const role = interaction.options.getRole('role');

      const emojiKey = parseEmojiInput(emojiInput);

      const data = await ReactionRoleMessage.findOne({ messageId });
      if (!data) {
        return interaction.reply({ content: 'Reaction role message not found.', ephemeral: true });
      }

      // Update mapping
      data.emojiRoleMap.set(emojiKey, role.id);
      await data.save();

      // React to the message
      const channel = await interaction.guild.channels.fetch(data.channelId);
      const msg = await channel.messages.fetch(messageId);
      await msg.react(emojiInput);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Reaction Role Added')
            .setDescription(`React with ${emojiInput} to get <@&${role.id}>`)
            .setColor(0x00bfff)
        ],
        ephemeral: true
      });
    }

    // REMOVE
    if (sub === 'remove') {
      const messageId = interaction.options.getString('messageid');
      const emojiInput = interaction.options.getString('emoji');
      const emojiKey = parseEmojiInput(emojiInput);

      const data = await ReactionRoleMessage.findOne({ messageId });
      if (!data) {
        return interaction.reply({ content: 'Reaction role message not found.', ephemeral: true });
      }

      if (!data.emojiRoleMap.has(emojiKey)) {
        return interaction.reply({ content: 'That emoji is not set for this message.', ephemeral: true });
      }

      data.emojiRoleMap.delete(emojiKey);
      await data.save();

      // Remove the reaction from the message
      const channel = await interaction.guild.channels.fetch(data.channelId);
      const msg = await channel.messages.fetch(messageId);
      // Remove bot's own reaction (if present)
      const reaction = msg.reactions.cache.find(r =>
        (r.emoji.id && r.emoji.id === emojiKey) ||
        (r.emoji.name && r.emoji.name === emojiKey)
      );
      if (reaction) await reaction.users.remove(interaction.client.user.id);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Reaction Role Removed')
            .setDescription(`Removed ${emojiInput} from the reaction role message.`)
            .setColor(0xff0000)
        ],
        ephemeral: true
      });
    }
  }
};
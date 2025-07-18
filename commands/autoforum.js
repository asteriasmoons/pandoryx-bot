const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const AutoForumConfig = require('../models/AutoForumConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('auto')
    .setDescription('Auto-forum configuration')
    .addSubcommand(sub =>
      sub.setName('forum-add')
        .setDescription('Enable auto-embed in a forum channel')
        .addChannelOption(opt =>
          opt.setName('forum')
            .setDescription('Forum channel to enable')
            .addChannelTypes(ChannelType.GuildForum)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('forum-remove')
        .setDescription('Disable auto-embed in a forum channel')
        .addChannelOption(opt =>
          opt.setName('forum')
            .setDescription('Forum channel to disable')
            .addChannelTypes(ChannelType.GuildForum)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('forum-list')
        .setDescription('List all forums with auto-embed enabled')
    )
    .addSubcommand(sub =>
      sub.setName('forum-set')
        .setDescription('Set embed settings for a forum channel')
        .addChannelOption(opt =>
          opt.setName('forum')
            .setDescription('Forum channel')
            .addChannelTypes(ChannelType.GuildForum)
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('title').setDescription('Embed title')
        )
        .addStringOption(opt =>
          opt.setName('description').setDescription('Embed description')
        )
        .addStringOption(opt =>
          opt.setName('color').setDescription('Embed color (hex, e.g. #5865F2)')
        )
        .addStringOption(opt =>
          opt.setName('buttonlabel').setDescription('Button label')
        )
        .addStringOption(opt =>
          opt.setName('emoji').setDescription('Button emoji (unicode or custom)')
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const forum = interaction.options.getChannel('forum');

    if (sub === 'forum-add') {
      await AutoForumConfig.findOneAndUpdate(
        { forumId: forum.id },
        { $setOnInsert: { forumId: forum.id } },
        { upsert: true }
      );
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setDescription(`✅ Auto-forum enabled in <#${forum.id}>.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'forum-remove') {
      await AutoForumConfig.deleteOne({ forumId: forum.id });
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription(`❌ Auto-forum disabled in <#${forum.id}>.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'forum-list') {
      const configs = await AutoForumConfig.find();
      let embed;
      if (!configs.length) {
        embed = new EmbedBuilder()
          .setColor(0xED4245)
          .setDescription("No forums are currently configured for auto-forum.");
      } else {
        const forums = configs.map(c => `<#${c.forumId}>`).join('\n');
        embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('Auto-forum Enabled Channels')
          .setDescription(forums);
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'forum-set') {
      const update = {};
      if (interaction.options.getString('title')) update.title = interaction.options.getString('title');
      if (interaction.options.getString('description')) update.description = interaction.options.getString('description');
      if (interaction.options.getString('color')) update.color = interaction.options.getString('color');
      if (interaction.options.getString('buttonlabel')) update.buttonLabel = interaction.options.getString('buttonlabel');
      if (interaction.options.getString('emoji')) update.buttonEmoji = interaction.options.getString('emoji');

      await AutoForumConfig.findOneAndUpdate(
        { forumId: forum.id },
        { $set: update },
        { upsert: true }
      );
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setDescription(`🔧 Auto-forum settings updated for <#${forum.id}>.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
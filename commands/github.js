// commands/github.js
const { SlashCommandBuilder, ChannelType } = require('discord.js');
const GitHubFeed = require('../models/GitHubFeed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('github')
    .setDescription('Manage GitHub feeds')
    .addSubcommand(sub =>
      sub.setName('watch')
        .setDescription('Watch a GitHub repo')
        .addStringOption(opt =>
          opt.setName('repo').setDescription('GitHub repo URL').setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Target channel').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('unwatch')
        .setDescription('Stop watching a repo')
        .addStringOption(opt =>
          opt.setName('repo').setDescription('GitHub repo URL').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all watched GitHub repos')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'watch') {
      const repoUrl = interaction.options.getString('repo');
      const channel = interaction.options.getChannel('channel');

      await GitHubFeed.findOneAndUpdate(
        { guildId, repoUrl },
        { channelId: channel.id },
        { upsert: true }
      );

      await interaction.reply(`✅ Now watching ${repoUrl} for updates in <#${channel.id}>`);
    }

    else if (sub === 'unwatch') {
      const repoUrl = interaction.options.getString('repo');
      await GitHubFeed.deleteOne({ guildId, repoUrl });
      await interaction.reply(`🛑 Stopped watching ${repoUrl}`);
    }

    else if (sub === 'list') {
      const feeds = await GitHubFeed.find({ guildId });
      if (!feeds.length) return interaction.reply(`No repos are being watched.`);

      const list = feeds.map(f => `- ${f.repoUrl} → <#${f.channelId}>`).join('\n');
      await interaction.reply({ content: `🔍 Repos being watched:\n${list}`, ephemeral: true });
    }
  }
};
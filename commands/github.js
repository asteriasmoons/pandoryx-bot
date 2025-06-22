const { SlashCommandBuilder, ChannelType } = require('discord.js');
const GitHubFeed = require('../models/GitHubFeed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('github')
    .setDescription('Track GitHub repositories and send updates')
    .addSubcommand(sub =>
      sub.setName('watch')
        .setDescription('Start watching a GitHub repo')
        .addStringOption(opt =>
          opt.setName('repo').setDescription('GitHub repo URL (e.g., https://github.com/user/repo)').setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Channel to post updates in').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('branch').setDescription('Branch to track (default: main)')
        )
    )
    .addSubcommand(sub =>
      sub.setName('unwatch')
        .setDescription('Stop watching a GitHub repo')
        .addStringOption(opt =>
          opt.setName('repo').setDescription('GitHub repo URL').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List watched repositories in this server')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'watch') {
      const repoUrl = interaction.options.getString('repo');
      const channel = interaction.options.getChannel('channel');
      const branch = interaction.options.getString('branch') || 'main';

      await GitHubFeed.findOneAndUpdate(
        { guildId, repoUrl },
        { channelId: channel.id, branch },
        { upsert: true }
      );

      await interaction.reply(`📡 Now watching \`${repoUrl}\` on branch \`${branch}\` in <#${channel.id}>`);
    }

    if (sub === 'unwatch') {
      const repoUrl = interaction.options.getString('repo');
      await GitHubFeed.deleteOne({ guildId, repoUrl });
      await interaction.reply(`🛑 Stopped watching \`${repoUrl}\``);
    }

    if (sub === 'list') {
      const feeds = await GitHubFeed.find({ guildId });
      if (!feeds.length) return interaction.reply(`📭 No repositories are being watched in this server.`);

      const list = feeds.map(f =>
        `• [${f.repoUrl}](${f.repoUrl}) → <#${f.channelId}> (Branch: \`${f.branch}\`)`
      ).join('\n');

      await interaction.reply({ content: `📋 Watching the following GitHub repos:\n${list}`, ephemeral: true });
    }
  }
};
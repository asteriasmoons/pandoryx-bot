const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
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

      const embed = new EmbedBuilder()
        .setColor(0x8f72da)
        .setTitle('GitHub Feed Added')
        .setDescription(`Now watching [${repoUrl}](${repoUrl}) on branch \`${branch}\`.\nUpdates will be posted in <#${channel.id}>.`)
        .setFooter({ text: 'GitHub Feed Tracker' });

      await interaction.reply({ embeds: [embed] });
    }

    else if (sub === 'unwatch') {
      const repoUrl = interaction.options.getString('repo');
      await GitHubFeed.deleteOne({ guildId, repoUrl });

      const embed = new EmbedBuilder()
        .setColor(0x8f72da)
        .setTitle('GitHub Feed Removed')
        .setDescription(`No longer watching [${repoUrl}](${repoUrl}).`)
        .setFooter({ text: 'GitHub Feed Tracker' });

      await interaction.reply({ embeds: [embed] });
    }

    else if (sub === 'list') {
      const feeds = await GitHubFeed.find({ guildId });

      if (!feeds.length) {
        const embed = new EmbedBuilder()
          .setColor(0x8f72da)
          .setTitle('No Repositories Tracked')
          .setDescription('This server is not watching any GitHub repositories.')
          .setFooter({ text: 'GitHub Feed Tracker' });

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x8f72da)
        .setTitle('Watched GitHub Repositories')
        .setDescription(
          feeds.map(f => `• [${f.repoUrl}](${f.repoUrl}) → <#${f.channelId}> (Branch: \`${f.branch}\`)`).join('\n')
        )
        .setFooter({ text: 'GitHub Feed Tracker' });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
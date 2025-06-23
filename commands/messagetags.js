const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('Messagetags')
    .setDescription('Show the available placeholders/tags for welcome and leave messages'),
  async execute(interaction) {
    await interaction.reply({
      ephemeral: true,
      embeds: [
        {
          title: 'Available Placeholders for Welcome/Leave Messages',
          description: [
            '`{user}` – Mention the member (e.g., <@1234567890>)',
            '`{username}` – Member\'s username (e.g., Asteria)',
            '`{userTag}` – Full Discord tag (e.g., Asteria#0001)',
            '`{userId}` – User ID (e.g., 1234567890)',
            '`{userAvatar}` – Avatar URL',
            '`{server}` – Server name',
            '',
            '*You can use these anywhere in text fields or embed fields!*'
          ].join('\n')
        }
      ]
    });
  }
};
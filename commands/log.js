const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log')
    .setDescription('Configure logging')
    .addSubcommand(sub =>
      sub.setName('config').setDescription('Configure event log destinations.')
    ),

  async execute(interaction) {
    const eventSelect = new StringSelectMenuBuilder()
      .setCustomId('selectLogEvent')
      .setPlaceholder('Select an event to configure')
      .addOptions([
        { label: 'Member Join', value: 'memberJoin' },
        { label: 'Member Leave', value: 'memberLeave' },
        { label: 'Message Deleted', value: 'messageDelete' },
        { label: 'Message Edited', value: 'messageEdit' },
        { label: 'Bulk Delete', value: 'bulkDelete' },
        { label: 'Nickname Changed', value: 'nicknameChange' },
        { label: 'Avatar Changed', value: 'avatarChange' },
        { label: 'Channel Created', value: 'channelCreate' },
        { label: 'Channel Deleted', value: 'channelDelete' },
        { label: 'Role Updated', value: 'roleUpdate' },
        { label: 'Emoji or Sticker Changed', value: 'emojiUpdate' },
        { label: 'Warn', value: 'warn' },
        { label: 'Timeout', value: 'timeout' },
        { label: 'Ban', value: 'ban' },
        { label: 'Kick', value: 'kick' }
      ]);

    const row = new ActionRowBuilder().addComponents(eventSelect);

    await interaction.reply({
      content: '🛠️ Select an event you want to assign a log channel for:',
      components: [row],
      ephemeral: true
    });
  }
};
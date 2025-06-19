// /commands/log.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log')
    .setDescription('Configure log settings')
    .addSubcommand(sub =>
      sub.setName('config')
         .setDescription('Configure what channel to log specific events to.')
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: 'You need to be an administrator to use this command.', ephemeral: true });
    }

    const eventSelect = new StringSelectMenuBuilder()
      .setCustomId('selectLogEvent')
      .setPlaceholder('Choose an event to configure')
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
        { label: 'Kick', value: 'kick' },
      ]);

    const row = new ActionRowBuilder().addComponents(eventSelect);

    await interaction.reply({
      content: 'Select the event you want to configure:',
      components: [row],
      ephemeral: true
    });
  }
};
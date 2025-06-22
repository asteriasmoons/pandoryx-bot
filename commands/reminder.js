// commands/reminder.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Reminder = require('../models/Reminder');
const chrono = require('chrono-node'); // <-- ADD THIS LINE

const setupCache = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Create, list, edit, or delete reminders for your server')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a new reminder')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('A unique name for this reminder')
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all reminders in this server')
    )
    .addSubcommand(sub =>
      sub.setName('edit')
        .setDescription('Edit an existing reminder')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('The name of the reminder to edit')
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a reminder')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('The name of the reminder to delete')
            .setRequired(true))
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const setupKey = `${guildId}_${userId}`;

    // CREATE
    if (sub === 'create') {
      const name = interaction.options.getString('name').trim();
      const exists = await Reminder.findOne({ guildId, name });
      if (exists) {
        return interaction.reply({ content: `❌ A reminder named **${name}** already exists.`, ephemeral: true });
      }

      const setupObj = {
        guildId,
        creatorId: userId,
        name,
        interval: null,
        startDate: null,
        ping: '',
        channelId: null,
        dayOfWeek: null,
        embedTitle: 'Reminder!',
        embedDescription: '',
        embedColor: '#8757f2'
      };
      setupCache.set(setupKey, setupObj);
      return interaction.reply(getSetupUI(setupObj));
    }

    // LIST
    if (sub === 'list') {
      const reminders = await Reminder.find({ guildId });
      if (!reminders.length)
        return interaction.reply({ content: 'No reminders set in this server.', ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle('Reminders')
        .setColor(0x8757f2)
        .setDescription(
          reminders.map(r =>
            `• **${r.name}** — Every \`${r.interval}\` in <#${r.channelId}> (Title: ${r.embedTitle})`
          ).join('\n')
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // EDIT
    if (sub === 'edit') {
      const name = interaction.options.getString('name').trim();
      const reminder = await Reminder.findOne({ guildId, name });
      if (!reminder)
        return interaction.reply({ content: `❌ No reminder named **${name}** was found.`, ephemeral: true });

      const setupObj = { ...reminder.toObject() };
      setupCache.set(setupKey, setupObj);
      return interaction.reply(getSetupUI(setupObj));
    }

    // DELETE
    if (sub === 'delete') {
      const name = interaction.options.getString('name').trim();
      const reminder = await Reminder.findOne({ guildId, name });
      if (!reminder)
        return interaction.reply({ content: `❌ No reminder named **${name}** was found.`, ephemeral: true });

      await reminder.deleteOne();
      return interaction.reply({ content: `✅ Reminder **${name}** deleted.`, ephemeral: true });
    }
  },

  async handleComponent(interaction, client) {
    const guildId = interaction.guildId || interaction.guild.id;
    const userId = interaction.user.id;
    const setupKey = `${guildId}_${userId}`;
    const setupObj = setupCache.get(setupKey);

    if (!setupObj)
      return interaction.reply({ content: 'Setup session expired or not found. Please run `/reminder create` again.', ephemeral: true });

    // SELECT MENU HANDLING
    if (interaction.isStringSelectMenu()) {
      const selected = interaction.values[0];
      let prompt = '';

      if (interaction.customId === 'reminder-settings') {
        if (selected === 'interval') prompt = 'How often should this reminder repeat? (e.g. `1h`, `1d`, `12h`)';
        if (selected === 'startDate') prompt = 'When should the first reminder start? (Try things like `tomorrow 9am`, `in 3 hours`, `2025-07-01 10:00`, or `now`)';
        if (selected === 'ping') prompt = 'Who should be pinged? (mention a user, a role, or type text. Leave blank for none)';
        if (selected === 'channel') prompt = 'Which channel should the reminder be sent to? (mention the channel or paste its ID)';
        if (selected === 'dayOfWeek') prompt = 'On which day of the week should this reminder be sent? (e.g. `Monday`. Leave blank for every day)';
      }
      if (interaction.customId === 'reminder-message') {
        if (selected === 'embedTitle') prompt = 'What should the embed title be?';
        if (selected === 'embedDescription') prompt = 'What should the embed description be?';
        if (selected === 'embedColor') prompt = 'What color should the embed be? (hex code, e.g. `#ffcc00`)';
      }

      await interaction.reply({ content: prompt, ephemeral: true });

      const channel = await interaction.channel.fetch();
      const collector = channel.createMessageCollector({
        filter: m => m.author.id === interaction.user.id,
        max: 1,
        time: 60000
      });

      collector.on('collect', async m => {
        const value = m.content.trim();
        if (interaction.customId === 'reminder-settings') {
          if (selected === 'interval') setupObj.interval = value;
          if (selected === 'startDate') {
            let parsed;
            if (value.toLowerCase() === 'now') {
              parsed = new Date();
            } else {
              parsed = chrono.parseDate(value);
            }
            if (!parsed || isNaN(parsed.getTime())) {
              await interaction.followUp({
                content: '⚠️ Sorry, I couldn\'t understand that date/time! Try things like `tomorrow 5pm`, `in 2 hours`, `2025-07-01 10:00`, or `now`.',
                ephemeral: true
              });
              return;
            }
            setupObj.startDate = parsed;
          }
          if (selected === 'ping') setupObj.ping = value;
          if (selected === 'channel') {
            let channelId = value;
            const channelMention = value.match(/^<#(\d+)>$/);
            if (channelMention) channelId = channelMention[1];
            setupObj.channelId = channelId;
          }
          if (selected === 'dayOfWeek') setupObj.dayOfWeek = value || null;
        } else if (interaction.customId === 'reminder-message') {
          if (selected === 'embedTitle') setupObj.embedTitle = value;
          if (selected === 'embedDescription') setupObj.embedDescription = value;
          if (selected === 'embedColor') setupObj.embedColor = value.startsWith('#') ? value : `#${value}`;
        }

        setupCache.set(setupKey, setupObj);
        await m.delete().catch(() => {});
        await interaction.followUp(getSetupUI(setupObj));
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time') interaction.followUp({ content: '⏰ Setup timed out. Please use `/reminder edit` to continue.', ephemeral: true });
      });

      return;
    }

    // BUTTON HANDLING
    if (interaction.isButton()) {
      if (!['reminder-save', 'reminder-cancel'].includes(interaction.customId)) return;

      if (interaction.customId === 'reminder-cancel') {
        setupCache.delete(setupKey);
        return interaction.reply({ content: '❌ Reminder setup canceled.', ephemeral: true });
      }

      if (interaction.customId === 'reminder-save') {
        if (!setupObj.interval || !setupObj.startDate || !setupObj.channelId) {
          return interaction.reply({
            content: 'Please set the interval, start date, and channel before saving!',
            ephemeral: true
          });
        }
        if (typeof setupObj.startDate === 'string') setupObj.startDate = new Date(setupObj.startDate);

        await Reminder.findOneAndUpdate(
          { guildId: setupObj.guildId, name: setupObj.name },
          setupObj,
          { upsert: true, new: true }
        );
        setupCache.delete(setupKey);
        return interaction.reply({ content: `✅ Reminder **${setupObj.name}** saved!`, ephemeral: true });
      }
    }
  }
};

// Helper for embed/menus/buttons
function getSetupUI(data) {
  const previewEmbed = new EmbedBuilder()
    .setTitle(data.embedTitle || 'Reminder Preview')
    .setDescription(data.embedDescription || 'No description set.')
    .setColor(data.embedColor || '#8757f2')
    .addFields(
      { name: 'Interval', value: data.interval ? `\`${data.interval}\`` : '`Not set`', inline: true },
      { name: 'Start Date', value: data.startDate ? `<t:${Math.floor((new Date(data.startDate).getTime())/1000)}:f>` : '`Not set`', inline: true },
      { name: 'Ping', value: data.ping || '`None`', inline: true },
      { name: 'Channel', value: data.channelId ? `<#${data.channelId}>` : '`Not set`', inline: true },
      { name: 'Day of Week', value: data.dayOfWeek || '`Every day`', inline: true }
    );

  const settingsMenu = new StringSelectMenuBuilder()
    .setCustomId('reminder-settings')
    .setPlaceholder('Select a setting to configure...')
    .addOptions([
      { label: 'Reminder Interval', value: 'interval', description: 'How often to repeat? (e.g. 1h, 1d)' },
      { label: 'Start Date', value: 'startDate', description: 'When to start the reminder?' },
      { label: 'Ping (Role/User)', value: 'ping', description: 'Who should be pinged?' },
      { label: 'Channel', value: 'channel', description: 'Which channel to send to?' },
      { label: 'Send on Specific Day', value: 'dayOfWeek', description: 'Which day? (optional)' }
    ]);
  const messageMenu = new StringSelectMenuBuilder()
    .setCustomId('reminder-message')
    .setPlaceholder('Customize reminder message...')
    .addOptions([
      { label: 'Embed Title', value: 'embedTitle', description: 'Change the embed title' },
      { label: 'Embed Description', value: 'embedDescription', description: 'Change the embed description' },
      { label: 'Embed Color', value: 'embedColor', description: 'Change the embed color (hex)' }
    ]);
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('reminder-save').setLabel('Save').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('reminder-cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
  );
  return {
    embeds: [previewEmbed],
    components: [
      new ActionRowBuilder().addComponents(settingsMenu),
      new ActionRowBuilder().addComponents(messageMenu),
      buttons
    ]
  };
}
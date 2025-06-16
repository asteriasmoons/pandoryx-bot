// interactionCreate.js
const { 
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits, 
  ChannelType,
  AttachmentBuilder
} = require('discord.js');
const EmbedModel = require('../models/Embed');
const TicketPanel = require('../models/TicketPanel');
const TicketInstance = require('../models/TicketInstance');
const { buildEmbed } = require('../utils/embedEditorUi');

const staffRoleId = "1368040155793068112";

async function generateTranscript(channel) {
  let messages = [];
  let lastId;
  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, before: lastId });
    messages = messages.concat(Array.from(fetched.values()));
    if (fetched.size !== 100) break;
    lastId = fetched.last()?.id;
  }
  messages = messages.reverse();

  let transcript = '';
  for (const msg of messages) {
    transcript += `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;
  }
  return Buffer.from(transcript, 'utf-8');
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    function isStaff(interaction) {
      return staffRoleId && interaction.member.roles.cache.has(staffRoleId);
    }

    // === BUTTON HANDLERS ===
    if (interaction.isButton()) {
      // --- TICKETPANEL: Toggle Transcript ---
    if (interaction.customId.startsWith('ticketpanel_toggle_transcript:')) {
    const panelId = interaction.customId.split(':')[1];
    const panel = await TicketPanel.findById(panelId);
    if (!panel) {
      return interaction.reply({ content: '❌ Panel not found.', ephemeral: false });
    }

    panel.transcriptsEnabled = !panel.transcriptsEnabled;
    await panel.save();

      return interaction.reply({
      content: `📝 Transcript generation has been **${panel.transcriptsEnabled ? 'enabled' : 'disabled'}** for this panel.`,
    });
  }

    // --- TICKETPANEL: Publish Preview ---
    if (interaction.customId.startsWith('ticketpanel_publish_preview:')) {
    const panelId = interaction.customId.split(':')[1];
    const panel = await TicketPanel.findById(panelId);
    if (!panel) {
     return interaction.reply({ content: '❌ Panel not found.', ephemeral: false });
   }

    const channel = interaction.guild.channels.cache.get(panel.postChannelId);
    if (!channel || !channel.isTextBased()) {
    return interaction.reply({ content: '❌ Panel post channel is invalid or not set.', ephemeral: false });
   }

    const button = new ButtonBuilder()
    .setCustomId(`open_ticket_modal:${panel.name}`)
    .setLabel(panel.buttonLabel || 'Open Ticket')
    .setStyle(ButtonStyle.Primary);

    if (panel.emoji) button.setEmoji(panel.emoji);

    const row = new ActionRowBuilder().addComponents(button);

    const embed = new EmbedBuilder()
    .setTitle(panel.embed?.title || 'Need Help?')
    .setDescription(panel.embed?.description || 'Click the button below to open a ticket.')
    .setColor(panel.embed?.color || 0x5865F2);

    await channel.send({ embeds: [embed], components: [row] });

       return interaction.reply({
       content: `✅ Ticket panel preview has been posted to <#${channel.id}>.`,
     });
   }

      // --- EMBED EDITOR BUTTON HANDLER (unchanged) ---
      const [prefix, action, section, embedId] = interaction.customId.split('_');
      if (prefix === 'embed' && action === 'edit') {
        const doc = await EmbedModel.findById(embedId);
        if (!doc) return interaction.reply({ content: 'Embed not found.' });

        if (section === 'basic') {
          const modal = new ModalBuilder()
            .setCustomId(`embed_modal_basic_${embedId}`)
            .setTitle('Edit Basic Info')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('title')
                  .setLabel('Title')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setValue(doc.title || '')
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('description')
                  .setLabel('Description')
                  .setStyle(TextInputStyle.Paragraph)
                  .setRequired(false)
                  .setValue(doc.description || '')
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('color')
                  .setLabel('Hex Color (e.g. #993377)')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setValue(doc.color || '#993377')
              )
            );
          return interaction.showModal(modal);
        }

        if (section === 'author') {
          if (!doc.author) doc.author = {};
          const modal = new ModalBuilder()
            .setCustomId(`embed_modal_author_${embedId}`)
            .setTitle('Edit Author')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('author_name')
                  .setLabel('Author Name')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setValue(doc.author?.name || '')
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('author_icon')
                  .setLabel('Author Icon URL')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setValue(doc.author?.icon_url || '')
              )
            );
          return interaction.showModal(modal);
        }

        if (section === 'footer') {
          if (!doc.footer) doc.footer = {};
          const modal = new ModalBuilder()
            .setCustomId(`embed_modal_footer_${embedId}`)
            .setTitle('Edit Footer')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('footer_text')
                  .setLabel('Footer Text')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setValue(doc.footer?.text || '')
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('footer_icon')
                  .setLabel('Footer Icon URL')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setValue(doc.footer?.icon_url || '')
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('footer_timestamp')
                  .setLabel('Add Timestamp? (yes/no)')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setValue(doc.footer?.timestamp ? 'yes' : 'no')
              )
            );
          return interaction.showModal(modal);
        }

        if (section === 'images') {
          const modal = new ModalBuilder()
            .setCustomId(`embed_modal_images_${embedId}`)
            .setTitle('Edit Images')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('thumbnail')
                  .setLabel('Thumbnail URL')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setValue(doc.thumbnail || '')
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('image')
                  .setLabel('Main Image URL')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setValue(doc.image || '')
              )
            );
          return interaction.showModal(modal);
        }
      }

      // === New Ticket Panel Buttons ===

      // 📝 Edit Greeting Modal
      if (interaction.customId.startsWith('ticketpanel_edit_greeting:')) {
        const panelId = interaction.customId.split(':')[1];
        const panel = await TicketPanel.findById(panelId);
        if (!panel) return interaction.reply({ content: '❌ Panel not found.', ephemeral: false });

        const modal = new ModalBuilder()
          .setCustomId(`ticketpanel_modal_greeting:${panelId}`)
          .setTitle('Set Greeting Message')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('greeting_text')
                .setLabel('Message shown when ticket is opened')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setValue(panel.greeting || '')
            )
          );

        return interaction.showModal(modal);
      }

      // 🎭 Set Emoji via message
      if (interaction.customId.startsWith('ticketpanel_set_emoji:')) {
        const panelId = interaction.customId.split(':')[1];
        const panel = await TicketPanel.findById(panelId);
        if (!panel) return interaction.reply({ content: '❌ Panel not found.', ephemeral: false });

        await interaction.reply({
          content: 'Please send the emoji you want to use (standard or custom). You have 30 seconds.',
        });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

        collector.on('collect', async msg => {
          const emoji = msg.content.trim();
          const isCustom = /^<a?:\w+:\d+>$/.test(emoji);
          const isUnicode = /\p{Emoji}/u.test(emoji);

          if (!isCustom && !isUnicode) {
            return msg.reply('❌ Invalid emoji. Please use a standard or custom emoji.');
          }

          panel.emoji = emoji;
          await panel.save();

          await msg.reply(`✅ Emoji set to ${emoji}`);
        });

        collector.on('end', collected => {
          if (!collected.size) {
            interaction.followUp({ content: '⏱️ Emoji input timed out.', ephemeral: false });
          }
        });
      }
    }

    // === MODAL HANDLERS ===
    if (interaction.isModalSubmit()) {
      // Embed modal handling
      const [prefix, type, section, embedId] = interaction.customId.split('_');
      if (prefix === 'embed' && type === 'modal') {
        const doc = await EmbedModel.findById(embedId);
        if (!doc) return interaction.reply({ content: 'Embed not found.' });

        function emptyToNull(str) {
          return (typeof str === 'string' && str.trim() === '') ? null : str;
        }

        if (section === 'basic') {
          doc.title = emptyToNull(interaction.fields.getTextInputValue('title'));
          doc.description = emptyToNull(interaction.fields.getTextInputValue('description'));
          doc.color = emptyToNull(interaction.fields.getTextInputValue('color')) || '#993377';
        }

        if (section === 'author') {
          if (!doc.author) doc.author = {};
          doc.author.name = emptyToNull(interaction.fields.getTextInputValue('author_name'));
          doc.author.icon_url = emptyToNull(interaction.fields.getTextInputValue('author_icon'));
        }

        if (section === 'footer') {
          if (!doc.footer) doc.footer = {};
          doc.footer.text = emptyToNull(interaction.fields.getTextInputValue('footer_text'));
          doc.footer.icon_url = emptyToNull(interaction.fields.getTextInputValue('footer_icon'));
          const timestampInput = interaction.fields.getTextInputValue('footer_timestamp').toLowerCase();
          doc.footer.timestamp = timestampInput === 'yes' || timestampInput === 'true';
        }

        if (section === 'images') {
          doc.thumbnail = emptyToNull(interaction.fields.getTextInputValue('thumbnail'));
          doc.image = emptyToNull(interaction.fields.getTextInputValue('image'));
        }

        await doc.save();

        return interaction.update({
          content: `**Editing Embed:** \`${doc.name}\` (updated!)`,
          embeds: [buildEmbed(doc)],
          components: [
            new ActionRowBuilder().addComponents(
              ...[
                { label: 'Edit Basic Info', id: 'basic', style: 'Secondary' },
                { label: 'Edit Author', id: 'author', style: 'Secondary' },
                { label: 'Edit Footer', id: 'footer', style: 'Secondary' },
                { label: 'Edit Images', id: 'images', style: 'Secondary' }
              ].map(btn =>
                new ButtonBuilder()
                  .setCustomId(`embed_edit_${btn.id}_${doc._id}`)
                  .setLabel(btn.label)
                  .setStyle(ButtonStyle[btn.style])
              )
            )
          ]
        });
      }

      // 📝 Save greeting
      if (interaction.customId.startsWith('ticketpanel_modal_greeting:')) {
        const panelId = interaction.customId.split(':')[1];
        const panel = await TicketPanel.findById(panelId);
        if (!panel) return interaction.reply({ content: '❌ Panel not found.', ephemeral: false });

        const greeting = interaction.fields.getTextInputValue('greeting_text');
        panel.greeting = greeting;
        await panel.save();

        return interaction.reply({ content: '✅ Greeting message updated.' });
      }
    }

    // === TICKET: Modal Submit (Create Ticket Channel) ===
if (interaction.customId.startsWith('ticket_modal_submit:')) {
  const panelName = interaction.customId.split(':')[1];
  const panel = await TicketPanel.findOne({
    guildId: interaction.guild.id,
    panelName
  });

  if (!panel) {
    return interaction.reply({
      content: `❌ Ticket panel \`${panelName}\` not found.`,
      ephemeral: false
    });
  }

  const issue = interaction.fields.getTextInputValue('issue');

  const overwrites = [
    {
      id: interaction.guild.roles.everyone,
      deny: ['ViewChannel']
    },
    {
      id: interaction.user.id,
      allow: ['ViewChannel', 'SendMessages']
    }
  ];

  if (staffRoleId) {
    overwrites.push({
      id: staffRoleId,
      allow: ['ViewChannel', 'SendMessages']
    });
  }

  const channelOptions = {
    name: `ticket-${interaction.user.username}`.toLowerCase(),
    type: ChannelType.GuildText,
    permissionOverwrites: overwrites
  };

  if (panel.ticketCategoryId) {
    channelOptions.parent = panel.ticketCategoryId;
  }

  const ticketChannel = await interaction.guild.channels.create(channelOptions);

  await TicketInstance.create({
    ticketId: ticketChannel.id,
    userId: interaction.user.id,
    panelName,
    channelId: ticketChannel.id,
    status: 'open',
    content: { issue }
  });

  const claimBtn = new ButtonBuilder()
    .setCustomId('ticket_claim')
    .setLabel('Claim')
    .setStyle(ButtonStyle.Primary);

  const closeBtn = new ButtonBuilder()
    .setCustomId('ticket_close')
    .setLabel('Close')
    .setStyle(ButtonStyle.Secondary);

  const deleteBtn = new ButtonBuilder()
    .setCustomId('ticket_delete')
    .setLabel('Delete')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(claimBtn, closeBtn, deleteBtn);

  await ticketChannel.send({
    content: `<@${interaction.user.id}>`,
    embeds: [
      new EmbedBuilder()
        .setTitle('Ticket Opened')
        .setDescription(`**${panel.greeting}**\n\n**Issue:**\n${issue}`)
        .setColor(panel.embed?.color || 0x5865F2)
    ],
    components: [row]
  });

  return interaction.reply({
    content: `✅ Your ticket has been created: <#${ticketChannel.id}>`,
    ephemeral: false
  });
}

    // === SELECT MENU HANDLERS ===
    if (interaction.isStringSelectMenu()) {
   // Set post channel for panel
    if (interaction.customId.startsWith('ticketpanel_select_post_channel:')) {
    const panelId = interaction.customId.split(':')[1];
    const panel = await TicketPanel.findById(panelId);
    if (!panel) return interaction.reply({ content: '❌ Panel not found.', ephemeral: false });

    const selectedChannelId = interaction.values[0];
    panel.postChannelId = selectedChannelId;
    await panel.save();

      return interaction.reply({ content: `✅ Post channel set to <#${selectedChannelId}>.`, ephemeral: false });
    }

    // Set category for new tickets
    if (interaction.customId.startsWith('ticketpanel_select_category:')) {
    const panelId = interaction.customId.split(':')[1];
    const panel = await TicketPanel.findById(panelId);
    if (!panel) return interaction.reply({ content: '❌ Panel not found.', ephemeral: false });

    const selectedCategoryId = interaction.values[0];
    panel.ticketCategoryId = selectedCategoryId;
    await panel.save();

      return interaction.reply({ content: `✅ Ticket category set to <#${selectedCategoryId}>.`, ephemeral: false });
     }
   }

    // === SLASH COMMAND HANDLER ===
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        if (!client.reactionRoleCache) {
          client.reactionRoleCache = {};
        }
        await command.execute(interaction, client, client.reactionRoleCache);
      } catch (error) {
        console.error(error);
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: 'There was an error executing this command!' });
          } else {
            await interaction.reply({ content: 'There was an error executing this command!' });
          }
        } catch (err) {
          console.error('Failed to reply to interaction:', err);
        }
      }
    }
  }
};
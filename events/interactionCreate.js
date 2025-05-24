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
  AttachmentBuilder // <--- Added for transcript
} = require('discord.js');
const EmbedModel = require('../models/Embed');
const TicketPanel = require('../models/TicketPanel');
const TicketInstance = require('../models/TicketInstance');
const { buildEmbed } = require('../utils/embedEditorUi');

// --- SET YOUR STAFF ROLE ID HERE ---
const staffRoleId = "1368040155793068112"; // <--- Replace with your staff role ID

// --- TRANSCRIPT GENERATION FUNCTION ---
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
    // Helper: Staff check
    function isStaff(interaction) {
      return staffRoleId && interaction.member.roles.cache.has(staffRoleId);
    }

    // --- ALL BUTTON HANDLERS ---
    if (interaction.isButton()) {
      // --- EMBED EDITOR BUTTON HANDLER ---
      const [prefix, action, section, embedId] = interaction.customId.split('_');
      if (prefix === 'embed' && action === 'edit') {
        // Fetch embed from DB
        const doc = await EmbedModel.findById(embedId);
        if (!doc) return interaction.reply({ content: 'Embed not found.' });

        // Show modal for the relevant section
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
        return; // Prevent fallthrough
      }

      // --- TICKET: Open Modal Button ---
      if (interaction.customId.startsWith('open_ticket_modal:')) {
        const panelName = interaction.customId.split(':')[1];
        const modal = new ModalBuilder()
          .setCustomId(`ticket_modal_submit:${panelName}`)
          .setTitle('Open a Ticket')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('issue')
                .setLabel('What do you need help with?')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            )
          );
        return interaction.showModal(modal);
      }

      // --- TICKET: Claim Button ---
      if (interaction.customId === 'ticket_claim') {
        if (!isStaff(interaction)) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle('Permission Denied')
                .setDescription('Only staff can claim tickets.')
                .setColor(0xED4245)
            ]
          });
        }

        const msg = await interaction.message.fetch();
        const row = ActionRowBuilder.from(msg.components[0]);
        row.components[0].setDisabled(true).setLabel(`Claimed by ${interaction.user.username}`);

        await msg.edit({
          components: [row],
          embeds: [
            EmbedBuilder.from(msg.embeds[0])
              .setFooter({ text: `Claimed by ${interaction.user.tag}` })
          ]
        });

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Ticket Claimed')
              .setDescription(`Ticket has been claimed by <@${interaction.user.id}>.`)
              .setColor(0x57F287)
          ]
        });
        return;
      }

      // --- TICKET: Close Button ---
      if (interaction.customId === 'ticket_close') {
        if (!isStaff(interaction)) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle('Permission Denied')
                .setDescription('Only staff can close tickets.')
                .setColor(0xED4245)
            ]
          });
        }

        const ticketUser = (await TicketInstance.findOne({ channelId: interaction.channel.id }))?.userId;
        if (ticketUser) {
          await interaction.channel.permissionOverwrites.edit(ticketUser, { ViewChannel: false });
        }

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Ticket Closed')
              .setDescription('This ticket has been closed. Staff can still view this channel.')
              .setColor(0xED4245)
          ]
        });
        return;
      }

      // --- TICKET: Delete Button ---
      if (interaction.customId === 'ticket_delete') {
        if (!isStaff(interaction)) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle('Permission Denied')
                .setDescription('Only staff can delete tickets.')
                .setColor(0xED4245)
            ]
          });
        }

        // --- TRANSCRIPT LOGIC START ---
        try {
          const ticketInstance = await TicketInstance.findOne({ channelId: interaction.channel.id });

          // Generate transcript
          const transcriptBuffer = await generateTranscript(interaction.channel);
          const attachment = new AttachmentBuilder(transcriptBuffer, { name: `transcript-${interaction.channel.name}.txt` });

          // Send to log channel
          const GuildSetting = require('../models/GuildSetting');
          const settings = await GuildSetting.findOne({ guildId: interaction.guild.id });
          const logChannelId = settings?.transcriptChannelId;
          const logChannel = logChannelId ? interaction.guild.channels.cache.get(logChannelId) : null;
          
          if (logChannel) {
            await logChannel.send({
              content: `Transcript for ticket ${interaction.channel.name}:`,
              files: [attachment]
            });
          }

          // Send to user
          if (ticketInstance && ticketInstance.userId) {
            try {
              const user = await interaction.client.users.fetch(ticketInstance.userId);
              await user.send({
                content: `Here is the transcript for your closed ticket:`,
                files: [attachment]
              });
            } catch (err) {
              // Ignore if user DMs are closed
            }
            ticketInstance.status = 'closed';
            await ticketInstance.save();
          }
        } catch (err) {
          // If any error occurs, still proceed to delete the channel
          console.error('Error generating/sending transcript:', err);
        }
        // --- TRANSCRIPT LOGIC END ---

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Ticket Deleted')
              .setDescription('This ticket channel will be deleted in 5 seconds.')
              .setColor(0xED4245)
          ]
        });
        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 5000);
        return;
      }
    }

    // --- EMBED EDITOR MODAL HANDLER ---
    if (interaction.isModalSubmit()) {
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

        // Edit the original reply with the updated embed and buttons
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

      // --- TICKET: Modal Submit (Create Ticket Channel) ---
      if (interaction.customId.startsWith('ticket_modal_submit:')) {
        const panelName = interaction.customId.split(':')[1];
        const issue = interaction.fields.getTextInputValue('issue');

        // Create ticket channel
        const permissionOverwrites = [
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
        ];
        if (staffRoleId) {
          permissionOverwrites.push({
            id: staffRoleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          });
        }

        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`.toLowerCase(),
          type: ChannelType.GuildText,
          permissionOverwrites,
        });

        await TicketInstance.create({
          ticketId: ticketChannel.id,
          userId: interaction.user.id,
          panelName,
          channelId: ticketChannel.id,
          status: 'open',
          content: { issue }
        });

        // --- ADD BUTTONS ---
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
              .setDescription(`**Issue:**\n${issue}`)
              .setColor(0x5865F2)
          ],
          components: [row]
        });

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Ticket Created')
              .setDescription(`Your ticket has been created: <#${ticketChannel.id}>`)
              .setColor(0x57F287)
          ]
        });
        return;
      }
    }

    // --- SLASH COMMAND HANDLER (keep this for your commands to work) ---
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
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
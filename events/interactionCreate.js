// interactionCreate.js
const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EmbedModel = require('../models/Embed');
const { buildEmbed } = require('../utils/embedEditorUi.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // --- EMBED EDITOR BUTTON HANDLER ---
    if (interaction.isButton()) {
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
        return; // prevent fallthrough
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
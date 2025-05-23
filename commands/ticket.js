// ticket.js

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');

// Replace with your actual schema imports
const TicketPanel = require('../models/TicketPanel');
const TicketInstance = require('../models/TicketInstance');

// --- STAFF ROLE LOGIC ---
function getStaffRoleId(guild) {
  // Use role name or ID here:
const staffRoleId = "1368040112277032980"; // <-- CHANGE THIS TO YOUR STAFF ROLE NAME OR ID
  let role = guild.roles.cache.find(r => r.name === staffRoleName) ||
             guild.roles.cache.get(staffRoleName);
  return role ? role.id : null;
}

// 1. Slash Command Data (for registration)
const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Ticket system commands')
  .addSubcommand(sub =>
    sub
      .setName('panel_create')
      .setDescription('Create a ticket panel config')
      .addStringOption(opt =>
        opt.setName('name').setDescription('Panel name').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('title').setDescription('Embed title').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('description').setDescription('Embed description').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('color').setDescription('Embed color (hex, e.g. #5865F)').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('panel_send')
      .setDescription('Send a ticket panel')
      .addStringOption(opt =>
        opt.setName('name').setDescription('Panel name').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('panel_edit')
      .setDescription('Edit a ticket panel config')
      .addStringOption(opt =>
        opt.setName('name').setDescription('Panel name').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('title').setDescription('Embed title').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('description').setDescription('Embed description').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('color').setDescription('Embed color (hex, e.g. #8102ff)').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('panel_delete')
      .setDescription('Delete a ticket panel')
      .addStringOption(opt =>
        opt.setName('name').setDescription('Panel name').setRequired(true)
      )
  );

// 2. Command Handler
async function execute(interaction) {
  const sub = interaction.options.getSubcommand();

  // /ticket panel_create
  if (sub === 'panel_create') {
    const name = interaction.options.getString('name');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const color = interaction.options.getString('color');

    if (await TicketPanel.findOne({ name })) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Panel Already Exists')
            .setDescription(`A panel with the name \`${name}\` already exists.`)
            .setColor(0x8102ff)
        ]
      });
    }

    await TicketPanel.create({
      name,
      embed: { title, description, color }
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Panel Created')
          .setDescription(`Panel \`${name}\` created and ready to send!`)
          .setColor(0x8102ff)
      ]
    });
  }

  // /ticket panel_send
  if (sub === 'panel_send') {
    const name = interaction.options.getString('name');
    const panel = await TicketPanel.findOne({ name });
    if (!panel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Panel Not Found')
            .setDescription(`No panel found with the name \`${name}\`.`)
            .setColor(0x8102ff)
        ]
      });
    }
    if (panel.channelId && panel.messageId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Panel Already Sent')
            .setDescription(`Panel \`${name}\` has already been sent.`)
            .setColor(0x8102ff)
        ]
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(panel.embed.title)
      .setDescription(panel.embed.description)
      .setColor(panel.embed.color);

    const button = new ButtonBuilder()
      .setCustomId(`open_ticket_modal:${name}`)
      .setLabel('Open Ticket')
      .setStyle(ButtonStyle.Primary)
	  .setEmoji('1368589310940413952');

    const row = new ActionRowBuilder().addComponents(button);

    const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

    panel.channelId = interaction.channel.id;
    panel.messageId = msg.id;
    await panel.save();

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Panel Sent')
          .setDescription(`Ticket panel \`${name}\` has been sent successfully!`)
          .setColor(0x8102ff)
      ]
    });
  }

  // /ticket panel_edit
  if (sub === 'panel_edit') {
    const name = interaction.options.getString('name');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const color = interaction.options.getString('color');

    const panel = await TicketPanel.findOne({ name });
    if (!panel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Panel Not Found')
            .setDescription(`No panel found with the name \`${name}\`.`)
            .setColor(0x8102ff)
        ]
      });
    }

    // Update DB
    panel.embed = { title, description, color };
    await panel.save();

    // Edit the message if it exists
    if (panel.channelId && panel.messageId) {
      try {
        const channel = await interaction.guild.channels.fetch(panel.channelId);
        const msg = await channel.messages.fetch(panel.messageId);

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color);

        await msg.edit({ embeds: [embed] });
      } catch {
        // If message or channel is gone, ignore for now
      }
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Panel Updated')
          .setDescription(`Panel \`${name}\` has been updated.`)
          .setColor(0x8102ff)
      ]
    });
  }

  // /ticket panel_delete
  if (sub === 'panel_delete') {
    const name = interaction.options.getString('name');
    const panel = await TicketPanel.findOne({ name });
    if (!panel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Panel Not Found')
            .setDescription(`No panel found with the name \`${name}\`.`)
            .setColor(0x8102ff)
        ]
      });
    }

    // Delete the message if it exists
    if (panel.channelId && panel.messageId) {
      try {
        const channel = await interaction.guild.channels.fetch(panel.channelId);
        const msg = await channel.messages.fetch(panel.messageId);
        await msg.delete();
      } catch {
        // If message or channel is gone, ignore for now
      }
    }

    await panel.deleteOne();

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Panel Deleted')
          .setDescription(`Panel \`${name}\` has been deleted.`)
          .setColor(0x8102ff)
      ]
    });
  }
}

// 3. Component & Modal Handlers
async function handleComponent(interaction) {
  // Button: open ticket modal
  if (interaction.isButton() && interaction.customId.startsWith('open_ticket_modal:')) {
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

  // Modal: create ticket channel
  if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_submit:')) {
    const panelName = interaction.customId.split(':')[1];
    const issue = interaction.fields.getTextInputValue('issue');

    // Create ticket channel
    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`.toLowerCase(),
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        // Add your staff role here if needed
      ],
    });

    await TicketInstance.create({
      ticketId: ticketChannel.id,
      userId: interaction.user.id,
      panelName,
      channelId: ticketChannel.id,
      status: 'open',
      content: { issue }
    });

    await ticketChannel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [
        new EmbedBuilder()
          .setTitle('Ticket Opened')
          .setDescription(`**Issue:**\n${issue}`)
          .setColor(0x8102ff)
      ]
    });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Ticket Created')
          .setDescription(`Your ticket has been created: <#${ticketChannel.id}>`)
          .setColor(0x8102ff)
      ]
    });
  }
}

// 4. Export for use in your main bot file
module.exports = {
  data,
  execute,
  handleComponent,
};